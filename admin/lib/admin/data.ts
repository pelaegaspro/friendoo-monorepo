import { randomUUID } from 'crypto'
import { getAuth, getBucket, getDb, adminFieldValue, admin } from '@/lib/firebaseAdmin'
import type {
  AdminHost,
  AdminStats,
  AdminUserRow,
  AppSettingsRecord,
  CallRow,
  CoinPackageRecord,
  HostApplicationRecord,
  TransactionRow,
} from './types'

const HOST_LANGUAGE_OPTIONS = [
  'Hindi',
  'English',
  'Tamil',
  'Telugu',
  'Bengali',
  'Marathi',
  'Kannada',
  'Malayalam',
  'Punjabi',
  'Gujarati',
] as const

type HostCreatePayload = {
  displayName: string
  phoneNumber: string
  age: number
  city: string
  languages: string[]
  coinsPerMinute: number
  photoURL: string
  bio: string
  gender: string
  status: 'approved' | 'pending'
}

type HostUpdatePayload = Partial<HostCreatePayload> & {
  hostStatus?: 'approved' | 'pending' | 'suspended'
}

type SettingsPayload = {
  welcomeBonusCoins: number
  minCoinBalanceToStartCall: number
  maxCallDurationMinutes: number
  maintenanceMode: boolean
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function asBoolean(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return [] as string[]
  return value.filter((item): item is string => typeof item === 'string')
}

function toIsoString(value: unknown): string | null {
  if (!value) return null
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string') return value
  if (typeof value === 'object' && typeof (value as { toDate?: unknown }).toDate === 'function') {
    return ((value as { toDate: () => Date }).toDate()).toISOString()
  }
  return null
}

function toDateValue(value: unknown): Date | null {
  const iso = toIsoString(value)
  if (!iso) return null
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? null : date
}

function sortByNewest<T extends { createdAt: string | null }>(rows: T[]) {
  return rows.sort((left, right) => {
    const leftValue = left.createdAt ? new Date(left.createdAt).getTime() : 0
    const rightValue = right.createdAt ? new Date(right.createdAt).getTime() : 0
    return rightValue - leftValue
  })
}

function normalizePhoneNumber(input: string) {
  const trimmed = input.trim()
  if (!/^\+91\d{10}$/.test(trimmed)) {
    throw new Error('Phone number must be in +91XXXXXXXXXX format')
  }
  return trimmed
}

function normalizeHostLanguages(input: string[]) {
  const normalized = input
    .map((item) => item.trim())
    .filter((item) => HOST_LANGUAGE_OPTIONS.includes(item as (typeof HOST_LANGUAGE_OPTIONS)[number]))

  if (!normalized.length) {
    return ['Hindi']
  }

  return Array.from(new Set(normalized))
}

function sanitizeHostPayload(payload: HostCreatePayload) {
  const displayName = payload.displayName.trim() || 'Unknown Host'
  const phoneNumber = normalizePhoneNumber(payload.phoneNumber)
  const age = Math.max(18, Math.min(35, Math.round(payload.age)))
  const city = payload.city.trim()
  const languages = normalizeHostLanguages(payload.languages)
  const coinsPerMinute = Math.max(1, Math.round(payload.coinsPerMinute || 20))
  const bio = payload.bio.trim().slice(0, 150)
  const gender = payload.gender.trim() || 'Female'
  const status = payload.status === 'pending' ? 'pending' : 'approved'
  const photoURL = payload.photoURL.trim()

  return {
    displayName,
    phoneNumber,
    age,
    city,
    languages,
    coinsPerMinute,
    bio,
    gender,
    status,
    photoURL,
  }
}

function getUsernameFromPhone(phoneNumber: string) {
  return `phone_${phoneNumber.slice(-4)}`
}

export async function getAdminStats(): Promise<AdminStats> {
  const db = getDb()
  const [usersSnap, callsSnap, transactionsSnap, packagesSnap, pendingAppsSnap] = await Promise.all([
    db.collection('users').get(),
    db.collection('calls').where('status', '==', 'active').get(),
    db.collection('coinTransactions').where('type', '==', 'topup').get(),
    db.collection('coinPackages').get(),
    db.collection('hostApplications').where('status', '==', 'pending').get(),
  ])

  let totalUsers = 0
  let totalHosts = 0
  let totalCoinsInCirculation = 0

  usersSnap.forEach((doc) => {
    totalUsers += 1
    const data = doc.data()
    if (asBoolean(data.isHost) || ['approved', 'pending', 'suspended'].includes(asString(data.hostStatus))) {
      totalHosts += 1
    }
    totalCoinsInCirculation += asNumber(data.coinBalance)
  })

  const packageLookup = new Map(
    packagesSnap.docs.map((doc) => [
      doc.id,
      {
        displayName: asString(doc.data().displayName),
        priceInr: asNumber(doc.data().priceInr),
      },
    ])
  )

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  let todaysRevenueInr = 0
  transactionsSnap.forEach((doc) => {
    const data = doc.data()
    const createdAt = toDateValue(data.createdAt)
    if (!createdAt || createdAt < startOfToday) return

    todaysRevenueInr +=
      asNumber(data.amountInr) ||
      asNumber(data.amount) ||
      asNumber(packageLookup.get(asString(data.packageId))?.priceInr)
  })

  return {
    totalUsers,
    totalHosts,
    activeCalls: callsSnap.size,
    todaysRevenueInr,
    totalCoinsInCirculation,
    pendingHostApplications: pendingAppsSnap.size,
  }
}

export async function listHosts(): Promise<AdminHost[]> {
  const db = getDb()
  const [usersSnap, callsSnap] = await Promise.all([
    db.collection('users').get(),
    db.collection('calls').get(),
  ])

  const callSummary = new Map<string, { callsMade: number; coinsEarned: number }>()
  callsSnap.forEach((doc) => {
    const data = doc.data()
    const hostId = asString(data.toUserId || data.hostId)
    if (!hostId) return
    const current = callSummary.get(hostId) ?? { callsMade: 0, coinsEarned: 0 }
    current.callsMade += 1
    current.coinsEarned += asNumber(data.coinsSpent)
    callSummary.set(hostId, current)
  })

  const rows = usersSnap.docs
    .map((doc) => {
      const data = doc.data()
      const hostStatus = asString(data.hostStatus)
      const looksLikeHost =
        asBoolean(data.isHost) ||
        ['approved', 'pending', 'suspended'].includes(hostStatus) ||
        typeof data.ratePerMinute === 'number'

      if (!looksLikeHost) return null

      const summary = callSummary.get(doc.id) ?? { callsMade: 0, coinsEarned: 0 }

      return {
        id: doc.id,
        displayName: asString(data.displayName, 'Unknown Host'),
        phoneNumber: asString(data.phoneNumber || data.phone),
        city: asString(data.city),
        languages: asStringArray(data.languages),
        ratePerMinute: asNumber(data.ratePerMinute, 20),
        hostStatus:
          hostStatus === 'pending' || hostStatus === 'suspended' ? hostStatus : 'approved',
        isHost: asBoolean(data.isHost),
        photoURL: asString(data.photoURL),
        idProofUrl: asString(data.idProofUrl),
        bio: asString(data.bio),
        gender: asString(data.gender),
        age: typeof data.age === 'number' ? data.age : null,
        callsMade: summary.callsMade,
        coinsEarned: summary.coinsEarned,
        createdAt: toIsoString(data.createdAt),
      } satisfies AdminHost
    })
    .filter((row): row is AdminHost => Boolean(row))

  return sortByNewest(rows)
}

export async function uploadHostPhoto(
  fileName: string,
  bytes: Buffer,
  contentType: string,
  hostUid?: string
) {
  const bucket = getBucket()
  const safeName = `${Date.now()}-${randomUUID()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '-')}`
  const storagePath = hostUid
    ? `hostPhotos/${hostUid}/profile.jpg`
    : `hostPhotos/${safeName}`
  const storageFile = bucket.file(storagePath)

  await storageFile.save(bytes, {
    metadata: {
      contentType,
      cacheControl: 'public, max-age=31536000',
    },
  })

  const [signedUrl] = await storageFile.getSignedUrl({
    action: 'read',
    expires: '2500-01-01',
  })

  return signedUrl
}

export async function createHost(payload: HostCreatePayload) {
  const db = getDb()
  const auth = getAuth()
  const data = sanitizeHostPayload(payload)
  const hostStatus: 'approved' = 'approved'

  const createdUser = await auth.createUser({
    phoneNumber: data.phoneNumber,
    displayName: data.displayName,
  })

  const now = adminFieldValue.serverTimestamp()
  await db.collection('users').doc(createdUser.uid).set({
    displayName: data.displayName,
    username: getUsernameFromPhone(data.phoneNumber),
    phoneNumber: data.phoneNumber,
    phone: data.phoneNumber,
    photos: data.photoURL ? [data.photoURL] : [],
    photoURL: data.photoURL,
    city: data.city,
    languages: data.languages,
    age: data.age,
    gender: data.gender,
    bio: data.bio,
    coinBalance: 0,
    isHost: true,
    hostStatus,
    ratePerMinute: data.coinsPerMinute,
    totalCoinsPurchased: 0,
    totalCoinsSpent: 0,
    isBanned: false,
    onboardingComplete: true,
    createdAt: now,
    lastActive: now,
    isOnline: false,
    updatedBy: 'admin',
    updatedAt: now,
  })

  return { uid: createdUser.uid }
}

export async function updateHost(hostId: string, payload: { action: 'suspend' | 'restore' | 'edit'; updates?: HostUpdatePayload }) {
  const db = getDb()
  const hostRef = db.collection('users').doc(hostId)

  if (payload.action === 'suspend') {
    await hostRef.set(
      {
        isHost: false,
        hostStatus: 'suspended',
        updatedBy: 'admin',
        updatedAt: adminFieldValue.serverTimestamp(),
      },
      { merge: true }
    )
    return
  }

  if (payload.action === 'restore') {
    await hostRef.set(
      {
        isHost: true,
        hostStatus: 'approved',
        updatedBy: 'admin',
        updatedAt: adminFieldValue.serverTimestamp(),
      },
      { merge: true }
    )
    return
  }

  const updates = payload.updates ?? {}
  const nextValues: Record<string, unknown> = {
    updatedBy: 'admin',
    updatedAt: adminFieldValue.serverTimestamp(),
  }

  if (typeof updates.displayName === 'string') nextValues.displayName = updates.displayName.trim() || 'Unknown Host'
  if (typeof updates.phoneNumber === 'string') {
    const phoneNumber = normalizePhoneNumber(updates.phoneNumber)
    nextValues.phoneNumber = phoneNumber
    nextValues.username = getUsernameFromPhone(phoneNumber)
  }
  if (typeof updates.city === 'string') nextValues.city = updates.city.trim()
  if (Array.isArray(updates.languages)) nextValues.languages = normalizeHostLanguages(updates.languages)
  if (typeof updates.coinsPerMinute === 'number') nextValues.ratePerMinute = Math.max(1, Math.round(updates.coinsPerMinute))
  if (typeof updates.bio === 'string') nextValues.bio = updates.bio.trim().slice(0, 150)
  if (typeof updates.gender === 'string') nextValues.gender = updates.gender.trim() || 'Female'
  if (typeof updates.age === 'number') nextValues.age = Math.max(18, Math.min(35, Math.round(updates.age)))
  if (typeof updates.photoURL === 'string') {
    nextValues.photoURL = updates.photoURL.trim()
    nextValues.photos = updates.photoURL.trim() ? [updates.photoURL.trim()] : []
  }
  if (updates.hostStatus) {
    nextValues.hostStatus = updates.hostStatus
    nextValues.isHost = updates.hostStatus === 'approved'
  }

  await hostRef.set(nextValues, { merge: true })
}

export async function deleteHost(hostId: string) {
  const db = getDb()
  const auth = getAuth()

  await db.collection('users').doc(hostId).delete()
  try {
    await auth.deleteUser(hostId)
  } catch (error) {
    const code = (error as { code?: string } | undefined)?.code
    if (code !== 'auth/user-not-found') {
      throw error
    }
  }
}

export async function listHostApplications(): Promise<HostApplicationRecord[]> {
  const db = getDb()
  const snap = await db.collection('hostApplications').where('status', '==', 'pending').get()

  const rows = snap.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      name: asString(data.name, 'Unknown Applicant'),
      phone: asString(data.phone),
      age: typeof data.age === 'number' ? data.age : null,
      city: asString(data.city),
      language: asString(data.language, 'Hindi'),
      photoURL: asString(data.photoURL),
      idProofUrl: asString(data.idProofUrl),
      status: asString(data.status, 'pending') as HostApplicationRecord['status'],
      notes: asString(data.notes),
      submittedAt: toIsoString(data.submittedAt),
      reviewedAt: toIsoString(data.reviewedAt),
    } satisfies HostApplicationRecord
  })

  return rows.sort((left, right) => {
    const leftValue = left.submittedAt ? new Date(left.submittedAt).getTime() : 0
    const rightValue = right.submittedAt ? new Date(right.submittedAt).getTime() : 0
    return rightValue - leftValue
  })
}

