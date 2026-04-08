/**
 * generate-changelog.mjs
 *
 * Build-time script that fetches recently merged PRs from GitHub and appends
 * parsed release notes into a persistent JSON store consumed by the toast API.
 *
 * A PR is included if and only if its body contains a populated
 * `# Release Notes` section with at least one `## Feature` entry.
 * No GitHub labels are required.
 *
 * Environment variables:
 *   GITHUB_TOKEN           – GitHub PAT with repo read access (required)
 *   GITHUB_OWNER           – Repository owner, e.g. "jpcsapc" (required)
 *   GITHUB_REPO            – Repository name, e.g. "APC-Honors-Checker" (required)
 *   CHANGELOG_BRANCH       – Base branch to fetch PRs for (default: "main")
 *   CHANGELOG_MAX_ENTRIES  – Max entries to keep in the JSON (default: 10)
 *
 * Usage:
 *   node scripts/generate-changelog.mjs
 *
 * Output:
 *   src/lib/update-logs.json
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = resolve(__dirname, "../src/lib/update-logs.json");

// ── Config from env ─────────────────────────────────────────────────────────

const token = process.env.GITHUB_TOKEN;
const owner = process.env.GITHUB_OWNER;
const repo = process.env.GITHUB_REPO;
const branch = process.env.CHANGELOG_BRANCH || "main";
const maxEntries = parseInt(process.env.CHANGELOG_MAX_ENTRIES || "10", 10);

// ── Helpers ─────────────────────────────────────────────────────────────────

function writeEmpty(reason) {
  console.log(`[generate-changelog] ${reason} — leaving existing update logs unchanged.`);
}

function readExistingLogs() {
  try {
    const raw = readFileSync(OUTPUT_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (entry) =>
          typeof entry.id === "number" &&
          typeof entry.title === "string" &&
          typeof entry.description === "string" &&
          typeof entry.created_at === "string" &&
          typeof entry.is_visible === "boolean"
      )
      .sort((a, b) => a.id - b.id);
  } catch {
    return [];
  }
}

/**
 * Parses the `# Release Notes` section from a PR body.
 *
 * Expected format:
 *   # Release Notes
 *   ## Feature Title
 *   Description text for the feature.
 *   ## Another Feature
 *   Description for the second feature.
 *
 * Each `##` heading becomes a feature title; the lines below it become
 * the description (lines joined into a single string).
 * Returns [] if the section is missing or contains no valid features.
 */
function parseReleaseNotesSection(body) {
  if (!body) return [];

  const lines = body.split("\n");

  // Find the line index of the `# Release Notes` H1
  const h1Index = lines.findIndex((l) => /^#\s+Release\s+Notes\s*$/i.test(l.trim()));
  if (h1Index === -1) return [];

  // Collect lines that belong to the section (stop at the next H1)
  const sectionLines = [];
  for (let i = h1Index + 1; i < lines.length; i++) {
    if (/^#\s+\S/.test(lines[i])) break; // next H1 — end of section
    sectionLines.push(lines[i]);
  }

  // Split section into blocks, one per ## heading
  const features = [];
  let current = null;

  for (const line of sectionLines) {
    const h2Match = line.match(/^##\s+(.+)/);
    if (h2Match) {
      if (current) features.push(current);
      current = { title: h2Match[1].trim(), descLines: [] };
    } else if (current) {
      const trimmed = line.trim();
      if (trimmed) current.descLines.push(trimmed);
    }
  }
  if (current) features.push(current);

  return features.map(({ title, descLines }) => ({
    title,
    description: descLines.join(" "),
  }));
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const existingLogs = readExistingLogs();

  if (!token || !owner || !repo) {
    writeEmpty("Missing GITHUB_TOKEN, GITHUB_OWNER, or GITHUB_REPO");
    return;
  }

  console.log(
    `[generate-changelog] Fetching merged PRs → ${owner}/${repo} (base: ${branch})`
  );

  try {
    // Fetch closed PRs sorted by most recently updated.
    // We request a large page so the content-based filter has enough to work with.
    const url = new URL(
      `https://api.github.com/repos/${owner}/${repo}/pulls`
    );
    url.searchParams.set("state", "closed");
    url.searchParams.set("base", branch);
    url.searchParams.set("sort", "updated");
    url.searchParams.set("direction", "desc");
    url.searchParams.set("per_page", "50");

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (!res.ok) {
      writeEmpty(`GitHub API returned ${res.status}: ${res.statusText}`);
      return;
    }

    const pulls = await res.json();

    const parsedFeatureRows = pulls
      .filter((pr) => pr.merged_at !== null)
      .map((pr) => {
        const features = parseReleaseNotesSection(pr.body);
        return features.map((feature) => ({
          source_pr_number: pr.number,
          source_feature_title: feature.title,
          title: feature.title,
          description: feature.description,
          created_at: pr.merged_at,
        }));
      })
      .flat();

    if (parsedFeatureRows.length === 0) {
      writeEmpty(
        "No merged PRs with a parseable '# Release Notes' section found"
      );
      return;
    }

    const existingKeys = new Set(
      existingLogs.map(
        (entry) => `${entry.title}::${entry.description}::${entry.created_at}`
      )
    );

    const newRows = parsedFeatureRows.filter((entry) => {
      const key = `${entry.title}::${entry.description}::${entry.created_at}`;
      return !existingKeys.has(key);
    });

    if (newRows.length === 0) {
      console.log("[generate-changelog] No new entries detected — store unchanged.");
      return;
    }

    const latestId = existingLogs.length > 0 ? Math.max(...existingLogs.map((e) => e.id)) : 0;
    const nextRows = newRows.map((entry, index) => ({
      id: latestId + index + 1,
      title: entry.title,
      description: entry.description,
      created_at: entry.created_at,
      is_visible: true,
      source_pr_number: entry.source_pr_number,
      source_feature_title: entry.source_feature_title,
    }));

    const mergedLogs = [...existingLogs, ...nextRows]
      .sort((a, b) => a.id - b.id)
      .slice(-maxEntries);

    writeFileSync(OUTPUT_PATH, JSON.stringify(mergedLogs, null, 2) + "\n");
    console.log(
      `[generate-changelog] Added ${nextRows.length} entries. Store now has ${mergedLogs.length} entries.`
    );
  } catch (err) {
    writeEmpty(`Error: ${err.message}`);
  }
}

main();
