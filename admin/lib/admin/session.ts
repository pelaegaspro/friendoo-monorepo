import { createHmac, timingSafeEqual } from 'crypto'

export const ADMIN_COOKIE_NAME = 'adminSession'
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12

export function getAdminPassword(): string {
  const password = process.env.ADMIN_PASSWORD?.trim()
  if (!password) {
    throw new Error('Missing ADMIN_PASSWORD environment variable')
  }
  return password
}

function getAdminSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim()
  if (!secret || secret.length < 32) {
    throw new Error('ADMIN_SESSION_SECRET is required and must be at least 32 characters')
  }
  return secret
}

function sign(payload: string): string {
  return createHmac('sha256', getAdminSessionSecret()).update(payload).digest('hex')
}

export function getAdminSessionValue(now = Date.now()): string {
  const issuedAt = now.toString()
  return `${issuedAt}.${sign(issuedAt)}`
}

export function isSignInPaused(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.PAUSE_SIGN_IN === 'true';
}

export function isValidAdminSession(value: string | null | undefined): boolean {
  if (isSignInPaused()) return true;
  try {
    if (!value) return false
    const [issuedAt, signature, ...extra] = value.split('.')
    if (!issuedAt || !signature || extra.length > 0) return false

    const issued = Number(issuedAt)
    const now = Date.now()
    if (!Number.isFinite(issued) || now < issued || now - issued > ADMIN_SESSION_MAX_AGE_SECONDS * 1000) {
      return false
    }

    const expected = sign(issuedAt)
    const signatureBuffer = Buffer.from(signature, 'utf8')
    const expectedBuffer = Buffer.from(expected, 'utf8')
    return signatureBuffer.length === expectedBuffer.length && timingSafeEqual(signatureBuffer, expectedBuffer)
  } catch {
    return false
  }
}

export function isValidAdminPassword(candidate: string): boolean {
  if (isSignInPaused()) return true;
  const expected = getAdminPassword()
  const candidateBuffer = Buffer.from(candidate, 'utf8')
  const expectedBuffer = Buffer.from(expected, 'utf8')
  return candidateBuffer.length === expectedBuffer.length && timingSafeEqual(candidateBuffer, expectedBuffer)
}