export async function reviewHostApplication(applicationId: string, input: { action: 'approve' | 'reject'; notes?: string }) {
  const db = getDb()
  const appRef = db.collection('hostApplications').doc(applicationId)
  const snap = await appRef.get()

  if (!snap.exists) {
    throw new Error('Host application not found')
  }

  const data = snap.data() ?? {}
  const notes = input.notes?.trim() ?? ''

  if (input.action === 'reject') {
    await appRef.set(
      {
        status: 'rejected',
        notes,
        reviewedAt: adminFieldValue.serverTimestamp(),
        reviewedBy: 'admin',
        updatedBy: 'admin',
        updatedAt: adminFieldValue.serverTimestamp(),
      },
      { merge: true }
    )
    return { status: 'rejected' as const }
  }

  const userId = asString(data.userId)
  const phone = asString(data.phone)
  const displayName = asString(data.name, 'Unknown Host')
  const city = asString(data.city)
  const languagesFromList = asStringArray(data.languages)
  const normalizedLanguages = languagesFromList.length
    ? normalizeHostLanguages(languagesFromList)
    : normalizeHostLanguages([asString(data.language, 'Hindi')])
  const photos = asStringArray(data.photos)
  const photoURL = photos[0] || asString(data.photoURL)
  const auth = getAuth()

  let approvedUid = userId
  if (!approvedUid) {
    const created = await auth.createUser({
      phoneNumber: phone || undefined,
      displayName,
    })
    approvedUid = created.uid
  } else {
    try {
      await auth.getUser(approvedUid)
    } catch (error) {
      const code = (error as { code?: string }).code
      if (code === 'auth/user-not-found') {
        await auth.createUser({
          uid: approvedUid,
          phoneNumber: phone || undefined,
          displayName,
        })
      } else {
        throw error
      }
    }
  }

  const userRef = db.collection('users').doc(approvedUid)
  const userSnap = await userRef.get()
  const userData = userSnap.data() ?? {}
  const fcmTokens = Array.isArray(userData.fcmTokens)
    ? userData.fcmTokens.filter((token): token is string => typeof token === 'string')
    : []

  await userRef.set(
    {
      displayName,
      phoneNumber: phone,
      phone,
      city,
      languages: normalizedLanguages,
      photos: photoURL ? [photoURL] : photos,
      photoURL,
      isHost: true,
      hostStatus: 'approved',
      onboardingComplete: true,
      ratePerMinute: typeof data.ratePerMinute === 'number' ? Math.max(1, Math.round(data.ratePerMinute)) : 20,
      updatedBy: 'admin',
      updatedAt: adminFieldValue.serverTimestamp(),
      createdAt: userData.createdAt ?? adminFieldValue.serverTimestamp(),
      lastActive: adminFieldValue.serverTimestamp(),
      isOnline: false,
    },
    { merge: true }
  )

  if (fcmTokens.length) {
    await admin.messaging().sendEachForMulticast({
      tokens: fcmTokens,
      notification: {
        title: "🎉 You're approved as a Friendoo Host!",
        body: 'Start earning now. Go online from the app.',
      },
      data: {
        type: 'host_approved',
      },
    })
  }

  await db.collection('notifications').doc(approvedUid).collection('items').add({
    type: 'host_approved',
    title: "🎉 You're approved as a Friendoo Host!",
    message: 'Congratulations! Your host application is approved.',
    read: false,
    createdAt: adminFieldValue.serverTimestamp(),
  })

  await appRef.set(
    {
      status: 'approved',
      notes,
      reviewedAt: adminFieldValue.serverTimestamp(),
      reviewedBy: 'admin',
      userId: approvedUid,
      createdHostId: approvedUid,
      updatedBy: 'admin',
      updatedAt: adminFieldValue.serverTimestamp(),
    },
    { merge: true }
  )

  return { status: 'approved' as const, hostId: approvedUid }
}

