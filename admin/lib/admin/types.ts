export type HostStatus = 'approved' | 'pending' | 'suspended'
export type TransactionType = 'topup' | 'calldebit' | 'bonus'
export type CallStatus = 'active' | 'ended' | 'missed'

export interface AdminStats {
  totalUsers: number
  totalHosts: number
  activeCalls: number
  todaysRevenueInr: number
  totalCoinsInCirculation: number
  pendingHostApplications: number
}

export interface AdminHost {
  id: string
  displayName: string
  phoneNumber: string
  city: string
  languages: string[]
  ratePerMinute: number
  hostStatus: HostStatus
  isHost: boolean
  photoURL: string
  idProofUrl?: string | null
  bio: string
  gender: string
  age: number | null
  callsMade: number
  coinsEarned: number
  createdAt: string | null
}

export interface HostApplicationRecord {
  id: string
  name: string
  phone: string
  age: number | null
  city: string
  language: string
  about: string
  photoURL: string
  idProofUrl?: string | null
  status: 'pending' | 'approved' | 'rejected'
  notes: string
  submittedAt: string | null
  reviewedAt: string | null
}

export interface AdminUserRow {
  id: string
  displayName: string
  username: string
  phoneNumber: string
  photoURL: string
  city: string
  coinBalance: number
  status: 'active' | 'banned'
  joinedAt: string | null
}

export interface CoinPackageRecord {
  id: string
  displayName: string
  coins: number
  bonus: number
  priceInr: number
  active: boolean
  createdAt: string | null
}

export interface TransactionRow {
  id: string
  userId: string
  userName: string
  type: TransactionType
  amountCoins: number
  amountInr: number
  packageId: string
  packageName: string
  status: string
  createdAt: string | null
}

export interface CallRow {
  id: string
  callerId: string
  callerName: string
  hostId: string
  hostName: string
  status: CallStatus
  coinsSpent: number
  durationSeconds: number
  ratePerMinute: number
  createdAt: string | null
  acceptedAt: string | null
  endedAt: string | null
  agoraChannel: string
}

export interface AppSettingsRecord {
  welcomeBonusCoins: number
  minCoinBalanceToStartCall: number
  maxCallDurationMinutes: number
  maintenanceMode: boolean
  updatedAt: string | null
}

export type WithdrawalStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'failed'

export interface WithdrawalRecord {
  id: string
  hostId: string
  hostName: string
  amount: number
  upiId: string
  status: WithdrawalStatus
  requestedAt: string | null
  processedAt: string | null
  adminNote: string
  cashfreeReferenceId?: string | null
  failureReason?: string | null
}

export interface HostEarningsRecord {
  hostId: string
  totalEarningsInr: number
  totalCallMinutes: number
  totalCalls: number
  availableForWithdrawal: number
  pendingWithdrawal: number
  lifetimeEarnings: number
  lastPayoutDate: string | null
}
