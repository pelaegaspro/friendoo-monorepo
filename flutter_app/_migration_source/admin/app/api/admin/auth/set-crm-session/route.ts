import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/guard'
import { CRM_SESSION_COOKIE, createCrmSessionValue } from '@/lib/admin/crm-session'

/**
 * Sets a CRM session cookie for the current user.
 * Called from the portal page when the user clicks "CRM Dashboard".
 * Protected by admin session — only logged-in admins can set this.
 */
export async function POST() {
  const unauthorized = requireAdminApi()
  if (unauthorized) return unauthorized

  const response = NextResponse.json({ ok: true })
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
