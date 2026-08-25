import { NextRequest, NextResponse } from 'next/server';
import { requireCrmAuth } from '@/app/api/crm/_utils';
import { getOperationalAdminActorId, getSupabaseAdmin } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

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
