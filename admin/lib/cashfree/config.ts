import { getSupabaseAdmin } from '../supabaseServer';

export interface CashfreeConfig {
  environment: 'sandbox' | 'production';
  pgBaseUrl: string;
  payoutBaseUrl: string;
  pgAppId: string;
  pgSecretKey: string;
  payoutClientId: string;
  payoutClientSecret: string;
  minWithdrawalInr: number;
  hostSalaryRate: number;
  autoPayoutEnabled: boolean;
  defaultTransferMode: 'upi' | 'banktransfer';
}

export interface PayoutSettingsDocument {
  environment?: 'sandbox' | 'production';
  payout_client_id?: string;
  payout_client_secret?: string;
  pg_app_id?: string;
  pg_secret_key?: string;
  min_withdrawal_inr?: number;
  host_salary_rate?: number;
  auto_payout_enabled?: boolean;
  default_transfer_mode?: 'upi' | 'banktransfer';
}

export async function getCashfreeConfig(): Promise<CashfreeConfig> {
  let docSettings: PayoutSettingsDocument = {};

  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from('crm_configuration_documents')
      .select('payload')
      .eq('id', 'payout_settings')
      .maybeSingle();

    if (data?.payload && typeof data.payload === 'object') {
      docSettings = data.payload as PayoutSettingsDocument;
    }
  } catch (error) {
    console.warn('Failed to load payout_settings document from Supabase:', error);
  }

  const envRaw = (
    process.env.CASHFREE_ENVIRONMENT ||
    docSettings.environment ||
    'sandbox'
  ).toLowerCase();

  const environment: 'sandbox' | 'production' =
    envRaw === 'production' ? 'production' : 'sandbox';

  const pgAppId =
    process.env.CASHFREE_APP_ID ||
    (environment === 'sandbox' ? process.env.CASHFREE_SANDBOX_APP_ID : undefined) ||
    docSettings.pg_app_id ||
    '';

  const pgSecretKey =
    process.env.CASHFREE_SECRET_KEY ||
    (environment === 'sandbox' ? process.env.CASHFREE_SANDBOX_SECRET_KEY : undefined) ||
    docSettings.pg_secret_key ||
    '';

  const payoutClientId =
    process.env.CASHFREE_PAYOUT_CLIENT_ID ||
    docSettings.payout_client_id ||
    pgAppId;

  const payoutClientSecret =
    process.env.CASHFREE_PAYOUT_CLIENT_SECRET ||
    docSettings.payout_client_secret ||
    pgSecretKey;

  const pgBaseUrl =
    environment === 'production'
      ? 'https://api.cashfree.com/pg'
      : 'https://sandbox.cashfree.com/pg';

  const payoutBaseUrl =
    environment === 'production'
      ? 'https://payout-api.cashfree.com/payout'
      : 'https://sandbox.cashfree.com/payout';

  return {
    environment,
    pgBaseUrl,
    payoutBaseUrl,
    pgAppId,
    pgSecretKey,
    payoutClientId,
    payoutClientSecret,
    minWithdrawalInr: Number(docSettings.min_withdrawal_inr ?? 100),
    hostSalaryRate: Number(docSettings.host_salary_rate ?? 3),
    autoPayoutEnabled: Boolean(docSettings.auto_payout_enabled ?? false),
    defaultTransferMode: docSettings.default_transfer_mode ?? 'upi',
  };
}

