export type SegmentKey =
  | "all"
  | "new_user"
  | "low_balance"
  | "vip"
  | "inactive"
  | "first_call"
  | "at_risk"
  | "custom";

export type CampaignType = "push" | "inapp" | "both";
export type CampaignStatus = "draft" | "scheduled" | "sent" | "failed";

export type SupportType =
  | "user_complaint"
  | "host_complaint"
  | "refund_request"
  | "general";

export type SupportPriority = "low" | "medium" | "high" | "urgent";
export type SupportStatus = "open" | "in_progress" | "resolved" | "closed";

export type FraudSeverity = "low" | "medium" | "high" | "urgent";
export type FraudStatus = "open" | "reviewed" | "dismissed";

export type OfferType = "bonus_coins" | "discount" | "free_coins";

export interface CustomSegmentFilter {
  minCoins?: number;
  maxCoins?: number;
  lastActiveDays?: number;
  minSpendInr?: number;
  minCalls?: number;
  maxCalls?: number;
  city?: string;
  language?: string;
  isHost?: boolean;
}

export interface UserRecord {
  uid: string;
  displayName?: string;
  username?: string;
  phone?: string;
  photoURL?: string;
  city?: string;
  languages?: string[];
  gender?: string;
  age?: number;
  bio?: string;
  coinBalance?: number;
  isHost?: boolean;
  hostStatus?: string;
  ratePerMinute?: number;
  isOnline?: boolean;
  onboardingComplete?: boolean;
  isBanned?: boolean;
  createdAt?: unknown;
  lastActive?: unknown;
  totalCoinsPurchased?: number;
  totalCoinsSpent?: number;
  fcmTokens?: string[];
}

export interface CallRecord {
  id: string;
  fromUserId?: string;
  toUserId?: string;
  status?: string;
  ratePerMinute?: number;
  coinsSpent?: number;
  finalDurationSeconds?: number;
  finalCoinsDeducted?: number;
  createdAt?: unknown;
  acceptedAt?: unknown;
  endedAt?: unknown;
  endReason?: string;
}

export interface CoinTransactionRecord {
  id: string;
  userId?: string;
  type?: string;
  amountCoins?: number;
  balanceBefore?: number;
  balanceAfter?: number;
  packageId?: string;
  amountInr?: number;
  cashfreeOrderId?: string;
  status?: string;
  createdAt?: unknown;
}

export interface HostApplicationRecord {
  id: string;
  userId?: string;
  name?: string;
  phone?: string;
  age?: number;
  city?: string;
  languages?: string[];
  photos?: string[];
  status?: "pending" | "approved" | "rejected";
  submittedAt?: unknown;
  reviewedAt?: unknown;
  notes?: string;
}

export interface SupportMessage {
  senderId: string;
  senderName: string;
  text: string;
  sentAt: unknown;
  isAdmin: boolean;
}

export interface SupportTicketRecord {
  id: string;
  userId?: string;
  hostId?: string;
  type?: SupportType;
  subject?: string;
  description?: string;
  status?: SupportStatus;
  priority?: SupportPriority;
  messages?: SupportMessage[];
  assignedTo?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  resolvedAt?: unknown;
  refundAmount?: number;
  flaggedUserId?: string;
}

export interface CampaignRecord {
  id: string;
  name?: string;
  type?: CampaignType;
  segment?: SegmentKey;
  customFilter?: CustomSegmentFilter;
  title?: string;
  body?: string;
  status?: CampaignStatus;
  scheduledAt?: unknown;
  sentAt?: unknown;
  targetCount?: number;
  deliveredCount?: number;
  openedCount?: number;
  createdAt?: unknown;
  createdBy?: string;
}

export interface FraudAlertRecord {
  id: string;
  userId?: string;
  type?: string;
  description?: string;
  severity?: FraudSeverity;
  status?: FraudStatus;
  relatedCallId?: string;
  relatedTxId?: string;
  amount?: number;
  createdAt?: unknown;
  reviewedAt?: unknown;
  reviewedBy?: string;
}
