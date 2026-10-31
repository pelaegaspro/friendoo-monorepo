import { NextRequest, NextResponse } from 'next/server';
import { requireCrmAuth } from '@/app/api/crm/_utils';
import { getOperationalAdminActorId, getSupabaseAdmin } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

type ReplyBody = { ticketId?: string; message?: string; internal?: boolean };

export async function POST(request: NextRequest) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;
  try {
    const body = (await request.json()) as ReplyBody;
    if (!body.ticketId || !body.message?.trim()) return NextResponse.json({ error: 'ticketId and message are required.' }, { status: 400 });
    const supabase = getSupabaseAdmin();
    const actorId = getOperationalAdminActorId();
    const { data: ticket, error: ticketError } = await supabase.from('support_tickets').select('id, status, reporter_id, metadata').eq('id', body.ticketId).maybeSingle();
    if (ticketError) throw ticketError;
    if (!ticket) return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 });
    if (ticket.status === 'closed') return NextResponse.json({ error: 'Closed tickets cannot receive replies.' }, { status: 409 });
    const { data: message, error: messageError } = await supabase
      .from('support_messages')
      .insert({ ticket_id: body.ticketId, author_id: actorId, body: body.message.trim(), is_internal: Boolean(body.internal) })
      .select('id, created_at')
      .single();
    if (messageError) throw messageError;

    const existingMeta = (ticket.metadata as Record<string, unknown>) || {};
    const updatedMeta = {
      ...existingMeta,
      last_admin_message: body.message.trim(),
      admin_sender: 'Friendoo CRM Support 🛡️',
      has_admin_message: true,
    };

    const { error: updateError } = await supabase.from('support_tickets').update({
      assigned_to: actorId,
      status: body.internal ? 'in_progress' : 'waiting_for_user',
      metadata: updatedMeta,
      updated_at: new Date().toISOString(),
    }).eq('id', body.ticketId);
    if (updateError) throw updateError;

    // Realtime broadcast to mobile app
    if (!body.internal && ticket.reporter_id) {
      try {
        const channel = supabase.channel('support_live:' + ticket.reporter_id);
        await channel.send({
          type: 'broadcast',
          event: 'admin_message',
          payload: {
            message: body.message.trim(),
            sender: 'Friendoo CRM Support 🛡️',
            ticketId: body.ticketId,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (_) {}
    }
    const { error: eventError } = await supabase.from('operational_events').insert({
      event_key: 'support-reply:' + message.id,
      event_type: 'support_ticket.reply_added',
      aggregate_type: 'support_ticket',
      aggregate_id: body.ticketId,
      actor_id: actorId,
      payload: { internal: Boolean(body.internal) },
    });
    if (eventError) throw eventError;
    return NextResponse.json({ ok: true, messageId: message.id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not add support reply.' }, { status: 500 });
  }
}
