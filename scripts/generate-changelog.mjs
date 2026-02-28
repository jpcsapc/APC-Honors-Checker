/**
 * generate-changelog.mjs
 *
 * Build-time script that fetches recently merged PRs with the "release-note"
 * label from GitHub and writes them as a JSON changelog consumed by the
 * UpdateToast component.
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
 *   src/lib/changelog-generated.json
 */

import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = resolve(__dirname, "../src/lib/changelog-generated.json");

const REQUIRED_LABEL = "release-note";

// ── Config from env ─────────────────────────────────────────────────────────

const token = process.env.GITHUB_TOKEN;
const owner = process.env.GITHUB_OWNER;
const repo = process.env.GITHUB_REPO;
const branch = process.env.CHANGELOG_BRANCH || "main";
const maxEntries = parseInt(process.env.CHANGELOG_MAX_ENTRIES || "10", 10);

// ── Helpers ─────────────────────────────────────────────────────────────────

function writeEmpty(reason) {
  console.log(`[generate-changelog] ${reason} — writing empty changelog.`);
  writeFileSync(OUTPUT_PATH, JSON.stringify([], null, 2) + "\n");
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
 * the description (joined into a single string).
 * Returns [] if the section is missing or contains no valid features.
 */
function parseReleaseNotesSection(body) {
  if (!body) return [];

  // Find the `# Release Notes` H1 section; stop at the next H1 or EOF
  const sectionMatch = body.match(
    /^#\s+Release\s+Notes\s*\n([\s\S]*?)(?=\n^#\s|\s*$)/im
  );
  if (!sectionMatch) return [];

  const section = sectionMatch[1];

  // Split into blocks at each ## heading
  const blocks = section.split(/(?=^##\s)/m).filter((b) => b.trim());

  const features = [];
  for (const block of blocks) {
    const lines = block.split("\n");
    const titleMatch = lines[0].match(/^##\s+(.+)/);
    if (!titleMatch) continue;

    const title = titleMatch[1].trim();
    const description = lines
      .slice(1)
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
      .join(" ");

    if (title) features.push({ title, description });
  }

  return features;
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  if (!token || !owner || !repo) {
    writeEmpty("Missing GITHUB_TOKEN, GITHUB_OWNER, or GITHUB_REPO");
    return;
  }

  console.log(
    `[generate-changelog] Fetching merged PRs → ${owner}/${repo} (base: ${branch})`
  );

  try {
    // Fetch closed PRs sorted by most recently updated.
    // We request more than maxEntries because not all closed PRs are merged
    // or carry the required label.
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

    // Filter: must be merged + must have the required label
    const merged = pulls
      .filter(
        (pr) =>
          pr.merged_at !== null &&
          pr.labels.some((l) => l.name === REQUIRED_LABEL)
      )
      .slice(0, maxEntries);

    if (merged.length === 0) {
      writeEmpty("No merged PRs with the 'release-note' label found");
      return;
    }

    // Build changelog entries — skip PRs with no parseable release notes
    const entries = merged
      .map((pr) => ({
        id: pr.number,
        date: pr.merged_at.slice(0, 10), // YYYY-MM-DD
        title: pr.title,
        features: parseReleaseNotesSection(pr.body),
      }))
      .filter((entry) => entry.features.length > 0);

    if (entries.length === 0) {
      writeEmpty(
        "Labeled PRs found but none had a parseable '# Release Notes' section"
      );
      return;
    }

    // Sort by id ascending (oldest first) so the toast can reverse for display
    entries.sort((a, b) => a.id - b.id);

    writeFileSync(OUTPUT_PATH, JSON.stringify(entries, null, 2) + "\n");
    console.log(
      `[generate-changelog] Wrote ${entries.length} entries to changelog-generated.json`
    );
  } catch (err) {
    writeEmpty(`Error: ${err.message}`);
  }
}

main();
