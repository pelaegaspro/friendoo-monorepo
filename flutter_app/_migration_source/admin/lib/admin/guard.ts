import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { ADMIN_COOKIE_NAME, isValidAdminSession } from './session'

export function hasAdminSession() {
  const value = cookies().get(ADMIN_COOKIE_NAME)?.value
  return isValidAdminSession(value)
}

export function requireAdminApi() {
  if (hasAdminSession()) {
    return null
  }

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
