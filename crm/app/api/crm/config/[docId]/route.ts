import { NextRequest, NextResponse } from 'next/server';
import { requireCrmAuth } from '@/app/api/crm/_utils';
import { getOperationalAdminActorId, getSupabaseAdmin } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, context: { params: { docId: string } }) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;
  try {
    const { data, error } = await getSupabaseAdmin().from('crm_configuration_documents').select('id, payload, updated_by, created_at, updated_at').eq('id', context.params.docId).maybeSingle();
    if (error) throw error;
    return NextResponse.json({ id: context.params.docId, exists: Boolean(data), data: data?.payload ?? null, updatedAt: data?.updated_at ?? null });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not load configuration.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: { params: { docId: string } }) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const supabase = getSupabaseAdmin();
    const actorId = getOperationalAdminActorId();
    const { data: before, error: beforeError } = await supabase.from('crm_configuration_documents').select('payload').eq('id', context.params.docId).maybeSingle();
    if (beforeError) throw beforeError;
    const { data, error } = await supabase.from('crm_configuration_documents').upsert({ id: context.params.docId, payload, updated_by: actorId }, { onConflict: 'id' }).select('id, payload, updated_at').single();
    if (error) throw error;
    const { error: auditError } = await supabase.from('admin_audit_logs').insert({ actor_id: actorId, action: 'crm_configuration.updated', resource_type: 'crm_configuration_document', resource_id: context.params.docId, before_state: before?.payload ?? {}, after_state: data.payload });
    if (auditError) throw auditError;
    const { error: eventError } = await supabase.from('operational_events').insert({ event_key: 'crm-config:' + context.params.docId + ':' + Date.now().toString(), event_type: 'crm_configuration.updated', aggregate_type: 'crm_configuration_document', aggregate_id: context.params.docId, actor_id: actorId, payload: data.payload });
    if (eventError) throw eventError;
    return NextResponse.json({ ok: true, id: data.id, data: data.payload, updatedAt: data.updated_at });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not update configuration.' }, { status: 500 });
  }
}
