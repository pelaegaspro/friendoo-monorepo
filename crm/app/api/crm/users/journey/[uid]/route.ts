import { NextRequest, NextResponse } from 'next/server';
import { requireCrmAuth } from '@/app/api/crm/_utils';
import { getSupabaseAdmin } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, context: { params: Promise<{ uid: string }> }) {

  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;
  try {
        const { uid: userId } = await context.params;

    const supabase = getSupabaseAdmin();
    const [profileResult, walletResult, paymentsResult, transactionsResult, callsResult, reportsResult] = await Promise.all([
      supabase.from('profiles').select('id, phone, display_name, role, is_banned, created_at, updated_at').eq('id', userId).maybeSingle(),
      supabase.from('wallets').select('coin_balance, is_frozen, frozen_reason, updated_at').eq('user_id', userId).maybeSingle(),
      supabase.from('payment_orders').select('id, amount_inr, coins, status, provider, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
      supabase.from('wallet_transactions').select('id, type, coin_amount, balance_after, metadata, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(100),
      supabase.from('calls').select('id, status, call_type, total_coins_deducted, created_at, ended_at, end_reason').eq('caller_id', userId).order('created_at', { ascending: false }).limit(100),
      supabase.from('reports').select('id, reason, status, created_at').eq('reporter_id', userId).order('created_at', { ascending: false }).limit(50),
    ]);
    for (const result of [profileResult, walletResult, paymentsResult, transactionsResult, callsResult, reportsResult]) if (result.error) throw result.error;
    if (!profileResult.data) return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    const timeline = [
      { title: 'Account created', date: profileResult.data.created_at, detail: 'Joined Friendoo', level: 'ok' },
      ...(paymentsResult.data ?? []).map((payment) => ({ title: 'Top-up ' + payment.status, date: payment.created_at, detail: payment.coins + ' coins', level: payment.status === 'success' ? 'ok' : 'warn' })),
      ...(transactionsResult.data ?? []).map((transaction) => ({ title: 'Wallet ' + transaction.type, date: transaction.created_at, detail: transaction.coin_amount + ' coins', level: transaction.coin_amount >= 0 ? 'ok' : 'warn' })),
      ...(callsResult.data ?? []).map((call) => ({ title: 'Call ' + call.status, date: call.ended_at ?? call.created_at, detail: call.total_coins_deducted + ' coins', level: call.status === 'ended' ? 'ok' : 'warn' })),
      ...(reportsResult.data ?? []).map((report) => ({ title: 'Safety report ' + report.status, date: report.created_at, detail: report.reason, level: report.status === 'resolved' ? 'ok' : 'warn' })),
    ].sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
    return NextResponse.json({ user: { ...profileResult.data, coinBalance: walletResult.data?.coin_balance ?? 0, wallet: walletResult.data }, timeline, payments: paymentsResult.data ?? [], transactions: transactionsResult.data ?? [], calls: callsResult.data ?? [], reports: reportsResult.data ?? [] });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not load user journey.' }, { status: 500 });
  }
}
