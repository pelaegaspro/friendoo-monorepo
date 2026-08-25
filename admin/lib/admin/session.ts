export const ADMIN_COOKIE_NAME = 'adminSession'

export function getAdminPassword(): string {
  const password = process.env.ADMIN_PASSWORD
  if (!password) {
    throw new Error('Missing ADMIN_PASSWORD environment variable')
  }
  return password
}

export function getAdminSessionValue(): string {
  return `friendoo-admin:${getAdminPassword()}`
}

export function isValidAdminSession(value: string | null | undefined): boolean {
  if (!value) return false
  return value === getAdminSessionValue()
}
