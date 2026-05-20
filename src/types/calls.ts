export type CallStatus = 'ringing' | 'active' | 'ended' | 'missed' | 'rejected';
export type CallEndReason = 'hangup' | 'missed' | 'rejected' | 'insufficient_coins' | 'error';

export interface CallDoc {
  id: string;
  fromUserId: string;
  toUserId: string;

  status: CallStatus;
  createdAt?: unknown;
  ringingAt?: unknown;
  acceptedAt?: unknown;
  endedAt?: unknown;
  endReason?: CallEndReason;

  // Agora
  agoraChannel: string;
  agoraToken?: string;

  // Billing
  ratePerMinute: number; // coins per minute (e.g. 5)
  coinsSpent: number;
  lastBilledAt?: unknown;

  // Anonymous mode
  anonymous: boolean;
  aiAvatarId?: string;
  fromDisplayName?: string;
  toDisplayName?: string;

  // Optional push denormalization
  toFcmTokens?: string[];
}

export interface CreateCallRequest {
  toUserId: string;
  anonymous?: boolean;
}

