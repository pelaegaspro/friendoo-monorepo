import { NextResponse } from 'next/server'
import { ADMIN_COOKIE_NAME, getAdminPassword, getAdminSessionValue } from '@/lib/admin/session'
import { CRM_SESSION_COOKIE, createCrmSessionValue } from '@/lib/admin/crm-session'

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { password?: string } | null
  const password = body?.password?.trim() ?? ''

  if (!password || password !== getAdminPassword()) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })

  // Admin session cookie
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: getAdminSessionValue(),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })

  // CRM session cookie (same login, both apps accessible)
  response.cookies.set({
    name: CRM_SESSION_COOKIE,
    value: createCrmSessionValue(),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12,
  })

  return response
}
