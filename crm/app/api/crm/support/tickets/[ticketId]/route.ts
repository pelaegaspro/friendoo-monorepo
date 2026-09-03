import { NextRequest, NextResponse } from 'next/server';
import { requireCrmAuth } from '@/app/api/crm/_utils';
import { getSupabaseAdmin } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

function profileNameMap(rows: { id: string; display_name: string }[] | null) {
  return new Map((rows ?? []).map((row) => [row.id, row.display_name]));
}

export async function GET(request: NextRequest, context: { params: Promise<{ ticketId: string }> }) {

  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;
  try {
        const { ticketId } = await context.params;

    const supabase = getSupabaseAdmin();
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('id, reporter_id, subject, category, priority, status, assigned_to, metadata, created_at, updated_at, resolved_at')
      .eq('id', ticketId)
      .maybeSingle();
    if (ticketError) throw ticketError;
    if (!ticket) return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 });
    const { data: messages, error: messagesError } = await supabase
      .from('support_messages')
      .select('id, ticket_id, author_id, body, is_internal, created_at')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    if (messagesError) throw messagesError;
    const ids = Array.from(new Set([ticket.reporter_id, ticket.assigned_to, ...(messages ?? []).map((message) => message.author_id)].filter(Boolean)));
    const { data: profiles, error: profilesError } = ids.length
      ? await supabase.from('profiles').select('id, display_name').in('id', ids)
      : { data: [], error: null };
    if (profilesError) throw profilesError;
    const names = profileNameMap(profiles);
    return NextResponse.json({
      ticket: {
        ...ticket,
        userId: ticket.reporter_id,
        userName: ticket.reporter_id ? names.get(ticket.reporter_id) ?? 'Anonymous' : 'Anonymous',
        createdAt: ticket.created_at,
        updatedAt: ticket.updated_at,
        resolvedAt: ticket.resolved_at,
        internalNotes: (ticket.metadata as Record<string, unknown> | null)?.internal_notes ?? '',
      },
      messages: (messages ?? []).map((message) => ({ ...message, authorName: message.author_id ? names.get(message.author_id) ?? 'Admin' : 'System', createdAt: message.created_at })),
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not load support ticket.' }, { status: 500 });
  }
}