export async function listUsers(): Promise<AdminUserRow[]> {
  const db = getDb()
  const snap = await db.collection('users').get()

  const rows = snap.docs
    .map((doc) => {
      const data = doc.data()
      const hostStatus = asString(data.hostStatus)
      const isHostRecord =
        asBoolean(data.isHost) || ['approved', 'pending', 'suspended'].includes(hostStatus)
      if (isHostRecord) return null

      return {
        id: doc.id,
        displayName: asString(data.displayName, 'Friendoo User'),
        username: asString(data.username),
        phoneNumber: asString(data.phoneNumber || data.phone),
        photoURL: asString(data.photoURL),
        city: asString(data.city),
        coinBalance: asNumber(data.coinBalance),
        status: asBoolean(data.isBanned) ? 'banned' : 'active',
        joinedAt: toIsoString(data.createdAt),
      } satisfies AdminUserRow
    })
    .filter((row): row is AdminUserRow => Boolean(row))

  return rows.sort((left, right) => {
    const leftValue = left.joinedAt ? new Date(left.joinedAt).getTime() : 0
    const rightValue = right.joinedAt ? new Date(right.joinedAt).getTime() : 0
    return rightValue - leftValue
  })
}

export async function addCoinsToUser(userId: string, amountCoins: number) {
  const db = getDb()
  const amount = Math.max(1, Math.round(amountCoins))
  const userRef = db.collection('users').doc(userId)

  await db.runTransaction(async (transaction) => {
    const userSnap = await transaction.get(userRef)
    if (!userSnap.exists) {
      throw new Error('User not found')
    }

    const userData = userSnap.data() ?? {}
    const balanceBefore = asNumber(userData.coinBalance)
    const balanceAfter = balanceBefore + amount
    const txRef = db.collection('coinTransactions').doc()

    transaction.update(userRef, {
      coinBalance: balanceAfter,
      updatedBy: 'admin',
      updatedAt: adminFieldValue.serverTimestamp(),
    })

    transaction.set(txRef, {
      userId,
      type: 'bonus',
      amountCoins: amount,
      balanceBefore,
      balanceAfter,
      status: 'completed',
      createdAt: adminFieldValue.serverTimestamp(),
      updatedBy: 'admin',
      updatedAt: adminFieldValue.serverTimestamp(),
    })
  })
}

