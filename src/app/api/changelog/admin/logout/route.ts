import { NextResponse } from "next/server"
import { CHANGELOG_ADMIN_SESSION_COOKIE } from "@/lib/changelog-admin-auth"

export const runtime = "nodejs"

export async function POST() {
  const response = NextResponse.json({ success: true })
  response.cookies.set(CHANGELOG_ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })

  return response
}
