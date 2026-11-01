import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin/guard';
import { getSupabaseAdmin } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    const { ticketId, userId, message } = body;

    if (!ticketId || !message?.trim()) {
      return NextResponse.json({ error: 'ticketId and message are required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const text = message.trim();

    // 1. Resolve full user UUID
    let targetUserId = userId;
    if (!targetUserId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUserId)) {
      const { data: t } = await supabase.from('support_tickets').select('reporter_id').eq('id', ticketId).maybeSingle();
      if (t?.reporter_id) {
        targetUserId = t.reporter_id;
      }
    }

    // 2. Insert into support_messages
    const { data: insertedMsg, error: msgError } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: ticketId,
        body: text,
        is_internal: false,
      })
      .select('id, created_at')
      .single();

    if (msgError) throw msgError;

    // 3. Update ticket status and metadata
    const { data: currentTicket } = await supabase
      .from('support_tickets')
      .select('metadata')
      .eq('id', ticketId)
      .maybeSingle();

    const existingMeta = (currentTicket?.metadata as Record<string, unknown>) || {};
    await supabase
      .from('support_tickets')
      .update({
        status: 'waiting_for_user',
        updated_at: new Date().toISOString(),
        metadata: {
          ...existingMeta,
          last_admin_message: text,
          admin_sender: 'Friendoo Official Admin 🛡️',
          has_admin_message: true,
          user_has_replied: false,
        },
      })
      .eq('id', ticketId);

    // 4. Realtime Broadcast to user's Support Sheet & In-App Banner
    if (targetUserId) {
      try {
        const channel = supabase.channel(`support_live:${targetUserId}`);
        await channel.send({
          type: 'broadcast',
          event: 'admin_message',
          payload: {
            message: text,
            sender: 'Friendoo Official Admin 🛡️',
            ticketId,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (err) {
        console.warn('Realtime broadcast failed:', err);
      }
    }

    return NextResponse.json({ ok: true, messageId: insertedMsg.id });
  } catch (error) {
    console.error('Error in admin support reply:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not deliver reply' },
      { status: 500 }
    );
  }
}

