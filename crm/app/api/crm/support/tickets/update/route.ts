import { NextRequest, NextResponse } from 'next/server';
import { requireCrmAuth } from '@/app/api/crm/_utils';
import { getOperationalAdminActorId, getSupabaseAdmin } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

type UpdateBody = { ticketId?: string; status?: 'open' | 'in_progress' | 'waiting_for_user' | 'resolved' | 'closed'; priority?: 'low' | 'normal' | 'high' | 'urgent'; assignedTo?: string | null; internalNotes?: string };

export async function POST(request: NextRequest) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;
  try {
    const body = (await request.json()) as UpdateBody;
    if (!body.ticketId) return NextResponse.json({ error: 'ticketId is required.' }, { status: 400 });
    const supabase = getSupabaseAdmin();
    const actorId = getOperationalAdminActorId();
    const { data: before, error: beforeError } = await supabase.from('support_tickets').select('id, status, priority, assigned_to, metadata').eq('id', body.ticketId).maybeSingle();
    if (beforeError) throw beforeError;
    if (!before) return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 });
    const metadata = { ...(before.metadata as Record<string, unknown> ?? {}) };
    if (typeof body.internalNotes === 'string') metadata.internal_notes = body.internalNotes.slice(0, 5000);
    const patch: Record<string, unknown> = { metadata };
    if (body.status) patch.status = body.status;
    if (body.priority) patch.priority = body.priority;
    if (typeof body.assignedTo !== 'undefined') patch.assigned_to = body.assignedTo;
    if (body.status === 'resolved' || body.status === 'closed') patch.resolved_at = new Date().toISOString();
    const { data: after, error: updateError } = await supabase.from('support_tickets').update(patch).eq('id', body.ticketId).select('id, status, priority, assigned_to, metadata, resolved_at').single();
    if (updateError) throw updateError;
    const { error: auditError } = await supabase.from('admin_audit_logs').insert({ actor_id: actorId, action: 'support_ticket.updated', resource_type: 'support_ticket', resource_id: body.ticketId, before_state: before, after_state: after });
    if (auditError) throw auditError;
    const { error: eventError } = await supabase.from('operational_events').insert({ event_key: 'support-ticket-update:' + body.ticketId + ':' + Date.now().toString(), event_type: 'support_ticket.updated', aggregate_type: 'support_ticket', aggregate_id: body.ticketId, actor_id: actorId, payload: { status: after.status, priority: after.priority } });
    if (eventError) throw eventError;
    return NextResponse.json({ ok: true, ticket: after });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not update support ticket.' }, { status: 500 });
  }
}
