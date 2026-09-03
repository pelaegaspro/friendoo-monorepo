import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { ADMIN_COOKIE_NAME, isValidAdminSession } from './session'

export async function hasAdminSession(): Promise<boolean> {
  const cookieStore = await cookies()
  const value = cookieStore.get(ADMIN_COOKIE_NAME)?.value
  return isValidAdminSession(value)
}

export async function requireAdminApi() {
  if (await hasAdminSession()) {
    return null
  }

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
