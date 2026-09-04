import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_COOKIE_NAME, isValidAdminSessionEdge } from './lib/admin/edge-session'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  const sessionValue = request.cookies.get(ADMIN_COOKIE_NAME)?.value
  const hasSession = await isValidAdminSessionEdge(sessionValue)
  const isAuthPage = pathname === '/admin/login' || pathname === '/admin/portal'

  if (!hasSession && !isAuthPage) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  if (hasSession && pathname === '/admin/login') {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
