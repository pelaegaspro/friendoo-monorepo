const fs = require('fs');
const path = require('path');

const root = process.argv[2];
if (!root) throw new Error('Usage: node migrate_crm_remaining_core_routes.js <friendoo-root>');

const base = path.join(root, 'crm/app/api/crm');
const imports = `import { NextRequest, NextResponse } from 'next/server';
import { requireCrmAuth } from '@/app/api/crm/_utils';
import { getOperationalAdminActorId, getSupabaseAdmin } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';
`;

const refund = imports + `
type RefundBody = { ticketId?: string; userId?: string; coinsAmount?: number; reason?: string };

export async function POST(request: NextRequest) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;
  try {
    const body = (await request.json()) as RefundBody;
    const coins = Math.floor(Number(body.coinsAmount));
    if (!body.ticketId || !body.userId || !Number.isFinite(coins) || coins < 1) {
      return NextResponse.json({ error: 'ticketId, userId, and a positive coinsAmount are required.' }, { status: 400 });
    }
    const supabase = getSupabaseAdmin();
    const actorId = getOperationalAdminActorId();
    const { data: ticket, error: ticketError } = await supabase.from('support_tickets').select('id, reporter_id, status, metadata').eq('id', body.ticketId).maybeSingle();
    if (ticketError) throw ticketError;
    if (!ticket) return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 });
    if (ticket.reporter_id && ticket.reporter_id !== body.userId) return NextResponse.json({ error: 'The ticket does not belong to the specified user.' }, { status: 409 });
    const idempotencyKey = 'support-refund:' + body.ticketId + ':' + body.userId;
    const { data: balance, error: adjustmentError } = await supabase.rpc('admin_adjust_wallet', {
      p_actor_id: actorId,
      p_user_id: body.userId,
      p_coin_delta: coins,
      p_reason: body.reason?.trim() || 'Support-approved coin refund for ticket ' + body.ticketId,
      p_idempotency_key: idempotencyKey,
    });
    if (adjustmentError) throw adjustmentError;
    const metadata = { ...(ticket.metadata as Record<string, unknown> ?? {}), refund_coins: coins, refund_idempotency_key: idempotencyKey };
    const { error: ticketUpdateError } = await supabase.from('support_tickets').update({ status: 'resolved', assigned_to: actorId, resolved_at: new Date().toISOString(), metadata }).eq('id', body.ticketId);
    if (ticketUpdateError) throw ticketUpdateError;
    const { error: auditError } = await supabase.from('admin_audit_logs').insert({ actor_id: actorId, action: 'support_ticket.coin_refund', resource_type: 'support_ticket', resource_id: body.ticketId, before_state: { status: ticket.status, metadata: ticket.metadata }, after_state: { status: 'resolved', coins, balance, idempotencyKey } });
    if (auditError) throw auditError;
    return NextResponse.json({ ok: true, ticketId: body.ticketId, newCoinBalance: balance, idempotencyKey });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not process coin refund.' }, { status: 500 });
  }
}
`;

const userMessage = imports + `
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
`;

const sendOffer = imports + `
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
`;

const userJourney = imports + `
export async function GET(request: NextRequest, context: { params: { uid: string } }) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;
  try {
    const userId = context.params.uid;
    const supabase = getSupabaseAdmin();
    const [profileResult, walletResult, paymentsResult, transactionsResult, callsResult, reportsResult] = await Promise.all([
      supabase.from('profiles').select('id, phone, display_name, role, is_banned, created_at, updated_at').eq('id', userId).maybeSingle(),
      supabase.from('wallets').select('coin_balance, is_frozen, frozen_reason, updated_at').eq('user_id', userId).maybeSingle(),
      supabase.from('payment_orders').select('id, amount_inr, coins, status, provider, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
      supabase.from('wallet_transactions').select('id, type, coin_amount, balance_after, metadata, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(100),
      supabase.from('calls').select('id, status, call_type, total_coins_deducted, created_at, ended_at, end_reason').eq('caller_id', userId).order('created_at', { ascending: false }).limit(100),
      supabase.from('reports').select('id, reason, status, created_at').eq('reporter_id', userId).order('created_at', { ascending: false }).limit(50),
    ]);
    for (const result of [profileResult, walletResult, paymentsResult, transactionsResult, callsResult, reportsResult]) if (result.error) throw result.error;
    if (!profileResult.data) return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    const timeline = [
      { title: 'Account created', date: profileResult.data.created_at, detail: 'Joined Friendoo', level: 'ok' },
      ...(paymentsResult.data ?? []).map((payment) => ({ title: 'Top-up ' + payment.status, date: payment.created_at, detail: payment.coins + ' coins', level: payment.status === 'success' ? 'ok' : 'warn' })),
      ...(transactionsResult.data ?? []).map((transaction) => ({ title: 'Wallet ' + transaction.type, date: transaction.created_at, detail: transaction.coin_amount + ' coins', level: transaction.coin_amount >= 0 ? 'ok' : 'warn' })),
      ...(callsResult.data ?? []).map((call) => ({ title: 'Call ' + call.status, date: call.ended_at ?? call.created_at, detail: call.total_coins_deducted + ' coins', level: call.status === 'ended' ? 'ok' : 'warn' })),
      ...(reportsResult.data ?? []).map((report) => ({ title: 'Safety report ' + report.status, date: report.created_at, detail: report.reason, level: report.status === 'resolved' ? 'ok' : 'warn' })),
    ].sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
    return NextResponse.json({ user: { ...profileResult.data, coinBalance: walletResult.data?.coin_balance ?? 0, wallet: walletResult.data }, timeline, payments: paymentsResult.data ?? [], transactions: transactionsResult.data ?? [], calls: callsResult.data ?? [], reports: reportsResult.data ?? [] });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not load user journey.' }, { status: 500 });
  }
}
`;

