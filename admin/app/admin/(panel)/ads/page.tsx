'use client'

import { FormEvent, useEffect, useState } from 'react'
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

} from 'lucide-react'

type AdForm = {

  id?: string
  title: string
  campaignType: 'user_offer' | 'host_incentive' | 'flash_package' | 'sponsor_ad'
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
  { name: 'Host Flame Surge', colors: ['#D97706', '#F59E0B', '#EF4444'] },
  { name: 'Flash Deal Emerald', colors: ['#059669', '#10B981', '#06B6D4'] },
  { name: 'Cyber Purple VIP', colors: ['#7928CA', '#FF0080'] },
  { name: 'Midnight Gold', colors: ['#1E1B4B', '#4338CA', '#F59E0B'] },
]

const blankAd: AdForm = {
  title: '',
  campaignType: 'flash_package',
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
    setForm({
      id: item.id,
      title: item.title,
      campaignType: item.campaignType || 'user_offer',
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

  // Quick Preset Handlers for Admin Convenience
  const applyHostSurgeTemplate = () => {
    setForm({
      ...form,
      title: 'Host Peak Hour Surge (+₹10/Min)',
      campaignType: 'host_incentive',
      targetAudience: 'hosts',
      placement: 'host_top_banner',
      badgeText: 'PEAK HOUR SURGE • +₹10/MIN',
      headline: 'Earn 2X Extra from 8 PM - 11 PM! 🔥',
      subtitle: 'Surge traffic is active now. Go online to earn maximum payout.',
      gradientColors: ['#D97706', '#F59E0B', '#EF4444'],
      actionType: 'none',
      promoCoins: null,
      promoPriceInr: null,
      originalPriceInr: null,
      priority: 50,
      showAsPopup: false,
    })
  }

  const applyFlash50For39Template = () => {
    setForm({
      ...form,
      title: 'Flash Sale 50 Coins for ₹39',
      campaignType: 'flash_package',
      targetAudience: 'priority_users',
      placement: 'user_top_banner',
      badgeText: 'LIMITED FLASH • ₹39',
      headline: 'Get 50 Coins for Just ₹39! ⚡',
      subtitle: 'Exclusive discount package unlocked for you. Regular ₹49.',
      gradientColors: ['#4F46E5', '#7C3AED', '#DB2777'],
      actionType: 'recharge',
      promoCoins: 50,
      promoPriceInr: 39,
      originalPriceInr: 49,
      promoBonusLabel: '50 Coins for ₹39',
      priority: 100,
      showAsPopup: true,
    })
  }

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
            <span className="bento-badge border-purple-500/30 bg-purple-500/10 text-purple-300">
              Cloud Marketing & Surge Engine
            </span>
            <span className="bento-badge border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
              Live Realtime Sync
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white md:text-3xl">
            Promotions, Pop-ups & Host Surge
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Push top screen banners, user pop-up flash packages (e.g. 50 coins for ₹39), and host peak-hour incentives in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg transition hover:bg-purple-500"
          >
            <Plus className="h-4 w-4" />
            Create Campaign
          </button>
        </div>
      </div>

      {/* Metrics Bento Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bento-card relative overflow-hidden p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Active Campaigns</span>
            <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-white">{activeCount} / {ads.length}</div>
          <div className="mt-1 text-xs text-zinc-400">Pushed to live app clients</div>
        </div>

        <div className="bento-card relative overflow-hidden p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Total Views</span>
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
              <Eye className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-white">{totalImpressions.toLocaleString()}</div>
          <div className="mt-1 text-xs text-zinc-400">Top banners & pop-up impressions</div>
        </div>

        <div className="bento-card relative overflow-hidden p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Total Conversions / Taps</span>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
              <MousePointerClick className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-white">{totalClicks.toLocaleString()}</div>
          <div className="mt-1 text-xs text-zinc-400">Purchases & external clicks</div>
        </div>

        <div className="bento-card relative overflow-hidden p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Average CTR</span>
            <div className="rounded-lg bg-yellow-500/10 p-2 text-yellow-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-white">{avgCtr}%</div>
          <div className="mt-1 text-xs text-zinc-400">Overall conversion rate</div>
        </div>
      </div>

      {/* Main Campaign List Section */}
      <SectionCard title="Active Campaigns & Targeted Placements" description="Targeted by audience, screen position, and priority level.">
        {loading ? (
          <LoadingBlock rows={3} />
        ) : ads.length === 0 ? (
          <DataState title="No Campaigns Active" body="Create your first campaign to push top banners or host incentives." />
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {ads.map((ad) => {
              const bgGradient = ad.gradientColors && ad.gradientColors.length >= 2
                ? `linear-gradient(135deg, ${ad.gradientColors.join(', ')})`
                : 'linear-gradient(135deg, #4F46E5, #DB2777)'
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
                        {ad.showAsPopup && (
                          <span className="rounded-md bg-pink-500/20 px-2 py-0.5 text-[10px] font-bold text-pink-300">
                            POP-UP
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 flex items-center gap-2 text-xs text-zinc-400 flex-wrap">
                        <span className="flex items-center gap-1 text-purple-300 font-semibold">
                          <Target className="h-3 w-3" /> {ad.targetAudience}
                        </span>
                        <span>•</span>
                        <span>Placement: <strong className="text-zinc-200">{ad.placement}</strong></span>
                        <span>•</span>
                        <span>Priority: <strong className="text-yellow-400">{ad.priority}</strong></span>
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
                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                        }`}
                        title={ad.isActive ? 'Pause Campaign' : 'Activate Campaign'}
                      >
                        <Power className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEdit(ad)}
                        className="rounded-lg bg-zinc-800 p-2 text-zinc-300 hover:bg-zinc-700"
                        title="Edit Campaign"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteAd(ad)}
                        className="rounded-lg bg-red-500/10 p-2 text-red-400 hover:bg-red-500/20"
                        title="Delete Campaign"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Mobile Live Preview Card */}
                  <div className="rounded-2xl p-4 text-white shadow-lg relative overflow-hidden" style={{ background: bgGradient }}>
                    {ad.imageUrl && (
                      <div
                        className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay"
                        style={{ backgroundImage: `url(${ad.imageUrl})` }}
                      />
                    )}
                    <div className="relative z-10 space-y-1.5">
                      <div className="flex items-center justify-between">
                        {ad.badgeText && (
                          <div className="inline-block rounded-md bg-white/25 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
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
        title={form.id ? 'Edit Campaign & Deal' : 'Create Live Campaign'}
        description="Configure target audience, screen placement, flash package values, and priority."
      >
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-400">Quick Presets:</span>
          <button
            type="button"
            onClick={applyFlash50For39Template}
            className="inline-flex items-center gap-1 rounded-lg bg-purple-500/20 px-2.5 py-1 text-[11px] font-bold text-purple-300 hover:bg-purple-500/30"
          >
            <Zap className="h-3 w-3" /> 50 Coins for ₹39
          </button>
          <button
            type="button"
            onClick={applyHostSurgeTemplate}
            className="inline-flex items-center gap-1 rounded-lg bg-amber-500/20 px-2.5 py-1 text-[11px] font-bold text-amber-300 hover:bg-amber-500/30"
          >
            <Flame className="h-3 w-3" /> Host Peak Surge
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-300">Campaign Title</label>
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
                onChange={(e) => setForm({ ...form, campaignType: selectOption(e.target.value, campaignTypes, form.campaignType) })}
                className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="flash_package">⚡ Flash Package Deal</option>
                <option value="user_offer">🛍️ User Pop-up / Promo</option>
                <option value="host_incentive">🔥 Host Peak-Hour Surge</option>
                <option value="sponsor_ad">📢 3rd-Party Sponsor Ad</option>
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
              {gradientPresets.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => setForm({ ...form, gradientColors: preset.colors })}
                  className={`flex items-center gap-2 rounded-xl border p-2 text-left transition ${
                    JSON.stringify(form.gradientColors) === JSON.stringify(preset.colors)
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-white/5 bg-zinc-900 hover:border-white/20'
                  }`}
                >
                  <div
                    className="h-5 w-5 rounded-full shadow-sm"
                    style={{ background: `linear-gradient(135deg, ${preset.colors.join(', ')})` }}
                  />
                  <span className="text-[11px] font-semibold text-zinc-200">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-300">Tap Action</label>
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
              <label className="flex items-center gap-2 text-xs text-pink-300 cursor-pointer font-semibold">
                <input
                  type="checkbox"
                  checked={form.showAsPopup}
                  onChange={(e) => setForm({ ...form, showAsPopup: e.target.checked })}
                  className="rounded border-pink-700 bg-zinc-800 text-pink-600 focus:ring-0"
                />
                <span>Auto Pop-Up on Screen Enter</span>
              </label>
            </div>
          </div>

          {form.actionType === 'link' && (
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-300">Action URL</label>
              <input
                type="url"
                value={form.actionUrl || ''}
                onChange={(e) => setForm({ ...form, actionUrl: e.target.value })}
                placeholder="https://play.google.com/store/apps/details?id=..."
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
              style={{ background: `linear-gradient(135deg, ${form.gradientColors.join(', ')})` }}
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
                    <div className="inline-block rounded-md bg-white/25 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
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
