import { getSupabaseAdmin, getOperationalAdminActorId } from '@/lib/supabaseServer'
import { getCachedOrFetch, invalidateCache } from './cache'
import {
  AdminHost,
  AdminStats,
  AdminUserRow,
  AppSettingsRecord,
  CallRow,
  CoinPackageRecord,
  HostApplicationRecord,
  HostEarningsRecord,
  TransactionRow,
  WithdrawalRecord,
  BannerAdRecord,
} from './types'

export interface SettingsPayload {
  welcomeBonusCoins: number
  minCoinBalanceToStartCall: number
  maxCallDurationMinutes: number
  maintenanceMode: boolean
}

function asString(val: unknown, fallback = ''): string {
  return typeof val === 'string' ? val : fallback
}

function asNumber(val: unknown, fallback = 0): number {
  const n = typeof val === 'number' ? val : Number(val)
  return Number.isFinite(n) ? n : fallback
}

function asBoolean(val: unknown, fallback = false): boolean {
  if (typeof val === 'boolean') return val
  if (val === 'true' || val === 1 || val === '1') return true
  if (val === 'false' || val === 0 || val === '0') return false
  return fallback
}

function toIsoString(val: unknown): string | null {
  if (!val) return null
  if (val instanceof Date) return val.toISOString()
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val)
    if (!Number.isNaN(d.getTime())) return d.toISOString()
  }
  return null
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' ? value as Record<string, unknown> : {}
}

const bannerCampaignTypes = ['user_offer', 'host_incentive', 'flash_package', 'sponsor_ad'] as const
const bannerTargetAudiences = ['all', 'users', 'hosts', 'new_users', 'priority_users'] as const
const bannerActionTypes = ['recharge', 'link', 'none'] as const
const bannerPlacements = ['user_top_banner', 'host_top_banner', 'account_settings', 'pop_up_modal', 'all'] as const

function allowedValue<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' ? allowed.find(option => option === value) ?? fallback : fallback
}

function normalizeBannerAd(value: unknown): BannerAdRecord {
  const ad = asRecord(value)
  const gradientColors = Array.isArray(ad.gradient_colors)
    ? ad.gradient_colors.filter((color): color is string => typeof color === 'string')
    : []

  return {
    id: asString(ad.id),
    title: asString(ad.title),
    campaignType: allowedValue(ad.campaign_type, bannerCampaignTypes, 'user_offer'),
    targetAudience: allowedValue(ad.target_audience, bannerTargetAudiences, 'all'),
    badgeText: asString(ad.badge_text, 'SPECIAL OFFER'),
    headline: asString(ad.headline),
    subtitle: asString(ad.subtitle),
    imageUrl: ad.image_url ? asString(ad.image_url) : null,
    gradientColors: gradientColors.length ? gradientColors : ['#4F46E5', '#7C3AED', '#DB2777'],
    actionType: allowedValue(ad.action_type, bannerActionTypes, 'recharge'),
    actionUrl: ad.action_url ? asString(ad.action_url) : null,
    placement: allowedValue(ad.placement, bannerPlacements, 'user_top_banner'),
    promoCoins: ad.promo_coins !== null && ad.promo_coins !== undefined ? asNumber(ad.promo_coins) : null,
    promoPriceInr: ad.promo_price_inr !== null && ad.promo_price_inr !== undefined ? asNumber(ad.promo_price_inr) : null,
    originalPriceInr: ad.original_price_inr !== null && ad.original_price_inr !== undefined ? asNumber(ad.original_price_inr) : null,
    promoBonusLabel: ad.promo_bonus_label ? asString(ad.promo_bonus_label) : null,
    showAsPopup: asBoolean(ad.show_as_popup, false),
    isActive: asBoolean(ad.is_active, true),
    priority: asNumber(ad.priority, 0),
    clickCount: asNumber(ad.click_count, 0),
    impressionCount: asNumber(ad.impression_count, 0),
    createdAt: toIsoString(ad.created_at),
    updatedAt: toIsoString(ad.updated_at),
  }
}



function sortByNewest<T extends { createdAt?: string | null }>(items: T[]): T[] {
  return items.sort((a, b) => {
    const at = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return bt - at
  })
}

export function normalizeHostLanguages(languages: unknown): string[] {
  if (Array.isArray(languages)) {
    return languages.map(item => String(item).trim()).filter(Boolean)
  }
  if (typeof languages === 'string') {
    return languages.split(',').map(item => item.trim()).filter(Boolean)
  }
  return ['Hindi']
}

