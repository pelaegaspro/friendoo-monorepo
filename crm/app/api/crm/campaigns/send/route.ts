import { NextRequest, NextResponse } from 'next/server';
import { requireCrmAuth } from '@/app/api/crm/_utils';
import { getOperationalAdminActorId, getSupabaseAdmin } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

type SendCampaignBody = { campaignId?: string };

export async function POST(request: NextRequest) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;
  try {
    const body = (await request.json()) as SendCampaignBody;
    if (!body.campaignId) return NextResponse.json({ error: 'campaignId is required.' }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const actorId = getOperationalAdminActorId();
    const { data: campaign, error: campaignError } = await supabase
      .from('crm_campaigns')
      .select('id, name, channel, audience_filter, title, body, status')
      .eq('id', body.campaignId)
      .maybeSingle();
    if (campaignError) throw campaignError;
    if (!campaign) return NextResponse.json({ error: 'Campaign not found.' }, { status: 404 });
    if (campaign.status === 'sent' || campaign.status === 'cancelled') {
      return NextResponse.json({ error: 'This campaign cannot be queued from its current status.' }, { status: 409 });
    }

    const { error: updateError } = await supabase
      .from('crm_campaigns')
      .update({ status: 'scheduled' })
      .eq('id', campaign.id);
    if (updateError) throw updateError;

    const { error: eventError } = await supabase.from('operational_events').insert({
      event_key: 'campaign-request:' + campaign.id + ':' + Date.now().toString(),
      event_type: 'crm_campaign.delivery_requested',
      aggregate_type: 'crm_campaign',
      aggregate_id: campaign.id,
      actor_id: actorId,
      payload: { channel: campaign.channel, audience_filter: campaign.audience_filter, title: campaign.title },
    });
    if (eventError) throw eventError;

    return NextResponse.json({ ok: true, campaignId: campaign.id, queued: true, targetCount: 0, deliveredCount: 0 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not queue campaign.' }, { status: 500 });
  }
}
