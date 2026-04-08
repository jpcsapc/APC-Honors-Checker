import { NextRequest, NextResponse } from "next/server"
import {
  ADMIN_PASSWORD,
  ADMIN_USERNAME,
  CHANGELOG_ADMIN_SESSION_COOKIE,
  getAdminTokenFromEnv,
} from "@/lib/changelog-admin-auth"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const token = getAdminTokenFromEnv()
  if (!token) {
    return NextResponse.json(
      { error: "CHANGELOG_ADMIN_TOKEN is not configured." },
      { status: 500 }
    )
  }

  try {
    const body = await request.json()
    const username = String(body?.username || "")
    const password = String(body?.password || "")

    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const response = NextResponse.json({ success: true })
    response.cookies.set(CHANGELOG_ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    })

    return response
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}
