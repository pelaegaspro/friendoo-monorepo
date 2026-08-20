const fs = require('fs');
const path = require('path');

const root = process.argv[2];
if (!root) throw new Error('Usage: node migrate_crm_campaigns_supabase.js <friendoo-root>');

const base = path.join(root, 'crm/app/api/crm/campaigns');
const common = `import { NextRequest, NextResponse } from 'next/server';
import { requireCrmAuth } from '@/app/api/crm/_utils';
import { getOperationalAdminActorId, getSupabaseAdmin } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';
`;

const create = common + `
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
`;

const list = common + `
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
`;

const send = common + `
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
`;

for (const [name, content] of Object.entries({ create, list, send })) {
  const target = path.join(base, name, 'route.ts');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}
