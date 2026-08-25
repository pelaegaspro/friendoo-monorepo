import { NextRequest, NextResponse } from 'next/server';
import { requireCrmAuth } from '@/app/api/crm/_utils';
import { getOperationalAdminActorId, getSupabaseAdmin } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

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
