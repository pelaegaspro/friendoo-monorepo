import { createHmac } from 'crypto'

const CRM_SESSION_COOKIE = 'crmSession'

function getCrmSecret(): string {
  return process.env.CRM_SESSION_SECRET || process.env.ADMIN_PASSWORD || 'friendoo-crm-change-me'
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
  const signature = sign(issuedAt)
  return `${issuedAt}.${signature}`
}

export { CRM_SESSION_COOKIE }
