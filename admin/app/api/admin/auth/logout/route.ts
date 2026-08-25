import { NextResponse } from 'next/server'
import { ADMIN_COOKIE_NAME } from '@/lib/admin/session'
import { CRM_SESSION_COOKIE } from '@/lib/admin/crm-session'

export async function POST() {
  const response = NextResponse.json({ ok: true })

  // Clear admin session
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(0),
  })

  // Clear CRM session
  response.cookies.set({
    name: CRM_SESSION_COOKIE,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(0),
  })

  return response
}
