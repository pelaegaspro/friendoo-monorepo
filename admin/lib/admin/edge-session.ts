export const ADMIN_COOKIE_NAME = 'adminSession'
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12

const encoder = new TextEncoder()

function getAdminSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim()
  if (!secret || secret.length < 32) {
    throw new Error('ADMIN_SESSION_SECRET is required and must be at least 32 characters')
  }
  return secret
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false

  let difference = 0
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }
  return difference === 0
}

async function sign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(getAdminSessionSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  return toHex(signature)
}

export async function isValidAdminSessionEdge(value: string | null | undefined): Promise<boolean> {
  try {
    if (!value) return false

    const [issuedAt, signature, ...extra] = value.split('.')
    if (!issuedAt || !signature || extra.length > 0) return false

    const issued = Number(issuedAt)
    const now = Date.now()
    if (!Number.isFinite(issued) || now < issued || now - issued > ADMIN_SESSION_MAX_AGE_SECONDS * 1000) {
      return false
    }

    return constantTimeEqual(signature, await sign(issuedAt))
  } catch {
    return false
  }
}
