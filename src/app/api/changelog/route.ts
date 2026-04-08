import { NextResponse } from "next/server";
import { readUpdateLogs } from "@/lib/update-logs-store";

export const runtime = "nodejs";

export async function GET() {
  try {
    const entries = await readUpdateLogs();
    const visibleEntries = entries.filter((entry) => entry.is_visible);

    return NextResponse.json(
      {
        entries: visibleEntries,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Failed to fetch changelog entries:", error);
    return NextResponse.json(
      { error: "Failed to load update logs" },
      { status: 500 }
    );
  }
}