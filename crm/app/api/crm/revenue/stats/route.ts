import { NextRequest, NextResponse } from 'next/server';
import { requireCrmAuth } from '@/app/api/crm/_utils';
import { getRevenueStats } from '@/lib/crmData';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;
  try {
    const payload = await getRevenueStats();
    return NextResponse.json(payload, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not load revenue statistics.' }, { status: 500 });
  }
}
