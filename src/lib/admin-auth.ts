export interface AdminCredentials {
  username: string
  password: string
}

export interface AdminSession {
  isAuthenticated: boolean
  authenticatedAt?: number
  sessionExpiry?: number
}

const ADMIN_USERNAME = 'adminadmin'
const ADMIN_PASSWORD = '19780111'
const SESSION_DURATION = 8 * 60 * 60 * 1000

export function validateAdminCredentials(credentials: AdminCredentials): boolean {
  return credentials.username === ADMIN_USERNAME && credentials.password === ADMIN_PASSWORD
}

export function createAdminSession(): AdminSession {
  const now = Date.now()
  return {
    isAuthenticated: true,
    authenticatedAt: now,
    sessionExpiry: now + SESSION_DURATION
  }
}

export function isAdminSessionValid(session: AdminSession | null): boolean {
  if (!session || !session.isAuthenticated) return false
  if (!session.sessionExpiry) return false
  return Date.now() < session.sessionExpiry
}

export function initializeAdminSession(): AdminSession {
  return {
    isAuthenticated: false
  }
}