export async function setUserBanState(userId: string, isBanned: boolean) {
  const db = getDb()
  await db.collection('users').doc(userId).set(
    {
      isBanned,
      updatedBy: 'admin',
      updatedAt: adminFieldValue.serverTimestamp(),
    },
    { merge: true }
  )
}

export async function listPackages(): Promise<CoinPackageRecord[]> {
  const db = getDb()
  const snap = await db.collection('coinPackages').get()

  const rows = snap.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      displayName: asString(data.displayName, 'Package'),
      coins: asNumber(data.coins),
      bonus: asNumber(data.bonus),
      priceInr: asNumber(data.priceInr),
      active: asBoolean(data.active, true),
      createdAt: toIsoString(data.createdAt),
    } satisfies CoinPackageRecord
  })

  return sortByNewest(rows)
}

export async function upsertPackage(payload: Partial<CoinPackageRecord> & { id?: string }) {
  const db = getDb()
  const values = {
    displayName: asString(payload.displayName, 'Package'),
    coins: Math.max(0, Math.round(asNumber(payload.coins))),
    bonus: Math.max(0, Math.round(asNumber(payload.bonus))),
    priceInr: Math.max(0, asNumber(payload.priceInr)),
    active: payload.active ?? true,
    updatedBy: 'admin',
    updatedAt: adminFieldValue.serverTimestamp(),
  }

  if (payload.id) {
    await db.collection('coinPackages').doc(payload.id).set(values, { merge: true })
    return { id: payload.id }
  }

  const ref = await db.collection('coinPackages').add({
    ...values,
    createdAt: adminFieldValue.serverTimestamp(),
  })

  return { id: ref.id }
}

