import { promises as fs } from "node:fs";
import path from "node:path";
import { type ChangelogEntry } from "@/lib/changelog";

const UPDATE_LOGS_PATH = path.join(process.cwd(), "src", "lib", "update-logs.json");

function normalizeEntry(entry: Partial<ChangelogEntry>): ChangelogEntry | null {
  if (
    typeof entry.id !== "number" ||
    typeof entry.title !== "string" ||
    typeof entry.description !== "string" ||
    typeof entry.created_at !== "string" ||
    typeof entry.is_visible !== "boolean"
  ) {
    return null;
  }

  return {
    id: entry.id,
    title: entry.title,
    description: entry.description,
    created_at: entry.created_at,
    is_visible: entry.is_visible,
  };
}

export async function readUpdateLogs(): Promise<ChangelogEntry[]> {
  try {
    const raw = await fs.readFile(UPDATE_LOGS_PATH, "utf-8");
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((entry) => normalizeEntry(entry))
      .filter((entry): entry is ChangelogEntry => entry !== null)
      .sort((a, b) => a.id - b.id);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      await writeUpdateLogs([]);
      return [];
    }
    throw error;
  }
}

export async function writeUpdateLogs(entries: ChangelogEntry[]): Promise<void> {
  const sortedEntries = [...entries].sort((a, b) => a.id - b.id);
  await fs.writeFile(UPDATE_LOGS_PATH, `${JSON.stringify(sortedEntries, null, 2)}\n`, "utf-8");
}

export async function setUpdateLogVisibility(
  id: number,
  isVisible: boolean
): Promise<ChangelogEntry | null> {
  const entries = await readUpdateLogs();
  const index = entries.findIndex((entry) => entry.id === id);
  if (index === -1) {
    return null;
  }

  const updated = { ...entries[index], is_visible: isVisible };
  entries[index] = updated;
  await writeUpdateLogs(entries);
  return updated;
}

export async function createUpdateLog(
  title: string,
  description: string
): Promise<ChangelogEntry> {
  const entries = await readUpdateLogs();
  const maxId = entries.length > 0 ? Math.max(...entries.map((e) => e.id)) : 0;
  
  const newEntry: ChangelogEntry = {
    id: maxId + 1,
    title: title.trim(),
    description: description.trim(),
    created_at: new Date().toISOString(),
    is_visible: true,
  };

  entries.push(newEntry);
  await writeUpdateLogs(entries);
  return newEntry;
}

export async function deleteUpdateLog(id: number): Promise<boolean> {
  const entries = await readUpdateLogs();
  const nextEntries = entries.filter((entry) => entry.id !== id);

  if (nextEntries.length === entries.length) {
    return false;
  }

  await writeUpdateLogs(nextEntries);
  return true;
}