const revenueStats = imports + `
export async function GET(request: NextRequest) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;
  try {
    const { data: payments, error } = await getSupabaseAdmin().from('payment_orders').select('id, amount_inr, coins, created_at').eq('status', 'success').order('created_at', { ascending: false }).limit(1000);
    if (error) throw error;
    const now = new Date();
    const month = now.getUTCMonth();
    const year = now.getUTCFullYear();
    const totalRevenue = (payments ?? []).reduce((sum, payment) => sum + Number(payment.amount_inr ?? 0), 0);
    const monthRevenue = (payments ?? []).filter((payment) => { const date = new Date(payment.created_at); return date.getUTCMonth() === month && date.getUTCFullYear() === year; }).reduce((sum, payment) => sum + Number(payment.amount_inr ?? 0), 0);
    const totalCoins = (payments ?? []).reduce((sum, payment) => sum + Number(payment.coins ?? 0), 0);
    return NextResponse.json({ totalRevenue, monthRevenue, totalCoins, successfulOrders: (payments ?? []).length, payments: payments ?? [] }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not load revenue statistics.' }, { status: 500 });
  }
}
`;

const config = imports + `
export async function GET(request: NextRequest, context: { params: { docId: string } }) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;
  try {
    const { data, error } = await getSupabaseAdmin().from('crm_configuration_documents').select('id, payload, updated_by, created_at, updated_at').eq('id', context.params.docId).maybeSingle();
    if (error) throw error;
    return NextResponse.json({ id: context.params.docId, exists: Boolean(data), data: data?.payload ?? null, updatedAt: data?.updated_at ?? null });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not load configuration.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: { params: { docId: string } }) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const supabase = getSupabaseAdmin();
    const actorId = getOperationalAdminActorId();
    const { data: before, error: beforeError } = await supabase.from('crm_configuration_documents').select('payload').eq('id', context.params.docId).maybeSingle();
    if (beforeError) throw beforeError;
    const { data, error } = await supabase.from('crm_configuration_documents').upsert({ id: context.params.docId, payload, updated_by: actorId }, { onConflict: 'id' }).select('id, payload, updated_at').single();
    if (error) throw error;
    const { error: auditError } = await supabase.from('admin_audit_logs').insert({ actor_id: actorId, action: 'crm_configuration.updated', resource_type: 'crm_configuration_document', resource_id: context.params.docId, before_state: before?.payload ?? {}, after_state: data.payload });
    if (auditError) throw auditError;
    const { error: eventError } = await supabase.from('operational_events').insert({ event_key: 'crm-config:' + context.params.docId + ':' + Date.now().toString(), event_type: 'crm_configuration.updated', aggregate_type: 'crm_configuration_document', aggregate_id: context.params.docId, actor_id: actorId, payload: data.payload });
    if (eventError) throw eventError;
    return NextResponse.json({ ok: true, id: data.id, data: data.payload, updatedAt: data.updated_at });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not update configuration.' }, { status: 500 });
  }
}
`;

const usersList = imports + `
export async function GET(request: NextRequest) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;
  try {
    const supabase = getSupabaseAdmin();
    const search = new URL(request.url).searchParams.get('search')?.trim();
    let profilesQuery = supabase.from('profiles').select('id, phone, display_name, role, is_banned, created_at, updated_at').order('created_at', { ascending: false }).limit(200);
    if (search) profilesQuery = profilesQuery.or('display_name.ilike.%' + search + '%,phone.ilike.%' + search + '%');
    const { data: profiles, error: profilesError } = await profilesQuery;
    if (profilesError) throw profilesError;
    const ids = (profiles ?? []).map((profile) => profile.id);
    const { data: wallets, error: walletsError } = ids.length ? await supabase.from('wallets').select('user_id, coin_balance, is_frozen, frozen_reason, updated_at').in('user_id', ids) : { data: [], error: null };
    if (walletsError) throw walletsError;
    const walletByUser = new Map((wallets ?? []).map((wallet) => [wallet.user_id, wallet]));
    const users = (profiles ?? []).map((profile) => ({ ...profile, uid: profile.id, displayName: profile.display_name, createdAt: profile.created_at, lastActive: profile.updated_at, coinBalance: walletByUser.get(profile.id)?.coin_balance ?? 0, wallet: walletByUser.get(profile.id) ?? null }));
    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not load users.' }, { status: 500 });
  }
}
`;

const routes = {
  'support/refund/route.ts': refund,
  'users/message/route.ts': userMessage,
  'users/sendOffer/route.ts': sendOffer,
  'users/journey/[uid]/route.ts': userJourney,
  'revenue/stats/route.ts': revenueStats,
  'config/[docId]/route.ts': config,
  'users/list/route.ts': usersList,
};

for (const [relativePath, source] of Object.entries(routes)) {
  const target = path.join(base, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, source);
}
