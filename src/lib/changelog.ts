export interface ChangelogEntry {
  /** Unique, ever-increasing ID. Bump this when you add a new entry. */
  id: number;
  date: string;
  changes: string[];
}

/**
 * System changelog.
 *
 * HOW TO ADD AN UPDATE:
 *  1. Append a new object at the END of this array.
 *  2. Increment `id` by 1 (must always be the highest value in the array).
 *  3. Set `date` to today's date (YYYY-MM-DD).
 *  4. List every user-facing change in `changes`.
 *
 * The toast will show all entries whose `id` is greater than the last
 * acknowledged ID stored in the user's localStorage.
 */
export const CHANGELOG: ChangelogEntry[] = [
  {
    id: 1,
    date: "2026-03-01",
    changes: [
      "Latin Honors results are now shown directly on the Honors Calculator — no more switching between pages.",
    ],
  },
];

/** The key used in localStorage to persist the last-seen changelog ID. */
export const CHANGELOG_STORAGE_KEY = "lastSeenChangelogId";

/** Returns all entries the user has not yet acknowledged. */
export function getUnreadEntries(lastSeenId: number): ChangelogEntry[] {
  return CHANGELOG.filter((entry) => entry.id > lastSeenId);
}

/** The highest `id` currently in the changelog. */
export const LATEST_CHANGELOG_ID = Math.max(...CHANGELOG.map((e) => e.id));
