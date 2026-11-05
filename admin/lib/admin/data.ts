import { getSupabaseAdmin, getOperationalAdminActorId } from '@/lib/supabaseServer'
import { getCachedOrFetch, invalidateCache } from './cache'
import {
  AdminHost,
  AdminStats,
  AdminUserRow,
  AppSettingsRecord,
  CallRow,
  CallStatus,
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
    campaignClass: ad.campaign_class === 'sponsored_ad' || ad.campaign_type === 'sponsor_ad' ? 'sponsored_ad' : 'friendoo_offer',
    sponsorName: ad.sponsor_name ? asString(ad.sponsor_name) : null,
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
        supabase.from('calls').select('id', { count: 'exact', head: true }).in('status', ['ringing', 'accepted', 'active']).is('ended_at', null).gte('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString()),
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
      console.warn('getAdminStats error:', error)
      return {
        totalUsers: 0,
        totalHosts: 0,
        activeCalls: 0,
        todaysRevenueInr: 0,
        totalCoinsInCirculation: 0,
        pendingHostApplications: 0,
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
            city,
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
          city: asString(p.city, 'Mumbai'),
          languages: ['Hindi', 'English'],
          ratePerMinute: asNumber(h.rate_per_audio_minute, 5),
          hostStatus: asBoolean(p.is_banned) ? 'suspended' : 'approved',
          isHost: true,
          avatarSeed: '',
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
      console.warn('listHosts error:', error)
      return []
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
  const displayName = asString(payload.displayName, 'New Host')
  const phone = asString(payload.phoneNumber || payload.phone)

  let id: string
  if (phone) {
    let cleanPhone = phone.trim()
    if (!cleanPhone.startsWith('+')) cleanPhone = '+91' + cleanPhone.replace(/^0+/, '')
    const { data: existingProfile } = await supabase.from('profiles').select('id').eq('phone', cleanPhone).maybeSingle()
    if (existingProfile?.id) {
      id = existingProfile.id
    } else {
      const { data: authUser } = await supabase.auth.admin.createUser({
        phone: cleanPhone,
        phone_confirm: true,
        user_metadata: { display_name: displayName, role: 'host' },
      })
      if (authUser?.user?.id) {
        id = authUser.user.id
      } else {
        const { data: listData } = await supabase.auth.admin.listUsers()
        const found = listData?.users?.find(u => u.phone === cleanPhone)
        if (found?.id) {
          id = found.id
        } else {
          const fallbackEmail = `host_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@friendoo.internal`
          const { data: fallbackUser } = await supabase.auth.admin.createUser({
            email: fallbackEmail,
            email_confirm: true,
            user_metadata: { display_name: displayName, role: 'host' },
          })
          id = fallbackUser?.user?.id || crypto.randomUUID()
        }
      }
    }
  } else {
    const fallbackEmail = `host_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@friendoo.internal`
    const { data: fallbackUser } = await supabase.auth.admin.createUser({
      email: fallbackEmail,
      email_confirm: true,
      user_metadata: { display_name: displayName, role: 'host' },
    })
    id = fallbackUser?.user?.id || crypto.randomUUID()
  }

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
    rate_per_audio_minute: asNumber(payload.ratePerMinute, 5),
    rate_per_video_minute: asNumber(payload.ratePerMinute, 5) * 2,
    is_available: true,
    updated_at: new Date().toISOString(),
  })

  const langs = (Array.isArray(payload.languages) && payload.languages.length > 0) ? payload.languages : ['Hindi', 'English'];
  await supabase.from('host_languages').delete().eq('host_id', id);
  await supabase.from('host_languages').insert(
    langs.map((l: string, idx: number) => ({ host_id: id, language_code: l, is_primary: idx === 0 }))
  );

  invalidateCache('admin:hosts')
  invalidateCache('admin:stats')
  return { id }
}

