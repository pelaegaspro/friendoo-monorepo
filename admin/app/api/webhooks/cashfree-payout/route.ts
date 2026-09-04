import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseServer';
import { getCashfreeConfig } from '@/lib/cashfree/config';
import { verifyCashfreePayoutWebhookSignature } from '@/lib/cashfree/payouts';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const timestamp = req.headers.get('x-webhook-timestamp') || '';
    const signature = req.headers.get('x-webhook-signature') || '';

    const config = await getCashfreeConfig();

    // Verify signature in production or if secret is configured
    if (config.payoutClientSecret && signature) {
      const isValid = await verifyCashfreePayoutWebhookSignature(
        config.payoutClientSecret,
        timestamp,
        rawBody,
        signature
      );
      if (!isValid) {
        console.warn('Cashfree Payout webhook signature verification failed');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 });
    }

    const eventType = String(
      payload.event || payload.type || payload.event_type || ''
    ).toUpperCase();

    const data = (payload.data || payload) as Record<string, unknown>;
    const transferId = String(
      data.transfer_id || data.transferId || data.referenceId || ''
    );
    const cfTransferId = String(
      data.cf_transfer_id || data.cfTransferId || ''
    );
    const status = String(
      data.status || data.transfer_status || ''
    ).toUpperCase();
    const failureReason = String(
      data.status_description || data.failure_reason || data.message || 'Transfer failed'
    );

    if (!transferId) {
      // Ignored event or ping check
      return NextResponse.json({ status: 'ignored', message: 'No transfer_id in payload' });
    }

    const supabase = getSupabaseAdmin();

    // Look up payout by provider_transfer_id or extracted UUID
    const { data: payout, error: lookupError } = await supabase
      .from('host_payouts')
      .select('id, status')
      .eq('provider_transfer_id', transferId)
      .maybeSingle();

    if (lookupError || !payout) {
      console.warn(`Payout not found for Cashfree transfer_id: ${transferId}`);
      return NextResponse.json({ status: 'ignored', message: 'Payout not found' });
    }

    if (payout.status === 'paid') {
      return NextResponse.json({ status: 'duplicate', message: 'Payout already marked paid' });
    }

    if (eventType === 'TRANSFER_SUCCESS' || status === 'SUCCESS') {
      const { error: rpcError } = await supabase.rpc('record_host_payout_provider_result', {
        p_payout_id: payout.id,
        p_success: true,
        p_provider: 'cashfree',
        p_provider_transfer_id: transferId,
        p_provider_reference_id: cfTransferId || null,
        p_failure_reason: null,
      });

      if (rpcError) {
        console.error('Error recording payout success:', rpcError);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }

      return NextResponse.json({ status: 'processed', result: 'paid' });
    } else if (
      eventType === 'TRANSFER_FAILED' ||
      eventType === 'TRANSFER_REVERSED' ||
      status === 'FAILED' ||
      status === 'REJECTED'
    ) {
      const { error: rpcError } = await supabase.rpc('record_host_payout_provider_result', {
        p_payout_id: payout.id,
        p_success: false,
        p_provider: 'cashfree',
        p_provider_transfer_id: transferId,
        p_provider_reference_id: cfTransferId || null,
        p_failure_reason: failureReason,
      });

      if (rpcError) {
        console.error('Error recording payout failure:', rpcError);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }

      return NextResponse.json({ status: 'processed', result: 'failed_and_refunded' });
    }

    return NextResponse.json({ status: 'ignored', message: `Unhandled event ${eventType}` });
  } catch (error) {
    console.error('Cashfree Payout webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