export async function deletePackage(packageId: string) {
  const db = getDb()
  await db.collection('coinPackages').doc(packageId).delete()
}

export async function listTransactions(): Promise<TransactionRow[]> {
  const db = getDb()
  const [usersSnap, packagesSnap, transactionsSnap] = await Promise.all([
    db.collection('users').get(),
    db.collection('coinPackages').get(),
    db.collection('coinTransactions').get(),
  ])

  const users = new Map(
    usersSnap.docs.map((doc) => [doc.id, asString(doc.data().displayName, 'Friendoo User')])
  )
  const packages = new Map(
    packagesSnap.docs.map((doc) => [
      doc.id,
      {
        name: asString(doc.data().displayName, 'Package'),
        priceInr: asNumber(doc.data().priceInr),
      },
    ])
  )

  const rows = transactionsSnap.docs.map((doc) => {
    const data = doc.data()
    const packageId = asString(data.packageId)
    const packageData = packages.get(packageId)

    return {
      id: doc.id,
      userId: asString(data.userId),
      userName: users.get(asString(data.userId)) ?? 'Friendoo User',
      type: (asString(data.type, 'bonus') as TransactionRow['type']),
      amountCoins: asNumber(data.amountCoins || data.coins),
      amountInr: asNumber(data.amountInr || data.amount || packageData?.priceInr),
      packageId,
      packageName: packageData?.name ?? '',
      status: asString(data.status, 'completed'),
      createdAt: toIsoString(data.createdAt),
    } satisfies TransactionRow
  })

  return sortByNewest(rows)
}

