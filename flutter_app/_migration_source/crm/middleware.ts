import { NextRequest, NextResponse } from "next/server";

const CRM_SESSION_COOKIE = "crmSession";

export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/crm")) {
    return NextResponse.next();
  }

  const session = request.cookies.get(CRM_SESSION_COOKIE)?.value;
  if (!session) {
    const url = new URL("/login", request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/crm/:path*"],
};
