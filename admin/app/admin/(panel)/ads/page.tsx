'use client'

import { FormEvent, useEffect, useState, useMemo } from 'react'
import toast from 'react-hot-toast'
import SectionCard from '@/components/admin/SectionCard'
import LoadingBlock from '@/components/admin/LoadingBlock'
import DataState from '@/components/admin/DataState'
import SideSheet from '@/components/admin/SideSheet'
import Badge from '@/components/ui/Badge'
import { adminFetch } from '@/lib/admin/client'
import type { BannerAdRecord } from '@/lib/admin/types'
import { formatDateTime } from '@/lib/admin/format'
import {
  Sparkles,
  Eye,
  MousePointerClick,
  TrendingUp,
  Plus,
  Trash2,
  Edit3,
  Power,
  Flame,
  Zap,
  Target,
  Check,
  ExternalLink,
  Gift,
  Building2,
  Filter,
} from 'lucide-react'

type AdForm = {
  id?: string
  title: string
  campaignType: 'user_offer' | 'host_incentive' | 'flash_package' | 'sponsor_ad'
  campaignClass: 'friendoo_offer' | 'sponsored_ad'
  sponsorName?: string | null
  targetAudience: 'all' | 'users' | 'hosts' | 'new_users' | 'priority_users'
  badgeText: string
  headline: string
  subtitle: string
  imageUrl?: string | null
  gradientColors: string[]
  actionType: 'recharge' | 'link' | 'none'
  actionUrl?: string | null
  placement: 'user_top_banner' | 'host_top_banner' | 'account_settings' | 'pop_up_modal' | 'all'
  promoCoins?: number | null
  promoPriceInr?: number | null
  originalPriceInr?: number | null
  promoBonusLabel?: string | null
  showAsPopup: boolean
  isActive: boolean
  priority: number
}

const campaignTypes: readonly AdForm['campaignType'][] = ['user_offer', 'host_incentive', 'flash_package', 'sponsor_ad']
const targetAudiences: readonly AdForm['targetAudience'][] = ['all', 'users', 'hosts', 'new_users', 'priority_users']
const placements: readonly AdForm['placement'][] = ['user_top_banner', 'host_top_banner', 'account_settings', 'pop_up_modal', 'all']
const actionTypes: readonly AdForm['actionType'][] = ['recharge', 'link', 'none']

function selectOption<T extends string>(value: string, options: readonly T[], fallback: T): T {
  return options.find(option => option === value) ?? fallback
}

const gradientPresets = [
  { name: 'Indigo Dream (Default)', colors: ['#4F46E5', '#7C3AED', '#DB2777'] },
  { name: 'Dark Sponsor Luxe', colors: ['#161B26', '#1F293D', '#7C3AED'] },
  { name: 'Host Flame Surge', colors: ['#D97706', '#F59E0B', '#EF4444'] },
  { name: 'Flash Deal Emerald', colors: ['#059669', '#10B981', '#06B6D4'] },
  { name: 'Cyber Purple VIP', colors: ['#7928CA', '#FF0080'] },
  { name: 'Midnight Gold', colors: ['#1E1B4B', '#4338CA', '#F59E0B'] },
]

const blankAd: AdForm = {
  title: '',
  campaignType: 'flash_package',
  campaignClass: 'friendoo_offer',
  sponsorName: null,
  targetAudience: 'users',
  badgeText: 'FLASH DEAL • ₹39 ONLY',
  headline: '50 Coins for Just ₹39! ⚡',
  subtitle: 'Limited-time special deal for top callers today.',
  imageUrl: null,
  gradientColors: ['#4F46E5', '#7C3AED', '#DB2777'],
  actionType: 'recharge',
  actionUrl: null,
  placement: 'user_top_banner',
  promoCoins: 50,
  promoPriceInr: 39,
  originalPriceInr: 49,
  promoBonusLabel: '50 Coins for ₹39',
  showAsPopup: false,
  isActive: true,
  priority: 20,
}