export async function listCalls(): Promise<CallRow[]> {
  const db = getDb()
  const [usersSnap, callsSnap] = await Promise.all([
    db.collection('users').get(),
    db.collection('calls').get(),
  ])

  const users = new Map(
    usersSnap.docs.map((doc) => [doc.id, asString(doc.data().displayName, 'Friendoo User')])
  )

  const rows = callsSnap.docs.map((doc) => {
    const data = doc.data()
    const callerId = asString(data.fromUserId || data.callerId)
    const hostId = asString(data.toUserId || data.hostId)
    const acceptedAt = toIsoString(data.acceptedAt)
    const endedAt = toIsoString(data.endedAt)
    const createdAt = toIsoString(data.createdAt)
    const finalDurationSeconds = asNumber(data.finalDurationSeconds || data.durationSeconds)

    let durationSeconds = finalDurationSeconds
    if (!durationSeconds && acceptedAt && endedAt) {
      durationSeconds = Math.max(
        0,
        Math.round((new Date(endedAt).getTime() - new Date(acceptedAt).getTime()) / 1000)
      )
    }

    const statusValue = asString(data.status, 'missed')
    const status =
      statusValue === 'active' || statusValue === 'ended' ? statusValue : 'missed'

    return {
      id: doc.id,
      callerId,
      callerName: users.get(callerId) ?? 'Friendoo User',
      hostId,
      hostName: users.get(hostId) ?? 'Host',
      status,
      coinsSpent: asNumber(data.coinsSpent),
      durationSeconds,
      ratePerMinute: asNumber(data.ratePerMinute),
      createdAt,
      acceptedAt,
      endedAt,
      agoraChannel: asString(data.agoraChannel),
    } satisfies CallRow
  })

  return sortByNewest(rows)
}

