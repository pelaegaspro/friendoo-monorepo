import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin/guard';
import { getSupabaseAdmin, getOperationalAdminActorId } from '@/lib/supabaseServer';
import { getCashfreeConfig, PayoutSettingsDocument } from '@/lib/cashfree/config';

export async function GET() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  try {
    const config = await getCashfreeConfig();

    return NextResponse.json({
      environment: config.environment,
      minWithdrawalInr: config.minWithdrawalInr,
      hostSalaryRate: config.hostSalaryRate,
      autoPayoutEnabled: config.autoPayoutEnabled,
      defaultTransferMode: config.defaultTransferMode,
      payoutClientId: config.payoutClientId ? `${config.payoutClientId.slice(0, 6)}...` : '',
      pgAppId: config.pgAppId ? `${config.pgAppId.slice(0, 6)}...` : '',
      isConfigured: Boolean(config.payoutClientId && config.payoutClientSecret),
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    const supabase = getSupabaseAdmin();
    const actorId = getOperationalAdminActorId();

    const { data: existingDoc } = await supabase
      .from('crm_configuration_documents')
      .select('payload')
      .eq('id', 'payout_settings')
      .maybeSingle();

    const existingPayload = (existingDoc?.payload as Record<string, unknown>) ?? {};

    const nextPayload: PayoutSettingsDocument = {
      ...existingPayload,
      environment: body.environment === 'production' ? 'production' : 'sandbox',
      min_withdrawal_inr: Number(body.minWithdrawalInr ?? 100),
      host_salary_rate: Number(body.hostSalaryRate ?? 3),
      auto_payout_enabled: Boolean(body.autoPayoutEnabled ?? false),
      default_transfer_mode: body.defaultTransferMode === 'banktransfer' ? 'banktransfer' : 'upi',
    };

    if (body.payoutClientId && !body.payoutClientId.includes('...')) {
      nextPayload.payout_client_id = body.payoutClientId.trim();
    }
    if (body.payoutClientSecret) {
      nextPayload.payout_client_secret = body.payoutClientSecret.trim();
    }
    if (body.pgAppId && !body.pgAppId.includes('...')) {
      nextPayload.pg_app_id = body.pgAppId.trim();
    }
    if (body.pgSecretKey) {
      nextPayload.pg_secret_key = body.pgSecretKey.trim();
    }

    const { error: upsertError } = await supabase
      .from('crm_configuration_documents')
      .upsert({
        id: 'payout_settings',
        payload: nextPayload,
        updated_by: actorId,
        updated_at: new Date().toISOString(),
      });

    if (upsertError) throw upsertError;

    return NextResponse.json({ ok: true, message: 'Payout settings saved successfully' });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 });
  }
}