export default function CloudAdsAdminPage() {
  const [ads, setAds] = useState<BannerAdRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [form, setForm] = useState<AdForm>(blankAd)
  const [saving, setSaving] = useState(false)
  const [activeFilter, setActiveFilter] = useState<'all' | 'offers' | 'sponsored' | 'flash' | 'hosts'>('all')

  const load = async () => {
    setLoading(true)
    try {
      const response = await adminFetch<{ ads: BannerAdRecord[] }>('/api/admin/ads/list')
      setAds(response.ads || [])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load campaigns')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [])

  const openCreate = () => {
    setForm(blankAd)
    setSheetOpen(true)
  }

  const openEdit = (item: BannerAdRecord) => {
    const isSpon = item.campaignClass === 'sponsored_ad' || item.campaignType === 'sponsor_ad' || Boolean(item.sponsorName)
    setForm({
      id: item.id,
      title: item.title,
      campaignType: item.campaignType || 'user_offer',
      campaignClass: isSpon ? 'sponsored_ad' : 'friendoo_offer',
      sponsorName: item.sponsorName || null,
      targetAudience: item.targetAudience || 'all',
      badgeText: item.badgeText,
      headline: item.headline,
      subtitle: item.subtitle,
      imageUrl: item.imageUrl,
      gradientColors: item.gradientColors,
      actionType: item.actionType,
      actionUrl: item.actionUrl,
      placement: item.placement || 'user_top_banner',
      promoCoins: item.promoCoins,
      promoPriceInr: item.promoPriceInr,
      originalPriceInr: item.originalPriceInr,
      promoBonusLabel: item.promoBonusLabel,
      showAsPopup: item.showAsPopup || false,
      isActive: item.isActive,
      priority: item.priority || 10,
    })
    setSheetOpen(true)
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    try {
      await adminFetch('/api/admin/ads/upsert', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      toast.success(form.id ? 'Campaign updated' : 'Campaign deployed to app in real-time!')
      setSheetOpen(false)
      setForm(blankAd)
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save campaign')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (item: BannerAdRecord) => {
    try {
      await adminFetch('/api/admin/ads/toggle', {
        method: 'POST',
        body: JSON.stringify({ adId: item.id, isActive: !item.isActive }),
      })
      toast.success(item.isActive ? 'Campaign paused' : 'Campaign activated')
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update campaign status')
    }
  }

  const deleteAd = async (item: BannerAdRecord) => {
    if (!confirm(`Are you sure you want to delete "${item.title}"?`)) return
    try {
      await adminFetch(`/api/admin/ads/${item.id}`, { method: 'DELETE' })
      toast.success('Campaign deleted')
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete campaign')
    }
  }

  // Quick Preset Handlers
  const applyFlash50For39Template = () => {
    setForm({
      ...form,
      title: 'Flash Sale 50 Coins for ₹39',
      campaignType: 'flash_package',
      campaignClass: 'friendoo_offer',
      sponsorName: null,
      targetAudience: 'priority_users',
      placement: 'user_top_banner',
      badgeText: 'LIMITED FLASH • ₹39',
      headline: 'Get 50 Coins for Just ₹39! ⚡',
      subtitle: 'Exclusive discount package unlocked for you. Regular ₹49.',
      gradientColors: ['#4F46E5', '#7C3AED', '#DB2777'],
      actionType: 'recharge',
      actionUrl: null,
      promoCoins: 50,
      promoPriceInr: 39,
      originalPriceInr: 49,
      promoBonusLabel: '50 Coins for ₹39',
      priority: 100,
      showAsPopup: false,
    })
  }

  const applyFirstRechargeBonusTemplate = () => {
    setForm({
      ...form,
      title: 'First Recharge 50% Bonus Coins',
      campaignType: 'user_offer',
      campaignClass: 'friendoo_offer',
      sponsorName: null,
      targetAudience: 'new_users',
      placement: 'user_top_banner',
      badgeText: 'SPECIAL OFFER • 50% BONUS',
      headline: 'Talk More, Connect Freely! 🎁',
      subtitle: 'Get up to 50% bonus coins on talk recharge packs today.',
      gradientColors: ['#4F46E5', '#7C3AED', '#DB2777'],
      actionType: 'recharge',
      actionUrl: null,
      promoCoins: 200,
      promoPriceInr: 99,
      originalPriceInr: 149,
      promoBonusLabel: '+100 Bonus Coins',
      priority: 80,
      showAsPopup: false,
    })
  }

  const applyHostSurgeTemplate = () => {
    setForm({
      ...form,
      title: 'Host Peak Hour Surge (+₹10/Min)',
      campaignType: 'host_incentive',
      campaignClass: 'friendoo_offer',
      sponsorName: null,
      targetAudience: 'hosts',
      placement: 'host_top_banner',
      badgeText: 'PEAK HOUR SURGE • +₹10/MIN',
      headline: 'Earn 2X Extra from 8 PM - 11 PM! 🔥',
      subtitle: 'Surge traffic is active now. Go online to earn maximum payout.',
      gradientColors: ['#D97706', '#F59E0B', '#EF4444'],
      actionType: 'none',
      actionUrl: null,
      promoCoins: null,
      promoPriceInr: null,
      originalPriceInr: null,
      priority: 50,
      showAsPopup: false,
    })
  }

  const applySponsoredTemplate = () => {
    setForm({
      ...form,
      title: 'Sponsored Partner Promotion',
      campaignType: 'sponsor_ad',
      campaignClass: 'sponsored_ad',
      sponsorName: 'Cashfree Payments',
      targetAudience: 'all',
      placement: 'user_top_banner',
      badgeText: 'SPONSORED • CASHFREE',
      headline: 'Exclusive Partner Offer for Friendoo',
      subtitle: 'Fast, secure UPI recharges directly in external browser.',
      gradientColors: ['#161B26', '#1F293D', '#7C3AED'],
      actionType: 'link',
      actionUrl: 'https://cashfree.com',
      promoCoins: null,
      promoPriceInr: null,
      originalPriceInr: null,
      priority: 60,
      showAsPopup: false,
    })
  }

  // Filtered ads
  const filteredAds = useMemo(() => {
    return ads.filter((ad) => {
      const isSpon = ad.campaignClass === 'sponsored_ad' || ad.campaignType === 'sponsor_ad' || Boolean(ad.sponsorName)
      if (activeFilter === 'offers') return !isSpon
      if (activeFilter === 'sponsored') return isSpon
      if (activeFilter === 'flash') return ad.campaignType === 'flash_package'
      if (activeFilter === 'hosts') return ad.campaignType === 'host_incentive' || ad.targetAudience === 'hosts'
      return true
    })
  }, [ads, activeFilter])

  // Aggregate metrics
  const totalImpressions = ads.reduce((acc, a) => acc + a.impressionCount, 0)
  const totalClicks = ads.reduce((acc, a) => acc + a.clickCount, 0)
  const activeCount = ads.filter((a) => a.isActive).length
  const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : '0.0'

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="bento-badge border-purple-500/30 bg-purple-500/10 text-purple-400">
              Cloud Marketing & Surge Engine
            </span>
            <span className="bento-badge border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              Live Realtime Sync
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white md:text-3xl">
            Cloud Ad Banners & Offers
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Easily create, customize, and push in-app coin offers, host surge banners, or third-party sponsored ads.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg transition hover:bg-purple-500"
          >
            <Plus className="h-4 w-4" />
            Create Ad Banner
          </button>
        </div>
      </div>

      {/* Metrics Bento Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bento-card relative overflow-hidden p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Active Campaigns</span>
            <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-white">{activeCount} / {ads.length}</div>
          <div className="mt-1 text-xs text-zinc-400">Pushed to live app clients</div>
        </div>

        <div className="bento-card relative overflow-hidden p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Total Views</span>
            <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
              <Eye className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-white">{totalImpressions.toLocaleString()}</div>
          <div className="mt-1 text-xs text-zinc-400">Top banners & pop-up impressions</div>
        </div>

        <div className="bento-card relative overflow-hidden p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Total Conversions & Taps</span>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
              <MousePointerClick className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-white">{totalClicks.toLocaleString()}</div>
          <div className="mt-1 text-xs text-zinc-400">Purchases & external clicks</div>
        </div>

        <div className="bento-card relative overflow-hidden p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Average CTR</span>
            <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-white">{avgCtr}%</div>
          <div className="mt-1 text-xs text-zinc-400">Overall conversion rate</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.08] pb-3">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 mr-2">
          <Filter className="h-3.5 w-3.5" /> Filter:
        </span>
        {[
          { key: 'all', label: `All (${ads.length})` },
          { key: 'offers', label: `🎁 Friendoo Offers (${ads.filter(a => !(a.campaignClass === 'sponsored_ad' || a.campaignType === 'sponsor_ad' || a.sponsorName)).length})` },
          { key: 'sponsored', label: `📢 Sponsored Ads (${ads.filter(a => a.campaignClass === 'sponsored_ad' || a.campaignType === 'sponsor_ad' || a.sponsorName).length})` },
          { key: 'flash', label: `⚡ Flash Deals (${ads.filter(a => a.campaignType === 'flash_package').length})` },
          { key: 'hosts', label: `🔥 Host Surge (${ads.filter(a => a.campaignType === 'host_incentive' || a.targetAudience === 'hosts').length})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key as typeof activeFilter)}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              activeFilter === tab.key
                ? 'bg-purple-600 text-white shadow-sm'
                : 'border border-white/10 bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Campaign List Section */}
      <SectionCard title="Active Campaigns & Targeted Placements" description="Targeted by audience, screen position, and priority level.">
        {loading ? (
          <LoadingBlock rows={3} />
        ) : filteredAds.length === 0 ? (
          <DataState title="No Campaigns Found" body="No campaigns match this category. Click '+ Create Ad Banner' to push one now." />
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredAds.map((ad) => {
              const isSpon = ad.campaignClass === 'sponsored_ad' || ad.campaignType === 'sponsor_ad' || Boolean(ad.sponsorName)
              const bgGradient = ad.gradientColors && ad.gradientColors.length >= 2
                ? `linear-gradient(135deg, ${ad.gradientColors.join(', ')})`
                : (isSpon ? 'linear-gradient(135deg, #161B26, #1F293D)' : 'linear-gradient(135deg, #4F46E5, #DB2777)')
              const ctr = ad.impressionCount > 0 ? ((ad.clickCount / ad.impressionCount) * 100).toFixed(1) : '0.0'

              return (
                <div key={ad.id} className="bento-card flex flex-col justify-between p-5 space-y-4 border border-white/5">
                  {/* Header info */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-white">{ad.title}</h3>
                        <Badge variant={ad.isActive ? 'success' : 'neutral'}>
                          {ad.isActive ? 'Active' : 'Paused'}
                        </Badge>
                        {isSpon && (
                          <span className="rounded-md border border-pink-500/30 bg-pink-500/20 px-2 py-0.5 text-[10px] font-bold text-pink-300">
                            SPONSORED
                          </span>
                        )}
                        {ad.showAsPopup && (
                          <span className="rounded-md bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-300">
                            POP-UP
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 flex items-center gap-2 text-xs text-zinc-400 flex-wrap">
                        {isSpon && ad.sponsorName && (
                          <>
                            <span className="text-pink-300 font-semibold flex items-center gap-1">
                              <Building2 className="h-3 w-3" /> {ad.sponsorName}
                            </span>
                            <span>•</span>
                          </>
                        )}
                        <span className="flex items-center gap-1 text-purple-400 font-semibold">
                          <Target className="h-3 w-3" /> {ad.targetAudience}
                        </span>
                        <span>•</span>
                        <span>Placement: <strong className="text-zinc-200">{ad.placement}</strong></span>
                        <span>•</span>
                        <span>Priority: <strong className="text-purple-400">{ad.priority}</strong></span>
                        {ad.promoPriceInr && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-400 font-bold">
                              ₹{ad.promoPriceInr} ({ad.promoCoins} Coins)
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => toggleActive(ad)}
                        className={`rounded-lg p-2 text-xs transition ${
                          ad.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                            : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                        }`}
                        title={ad.isActive ? 'Pause Campaign' : 'Activate Campaign'}
                      >
                        <Power className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEdit(ad)}
                        className="rounded-lg bg-white/5 p-2 text-zinc-400 hover:bg-white/10 hover:text-white transition"
                        title="Edit Campaign"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteAd(ad)}
                        className="rounded-lg bg-red-500/10 p-2 text-red-400 hover:bg-red-500/20 transition"
                        title="Delete Campaign"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Mobile Live Preview Card */}
                  <div
                    className="rounded-2xl p-4 text-white shadow-lg relative overflow-hidden"
                    style={{ background: bgGradient, border: isSpon ? '1px solid #262D40' : undefined }}
                  >
                    {ad.imageUrl && (
                      <div
                        className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay"
                        style={{ backgroundImage: `url(${ad.imageUrl})` }}
                      />
                    )}
                    <div className="relative z-10 space-y-1.5">
                      <div className="flex items-center justify-between">
                        {ad.badgeText && (
                          <div className={`inline-block rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                            isSpon ? 'bg-pink-500/30 border border-pink-500/40 text-pink-200' : 'bg-white/25 text-white'
                          }`}>
                            {ad.badgeText}
                          </div>
                        )}
                        {ad.promoPriceInr && (
                          <div className="rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-black text-white shadow">
                            ⚡ ₹{ad.promoPriceInr}
                          </div>
                        )}
                      </div>
                      <div className="text-base font-black tracking-tight">{ad.headline}</div>
                      <div className="text-xs font-medium text-white/90">{ad.subtitle}</div>
                      {ad.actionType === 'link' && ad.actionUrl && (
                        <div className="pt-1 flex items-center gap-1 text-[10px] text-zinc-300">
                          <ExternalLink className="h-3 w-3 text-pink-400" />
                          <span className="truncate max-w-[280px]">{ad.actionUrl}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stats footer */}
                  <div className="flex items-center justify-between border-t border-white/5 pt-3 text-xs text-zinc-400">
                    <div>Views: <span className="font-semibold text-zinc-200">{ad.impressionCount.toLocaleString()}</span></div>
                    <div>Clicks: <span className="font-semibold text-zinc-200">{ad.clickCount.toLocaleString()}</span></div>
                    <div>CTR: <span className="font-semibold text-emerald-400">{ctr}%</span></div>
                    <div>Updated: <span className="text-zinc-400">{formatDateTime(ad.updatedAt || ad.createdAt)}</span></div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </SectionCard>

      {/* Create / Edit SideSheet Drawer */}
      <SideSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={form.id ? 'Edit Campaign & Deal' : 'Create Live Ad Banner'}
        description="Choose a quick preset or configure custom audience, pricing, and placement."
      >
        <div className="mb-5 space-y-2">
          <div className="text-xs font-semibold text-zinc-400">1-Click Quick Presets:</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={applyFlash50For39Template}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 p-2 text-xs font-medium text-zinc-300 hover:bg-white/10 hover:text-white transition"
            >
              <Zap className="h-3.5 w-3.5 text-yellow-400 shrink-0" />
              <span className="truncate">⚡ 50 Coins for ₹39</span>
            </button>
            <button
              type="button"
              onClick={applyFirstRechargeBonusTemplate}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 p-2 text-xs font-medium text-zinc-300 hover:bg-white/10 hover:text-white transition"
            >
              <Gift className="h-3.5 w-3.5 text-purple-400 shrink-0" />
              <span className="truncate">🎁 50% Bonus Offer</span>
            </button>
            <button
              type="button"
              onClick={applyHostSurgeTemplate}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 p-2 text-xs font-medium text-zinc-300 hover:bg-white/10 hover:text-white transition"
            >
              <Flame className="h-3.5 w-3.5 text-orange-400 shrink-0" />
              <span className="truncate">🔥 Host Peak Surge</span>
            </button>
            <button
              type="button"
              onClick={applySponsoredTemplate}
              className="inline-flex items-center gap-1.5 rounded-lg border border-pink-500/30 bg-pink-500/10 p-2 text-xs font-medium text-pink-300 hover:bg-pink-500/20 hover:text-white transition"
            >
              <Building2 className="h-3.5 w-3.5 text-pink-400 shrink-0" />
              <span className="truncate">📢 Sponsored Ad</span>
            </button>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-300">Campaign Title</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Flash 50 Coins for ₹39 for New Callers"
              className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-300">Campaign Type</label>
              <select
                value={form.campaignType}
                onChange={(e) => {
                  const val = selectOption(e.target.value, campaignTypes, form.campaignType)
                  const isSpon = val === 'sponsor_ad'
                  setForm({
                    ...form,
                    campaignType: val,
                    campaignClass: isSpon ? 'sponsored_ad' : 'friendoo_offer',
                    badgeText: isSpon ? 'SPONSORED' : (val === 'flash_package' ? 'FLASH DEAL • ₹39' : form.badgeText),
                    actionType: isSpon ? 'link' : (val === 'host_incentive' ? 'none' : 'recharge'),
                  })
                }}
                className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="flash_package">⚡ Flash Package Deal</option>
                <option value="user_offer">🛍️ User Recharge Promo</option>
                <option value="host_incentive">🔥 Host Peak-Hour Surge</option>
                <option value="sponsor_ad">📢 3rd-Party Sponsored Ad</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-300">Target Audience</label>
              <select
                value={form.targetAudience}
                onChange={(e) => setForm({ ...form, targetAudience: selectOption(e.target.value, targetAudiences, form.targetAudience) })}
                className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="all">🌍 All Users & Hosts</option>
                <option value="users">👤 Callers / Users Only</option>
                <option value="hosts">🎙️ Hosts Only</option>
                <option value="priority_users">⭐ Priority / Selective Users</option>
                <option value="new_users">🆕 New Users (First Recharge)</option>
              </select>
            </div>
          </div>

          {/* Sponsored Partner Details */}
          {form.campaignType === 'sponsor_ad' && (
            <div className="rounded-xl border border-pink-500/30 bg-pink-500/10 p-3 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-pink-300">
                <Building2 className="h-3.5 w-3.5" /> Sponsor & Advertiser Details
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-zinc-300">Advertiser / Company Name</label>
                <input
                  type="text"
                  required
                  value={form.sponsorName || ''}
                  onChange={(e) => {
                    const name = e.target.value
                    setForm({
                      ...form,
                      sponsorName: name,
                      badgeText: name.trim() ? `SPONSORED • ${name.trim().toUpperCase()}` : 'SPONSORED',
                    })
                  }}
                  placeholder="e.g. Cashfree Payments / Spotify / Swiggy"
                  className="w-full rounded-lg border border-white/10 bg-zinc-900 px-2.5 py-1.5 text-xs text-white focus:border-pink-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-300">Screen Placement</label>
              <select
                value={form.placement}
                onChange={(e) => setForm({ ...form, placement: selectOption(e.target.value, placements, form.placement) })}
                className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="user_top_banner">🔝 Top Banner (User Discover)</option>
                <option value="host_top_banner">🔝 Top Banner (Host Lounge)</option>
                <option value="pop_up_modal">🪟 Pop-Up Flash Modal</option>
                <option value="account_settings">⚙️ Account & Settings Banner</option>
                <option value="all">🌟 All Screens</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-300">Priority Level (1 - 100)</label>
              <input
                type="number"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
                className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Flash Package Deal Settings */}
          {form.campaignType === 'flash_package' && (
            <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-3 space-y-3">
              <div className="flex items-center gap-1 text-xs font-bold text-purple-300">
                <Zap className="h-3.5 w-3.5" /> Temporary Package Value Override
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="mb-1 block text-[11px] text-zinc-300">Coins Amount</label>
                  <input
                    type="number"
                    value={form.promoCoins || ''}
                    onChange={(e) => setForm({ ...form, promoCoins: Number(e.target.value) })}
                    placeholder="e.g. 50"
                    className="w-full rounded-lg border border-white/10 bg-zinc-900 px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-zinc-300">Offer Price (₹)</label>
                  <input
                    type="number"
                    value={form.promoPriceInr || ''}
                    onChange={(e) => setForm({ ...form, promoPriceInr: Number(e.target.value) })}
                    placeholder="e.g. 39"
                    className="w-full rounded-lg border border-white/10 bg-zinc-900 px-2.5 py-1.5 text-xs text-emerald-400 font-bold"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-zinc-300">Original Price (₹)</label>
                  <input
                    type="number"
                    value={form.originalPriceInr || ''}
                    onChange={(e) => setForm({ ...form, originalPriceInr: Number(e.target.value) })}
                    placeholder="e.g. 49"
                    className="w-full rounded-lg border border-white/10 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-400 line-through"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-300">Badge Tag</label>
            <input
              type="text"
              value={form.badgeText}
              onChange={(e) => setForm({ ...form, badgeText: e.target.value })}
              placeholder="e.g. FLASH DEAL • ₹39 ONLY"
              className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-300">Headline</label>
            <input
              type="text"
              required
              value={form.headline}
              onChange={(e) => setForm({ ...form, headline: e.target.value })}
              placeholder="e.g. 50 Coins for Just ₹39! ⚡"
              className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-300">Subtitle / Description</label>
            <textarea
              required
              rows={2}
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              placeholder="e.g. Limited-time introductory talk offer for priority callers."
              className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-300">Color Gradient Theme</label>
            <div className="grid grid-cols-2 gap-2">
              {gradientPresets.map((preset) => {
                const isSelected = JSON.stringify(form.gradientColors) === JSON.stringify(preset.colors)
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setForm({ ...form, gradientColors: preset.colors })}
                    className={`flex items-center justify-between rounded-xl border p-2.5 text-left transition ${
                      isSelected
                        ? 'border-purple-500 bg-purple-500/10 text-white shadow-sm'
                        : 'border-white/10 bg-zinc-900 text-zinc-300 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="h-3.5 w-3.5 shrink-0 rounded-full border border-white/20 shadow-sm"
                        style={{ background: `linear-gradient(135deg, ${preset.colors.join(', ')})` }}
                      />
                      <span className="text-xs font-medium truncate">{preset.name}</span>
                    </div>
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-300">Tap Action</label>
              <select
                value={form.actionType}
                onChange={(e) => setForm({ ...form, actionType: selectOption(e.target.value, actionTypes, form.actionType) })}
                className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="recharge">Open Coin Recharge Sheet</option>
                <option value="link">Open External URL / Link</option>
                <option value="none">No Click Action (Display Only)</option>
              </select>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={form.showAsPopup}
                  onChange={(e) => setForm({ ...form, showAsPopup: e.target.checked })}
                  className="rounded border-zinc-700 bg-zinc-800 text-purple-600 focus:ring-0"
                />
                <span>Auto Pop-Up on Screen Enter</span>
              </label>
            </div>
          </div>

          {form.actionType === 'link' && (
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-300">External Action URL</label>
              <input
                type="url"
                required
                value={form.actionUrl || ''}
                onChange={(e) => setForm({ ...form, actionUrl: e.target.value })}
                placeholder="https://example.com/promo or https://partner.com"
                className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-purple-500 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-300">Optional Banner Graphic URL</label>
            <input
              type="url"
              value={form.imageUrl || ''}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value || null })}
              placeholder="https://..."
              className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-purple-500 focus:outline-none"
            />
          </div>

          {/* Live Mobile Card Preview */}
          <div className="pt-2">
            <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-400">Mobile Live Preview</div>
            <div
              className="rounded-2xl p-4 text-white shadow-xl relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${form.gradientColors.join(', ')})`,
                border: form.campaignClass === 'sponsored_ad' ? '1px solid #262D40' : undefined,
              }}
            >
              {form.imageUrl && (
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay"
                  style={{ backgroundImage: `url(${form.imageUrl})` }}
                />
              )}
              <div className="relative z-10 space-y-1.5">
                <div className="flex items-center justify-between">
                  {form.badgeText && (
                    <div className={`inline-block rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                      form.campaignClass === 'sponsored_ad' ? 'bg-pink-500/30 border border-pink-500/40 text-pink-200' : 'bg-white/25 text-white'
                    }`}>
                      {form.badgeText}
                    </div>
                  )}
                  {form.promoPriceInr && (
                    <div className="rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-black text-white shadow">
                      ⚡ ₹{form.promoPriceInr}
                    </div>
                  )}
                </div>
                <div className="text-base font-black tracking-tight">{form.headline || 'Your Headline Here'}</div>
                <div className="text-xs font-medium text-white/90">{form.subtitle || 'Your offer description will appear here...'}</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-4">
            <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="rounded border-zinc-700 bg-zinc-800 text-purple-600 focus:ring-0"
              />
              <span>Deploy as Active Campaign</span>
            </label>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-purple-500 disabled:opacity-50"
            >
              {saving ? 'Saving...' : form.id ? 'Save Changes' : 'Deploy Campaign'}
            </button>
          </div>
        </form>
      </SideSheet>
    </div>
  )
}