export async function getAppSettings(): Promise<AppSettingsRecord> {
  const db = getDb()
  const snap = await db.collection('config').doc('appSettings').get()
  const data = snap.data() ?? {}

  return {
    welcomeBonusCoins: asNumber(data.welcomeBonusCoins, 50),
    minCoinBalanceToStartCall: asNumber(data.minCoinBalanceToStartCall, 20),
    maxCallDurationMinutes: asNumber(data.maxCallDurationMinutes, 60),
    maintenanceMode: asBoolean(data.maintenanceMode),
    updatedAt: toIsoString(data.updatedAt),
  }
}

export async function listWithdrawals(): Promise<any[]> {
  const db = getDb()
  const [withdrawalsSnap, usersSnap] = await Promise.all([
    db.collectionGroup('payoutHistory').get(),
    db.collection('hosts').get(),
  ])

  const hosts = new Map(
    usersSnap.docs.map((doc) => [doc.id, { 
      alias: asString(doc.data().alias, 'Anonymous Host'),
      walletBalance: asNumber(doc.data().walletBalance, 0)
    }])
  )

  const rows = withdrawalsSnap.docs.map((doc) => {
    const data = doc.data()
    const hostId = doc.ref.parent.parent?.id || ''
    const host = hosts.get(hostId)
    return {
      id: doc.id,
      hostId,
      hostName: host?.alias ?? 'Unknown Host',
      walletBalance: host?.walletBalance ?? 0,
      amount: asNumber(data.amount),
      upiId: asString(data.upiId, 'Stored Encrypted'),
      status: asString(data.status, 'pending') as any,
      requestedAt: toIsoString(data.requestedAt),
      processedAt: toIsoString(data.processedAt),
      adminNote: asString(data.adminNote),
      razorpayPayoutId: asString(data.razorpayPayoutId),
      failureReason: asString(data.failureReason),
    }
  })

  return rows.sort((left, right) => {
    const leftValue = left.requestedAt ? new Date(left.requestedAt).getTime() : 0
    const rightValue = right.requestedAt ? new Date(right.requestedAt).getTime() : 0
    return rightValue - leftValue
  })
}

export async function getHostEarnings(hostId: string): Promise<import('./types').HostEarningsRecord | null> {
  const db = getDb()
  const snap = await db.collection('hostEarnings').document(hostId).get()
  if (!snap.exists) return null

  const data = snap.data() ?? {}
  return {
    hostId,
    totalEarningsInr: asNumber(data.totalEarningsInr),
    totalCallMinutes: asNumber(data.totalCallMinutes),
    totalCalls: asNumber(data.totalCalls),
    availableForWithdrawal: asNumber(data.availableForWithdrawal),
    pendingWithdrawal: asNumber(data.pendingWithdrawal),
    lifetimeEarnings: asNumber(data.lifetimeEarnings),
    lastPayoutDate: toIsoString(data.lastPayoutDate),
  }
}

export async function saveAppSettings(payload: SettingsPayload) {
  const db = getDb()
  await db.collection('config').doc('appSettings').set(
    {
      welcomeBonusCoins: Math.max(0, Math.round(payload.welcomeBonusCoins)),
      minCoinBalanceToStartCall: Math.max(0, Math.round(payload.minCoinBalanceToStartCall)),
      maxCallDurationMinutes: Math.max(1, Math.round(payload.maxCallDurationMinutes)),
      maintenanceMode: Boolean(payload.maintenanceMode),
      updatedBy: 'admin',
      updatedAt: adminFieldValue.serverTimestamp(),
    },
    { merge: true }
  )
}
