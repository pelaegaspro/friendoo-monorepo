import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin/guard';
import { getSupabaseAdmin } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ ticketId: string }> }
) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  try {
    const { ticketId } = await context.params;
    const supabase = getSupabaseAdmin();

    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .maybeSingle();

    if (ticketError) throw ticketError;
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const { data: messages, error: messagesError } = await supabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (messagesError) throw messagesError;

    // Map messages to ChatMessage interface
    const chatMessages = (messages || []).map((m) => {
      const isAdmin = !m.author_id || m.author_id !== ticket.reporter_id;
      return {
        id: m.id,
        sender: isAdmin ? 'admin' : 'user',
        senderName: isAdmin ? 'Friendoo Admin Support 🛡️' : 'User',
        content: m.body,
        timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    });

    return NextResponse.json({ ticket, messages: chatMessages });
  } catch (error) {
    console.error('Error loading ticket messages:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not load messages' },
      { status: 500 }
    );
  }
}

