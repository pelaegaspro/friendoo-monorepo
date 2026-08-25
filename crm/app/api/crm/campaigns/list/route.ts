import { NextRequest, NextResponse } from 'next/server';
import { requireCrmAuth } from '@/app/api/crm/_utils';
import { getSupabaseAdmin } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;
  try {
    const { data, error } = await getSupabaseAdmin()
      .from('crm_campaigns')
      .select('id, name, channel, audience_filter, title, body, status, created_at, updated_at, sent_at')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    const campaigns = (data ?? []).map((campaign) => {
      const filter = (campaign.audience_filter ?? {}) as Record<string, unknown>;
      return {
        ...campaign,
        type: filter.delivery_mode ?? (campaign.channel === 'in_app' ? 'inapp' : 'push'),
        segment: filter.segment ?? 'all',
        createdAt: campaign.created_at,
        updatedAt: campaign.updated_at,
        scheduledAt: campaign.status === 'scheduled' ? campaign.updated_at : null,
        sentAt: campaign.sent_at,
      };
    });
    return NextResponse.json({ campaigns });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not load campaigns.' }, { status: 500 });
  }
}