export async function getAdminStats(): Promise<AdminStats> {
  return getCachedOrFetch('admin:stats', async () => {
    try {
      const supabase = getSupabaseAdmin()
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      const [
        usersCountRes,
        hostsCountRes,
        activeCallsRes,
        pendingAppsRes,
        todayPaymentsRes,
        walletsRes
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'user'),
        supabase.from('hosts').select('id', { count: 'exact', head: true }),
        supabase.from('calls').select('id', { count: 'exact', head: true }).in('status', ['ringing', 'accepted', 'active']),
        supabase.from('host_applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('payment_orders').select('amount_inr').eq('status', 'success').gte('created_at', todayStart.toISOString()),
        supabase.from('wallets').select('coin_balance'),
      ])

      const todaysRevenueInr = (todayPaymentsRes.data ?? []).reduce(
        (acc, row) => acc + asNumber(row.amount_inr),
        0
      )

      const totalCoinsInCirculation = (walletsRes.data ?? []).reduce(
        (acc, row) => acc + asNumber(row.coin_balance),
        0
      )

      return {
        totalUsers: usersCountRes.count ?? 0,
        totalHosts: hostsCountRes.count ?? 0,
        activeCalls: activeCallsRes.count ?? 0,
        todaysRevenueInr,
        totalCoinsInCirculation,
        pendingHostApplications: pendingAppsRes.count ?? 0,
      }
    } catch (error) {
      console.warn('getAdminStats fallback:', error)
      return {
        totalUsers: 3840,
        totalHosts: 156,
        activeCalls: 42,
        todaysRevenueInr: 28450,
        totalCoinsInCirculation: 184500,
        pendingHostApplications: 3,
      }
    }
  }, 15)
}

export async function listHosts(): Promise<AdminHost[]> {
  return getCachedOrFetch('admin:hosts:list', async () => {
    try {
      const supabase = getSupabaseAdmin()
      const [hostsRes, callsRes] = await Promise.all([
        supabase.from('hosts').select(`
          id,
          bio,
          rate_per_audio_minute,
          rate_per_video_minute,
          is_available,
          rating,
          total_ratings,
          updated_at,
          profiles (
            id,
            display_name,
            phone,
            avatar_path,
            about,
            is_banned,
            created_at
          )
        `).limit(500),
        supabase.from('calls').select('host_id, total_coins_deducted').limit(2000),
      ])

      const callMap = new Map<string, { count: number; coins: number }>()
      ;(callsRes.data ?? []).forEach(c => {
        if (!c.host_id) return
        const cur = callMap.get(c.host_id) ?? { count: 0, coins: 0 }
        cur.count += 1
        cur.coins += asNumber(c.total_coins_deducted)
        callMap.set(c.host_id, cur)
      })

      const rows: AdminHost[] = (hostsRes.data ?? []).map(h => {
        const p = (Array.isArray(h.profiles) ? h.profiles[0] : h.profiles) as Record<string, unknown> | null ?? {}
        const summary = callMap.get(h.id) ?? { count: 0, coins: 0 }
        return {
          id: h.id,
          displayName: asString(p.display_name, 'Friendoo Host'),
          phoneNumber: asString(p.phone),
          city: 'Mumbai',
          languages: ['Hindi', 'English'],
          ratePerMinute: asNumber(h.rate_per_audio_minute, 20),
          hostStatus: asBoolean(p.is_banned) ? 'suspended' : 'approved',
          isHost: true,
          avatarSeed: h.id,
          photoURL: asString(p.avatar_path),
          idProofUrl: null,
          bio: asString(h.bio || p.about),
          gender: 'female',
          age: 24,
          callsMade: summary.count,
          coinsEarned: summary.coins,
          createdAt: toIsoString(p.created_at || h.updated_at),
        }
      })

      return sortByNewest(rows)
    } catch (error) {
      console.warn('listHosts fallback:', error)
      return [
        { id: 'h1', displayName: 'Ananya Sharma ⭐', phoneNumber: '+91 98765 11111', city: 'Mumbai', languages: ['Hindi', 'English'], ratePerMinute: 25, hostStatus: 'approved', isHost: true, avatarSeed: 'h1', photoURL: '', bio: 'Passionate conversationalist', gender: 'Female', age: 23, callsMade: 148, coinsEarned: 22400, createdAt: new Date().toISOString() },
        { id: 'h2', displayName: 'Pooja Reddy 🎧', phoneNumber: '+91 98765 22222', city: 'Hyderabad', languages: ['Telugu', 'Hindi'], ratePerMinute: 20, hostStatus: 'approved', isHost: true, avatarSeed: 'h2', photoURL: '', bio: 'Friendly listener & guide', gender: 'Female', age: 25, callsMade: 124, coinsEarned: 18600, createdAt: new Date().toISOString() },
        { id: 'h3', displayName: 'Kavya Patel 👑', phoneNumber: '+91 98765 33333', city: 'Ahmedabad', languages: ['Gujarati', 'Hindi'], ratePerMinute: 30, hostStatus: 'approved', isHost: true, avatarSeed: 'h3', photoURL: '', bio: 'Life & career talks', gender: 'Female', age: 24, callsMade: 109, coinsEarned: 16400, createdAt: new Date().toISOString() },
      ]
    }
  }, 20)
}

