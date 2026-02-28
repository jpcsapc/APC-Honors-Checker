import generatedChangelog from "./changelog-generated.json";

export interface ChangelogEntry {
  /** Unique ID — PR number when auto-generated, manual int otherwise. */
  id: number;
  /** ISO date string (YYYY-MM-DD). */
  date: string;
  /** PR title or short headline. */
  title: string;
  /** Optional detailed bullet points from the PR body's "## Release Notes" section. */
  changes: string[];
}

/**
 * System changelog.
 *
 * This is automatically generated at build time by `scripts/generate-changelog.mjs`.
 * The script fetches merged PRs with the "release-note" label from GitHub and
 * writes them to `changelog-generated.json`. For local development without a
 * GITHUB_TOKEN, the file defaults to an empty array (no toast shown).
 *
 * You can still add manual entries below — they are merged with the generated
 * ones by id.
 */
const MANUAL_ENTRIES: ChangelogEntry[] = [
  // Example manual entry (remove or keep as needed):
  // {
  //   id: 1,
  //   date: "2026-03-01",
  //   title: "Latin Honors merged into Honors Calculator",
  //   changes: [
  //     "Latin Honors results are now shown directly on the Honors Calculator — no more switching between pages.",
  //   ],
  // },
];

/** Merged changelog — generated entries take priority over manual ones with the same id. */
export const CHANGELOG: ChangelogEntry[] = (() => {
  const generated = (generatedChangelog as ChangelogEntry[]) ?? [];
  const byId = new Map<number, ChangelogEntry>();
  for (const entry of MANUAL_ENTRIES) byId.set(entry.id, entry);
  for (const entry of generated) byId.set(entry.id, entry); // generated wins on conflict
  return [...byId.values()].sort((a, b) => a.id - b.id);
})();

/** The key used in localStorage to persist the last-seen changelog ID. */
export const CHANGELOG_STORAGE_KEY = "lastSeenChangelogId";

/**
 * Maximum number of entries shown to a brand-new visitor (no localStorage).
 * Returning visitors who have previously dismissed will only see entries
 * newer than their stored id — this cap does not apply to them.
 */
export const MAX_INITIAL_DISPLAY = 3;

/** Returns all entries the user has not yet acknowledged. */
export function getUnreadEntries(lastSeenId: number): ChangelogEntry[] {
  return CHANGELOG.filter((entry) => entry.id > lastSeenId);
}

/** The highest `id` currently in the changelog. Returns 0 if empty. */
export const LATEST_CHANGELOG_ID =
  CHANGELOG.length > 0 ? Math.max(...CHANGELOG.map((e) => e.id)) : 0;
