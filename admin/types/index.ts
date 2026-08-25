export type DateType = string | Date | null | undefined

export interface AdminUser {
  uid: string
  email: string
  name: string
  role: 'superadmin' | 'admin'
  createdAt?: DateType
}

export interface AppUser {
  uid: string
  avatarSeed?: string
  name: string
  email?: string
  phone: string
  photoURL?: string
  role: 'user' | 'host'
  status: 'active' | 'banned' | 'suspended'
  isVerified: boolean
  createdAt?: DateType
  lastActive?: DateType
  coins?: number
  fcmToken?: string
}

export interface Host {
  id: string
  uid: string
  avatarSeed?: string
  name: string
  phone: string
  email?: string
  photoURL?: string
  category: string
  languages: string[]
  rating: number
  totalEarnings: number
  status: 'pending' | 'active' | 'rejected' | 'suspended'
  rejectionReason?: string
  createdAt?: DateType
}

export interface Booking {
  id: string
  userId: string
  hostId: string
  userName: string
  hostName: string
  scheduledAt?: DateType
  duration: number
  amount: number
  status: 'pending' | 'active' | 'completed' | 'cancelled'
  paymentStatus: 'pending' | 'paid' | 'refunded'
  callId?: string
  createdAt?: DateType
}

export interface Payment {
  id: string
  cashfreeId: string
  userId: string
  userName: string
  amount: number
  status: 'captured' | 'refunded' | 'failed'
  type: 'booking' | 'coins' | 'subscription'
  createdAt?: DateType
}

export interface Call {
  id: string
  channelId: string
  userId: string
  hostId: string
  userName: string
  hostName: string
  status: 'active' | 'ended'
  startedAt?: DateType
  endedAt?: DateType
  duration?: number
  agoraToken?: string
}

export interface ActionEntry {
  action: string
  adminId: string
  note?: string
  timestamp?: DateType
}

export interface Report {
  id: string
  reporterId: string
  reporterName: string
  reportedId: string
  reportedName: string
  reason: string
  description: string
  evidenceURLs?: string[]
  status: 'open' | 'investigating' | 'resolved' | 'dismissed'
  priority: 'high' | 'medium' | 'low'
  adminNotes?: string
  actionHistory?: ActionEntry[]
  createdAt?: DateType
  updatedAt?: DateType
}

export interface CoinPackage {
  coins: number
  price: number
}

export interface AppSettings {
  maintenanceMode: boolean
  minAppVersion: string
  maxBookingDuration: number
  coinPackages: CoinPackage[]
  platformFeePercent: number
}

export interface EmailLog {
  id: string
  to: string
  subject: string
  template: string
  sentAt?: DateType
  status: 'sent' | 'failed'
  adminId: string
}

export interface NotificationLog {
  id: string
  target: 'user' | 'all_users' | 'all_hosts'
  targetId?: string
  title: string
  body: string
  sentAt?: DateType
  status: 'sent' | 'failed'
  adminId: string
}
