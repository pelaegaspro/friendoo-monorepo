import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin/guard';
import { getSupabaseAdmin } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    const { ticketId, userId } = body;

    if (!ticketId) {
      return NextResponse.json({ error: 'ticketId is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    let targetUserId = userId;
    if (!targetUserId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUserId)) {
      const { data: t } = await supabase.from('support_tickets').select('reporter_id').eq('id', ticketId).maybeSingle();
      if (t?.reporter_id) {
        targetUserId = t.reporter_id;
      }
    }

    // 1. Update status to resolved
    const { error: updateError } = await supabase
      .from('support_tickets')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', ticketId);

    if (updateError) throw updateError;

    // 2. Broadcast resolution to dismiss in-app notification badge
    if (targetUserId) {
      try {
        const channel = supabase.channel(`support_live:${targetUserId}`);
        await channel.send({
          type: 'broadcast',
          event: 'ticket_resolved',
          payload: {
            ticketId,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (err) {
        console.warn('Realtime broadcast failed:', err);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error resolving support ticket:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not resolve ticket' },
      { status: 500 }
    );
  }
}