export async function updateHost(hostId: string, payload: Record<string, unknown>) {
  const supabase = getSupabaseAdmin()
  const updates = (payload.updates && typeof payload.updates === 'object' ? payload.updates : payload) as Record<string, unknown>
  const action = typeof payload.action === 'string' ? payload.action : undefined

  if (action === 'suspend') {
    await supabase.from('profiles').update({ is_banned: true, updated_at: new Date().toISOString() }).eq('id', hostId)
    await supabase.from('hosts').update({ is_available: false, updated_at: new Date().toISOString() }).eq('id', hostId)
  } else if (action === 'restore') {
    await supabase.from('profiles').update({ is_banned: false, updated_at: new Date().toISOString() }).eq('id', hostId)
    await supabase.from('hosts').update({ is_available: true, updated_at: new Date().toISOString() }).eq('id', hostId)
  }

  if (updates.displayName || updates.bio || updates.photoURL || updates.phoneNumber) {
    await supabase.from('profiles').update({
      display_name: updates.displayName ? String(updates.displayName) : undefined,
      phone: updates.phoneNumber ? String(updates.phoneNumber) : undefined,
      avatar_path: updates.photoURL ? String(updates.photoURL) : undefined,
      about: updates.bio ? String(updates.bio) : undefined,
      updated_at: new Date().toISOString(),
    }).eq('id', hostId)
  }

  if (updates.ratePerMinute !== undefined || updates.bio !== undefined || updates.isAvailable !== undefined) {
    await supabase.from('hosts').update({
      rate_per_audio_minute: updates.ratePerMinute !== undefined ? asNumber(updates.ratePerMinute) : undefined,
      bio: updates.bio ? String(updates.bio) : undefined,
      is_available: updates.isAvailable !== undefined ? Boolean(updates.isAvailable) : undefined,
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

      return (data ?? []).map(row => {
        const payload = (row.submitted_payload && typeof row.submitted_payload === 'object') ? row.submitted_payload as Record<string, unknown> : {}
        return {
          id: row.id,
          name: asString(row.display_name, 'Unknown Applicant'),
          phone: asString(row.phone),
          age: typeof payload.age === 'number' ? payload.age : (parseInt(String(payload.age || ''), 10) || 22),
          city: asString(row.city || payload.city, 'Not specified'),
          language: Array.isArray(row.languages) ? row.languages.join(', ') : 'Hindi',
          about: asString(row.bio),
          photoURL: '',
          idProofUrl: null,
          status: asString(row.status, 'pending') as HostApplicationRecord['status'],
          notes: asString(row.review_note),
          submittedAt: toIsoString(row.created_at),
          reviewedAt: toIsoString(row.reviewed_at),
          payoutType: (payload.payout_type === 'bank' ? 'bank' : 'upi') as 'upi' | 'bank',
          payoutDetails: (payload.payout_details && typeof payload.payout_details === 'object') ? payload.payout_details as Record<string, unknown> : {},
        }
      })
    } catch (error) {
      console.warn('listHostApplications error:', error)
      return []
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

  let profileId = application.application_profile_id
  if (!profileId) {
    const phone = application.phone
    if (phone) {
      const { data: ex } = await supabase.from('profiles').select('id').eq('phone', phone).maybeSingle()
      if (ex?.id) {
        profileId = ex.id
      } else {
        const { data: authUser } = await supabase.auth.admin.createUser({
          phone,
          phone_confirm: true,
          user_metadata: { display_name: application.display_name, role: 'host' }
        })
        if (authUser?.user?.id) {
          profileId = authUser.user.id
        } else {
          const { data: listData } = await supabase.auth.admin.listUsers()
          const found = listData?.users?.find(u => u.phone === phone)
          if (found?.id) profileId = found.id
        }
      }
    }
    if (!profileId) {
      const fallbackEmail = `host_app_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@friendoo.internal`
      const { data: authUser } = await supabase.auth.admin.createUser({
        email: fallbackEmail,
        email_confirm: true,
        user_metadata: { display_name: application.display_name, role: 'host' }
      })
      profileId = authUser?.user?.id || crypto.randomUUID()
    }
  }

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
    rate_per_audio_minute: 5,
    rate_per_video_minute: 10,
    is_available: true,
    updated_at: new Date().toISOString(),
  })

  const appLangs = (Array.isArray(application.languages) && application.languages.length > 0) ? application.languages : ['Hindi', 'English'];
  await supabase.from('host_languages').delete().eq('host_id', profileId);
  await supabase.from('host_languages').insert(
    appLangs.map((l: string, idx: number) => ({ host_id: profileId, language_code: l, is_primary: idx === 0 }))
  );

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
      const [profilesRes, hostsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select(`
            id,
            display_name,
            phone,
            avatar_path,
            city,
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
          .limit(500),
        supabase.from('hosts').select('id'),
      ])

      if (profilesRes.error) throw profilesRes.error
      const hostIdSet = new Set((hostsRes.data ?? []).map((h) => h.id))
      const profiles = (profilesRes.data ?? []).filter(
        (p) => p.role !== 'host' && !hostIdSet.has(p.id)
      )

      const userIds = profiles.map(p => p.id)

      // Fetch live presence from user_presence
      const presenceMap = new Map<string, { state: string; last_seen_at: string | null }>()
      if (userIds.length > 0) {
        try {
          const { data: presences } = await supabase
            .from('user_presence')
            .select('user_id, state, last_seen_at')
            .in('user_id', userIds)
          ;(presences ?? []).forEach((p) => {
            if (p.user_id) {
              presenceMap.set(p.user_id, {
                state: String(p.state || 'offline').toLowerCase(),
                last_seen_at: toIsoString(p.last_seen_at),
              })
            }
          })
        } catch (_) {}
      }

      // Fetch caller stats from calls table
      const callsCountMap = new Map<string, { totalCalls: number; totalCoinsSpent: number }>()
      if (userIds.length > 0) {
        try {
          const { data: callsData } = await supabase
            .from('calls')
            .select('caller_id, total_coins_deducted')
            .in('caller_id', userIds)
          ;(callsData ?? []).forEach((c) => {
            if (c.caller_id) {
              const current = callsCountMap.get(c.caller_id) ?? { totalCalls: 0, totalCoinsSpent: 0 }
              current.totalCalls += 1
              current.totalCoinsSpent += asNumber(c.total_coins_deducted, 0)
              callsCountMap.set(c.caller_id, current)
            }
          })
        } catch (_) {}
      }

      return (profiles ?? []).map(p => {
        const wallet = (Array.isArray(p.wallets) ? p.wallets[0] : p.wallets) as Record<string, unknown> | null ?? {}
        const presence = presenceMap.get(p.id)
        const stats = callsCountMap.get(p.id) ?? { totalCalls: 0, totalCoinsSpent: 0 }

        let isOnline = false
        if (presence?.last_seen_at) {
          const diffSec = (Date.now() - new Date(presence.last_seen_at).getTime()) / 1000
          isOnline = presence.state === 'online' && diffSec < 90
        }

        return {
          id: p.id,
          displayName: asString(p.display_name, 'Friendoo User'),
          username: asString(p.phone, 'user'),
          phoneNumber: asString(p.phone),
          avatarSeed: '',
          photoURL: asString(p.avatar_path),
          city: asString(p.city, '—'),
          coinBalance: asNumber(wallet.coin_balance, 0),
          status: asBoolean(p.is_banned) ? 'banned' : 'active',
          joinedAt: toIsoString(p.created_at),
          createdAt: toIsoString(p.created_at),
          isOnline,
          lastSeenAt: presence?.last_seen_at ?? null,
          totalCalls: stats.totalCalls,
          totalSpentCoins: stats.totalCoinsSpent,
          role: asString(p.role, 'user'),
        }
      })
    } catch (error) {
      console.warn('listUsers error:', error)
      return []
    }
  }, 10)
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
      console.warn('listPackages error:', error)
      return []
    }
  }, 60)
}

export async function upsertPackage(payload: Partial<CoinPackageRecord> & { id?: string }) {
  const supabase = getSupabaseAdmin()
  const coins = Math.max(1, Math.round(asNumber(payload.coins, 100)))
  const id = payload.id || `pkg_${coins}`
  const { error } = await supabase.from('coin_packages').upsert({
    id,
    coins,
    amount_inr: Math.max(1, Math.round(asNumber(payload.priceInr, 99))),
    is_active: payload.active ?? true,
    created_at: new Date().toISOString(),
  })
  if (error) throw error
  invalidateCache('admin:packages')
  return { id }
}

export async function deletePackage(packageId: string) {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from('coin_packages').delete().eq('id', packageId)
  if (error) {
    if (error.code === '23503') {
      // Foreign key constraint: orders reference this package. Deactivate instead.
      await supabase.from('coin_packages').update({ is_active: false }).eq('id', packageId)
      invalidateCache('admin:packages')
      return { deactivated: true, message: 'Package has order history; deactivated instead of deleting.' }
    }
    throw error
  }
  invalidateCache('admin:packages')
  return { deleted: true }
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
      console.warn('listTransactions error:', error)
      return []
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
        const isStale = !c.ended_at && c.created_at && (Date.now() - new Date(c.created_at).getTime() > 30 * 60 * 1000)
        const hasEnded = Boolean(c.ended_at) || isStale

        let durationSeconds = 0
        if (c.started_at && c.ended_at) {
          durationSeconds = Math.max(0, Math.round((new Date(c.ended_at).getTime() - new Date(c.started_at).getTime()) / 1000))
        } else if (c.started_at && (c.status === 'active' || c.status === 'accepted') && !hasEnded) {
          durationSeconds = Math.max(0, Math.round((Date.now() - new Date(c.started_at).getTime()) / 1000))
        } else if (c.started_at) {
          durationSeconds = 60
        }

        const callerProfile = c.caller_id ? profileMap.get(c.caller_id) : null
        const hostProfile = c.host_id ? profileMap.get(c.host_id) : null

        const rawStatus = (c.status ?? 'missed').toLowerCase()
        const normalizedStatus: CallStatus =
          hasEnded
            ? 'ended'
            : rawStatus === 'active' || rawStatus === 'accepted'
            ? 'active'
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
      console.warn('listCalls error:', error)
      return []
    }
  }, 15)
}

export async function getAppSettings(): Promise<AppSettingsRecord> {
  return getCachedOrFetch('admin:settings', async () => {
    try {
      const supabase = getSupabaseAdmin()
      const [{ data: adminDoc }, { data: remoteDoc }] = await Promise.all([
        supabase.from('crm_configuration_documents').select('payload, updated_at').eq('id', 'app_settings').maybeSingle(),
        supabase.from('crm_configuration_documents').select('payload, updated_at').eq('id', 'app_remote_config').maybeSingle(),
      ])

      const p = (adminDoc?.payload as Record<string, unknown>) ?? {}
      const r = (remoteDoc?.payload as Record<string, unknown>) ?? {}

      const maintenanceMode = p.maintenanceMode !== undefined ? asBoolean(p.maintenanceMode) : asBoolean(r.maintenance_mode, false)

      return {
        welcomeBonusCoins: asNumber(p.welcomeBonusCoins, 50),
        minCoinBalanceToStartCall: asNumber(p.minCoinBalanceToStartCall, 20),
        maxCallDurationMinutes: asNumber(p.maxCallDurationMinutes, 60),
        maintenanceMode,
        updatedAt: toIsoString(adminDoc?.updated_at || remoteDoc?.updated_at),
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

  const p = payload as unknown as Record<string, unknown>
  const maintenanceMode = asBoolean(p.maintenanceMode, false)
  const welcomeBonusCoins = asNumber(p.welcomeBonusCoins, 50)
  const minCoinBalanceToStartCall = asNumber(p.minCoinBalanceToStartCall, 20)
  const maxCallDurationMinutes = asNumber(p.maxCallDurationMinutes, 60)

  // 1. Save to app_settings for Admin Panel
  await supabase.from('crm_configuration_documents').upsert({
    id: 'app_settings',
    payload: {
      welcomeBonusCoins,
      minCoinBalanceToStartCall,
      maxCallDurationMinutes,
      maintenanceMode,
    },
    updated_by: actorId,
    updated_at: new Date().toISOString(),
  })

  // 2. Synchronize to app_remote_config for the Flutter app
  const { data: existingRemote } = await supabase
    .from('crm_configuration_documents')
    .select('payload')
    .eq('id', 'app_remote_config')
    .maybeSingle()

  const existingPayload = (existingRemote?.payload as Record<string, unknown>) ?? {}

  await supabase.from('crm_configuration_documents').upsert({
    id: 'app_remote_config',
    payload: {
      ...existingPayload,
      maintenance_mode: maintenanceMode,
      maintenance_message: maintenanceMode ? 'Platform maintenance in progress. Please check back shortly.' : null,
      enable_flash_sales: existingPayload.enable_flash_sales ?? true,
      support_phone: existingPayload.support_phone ?? '+919999999999',
      min_app_version: existingPayload.min_app_version ?? '1.0.0',
      dynamic_theme_color_hex: existingPayload.dynamic_theme_color_hex ?? '#8B5CF6',
    },
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
          amount_paise,
          upi_id,
          status,
          provider,
          provider_transfer_id,
          provider_reference_id,
          failure_reason,
          review_note,
          created_at,
          reviewed_at,
          hosts (
            profiles (
              display_name,
              phone
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data ?? []).map(p => {
        const hostProfile = (p.hosts as { profiles?: { display_name?: string; phone?: string } | { display_name?: string; phone?: string }[] } | null)?.profiles
        const pr = (Array.isArray(hostProfile) ? hostProfile[0] : hostProfile) ?? {}
        const amountInr = Number(p.amount_paise || 0) / 100
        return {
          id: p.id,
          hostId: p.host_id,
          hostName: asString(pr.display_name, 'Unknown Host'),
          amount: amountInr,
          upiId: asString(p.upi_id, 'Stored on file'),
          status: asString(p.status, 'pending') as WithdrawalRecord['status'],
          requestedAt: toIsoString(p.created_at),
          processedAt: toIsoString(p.reviewed_at),
          failureReason: asString(p.failure_reason),
          adminNote: asString(p.review_note),
          provider: asString(p.provider),
          providerTransferId: asString(p.provider_transfer_id),
          cashfreeReferenceId: asString(p.provider_reference_id),
        }
      })
    } catch (error) {
      console.warn('listWithdrawals error:', error)
      return []
    }
  }, 15)
}

export async function getHost(hostId: string): Promise<AdminHost | null> {
  try {
    const supabase = getSupabaseAdmin()
    const [{ data: h, error: hError }, { data: p, error: pError }] = await Promise.all([
      supabase.from('hosts').select('*').eq('id', hostId).maybeSingle(),
      supabase.from('profiles').select('*').eq('id', hostId).maybeSingle(),
    ])

    if (hError || pError || !h || !p) return null

    const { count } = await supabase.from('calls').select('*', { count: 'exact', head: true }).eq('host_id', hostId)

    return {
      id: h.id,
      name: asString(p.display_name, 'Host'),
      displayName: asString(p.display_name, 'Host'),
      phoneNumber: asString(p.phone),
      city: asString(p.city, 'Mumbai'),
      languages: ['Hindi', 'English'],
      ratePerMinute: asNumber(h.rate_per_audio_minute, 5),
      hostStatus: asBoolean(p.is_banned) ? 'suspended' : 'approved',
      isHost: true,
      avatarSeed: h.id,
      photoURL: asString(p.avatar_path),
      idProofUrl: null,
      bio: asString(h.bio || p.about),
      gender: 'female',
      age: 24,
      callsMade: count || 0,
      coinsEarned: 0,
      createdAt: toIsoString(p.created_at || h.updated_at),
    }
  } catch (error) {
    console.warn('getHost error:', error)
    return null
  }
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
      console.warn('listBannerAds error:', error)
      return []
    }
  }, 10)
}

export async function upsertBannerAd(payload: Partial<BannerAdRecord>): Promise<BannerAdRecord | null> {
  const supabase = getSupabaseAdmin()
  const dbPayload = {
    title: payload.title,
    campaign_type: payload.campaignType ?? 'user_offer',
    campaign_class: payload.campaignClass ?? (payload.campaignType === 'sponsor_ad' || payload.sponsorName ? 'sponsored_ad' : 'friendoo_offer'),
    sponsor_name: payload.sponsorName ?? null,
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

