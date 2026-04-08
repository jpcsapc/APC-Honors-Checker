export interface ChangelogEntry {
  id: number;
  title: string;
  description: string;
  created_at: string;
  is_visible: boolean;
}

/** The key used in localStorage to persist the last-seen changelog ID. */
export const CHANGELOG_STORAGE_KEY = "lastSeenChangelogId";

/**
 * Maximum number of entries shown to a brand-new visitor (no localStorage).
 * Returning visitors who have previously dismissed will only see entries
 * newer than their stored id — this cap does not apply to them.
 */
export const MAX_INITIAL_DISPLAY = 3;

/** Returns all entries the user has not yet acknowledged. */
export function getUnreadEntries(
  entries: ChangelogEntry[],
  lastSeenId: number
): ChangelogEntry[] {
  return entries.filter((entry) => entry.id > lastSeenId);
}

/** The highest `id` currently in the changelog. Returns 0 if empty. */
export function getLatestChangelogId(entries: ChangelogEntry[]): number {
  return entries.length > 0 ? Math.max(...entries.map((entry) => entry.id)) : 0;
}
