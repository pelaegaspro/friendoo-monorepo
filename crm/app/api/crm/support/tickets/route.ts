import { NextRequest, NextResponse } from 'next/server';
import { requireCrmAuth } from '@/app/api/crm/_utils';
import { getSupabaseAdmin } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

function profileNameMap(rows: { id: string; display_name: string }[] | null) {
  return new Map((rows ?? []).map((row) => [row.id, row.display_name]));
}

export async function GET(request: NextRequest) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;
  try {
    const supabase = getSupabaseAdmin();
    const { data: rows, error } = await supabase
      .from('support_tickets')
      .select('id, reporter_id, subject, category, priority, status, assigned_to, metadata, created_at, updated_at, resolved_at')
      .order('updated_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    const ids = Array.from(new Set((rows ?? []).flatMap((ticket) => [ticket.reporter_id, ticket.assigned_to]).filter(Boolean)));
    const { data: profiles, error: profilesError } = ids.length
      ? await supabase.from('profiles').select('id, display_name').in('id', ids)
      : { data: [], error: null };
    if (profilesError) throw profilesError;
    const names = profileNameMap(profiles);
    const ticketList = (rows ?? []).map((ticket) => ({
      ...ticket,
      userId: ticket.reporter_id,
      userName: ticket.reporter_id ? names.get(ticket.reporter_id) ?? 'Anonymous' : 'Anonymous',
      assignedToName: ticket.assigned_to ? names.get(ticket.assigned_to) ?? null : null,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
      resolvedAt: ticket.resolved_at,
      internalNotes: (ticket.metadata as Record<string, unknown> | null)?.internal_notes ?? '',
    }));
    return NextResponse.json({ tickets: ticketList });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not load support tickets.' }, { status: 500 });
  }
}

