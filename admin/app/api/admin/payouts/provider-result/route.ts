import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin/guard';
import { getOperationalAdminActorId, getSupabaseAdmin } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

type ProviderResultBody = {
  payoutId?: string;
  success?: boolean;
  provider?: string;
  providerTransferId?: string;
  providerReferenceId?: string;
  failureReason?: string;
};

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  try {
    const body = (await request.json()) as ProviderResultBody;
    if (!body.payoutId || typeof body.success !== 'boolean' || !body.provider?.trim()) {
      return NextResponse.json({ error: 'payoutId, success, and provider are required.' }, { status: 400 });
    }
    if (body.success && !body.providerTransferId?.trim() && !body.providerReferenceId?.trim()) {
      return NextResponse.json({ error: 'A successful payout requires a provider transfer or reference ID.' }, { status: 400 });
    }
    if (!body.success && !body.failureReason?.trim()) {
      return NextResponse.json({ error: 'A failed payout requires a failure reason.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const actorId = getOperationalAdminActorId();
    const requestId = randomUUID();
    const { data: before, error: beforeError } = await supabase
      .from('host_payouts')
      .select('id, status, provider, provider_transfer_id, provider_reference_id, failure_reason, processed_at, paid_at')
      .eq('id', body.payoutId)
      .maybeSingle();
    if (beforeError) throw beforeError;
    if (!before) return NextResponse.json({ error: 'Payout not found.' }, { status: 404 });
    if (before.status !== 'processing') {
      return NextResponse.json({ error: 'Only processing payouts can receive a provider result; current status is ' + before.status + '.' }, { status: 409 });
    }

    const { data: finalStatus, error: resultError } = await supabase.rpc('record_host_payout_provider_result', {
      p_payout_id: body.payoutId,
      p_success: body.success,
      p_provider: body.provider.trim(),
      p_provider_transfer_id: body.providerTransferId?.trim() || null,
      p_provider_reference_id: body.providerReferenceId?.trim() || null,
      p_failure_reason: body.failureReason?.trim() || null,
    });
    if (resultError) throw resultError;

    const { data: after, error: afterError } = await supabase
      .from('host_payouts')
      .select('id, status, provider, provider_transfer_id, provider_reference_id, failure_reason, processed_at, paid_at')
      .eq('id', body.payoutId)
      .single();
    if (afterError) throw afterError;

    const { error: auditError } = await supabase.from('admin_audit_logs').insert({
      actor_id: actorId,
      action: 'host_payout.provider_result_recorded',
      resource_type: 'host_payout',
      resource_id: body.payoutId,
      before_state: before,
      after_state: after,
      request_id: requestId,
    });
    if (auditError) throw auditError;

    return NextResponse.json({ ok: true, payoutId: body.payoutId, status: finalStatus, payout: after });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not record payout provider result.' }, { status: 500 });
  }
}
