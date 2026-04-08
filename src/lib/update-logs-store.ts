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
      return [];
    }
    throw error;
  }
}
