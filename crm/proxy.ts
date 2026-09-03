import { NextRequest, NextResponse } from "next/server";

import { CRM_SESSION_COOKIE, verifySessionValueForEdge } from "./lib/sessionEdge";

export async function proxy(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/crm")) {
    return NextResponse.next();
  }

  const session = request.cookies.get(CRM_SESSION_COOKIE)?.value;
  if (!(await verifySessionValueForEdge(session))) {
    const url = new URL("/login", request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/crm/:path*"],
};
