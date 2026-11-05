import { NextRequest, NextResponse } from 'next/server';

import { ADMIN_COOKIE_NAME } from './lib/admin/session';
import { isValidAdminSessionEdge } from './lib/admin/edge-session';

export async function proxy(request: NextRequest) {
  const value = request.cookies.get(ADMIN_COOKIE_NAME)?.value ?? null;
  const isAuthorized = await isValidAdminSessionEdge(value);

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
