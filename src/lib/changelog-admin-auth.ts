import { NextRequest } from "next/server"

export const CHANGELOG_ADMIN_SESSION_COOKIE = "changelog_admin_session"

export function getAdminUsernameFromEnv(): string {
  return process.env.ADMIN_USERNAME || ""
}

export function getAdminPasswordFromEnv(): string {
  return process.env.ADMIN_PASSWORD || ""
}

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
