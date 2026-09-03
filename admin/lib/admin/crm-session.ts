import { createHmac } from 'crypto'

const CRM_SESSION_COOKIE = 'crmSession'

function getCrmSecret(): string {
  const secret = process.env.CRM_SESSION_SECRET?.trim()
  if (!secret || secret.length < 32) {
    throw new Error('CRM_SESSION_SECRET is required and must be at least 32 characters')
  }
  return secret
}

function sign(payload: string): string {
  return createHmac('sha256', getCrmSecret()).update(payload).digest('hex')
}

/**
 * Generates a CRM-format session value matching crm/lib/session.ts exactly:
 * <timestamp>.<HMAC-SHA256>
 */
export function createCrmSessionValue(): string {
  const issuedAt = Date.now().toString()
  return `${issuedAt}.${sign(issuedAt)}`
}

export { CRM_SESSION_COOKIE }
