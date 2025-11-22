export interface AdminCredentials {
  username: string
  password: string
}

export interface AdminSession {
  isAuthenticated: boolean
  authenticatedAt?: number
  sessionExpiry?: number
  mfaVerified?: boolean
}

export interface MFACode {
  code: string
  expiresAt: number
  attempts: number
}

const ADMIN_USERNAME = 'adminadmin'
const ADMIN_PASSWORD = '19780111'
const SESSION_DURATION = 8 * 60 * 60 * 1000
const MFA_CODE_LENGTH = 6
const MFA_CODE_EXPIRY = 5 * 60 * 1000
const MAX_MFA_ATTEMPTS = 3

export function validateAdminCredentials(credentials: AdminCredentials): boolean {
  return credentials.username === ADMIN_USERNAME && credentials.password === ADMIN_PASSWORD
}

export function generateMFACode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function createMFACode(): MFACode {
  return {
    code: generateMFACode(),
    expiresAt: Date.now() + MFA_CODE_EXPIRY,
    attempts: 0
  }
}

export function validateMFACode(userCode: string, mfaCode: MFACode | null): { valid: boolean; reason?: string } {
  if (!mfaCode) {
    return { valid: false, reason: 'No MFA code generated' }
  }

  if (Date.now() > mfaCode.expiresAt) {
    return { valid: false, reason: 'Code has expired' }
  }

  if (mfaCode.attempts >= MAX_MFA_ATTEMPTS) {
    return { valid: false, reason: 'Too many attempts' }
  }

  if (userCode !== mfaCode.code) {
    return { valid: false, reason: 'Invalid code' }
  }

  return { valid: true }
}

export function createAdminSession(): AdminSession {
  const now = Date.now()
  return {
    isAuthenticated: true,
    authenticatedAt: now,
    sessionExpiry: now + SESSION_DURATION,
    mfaVerified: true
  }
}

export function isAdminSessionValid(session: AdminSession | null): boolean {
  if (!session || !session.isAuthenticated || !session.mfaVerified) return false
  if (!session.sessionExpiry) return false
  return Date.now() < session.sessionExpiry
}

export function initializeAdminSession(): AdminSession {
  return {
    isAuthenticated: false,
    mfaVerified: false
  }
}
