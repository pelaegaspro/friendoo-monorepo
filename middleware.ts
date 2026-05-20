import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // These cookies should be set on the client during login/onboarding
  const session = request.cookies.get('session');
  const onboardingComplete = request.cookies.get('onboardingComplete');

  // Paths that don't require authentication
  const isAuthPath = pathname.startsWith('/login');
  const isOnboardingPath = pathname.startsWith('/onboarding');
  const isSplashPath = pathname === '/';
  const isMainPath = !isAuthPath && !isOnboardingPath && !isSplashPath;

  // 1. If not logged in, only allow /login and /
  if (!session) {
    if (isAuthPath || isSplashPath) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. If logged in but onboarding not complete
  if (onboardingComplete?.value !== 'true') {
    if (isOnboardingPath) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  // 3. If logged in and onboarding complete
  if (isAuthPath || isOnboardingPath) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 4. If logged in and visiting splash, skip to main app
  if (isSplashPath) {
    return NextResponse.redirect(new URL('/discover', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
