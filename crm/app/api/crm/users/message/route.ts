import { NextRequest, NextResponse } from 'next/server';
import { requireCrmAuth } from '@/app/api/crm/_utils';
import { getOperationalAdminActorId, getSupabaseAdmin } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

type MessageBody = { userId?: string; title?: string; message?: string };

export async function POST(request: NextRequest) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;
  try {
    const body = (await request.json()) as MessageBody;
    if (!body.userId || !body.title?.trim() || !body.message?.trim()) return NextResponse.json({ error: 'userId, title, and message are required.' }, { status: 400 });
    const supabase = getSupabaseAdmin();
    const actorId = getOperationalAdminActorId();
    const { data: campaign, error: campaignError } = await supabase.from('crm_campaigns').insert({ created_by: actorId, name: 'Direct CRM message', channel: 'in_app', audience_filter: { user_ids: [body.userId], delivery_mode: 'inapp' }, title: body.title.trim(), body: body.message.trim(), status: 'scheduled' }).select('id').single();
    if (campaignError) throw campaignError;
    const { error: eventError } = await supabase.from('operational_events').insert({ event_key: 'direct-message:' + campaign.id, event_type: 'crm_campaign.delivery_requested', aggregate_type: 'crm_campaign', aggregate_id: campaign.id, actor_id: actorId, payload: { user_id: body.userId, channel: 'in_app' } });
    if (eventError) throw eventError;
    return NextResponse.json({ ok: true, queued: true, campaignId: campaign.id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not queue user message.' }, { status: 500 });
  }
}
