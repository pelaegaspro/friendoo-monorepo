import { getCashfreeConfig, CashfreeConfig } from './config';

export interface PayoutTransferBeneficiary {
  name: string;
  phone?: string;
  email?: string;
  vpa?: string;
  bankAccountNumber?: string;
  ifsc?: string;
}

export interface InitiatePayoutTransferParams {
  transferId: string;
  amountInr: number;
  transferMode: 'upi' | 'banktransfer';
  beneficiary: PayoutTransferBeneficiary;
  remarks?: string;
}

export interface CashfreeTransferResponse {
  success: boolean;
  status: 'SUCCESS' | 'PENDING' | 'FAILED' | 'REJECTED';
  transferId: string;
  referenceId?: string;
  message?: string;
  raw?: unknown;
}

export async function createCashfreePayoutTransfer(
  params: InitiatePayoutTransferParams,
  overrideConfig?: CashfreeConfig
): Promise<CashfreeTransferResponse> {
  const config = overrideConfig ?? (await getCashfreeConfig());

  if (!config.payoutClientId || !config.payoutClientSecret) {
    throw new Error('CASHFREE_PAYOUT_CREDENTIALS_MISSING');
  }

  const { transferId, amountInr, transferMode, beneficiary, remarks } = params;

  if (amountInr <= 0) {
    throw new Error('INVALID_TRANSFER_AMOUNT');
  }

  const instrumentDetails: Record<string, string> = {};
  if (transferMode === 'upi') {
    if (!beneficiary.vpa) {
      throw new Error('UPI_VPA_REQUIRED');
    }
    instrumentDetails.vpa = beneficiary.vpa;
  } else {
    if (!beneficiary.bankAccountNumber || !beneficiary.ifsc) {
      throw new Error('BANK_ACCOUNT_AND_IFSC_REQUIRED');
    }
    instrumentDetails.bank_account_number = beneficiary.bankAccountNumber;
    instrumentDetails.ifsc = beneficiary.ifsc;
  }

  const payload = {
    transfer_id: transferId,
    transfer_amount: Number(amountInr.toFixed(2)),
    transfer_currency: 'INR',
    transfer_mode: transferMode === 'upi' ? 'upi' : 'banktransfer',
    beneficiary_details: {
      beneficiary_name: beneficiary.name || 'Friendoo Host',
      beneficiary_phone: beneficiary.phone || '9999999999',
      beneficiary_instrument_details: instrumentDetails,
    },
    transfer_remarks: remarks || 'Friendoo Host Payout',
  };

  try {
    const response = await fetch(`${config.payoutBaseUrl}/transfers`, {
      method: 'POST',
      headers: {
        'x-api-version': '2024-01-01',
        'x-client-id': config.payoutClientId,
        'x-client-secret': config.payoutClientSecret,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg =
        data?.message ||
        data?.error ||
        data?.status_description ||
        `Cashfree Transfer Failed with status ${response.status}`;
      return {
        success: false,
        status: 'FAILED',
        transferId,
        message: errorMsg,
        raw: data,
      };
    }

    const cfStatus = String(data?.status || data?.transfer_status || 'PENDING').toUpperCase();

    if (cfStatus === 'SUCCESS') {
      return {
        success: true,
        status: 'SUCCESS',
        transferId: data?.transfer_id || transferId,
        referenceId: data?.cf_transfer_id ? String(data.cf_transfer_id) : undefined,
        message: data?.status_description || 'Transfer successful',
        raw: data,
      };
    } else if (cfStatus === 'PENDING' || cfStatus === 'RECEIVED' || cfStatus === 'PROCESSING') {
      return {
        success: true,
        status: 'PENDING',
        transferId: data?.transfer_id || transferId,
        referenceId: data?.cf_transfer_id ? String(data.cf_transfer_id) : undefined,
        message: data?.status_description || 'Transfer is processing with the bank network',
        raw: data,
      };
    } else {
      return {
        success: false,
        status: 'FAILED',
        transferId: data?.transfer_id || transferId,
        referenceId: data?.cf_transfer_id ? String(data.cf_transfer_id) : undefined,
        message: data?.status_description || 'Transfer rejected by provider',
        raw: data,
      };
    }
  } catch (error) {
    console.error('createCashfreePayoutTransfer error:', error);
    return {
      success: false,
      status: 'FAILED',
      transferId,
      message: error instanceof Error ? error.message : 'Network error during payout transfer',
    };
  }
}

export async function getCashfreePayoutTransfer(
  transferId: string,
  overrideConfig?: CashfreeConfig
): Promise<CashfreeTransferResponse> {
  const config = overrideConfig ?? (await getCashfreeConfig());

  if (!config.payoutClientId || !config.payoutClientSecret) {
    throw new Error('CASHFREE_PAYOUT_CREDENTIALS_MISSING');
  }

  try {
    const response = await fetch(
      `${config.payoutBaseUrl}/transfers/${encodeURIComponent(transferId)}`,
      {
        method: 'GET',
        headers: {
          'x-api-version': '2024-01-01',
          'x-client-id': config.payoutClientId,
          'x-client-secret': config.payoutClientSecret,
          accept: 'application/json',
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        status: 'FAILED',
        transferId,
        message: data?.message || 'Failed to query transfer status',
        raw: data,
      };
    }

    const cfStatus = String(data?.status || data?.transfer_status || 'PENDING').toUpperCase();

    return {
      success: cfStatus === 'SUCCESS' || cfStatus === 'PENDING' || cfStatus === 'RECEIVED',
      status:
        cfStatus === 'SUCCESS'
          ? 'SUCCESS'
          : cfStatus === 'FAILED' || cfStatus === 'REJECTED' || cfStatus === 'REVERSED'
          ? 'FAILED'
          : 'PENDING',
      transferId: data?.transfer_id || transferId,
      referenceId: data?.cf_transfer_id ? String(data.cf_transfer_id) : undefined,
      message: data?.status_description || data?.failure_reason,
      raw: data,
    };
  } catch (error) {
    console.error('getCashfreePayoutTransfer error:', error);
    return {
      success: false,
      status: 'PENDING',
      transferId,
      message: error instanceof Error ? error.message : 'Network error checking transfer',
    };
  }
}

export async function verifyCashfreePayoutWebhookSignature(
  secret: string,
  timestamp: string,
  rawPayload: string,
  signature: string
): Promise<boolean> {
  if (!secret || !timestamp || !rawPayload || !signature) return false;

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const calculated = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(`${timestamp}${rawPayload}`)
    );
    const expected = btoa(String.fromCharCode(...new Uint8Array(calculated)));

    if (expected.length !== signature.length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) {
      diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
    }
    return diff === 0;
  } catch {
    return false;
  }
}

