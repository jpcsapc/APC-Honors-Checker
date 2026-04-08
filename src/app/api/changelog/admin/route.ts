import { NextRequest, NextResponse } from "next/server";
import {
  createUpdateLog,
  deleteUpdateLog,
  readUpdateLogs,
  setUpdateLogVisibility,
} from "@/lib/update-logs-store";
import { hasValidAdminSession } from "@/lib/changelog-admin-auth";

export const runtime = "nodejs";

function isAuthorized(request: NextRequest): boolean {
  return hasValidAdminSession(request);
}

function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return unauthorizedResponse();
  }

  try {
    const entries = await readUpdateLogs();
    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Failed to fetch admin changelog entries:", error);
    return NextResponse.json(
      { error: "Failed to load update logs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const title = String(body?.title || "").trim();
    const description = String(body?.description || "").trim();

    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 }
      );
    }

    if (title.length > 100) {
      return NextResponse.json(
        { error: "Title must be 100 characters or less" },
        { status: 400 }
      );
    }

    if (description.length > 1000) {
      return NextResponse.json(
        { error: "Description must be 1000 characters or less" },
        { status: 400 }
      );
    }

    const entry = await createUpdateLog(title, description);
    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error("Failed to create update log:", error);
    return NextResponse.json(
      { error: "Failed to create update log" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (!isAuthorized(request)) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const id = Number(body.id);
    const isVisible = body.is_visible;

    if (!Number.isInteger(id) || typeof isVisible !== "boolean") {
      return NextResponse.json(
        { error: "Invalid payload. Expected { id: number, is_visible: boolean }" },
        { status: 400 }
      );
    }

    const updated = await setUpdateLogVisibility(id, isVisible);
    if (!updated) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    return NextResponse.json({ entry: updated });
  } catch (error) {
    console.error("Failed to update log visibility:", error);
    return NextResponse.json(
      { error: "Failed to update update log" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAuthorized(request)) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const id = Number(body.id);

    if (!Number.isInteger(id)) {
      return NextResponse.json(
        { error: "Invalid payload. Expected { id: number }" },
        { status: 400 }
      );
    }

    const deleted = await deleteUpdateLog(id);
    if (!deleted) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete update log:", error);
    return NextResponse.json(
      { error: "Failed to delete update log" },
      { status: 500 }
    );
  }
}