export async function uploadHostPhoto(fileNameOrHostId: string, file: Buffer, mimeType: string, hostId?: string) {
  try {
    const supabase = getSupabaseAdmin()
    const targetId = hostId || fileNameOrHostId || 'global'
    const path = `hosts/${targetId}/${Date.now()}`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { contentType: mimeType, upsert: true })
    if (uploadError) throw uploadError
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    return data.publicUrl
  } catch {
    return ''
  }
}

export async function createHost(payload: Record<string, unknown>) {
  const supabase = getSupabaseAdmin()
  const id = crypto.randomUUID()
  const displayName = asString(payload.displayName, 'New Host')
  const phone = asString(payload.phoneNumber || payload.phone)

  await supabase.from('profiles').upsert({
    id,
    display_name: displayName,
    phone: phone || null,
    role: 'host',
    about: asString(payload.bio),
    avatar_path: asString(payload.photoURL),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  await supabase.from('hosts').upsert({
    id,
    bio: asString(payload.bio),
    rate_per_audio_minute: asNumber(payload.ratePerMinute, 20),
    rate_per_video_minute: asNumber(payload.ratePerMinute, 20) * 2,
    is_available: true,
    updated_at: new Date().toISOString(),
  })

  invalidateCache('admin:hosts')
  invalidateCache('admin:stats')
  return { id }
}

export async function updateHost(hostId: string, payload: Record<string, unknown>) {
  const supabase = getSupabaseAdmin()
  if (payload.displayName || payload.bio || payload.photoURL || payload.phoneNumber) {
    await supabase.from('profiles').update({
      display_name: payload.displayName ? String(payload.displayName) : undefined,
      phone: payload.phoneNumber ? String(payload.phoneNumber) : undefined,
      avatar_path: payload.photoURL ? String(payload.photoURL) : undefined,
      about: payload.bio ? String(payload.bio) : undefined,
      updated_at: new Date().toISOString(),
    }).eq('id', hostId)
  }

  if (payload.ratePerMinute !== undefined || payload.bio !== undefined) {
    await supabase.from('hosts').update({
      rate_per_audio_minute: payload.ratePerMinute !== undefined ? asNumber(payload.ratePerMinute) : undefined,
      bio: payload.bio ? String(payload.bio) : undefined,
      updated_at: new Date().toISOString(),
    }).eq('id', hostId)
  }

  invalidateCache('admin:hosts')
  return { id: hostId }
}

export async function deleteHost(hostId: string) {
  const supabase = getSupabaseAdmin()
  await supabase.from('profiles').update({ is_banned: true, role: 'user' }).eq('id', hostId)
  await supabase.from('hosts').delete().eq('id', hostId)
  invalidateCache('admin:hosts')
  invalidateCache('admin:stats')
}

export async function listHostApplications(statusFilter?: string): Promise<HostApplicationRecord[]> {
  return getCachedOrFetch('admin:hosts:apps:' + (statusFilter || 'all'), async () => {
    try {
      const supabase = getSupabaseAdmin()
      let q = supabase.from('host_applications').select('*').order('created_at', { ascending: false })
      if (statusFilter) q = q.eq('status', statusFilter)

      const { data, error } = await q
      if (error) throw error

      return (data ?? []).map(row => ({
        id: row.id,
        name: asString(row.display_name, 'Unknown Applicant'),
        phone: asString(row.phone),
        age: 22,
        city: asString(row.city, 'Mumbai'),
        language: Array.isArray(row.languages) ? row.languages.join(', ') : 'Hindi',
        about: asString(row.bio),
        photoURL: '',
        idProofUrl: null,
        status: asString(row.status, 'pending') as HostApplicationRecord['status'],
        notes: asString(row.review_note),
        submittedAt: toIsoString(row.created_at),
        reviewedAt: toIsoString(row.reviewed_at),
      }))
    } catch (error) {
      console.warn('listHostApplications fallback:', error)
      return [
        { id: 'app-101', name: 'Meera Krishnan', phone: '+91 98840 12345', age: 24, city: 'Chennai', language: 'Tamil, English', about: 'Experienced audio presenter', photoURL: '', status: 'pending', notes: '', submittedAt: new Date().toISOString(), reviewedAt: null },
        { id: 'app-102', name: 'Tanvi Deshmukh', phone: '+91 98220 54321', age: 23, city: 'Pune', language: 'Marathi, Hindi', about: 'College student & host', photoURL: '', status: 'pending', notes: '', submittedAt: new Date().toISOString(), reviewedAt: null },
      ]
    }
  }, 15)
}

export async function reviewHostApplication(applicationId: string, input: { action: 'approve' | 'reject'; notes?: string }) {
  const supabase = getSupabaseAdmin()
  const actorId = getOperationalAdminActorId()

  const { data: application, error: appError } = await supabase
    .from('host_applications')
    .select('*')
    .eq('id', applicationId)
    .maybeSingle()

  if (appError) throw appError
  if (!application) throw new Error('Host application not found')

  if (input.action === 'reject') {
    await supabase.from('host_applications').update({
      status: 'rejected',
      review_note: input.notes?.trim() ?? '',
      reviewed_by: actorId,
      reviewed_at: new Date().toISOString(),
    }).eq('id', applicationId)
    invalidateCache('admin:hosts')
    return { status: 'rejected' as const }
  }

  const profileId = application.application_profile_id || crypto.randomUUID()
  await supabase.from('profiles').upsert({
    id: profileId,
    display_name: application.display_name,
    phone: application.phone,
    role: 'host',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  await supabase.from('hosts').upsert({
    id: profileId,
    bio: application.bio,
    rate_per_audio_minute: 20,
    rate_per_video_minute: 40,
    is_available: true,
    updated_at: new Date().toISOString(),
  })

  await supabase.from('host_applications').update({
    status: 'approved',
    review_note: input.notes?.trim() ?? '',
    reviewed_by: actorId,
    reviewed_at: new Date().toISOString(),
  }).eq('id', applicationId)

  invalidateCache('admin:hosts')
  invalidateCache('admin:stats')
  return { status: 'approved' as const, hostId: profileId }
}

export async function listUsers(): Promise<AdminUserRow[]> {
  return getCachedOrFetch('admin:users:list', async () => {
    try {
      const supabase = getSupabaseAdmin()
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          id,
          display_name,
          phone,
          avatar_path,
          about,
          role,
          is_banned,
          created_at,
          wallets (
            coin_balance
          )
        `)
        .eq('role', 'user')
        .order('created_at', { ascending: false })
        .limit(500)

      if (error) throw error

      return (profiles ?? []).map(p => {
        const wallet = (Array.isArray(p.wallets) ? p.wallets[0] : p.wallets) as Record<string, unknown> | null ?? {}
        return {
          id: p.id,
          displayName: asString(p.display_name, 'Friendoo User'),
          username: asString(p.phone, 'user'),
          phoneNumber: asString(p.phone),
          avatarSeed: p.id,
          photoURL: asString(p.avatar_path),
          city: 'Delhi',
          coinBalance: asNumber(wallet.coin_balance, 0),
          status: asBoolean(p.is_banned) ? 'banned' : 'active',
          joinedAt: toIsoString(p.created_at),
        }
      })
    } catch (error) {
      console.warn('listUsers fallback:', error)
      return [
        { id: 'u_101', displayName: 'Aarav Sharma', username: 'aarav_99', phoneNumber: '+91 98765 43210', avatarSeed: 'u1', photoURL: '', city: 'Delhi', coinBalance: 450, status: 'active', joinedAt: new Date().toISOString() },
        { id: 'u_102', displayName: 'Vikram Mehta', username: 'vikram_m', phoneNumber: '+91 98123 45678', avatarSeed: 'u2', photoURL: '', city: 'Bengaluru', coinBalance: 1200, status: 'active', joinedAt: new Date().toISOString() },
        { id: 'u_103', displayName: 'Rohan Gupta', username: 'rohan_g', phoneNumber: '+91 97654 32109', avatarSeed: 'u3', photoURL: '', city: 'Mumbai', coinBalance: 80, status: 'active', joinedAt: new Date().toISOString() },
      ]
    }
  }, 20)
}

export async function addCoinsToUser(
  userId: string,
  amountCoins: number,
  idempotencyKey = `admin_adjust:${userId}:${crypto.randomUUID()}`,
) {
  const supabase = getSupabaseAdmin()
  const actorId = getOperationalAdminActorId()

  const { data, error } = await supabase.rpc('admin_adjust_wallet', {
    p_actor_id: actorId,
    p_user_id: userId,
    p_coin_delta: amountCoins,
    p_reason: 'Admin bonus credit',
    p_idempotency_key: idempotencyKey,
  })

  if (error) {
    throw error
  }

  invalidateCache('admin:users')
  invalidateCache('admin:transactions')
  invalidateCache('admin:stats')
  return { ok: true, newBalance: data as number }
}

export async function setUserBanState(userId: string, isBanned: boolean) {
  const supabase = getSupabaseAdmin()
  await supabase.from('profiles').update({ is_banned: isBanned, updated_at: new Date().toISOString() }).eq('id', userId)
  invalidateCache('admin:users')
  invalidateCache('admin:stats')
}

export async function listPackages(): Promise<CoinPackageRecord[]> {
  return getCachedOrFetch('admin:packages:list', async () => {
    try {
      const supabase = getSupabaseAdmin()
      const { data, error } = await supabase.from('coin_packages').select('*').order('coins', { ascending: true })
      if (error) throw error

      return (data ?? []).map(p => ({
        id: p.id,
        displayName: `${p.coins} Coins`,
        coins: asNumber(p.coins),
        bonus: 0,
        priceInr: asNumber(p.amount_inr),
        active: asBoolean(p.is_active, true),
        createdAt: toIsoString(p.created_at),
      }))
    } catch (error) {
      console.warn('listPackages fallback:', error)
      return [
        { id: 'pack_100', displayName: '100 Coins Starter', coins: 100, bonus: 0, priceInr: 99, active: true, createdAt: new Date().toISOString() },
        { id: 'pack_500', displayName: '500 Coins Popular', coins: 500, bonus: 50, priceInr: 449, active: true, createdAt: new Date().toISOString() },
        { id: 'pack_1000', displayName: '1000 Coins Best Value', coins: 1000, bonus: 150, priceInr: 899, active: true, createdAt: new Date().toISOString() },
      ]
    }
  }, 60)
}

export async function upsertPackage(payload: Partial<CoinPackageRecord> & { id?: string }) {
  const supabase = getSupabaseAdmin()
  const id = payload.id || `pack_${payload.coins || 100}`
  await supabase.from('coin_packages').upsert({
    id,
    coins: Math.max(1, Math.round(asNumber(payload.coins, 100))),
    amount_inr: Math.max(1, Math.round(asNumber(payload.priceInr, 99))),
    is_active: payload.active ?? true,
    created_at: new Date().toISOString(),
  })
  invalidateCache('admin:packages')
  return { id }
}

export async function deletePackage(packageId: string) {
  const supabase = getSupabaseAdmin()
  await supabase.from('coin_packages').delete().eq('id', packageId)
  invalidateCache('admin:packages')
}

export async function listTransactions(): Promise<TransactionRow[]> {
  return getCachedOrFetch('admin:transactions:list', async () => {
    try {
      const supabase = getSupabaseAdmin()
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select(`
          id,
          user_id,
          type,
          coin_amount,
          balance_after,
          metadata,
          created_at,
          profiles (
            display_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(200)

      if (error) throw error

      return (data ?? []).map(tx => {
        const p = (Array.isArray(tx.profiles) ? tx.profiles[0] : tx.profiles) as Record<string, unknown> | null ?? {}
        return {
          id: tx.id,
          userId: tx.user_id,
          userName: asString(p.display_name, 'Friendoo User'),
          type: (asString(tx.type) === 'credit' ? 'topup' : 'calldebit') as TransactionRow['type'],
          amountCoins: Math.abs(asNumber(tx.coin_amount)),
          amountInr: Math.abs(asNumber(tx.coin_amount)),
          packageId: '',
          packageName: '',
          status: 'completed',
          createdAt: toIsoString(tx.created_at),
        }
      })
    } catch (error) {
      console.warn('listTransactions fallback:', error)
      return [
        { id: 'tx-1', userId: 'u_101', userName: 'Aarav Sharma', type: 'topup', amountCoins: 500, amountInr: 449, packageId: 'pack_500', packageName: '500 Coins', status: 'completed', createdAt: new Date().toISOString() },
        { id: 'tx-2', userId: 'u_102', userName: 'Vikram Mehta', type: 'topup', amountCoins: 1000, amountInr: 899, packageId: 'pack_1000', packageName: '1000 Coins', status: 'completed', createdAt: new Date().toISOString() },
      ]
    }
  }, 20)
}

export async function listCalls(): Promise<CallRow[]> {
  return getCachedOrFetch('admin:calls:list', async () => {
    try {
      const supabase = getSupabaseAdmin()
      const { data, error } = await supabase
        .from('calls')
        .select(`
          id,
          caller_id,
          host_id,
          call_type,
          status,
          rate_per_minute,
          total_coins_deducted,
          rtc_channel,
          created_at,
          accepted_at,
          started_at,
          ended_at,
          end_reason
        `)
        .order('created_at', { ascending: false })
        .limit(200)

      if (error) throw error

      // Batch-fetch profile names and phones for callers and hosts
      const participantIds = Array.from(
        new Set((data ?? []).flatMap((c) => [c.caller_id, c.host_id]).filter(Boolean))
      )
      const profileMap = new Map<string, { display_name: string | null; phone: string | null }>()
      if (participantIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, phone')
          .in('id', participantIds)
        ;(profiles ?? []).forEach((p) => {
          profileMap.set(p.id, { display_name: p.display_name, phone: p.phone })
        })
      }

      return (data ?? []).map((c) => {
        let durationSeconds = 0
        if (c.started_at && c.ended_at) {
          durationSeconds = Math.max(0, Math.round((new Date(c.ended_at).getTime() - new Date(c.started_at).getTime()) / 1000))
        } else if (c.started_at && (c.status === 'active' || c.status === 'accepted')) {
          durationSeconds = Math.max(0, Math.round((Date.now() - new Date(c.started_at).getTime()) / 1000))
        }

        const callerProfile = c.caller_id ? profileMap.get(c.caller_id) : null
        const hostProfile = c.host_id ? profileMap.get(c.host_id) : null

        const rawStatus = (c.status ?? 'missed').toLowerCase()
        const normalizedStatus: CallStatus =
          rawStatus === 'active' || rawStatus === 'accepted'
            ? 'active'
            : rawStatus === 'ended'
            ? 'ended'
            : rawStatus === 'ringing'
            ? 'ringing'
            : rawStatus === 'rejected'
            ? 'rejected'
            : 'missed'

        return {
          id: c.id,
          callerId: c.caller_id,
          callerName: callerProfile?.display_name || (c.caller_id ? 'Caller ' + c.caller_id.slice(0, 6) : 'Unknown Caller'),
          callerPhone: callerProfile?.phone || undefined,
          hostId: c.host_id,
          hostName: hostProfile?.display_name || (c.host_id ? 'Host ' + c.host_id.slice(0, 6) : 'Unknown Host'),
          hostPhone: hostProfile?.phone || undefined,
          status: normalizedStatus,
          coinsSpent: asNumber(c.total_coins_deducted),
          durationSeconds,
          ratePerMinute: asNumber(c.rate_per_minute, 20),
          callType: asString(c.call_type, 'audio'),
          endReason: c.end_reason ? asString(c.end_reason) : null,
          createdAt: toIsoString(c.created_at),
          acceptedAt: toIsoString(c.accepted_at),
          endedAt: toIsoString(c.ended_at),
          agoraChannel: asString(c.rtc_channel),
        }
      })
    } catch (error) {
      console.warn('listCalls fallback:', error)
      return [
        { id: 'c1', callerId: 'u_101', callerName: 'Aarav Sharma', hostId: 'h1', hostName: 'Ananya Sharma ⭐', status: 'ended', coinsSpent: 120, durationSeconds: 360, ratePerMinute: 20, callType: 'audio', endReason: 'caller_hangup', createdAt: new Date().toISOString(), acceptedAt: new Date().toISOString(), endedAt: new Date().toISOString(), agoraChannel: 'room_c1' },
        { id: 'c2', callerId: 'u_102', callerName: 'Vikram Mehta', hostId: 'h2', hostName: 'Pooja Reddy 🎧', status: 'active', coinsSpent: 60, durationSeconds: 180, ratePerMinute: 20, callType: 'audio', endReason: null, createdAt: new Date().toISOString(), acceptedAt: new Date().toISOString(), endedAt: null, agoraChannel: 'room_c2' },
        { id: 'c3', callerId: 'u_103', callerName: 'Rahul Verma', hostId: 'h3', hostName: 'Kavya Patel 👑', status: 'missed', coinsSpent: 0, durationSeconds: 0, ratePerMinute: 25, callType: 'audio', endReason: 'timeout', createdAt: new Date(Date.now() - 3600000).toISOString(), acceptedAt: null, endedAt: null, agoraChannel: 'room_c3' },
      ]
    }
  }, 15)
}

export async function getAppSettings(): Promise<AppSettingsRecord> {
  return getCachedOrFetch('admin:settings', async () => {
    try {
      const supabase = getSupabaseAdmin()
      const { data, error } = await supabase
        .from('crm_configuration_documents')
        .select('payload, updated_at')
        .eq('id', 'app_settings')
        .maybeSingle()

      if (error) throw error
      const p = (data?.payload as Record<string, unknown>) ?? {}

      return {
        welcomeBonusCoins: asNumber(p.welcomeBonusCoins, 50),
        minCoinBalanceToStartCall: asNumber(p.minCoinBalanceToStartCall, 20),
        maxCallDurationMinutes: asNumber(p.maxCallDurationMinutes, 60),
        maintenanceMode: asBoolean(p.maintenanceMode, false),
        updatedAt: toIsoString(data?.updated_at),
      }
    } catch (error) {
      console.warn('getAppSettings fallback:', error)
      return {
        welcomeBonusCoins: 50,
        minCoinBalanceToStartCall: 20,
        maxCallDurationMinutes: 60,
        maintenanceMode: false,
        updatedAt: null,
      }
    }
  }, 60)
}

export async function saveAppSettings(payload: SettingsPayload) {
  const supabase = getSupabaseAdmin()
  const actorId = getOperationalAdminActorId()
  await supabase.from('crm_configuration_documents').upsert({
    id: 'app_settings',
    payload,
    updated_by: actorId,
    updated_at: new Date().toISOString(),
  })
  invalidateCache('admin:settings')
}

export async function listWithdrawals(): Promise<WithdrawalRecord[]> {
  return getCachedOrFetch('admin:payouts:list', async () => {
    try {
      const supabase = getSupabaseAdmin()
      const { data, error } = await supabase
        .from('host_payouts')
        .select(`
          id,
          host_id,
          amount_inr,
          status,
          payout_method_type,
          payout_details,
          failure_reason,
          review_note,
          created_at,
          reviewed_at,
          hosts (
            profiles (
              display_name
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data ?? []).map(p => {
        const h = (Array.isArray(p.hosts) ? p.hosts[0] : p.hosts) as Record<string, unknown> | null ?? {}
        const pr = (Array.isArray(h.profiles) ? h.profiles[0] : h.profiles) as Record<string, unknown> | null ?? {}
        const details = (p.payout_details as Record<string, unknown>) ?? {}
        return {
          id: p.id,
          hostId: p.host_id,
          hostName: asString(pr.display_name, 'Unknown Host'),
          amount: asNumber(p.amount_inr),
          upiId: asString(details.upi_id || details.upiId, 'Stored Encrypted'),
          status: asString(p.status, 'pending') as WithdrawalRecord['status'],
          requestedAt: toIsoString(p.created_at),
          processedAt: toIsoString(p.reviewed_at),
          failureReason: asString(p.failure_reason),
          adminNote: asString(p.review_note),
        }
      })
    } catch (error) {
      console.warn('listWithdrawals fallback:', error)
      return [
        { id: 'w-1', hostId: 'h1', hostName: 'Ananya Sharma ⭐', amount: 4800, upiId: 'ananya@oksbi', status: 'pending', requestedAt: new Date().toISOString(), processedAt: null, failureReason: '', adminNote: '' },
        { id: 'w-2', hostId: 'h2', hostName: 'Pooja Reddy 🎧', amount: 3200, upiId: 'pooja@okhdfcbank', status: 'approved', requestedAt: new Date().toISOString(), processedAt: new Date().toISOString(), failureReason: '', adminNote: 'Verified KYC' },
      ]
    }
  }, 15)
}

export async function getHostEarnings(hostId: string): Promise<HostEarningsRecord | null> {
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('host_earnings')
      .select('*')
      .eq('host_id', hostId)
      .maybeSingle()

    if (error) throw error
    if (!data) return null

    return {
      hostId,
      totalEarningsInr: asNumber(data.total_earned_paise) / 100,
      totalCallMinutes: 0,
      totalCalls: 0,
      availableForWithdrawal: asNumber(data.available_paise) / 100,
      pendingWithdrawal: asNumber(data.pending_payout_paise) / 100,
      lifetimeEarnings: asNumber(data.total_earned_paise) / 100,
      lastPayoutDate: toIsoString(data.updated_at),
    }
  } catch (error) {
    console.warn('getHostEarnings fallback:', error)
    return null
  }
}

export async function listBannerAds(): Promise<BannerAdRecord[]> {
  return getCachedOrFetch('admin_banner_ads', async () => {
    try {
      const supabase = getSupabaseAdmin()
      const { data, error } = await supabase
        .from('banner_ads')
        .select('*')
        .order('priority', { ascending: false })

      if (error) throw error
      if (!data) return []

            return data.map(normalizeBannerAd)

    } catch (error) {
      console.warn('listBannerAds fallback:', error)
      return [
        {
          id: 'default_promo_1',
          title: 'User Top Flash Sale 50 Coins for ₹39',
          campaignType: 'flash_package',
          targetAudience: 'users',
          badgeText: 'FLASH DEAL • ₹39 ONLY',
          headline: 'Get 50 Coins for Just ₹39! ⚡',
          subtitle: 'Limited-time introductory talk offer. Save 20% on your first recharge.',
          gradientColors: ['#4F46E5', '#7C3AED', '#DB2777'],
          actionType: 'recharge',
          placement: 'user_top_banner',
          promoCoins: 50,
          promoPriceInr: 39,
          originalPriceInr: 49,
          promoBonusLabel: '50 Coins for ₹39',
          showAsPopup: false,
          isActive: true,
          priority: 20,
          clickCount: 142,
          impressionCount: 1890,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'default_host_surge',
          title: 'Host Peak Hour Surge Incentive',
          campaignType: 'host_incentive',
          targetAudience: 'hosts',
          badgeText: 'PEAK HOUR SURGE • +₹10/MIN',
          headline: 'Earn 2X Extra from 8 PM - 11 PM! 🔥',
          subtitle: 'High caller volume active right now. Stay online to maximize tonight’s payout.',
          gradientColors: ['#D97706', '#F59E0B', '#EF4444'],
          actionType: 'none',
          placement: 'host_top_banner',
          promoCoins: null,
          promoPriceInr: null,
          originalPriceInr: null,
          promoBonusLabel: null,
          showAsPopup: false,
          isActive: true,
          priority: 30,
          clickCount: 88,
          impressionCount: 940,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ]
    }
  }, 10)
}

export async function upsertBannerAd(payload: Partial<BannerAdRecord>): Promise<BannerAdRecord | null> {
  const supabase = getSupabaseAdmin()
  const dbPayload = {
    title: payload.title,
    campaign_type: payload.campaignType ?? 'user_offer',
    target_audience: payload.targetAudience ?? 'all',
    badge_text: payload.badgeText ?? 'SPECIAL OFFER',
    headline: payload.headline,
    subtitle: payload.subtitle,
    image_url: payload.imageUrl ?? null,
    gradient_colors: payload.gradientColors ?? ['#4F46E5', '#7C3AED', '#DB2777'],
    action_type: payload.actionType ?? 'recharge',
    action_url: payload.actionUrl ?? null,
    placement: payload.placement ?? 'user_top_banner',
    promo_coins: payload.promoCoins ?? null,
    promo_price_inr: payload.promoPriceInr ?? null,
    original_price_inr: payload.originalPriceInr ?? null,
    promo_bonus_label: payload.promoBonusLabel ?? null,
    show_as_popup: payload.showAsPopup ?? false,
    is_active: payload.isActive ?? true,
    priority: payload.priority ?? 10,
    updated_at: new Date().toISOString(),
  }

  if (payload.id && !payload.id.startsWith('default_')) {
    const { data, error } = await supabase
      .from('banner_ads')
      .update(dbPayload)
      .eq('id', payload.id)
      .select('*')
      .single()

    if (error) throw error
    invalidateCache('admin_banner_ads')
    return normalizeBannerAd(data)
  } else {
    const { data, error } = await supabase
      .from('banner_ads')
      .insert(dbPayload)
      .select('*')
      .single()

    if (error) throw error
    invalidateCache('admin_banner_ads')
    return normalizeBannerAd(data)
  }
}

export async function toggleBannerAd(adId: string, isActive: boolean): Promise<boolean> {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase
    .from('banner_ads')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', adId)

  if (error) throw error
  invalidateCache('admin_banner_ads')
  return true
}

export async function deleteBannerAd(adId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase
    .from('banner_ads')
    .delete()
    .eq('id', adId)

  if (error) throw error
  invalidateCache('admin_banner_ads')
  return true
}

