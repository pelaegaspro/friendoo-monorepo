import { NextRequest, NextResponse } from 'next/server';

import { CRM_SESSION_COOKIE, verifySessionValueForEdge } from './lib/sessionEdge';

export async function proxy(request: NextRequest) {
  const value = request.cookies.get(CRM_SESSION_COOKIE)?.value ?? undefined;
  const isAuthorized = await verifySessionValueForEdge(value);

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
