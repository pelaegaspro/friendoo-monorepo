import { NextRequest, NextResponse } from 'next/server';
import { requireCrmAuth } from '@/app/api/crm/_utils';
import { getOperationalAdminActorId, getSupabaseAdmin } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

type OfferBody = { uids?: string[]; userIds?: string[]; title?: string; message?: string; body?: string; offer?: Record<string, unknown> };

export async function POST(request: NextRequest) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;
  try {
    const body = (await request.json()) as OfferBody;
    const userIds = Array.from(new Set([...(body.uids ?? []), ...(body.userIds ?? [])].filter((value) => typeof value === 'string' && value.length > 0)));
    const title = body.title?.trim() || 'A Friendoo offer for you';
    const message = (body.message ?? body.body)?.trim();
    if (!userIds.length || !message) return NextResponse.json({ error: 'At least one user and an offer message are required.' }, { status: 400 });
    const supabase = getSupabaseAdmin();
    const actorId = getOperationalAdminActorId();
    const { data: campaign, error: campaignError } = await supabase.from('crm_campaigns').insert({ created_by: actorId, name: 'Targeted CRM offer', channel: 'in_app', audience_filter: { user_ids: userIds, delivery_mode: 'inapp', offer: body.offer ?? {} }, title, body: message, status: 'scheduled' }).select('id').single();
    if (campaignError) throw campaignError;
    const { error: eventError } = await supabase.from('operational_events').insert({ event_key: 'targeted-offer:' + campaign.id, event_type: 'crm_campaign.delivery_requested', aggregate_type: 'crm_campaign', aggregate_id: campaign.id, actor_id: actorId, payload: { user_ids: userIds, offer: body.offer ?? {} } });
    if (eventError) throw eventError;
    return NextResponse.json({ ok: true, queued: true, campaignId: campaign.id, users: userIds.length });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not queue offer.' }, { status: 500 });
  }
}
