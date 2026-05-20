export interface UserProfile {
  uid: string
  displayName: string
  username: string
  phoneNumber: string
  photoURL: string
  bio: string
  city: string
  languages: string[]
  interests: string[]
  gender: string
  age: number | null
  coinBalance: number
  isHost: boolean
  hostStatus: 'pending' | 'approved' | 'suspended' | null
  totalSpent: number
  status: 'active' | 'banned'
  joinedAt: string | null
  lastActive?: string | null
}

export type User = UserProfile
export type Gender = 'female' | 'male' | 'non-binary' | 'prefer-not-to-say'

export interface Host {
  id: string
  displayName: string
  photoURL: string
  bio: string
  city: string
  languages: string[]
  interests: string[]
  ratePerMinute: number
  hostTier: 'normal' | 'star'
  rating: number
  totalReviews: number
  isOnline: boolean
  callStatus: 'available' | 'busy' | 'offline'
  coinsEarned: number
  callsMade: number
}

export type ChatMessageType = 'text' | 'image' | 'gift'

export interface ChatMessage {
  id: string
  chatId: string
  senderId: string
  text: string
  type: ChatMessageType
  createdAt: string | null
  readAt: string | null
}

export interface Chat {
  id: string
  participants: string[]
  hostId: string
  userId: string
  lastMessage: string
  lastMessageAt: string | null
  unreadCount: number
}

export type CallStatus = 'requesting' | 'accepted' | 'active' | 'ended' | 'missed' | 'rejected'

export interface Call {
  id: string
  fromUserId: string
  hostId: string
  status: CallStatus
  agoraChannel: string
  ratePerMinute: number
  coinsSpent: number
  durationSeconds: number
  createdAt: string | null
  acceptedAt: string | null
  endedAt: string | null
}

export interface CoinPack {
  id: string
  displayName: string
  coins: number
  bonus: number
  priceInr: number
  active: boolean
}
