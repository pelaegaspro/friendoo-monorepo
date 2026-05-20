// Timestamp type compatible with firebase-admin Firestore
type Timestamp = { toDate(): Date; seconds: number; nanoseconds: number };

export type CurrencyCode = 'INR';

export interface CoinPackage {
  id: string;
  active: boolean;
  currency: CurrencyCode;
  priceInr: number;
  coins: number;
  displayName: string;
  sortOrder: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type CoinTransactionType = 'topup' | 'call_debit' | 'gift_sent' | 'gift_received' | 'refund' | 'bonus';
export type CoinTransactionStatus = 'pending' | 'success' | 'failed' | 'reversed';

export interface CoinTransaction {
  id: string;
  userId: string;
  type: CoinTransactionType;
  amountCoins: number;
  balanceBefore: number;
  balanceAfter: number;
  status: CoinTransactionStatus;
  reason?: string;
  endReason?: string;

  // Cashfree (topups)
  packageId?: string;
  amountInr?: number;
  currency?: CurrencyCode;
  cashfreeOrderId?: string;
  cashfreePaymentId?: string;
  paymentMethod?: string;

  // Calls
  callId?: string;
  ratePerMinute?: number;
  minutesBilled?: number;

  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  processedAt?: Timestamp;
}

export interface CreateOrderRequest {
  userId: string;
  packageId: string;
}

export interface CreateOrderResponse {
  orderId: string;
  paymentSessionId: string;
  amountInr: number;
  currency: CurrencyCode;
  packageId: string;
  coins: number;
}
