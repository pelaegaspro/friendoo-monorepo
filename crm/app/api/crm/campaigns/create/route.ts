import { NextRequest, NextResponse } from 'next/server';
import { requireCrmAuth } from '@/app/api/crm/_utils';
import { getOperationalAdminActorId, getSupabaseAdmin } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

type CreateCampaignBody = {
  name?: string;
  type?: 'push' | 'inapp' | 'both';
  segment?: string;
  customFilter?: Record<string, unknown>;
  title?: string;
  body?: string;
  scheduledAt?: string | null;
};

export async function POST(request: NextRequest) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;
  try {
    const body = (await request.json()) as CreateCampaignBody;
    if (!body.name?.trim() || !body.type || !body.segment?.trim() || !body.title?.trim() || !body.body?.trim()) {
      return NextResponse.json({ error: 'name, type, segment, title, and body are required.' }, { status: 400 });
    }
    const channel = body.type === 'inapp' ? 'in_app' : 'push';
    const audienceFilter = { segment: body.segment.trim(), delivery_mode: body.type, ...(body.customFilter ?? {}) };
    const { data, error } = await getSupabaseAdmin()
      .from('crm_campaigns')
      .insert({
        created_by: getOperationalAdminActorId(),
        name: body.name.trim(),
        channel,
        audience_filter: audienceFilter,
        title: body.title.trim(),
        body: body.body.trim(),
        status: body.scheduledAt ? 'scheduled' : 'draft',
      })
      .select('id, name, channel, audience_filter, title, body, status, created_at, updated_at')
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, campaignId: data.id, campaign: data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not create campaign.' }, { status: 500 });
  }
}
