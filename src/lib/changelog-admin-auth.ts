import { NextRequest } from "next/server"

export const CHANGELOG_ADMIN_SESSION_COOKIE = "changelog_admin_session"

export const ADMIN_USERNAME = "admin"
export const ADMIN_PASSWORD = "apc-admin-2026"

export function getAdminTokenFromEnv(): string {
  return process.env.CHANGELOG_ADMIN_TOKEN || ""
}

export function hasValidAdminSession(request: NextRequest): boolean {
  const token = getAdminTokenFromEnv()
  if (!token) {
    return false
  }

  const headerToken = request.headers.get("x-admin-token")
  if (headerToken === token) {
    return true
  }

  const cookieToken = request.cookies.get(CHANGELOG_ADMIN_SESSION_COOKIE)?.value
  return cookieToken === token
}
