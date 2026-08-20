const fs = require('fs');
const path = require('path');

const root = process.argv[2];
if (!root) throw new Error('Usage: node migrate_crm_support_fraud_supabase.js <friendoo-root>');

const crmRoot = path.join(root, 'crm/app/api/crm');
const imports = `import { NextRequest, NextResponse } from 'next/server';
import { requireCrmAuth } from '@/app/api/crm/_utils';
import { getOperationalAdminActorId, getSupabaseAdmin } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';
`;

const ticketHelpers = `
function profileNameMap(rows: { id: string; display_name: string }[] | null) {
  return new Map((rows ?? []).map((row) => [row.id, row.display_name]));
}
`;

const tickets = imports + ticketHelpers + `
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
`;

const ticketDetail = imports + ticketHelpers + `
export async function GET(request: NextRequest, context: { params: { ticketId: string } }) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;
  try {
    const ticketId = context.params.ticketId;
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
`;

const reply = imports + `
type ReplyBody = { ticketId?: string; message?: string; internal?: boolean };

export async function POST(request: NextRequest) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;
  try {
    const body = (await request.json()) as ReplyBody;
    if (!body.ticketId || !body.message?.trim()) return NextResponse.json({ error: 'ticketId and message are required.' }, { status: 400 });
    const supabase = getSupabaseAdmin();
    const actorId = getOperationalAdminActorId();
    const { data: ticket, error: ticketError } = await supabase.from('support_tickets').select('id, status').eq('id', body.ticketId).maybeSingle();
    if (ticketError) throw ticketError;
    if (!ticket) return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 });
    if (ticket.status === 'closed') return NextResponse.json({ error: 'Closed tickets cannot receive replies.' }, { status: 409 });
    const { data: message, error: messageError } = await supabase
      .from('support_messages')
      .insert({ ticket_id: body.ticketId, author_id: actorId, body: body.message.trim(), is_internal: Boolean(body.internal) })
      .select('id, created_at')
      .single();
    if (messageError) throw messageError;
    const { error: updateError } = await supabase.from('support_tickets').update({ assigned_to: actorId, status: body.internal ? 'in_progress' : 'waiting_for_user' }).eq('id', body.ticketId);
    if (updateError) throw updateError;
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
`;

const ticketUpdate = imports + `
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
`;

const fraudAlerts = imports + `
export async function GET(request: NextRequest) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;
  try {
    const supabase = getSupabaseAdmin();
    const { data: rows, error } = await supabase.from('fraud_alerts').select('id, user_id, alert_type, severity, status, evidence, assigned_to, resolution_note, resolved_at, created_at, updated_at').order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    const ids = Array.from(new Set((rows ?? []).flatMap((alert) => [alert.user_id, alert.assigned_to]).filter(Boolean)));
    const { data: profiles, error: profilesError } = ids.length ? await supabase.from('profiles').select('id, display_name').in('id', ids) : { data: [], error: null };
    if (profilesError) throw profilesError;
    const names = new Map((profiles ?? []).map((profile) => [profile.id, profile.display_name]));
    const alerts = (rows ?? []).map((alert) => ({ ...alert, flaggedUserId: alert.user_id, flaggedUserName: alert.user_id ? names.get(alert.user_id) ?? 'Anonymous' : 'Unknown', assignedToName: alert.assigned_to ? names.get(alert.assigned_to) ?? null : null, createdAt: alert.created_at, updatedAt: alert.updated_at, resolvedAt: alert.resolved_at }));
    return NextResponse.json({ alerts });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not load fraud alerts.' }, { status: 500 });
  }
}
`;

const fraudAction = imports + `
type FraudActionBody = { alertId?: string; action?: 'review' | 'dismiss' | 'resolve'; status?: 'open' | 'reviewing' | 'dismissed' | 'resolved'; assignedTo?: string | null; notes?: string };

export async function POST(request: NextRequest) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;
  try {
    const body = (await request.json()) as FraudActionBody;
    if (!body.alertId) return NextResponse.json({ error: 'alertId is required.' }, { status: 400 });
    const statusByAction: Record<string, FraudActionBody['status']> = { review: 'reviewing', dismiss: 'dismissed', resolve: 'resolved' };
    const nextStatus = body.status ?? (body.action ? statusByAction[body.action] : undefined);
    if (!nextStatus) return NextResponse.json({ error: 'A valid action or status is required.' }, { status: 400 });
    const supabase = getSupabaseAdmin();
    const actorId = getOperationalAdminActorId();
    const { data: before, error: beforeError } = await supabase.from('fraud_alerts').select('id, status, assigned_to, resolution_note, resolved_at').eq('id', body.alertId).maybeSingle();
    if (beforeError) throw beforeError;
    if (!before) return NextResponse.json({ error: 'Fraud alert not found.' }, { status: 404 });
    const patch: Record<string, unknown> = { status: nextStatus };
    if (typeof body.assignedTo !== 'undefined') patch.assigned_to = body.assignedTo;
    if (typeof body.notes === 'string') patch.resolution_note = body.notes.slice(0, 5000);
    if (nextStatus === 'resolved' || nextStatus === 'dismissed') patch.resolved_at = new Date().toISOString();
    const { data: after, error: updateError } = await supabase.from('fraud_alerts').update(patch).eq('id', body.alertId).select('id, status, assigned_to, resolution_note, resolved_at').single();
    if (updateError) throw updateError;
    const { error: auditError } = await supabase.from('admin_audit_logs').insert({ actor_id: actorId, action: 'fraud_alert.' + nextStatus, resource_type: 'fraud_alert', resource_id: body.alertId, before_state: before, after_state: after });
    if (auditError) throw auditError;
    const { error: eventError } = await supabase.from('operational_events').insert({ event_key: 'fraud-alert-action:' + body.alertId + ':' + Date.now().toString(), event_type: 'fraud_alert.' + nextStatus, aggregate_type: 'fraud_alert', aggregate_id: body.alertId, actor_id: actorId, payload: { status: nextStatus } });
    if (eventError) throw eventError;
    return NextResponse.json({ ok: true, alert: after });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not update fraud alert.' }, { status: 500 });
  }
}
`;

const files = {
  'support/tickets/route.ts': tickets,
  'support/tickets/[ticketId]/route.ts': ticketDetail,
  'support/reply/route.ts': reply,
  'support/tickets/update/route.ts': ticketUpdate,
  'fraud/alerts/route.ts': fraudAlerts,
  'fraud/action/route.ts': fraudAction,
};

for (const [relativePath, content] of Object.entries(files)) {
  const target = path.join(crmRoot, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}
