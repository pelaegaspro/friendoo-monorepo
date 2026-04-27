import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_COOKIE_NAME, isValidAdminSession } from './lib/admin/session'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  const sessionValue = request.cookies.get(ADMIN_COOKIE_NAME)?.value
  const hasSession = isValidAdminSession(sessionValue)
  const isLoginPage = pathname === '/admin/login'

  if (!hasSession && !isLoginPage) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  if (hasSession && isLoginPage) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
