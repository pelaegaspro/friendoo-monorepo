'use client'

import { FormEvent, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import SectionCard from '@/components/admin/SectionCard'
import LoadingBlock from '@/components/admin/LoadingBlock'
import { adminFetch } from '@/lib/admin/client'
import type { AppSettingsRecord } from '@/lib/admin/types'
import { formatDateTime } from '@/lib/admin/format'
import {
  Sliders,
  PhoneCall,
  CreditCard,
  ShieldCheck,
  Tv,
  Lock,
  Workflow,
  Send,
  ExternalLink,
  Layers,
  ArrowRight,
  CheckCircle2,
  Mail,
  FileSpreadsheet,
  MessageSquare,
} from 'lucide-react'

const defaultSettings: AppSettingsRecord = {
  welcomeBonusCoins: 50,
  minCoinBalanceToStartCall: 20,
  maxCallDurationMinutes: 60,
  maintenanceMode: false,
  updatedAt: null,
}

export default function SettingsAdminPage() {
  const [settings, setSettings] = useState<AppSettingsRecord>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Make.com Automation States
  const [makeWebhookUrl, setMakeWebhookUrl] = useState('')
  const [testingRoute1, setTestingRoute1] = useState(false)
  const [testingRoute2, setTestingRoute2] = useState(false)
  const [lastTestResult, setLastTestResult] = useState<{
    success: boolean
    event: string
    timestamp: string
    message: string
  } | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const nextSettings = await adminFetch<AppSettingsRecord>('/api/admin/settings')
      if (nextSettings && typeof nextSettings === 'object') {
        const raw = nextSettings as unknown as Record<string, unknown>
        setSettings({
          welcomeBonusCoins: Number(nextSettings.welcomeBonusCoins ?? raw.welcome_bonus_coins ?? 50),
          minCoinBalanceToStartCall: Number(nextSettings.minCoinBalanceToStartCall ?? raw.min_coin_balance_to_start_call ?? 20),
          maxCallDurationMinutes: Number(nextSettings.maxCallDurationMinutes ?? raw.max_call_duration_minutes ?? 60),
          maintenanceMode: Boolean(nextSettings.maintenanceMode ?? raw.maintenance_mode ?? false),
          updatedAt: (nextSettings.updatedAt ?? null) as string | null,
        })
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void Promise.resolve().then(load)
  }, [])

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    try {
      await adminFetch('/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify(settings),
      })
      toast.success('App configuration synchronized')
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const triggerTestAutomation = async (routeType: 'host.applied' | 'payment.completed') => {
    if (routeType === 'host.applied') setTestingRoute1(true)
    if (routeType === 'payment.completed') setTestingRoute2(true)

    try {
      const res = await adminFetch<{
        ok: boolean
        eventSent: { event: string }
        dispatcherResult: { success: boolean; message?: string }
      }>('/api/admin/automation/test', {
        method: 'POST',
        body: JSON.stringify({
          routeType,
          customWebhookUrl: makeWebhookUrl.trim() || undefined,
        }),
      })

      if (res.ok) {
        toast.success(`Dispatched ${routeType} test event to Make.com!`)
        setLastTestResult({
          success: true,
          event: routeType,
          timestamp: new Date().toLocaleTimeString(),
          message: 'Received 200 OK by Make.com automation hook',
        })
      } else {
        toast.error(res.dispatcherResult?.message || 'Webhook rejected or unconfigured')
        setLastTestResult({
          success: false,
          event: routeType,
          timestamp: new Date().toLocaleTimeString(),
          message: res.dispatcherResult?.message || 'Failed delivery',
        })
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Automation test failed')
    } finally {
      setTestingRoute1(false)
      setTestingRoute2(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 4K Glassy Page Header */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#071821]/60 p-6 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[#60CECA]/10 blur-3xl"></div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="h-2 w-2 rounded-full bg-[#2FE5A7] shadow-[0_0_8px_#2FE5A7]"></span>
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#60CECA]">
                System Architecture & Governance
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Control Desk, Gateways & Automations
            </h1>
            <p className="mt-1 text-xs text-[#8BA3AB]">
              Operational rules, audio WebRTC gateways, Make.com triggers, and encrypted payment infrastructure.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#05131A]/80 px-3.5 py-2 text-xs text-[#D7E3E7] backdrop-blur-md">
              <Lock className="h-3.5 w-3.5 text-[#2FE5A7]" />
              <span>
                Vault: <strong className="text-white font-mono">Server Envs (.env.local)</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingBlock rows={5} />
      ) : (
        <>
          {/* Make.com & Google Automations Engine (Prominent Card) */}
          <SectionCard
            icon={<Workflow className="h-5 w-5" />}
            title="Make.com & Google Automations Engine"
            badge="Live Router"
            description="Automatic event streaming to Google Sheets, Gmail notifications, and Telegram alerts."
          >
            <div className="space-y-5">
              {/* Visual Pipeline Topology */}
              <div className="rounded-xl border border-white/[0.08] bg-[#05131A]/80 p-4.5 backdrop-blur-md">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#60CECA]">
                  Automated Pipeline Architecture
                </p>
                
                <div className="grid gap-3 lg:grid-cols-2">
                  {/* Route 1 Block */}
                  <div className="rounded-xl border border-[#60CECA]/20 bg-[#071F29]/50 p-3.5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-[#60CECA]"></span>
                        Route 1: <code className="text-[#60CECA] font-mono">host.applied</code>
                      </span>
                      <span className="text-[10px] uppercase font-mono text-[#8BA3AB]">Host Onboarding</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#C2DDE4] pt-1">
                      <div className="flex items-center gap-1 bg-[#092B38] px-2 py-1 rounded-md text-[11px]">
                        <FileSpreadsheet className="h-3 w-3 text-[#2FE5A7]" />
                        <span>Google Sheets (Applications)</span>
                      </div>
                      <ArrowRight className="h-3 w-3 text-[#8BA3AB]" />
                      <div className="flex items-center gap-1 bg-[#092B38] px-2 py-1 rounded-md text-[11px]">
                        <MessageSquare className="h-3 w-3 text-[#25D366]" />
                        <span>WhatsApp (Onboarding Msg)</span>
                      </div>
                    </div>
                  </div>

                  {/* Route 2 Block */}
                  <div className="rounded-xl border border-[#F59E0B]/20 bg-[#261E0E]/50 p-3.5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-[#F59E0B]"></span>
                        Route 2: <code className="text-[#F59E0B] font-mono">payment.completed</code>
                      </span>
                      <span className="text-[10px] uppercase font-mono text-[#8BA3AB]">Payment & Payout</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#FDE68A] pt-1">
                      <div className="flex items-center gap-1 bg-[#33250A] px-2 py-1 rounded-md text-[11px]">
                        <FileSpreadsheet className="h-3 w-3 text-[#2FE5A7]" />
                        <span>Google Sheets (Ledger)</span>
                      </div>
                      <ArrowRight className="h-3 w-3 text-[#8BA3AB]" />
                      <div className="flex items-center gap-1 bg-[#33250A] px-2 py-1 rounded-md text-[11px]">
                        <Mail className="h-3 w-3 text-[#38BDF8]" />
                        <span>Gmail (Payment & Payout Alert)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Webhook Configuration Input */}
              <div className="rounded-xl border border-white/[0.06] bg-[#05131A]/70 p-4 backdrop-blur-md">
                <label className="block">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-white">Make.com Webhook URL</span>
                    <a
                      href="https://www.make.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-[#60CECA] hover:underline flex items-center gap-1"
                    >
                      <span>Open Make.com Console</span>
                      <ExternalLink size={10} />
                    </a>
                  </div>
                  <input
                    type="url"
                    value={makeWebhookUrl}
                    onChange={(e) => setMakeWebhookUrl(e.target.value)}
                    placeholder="https://hook.eu1.make.com/your-make-webhook-id (or leave blank to use MAKE_AUTOMATION_WEBHOOK_URL env)"
                    className="w-full rounded-xl border border-[#17333D] bg-[#071922] px-3.5 py-2.5 text-xs font-mono text-white outline-none transition placeholder:text-[#425761] focus:border-[#60CECA] focus:ring-1 focus:ring-[#60CECA]"
                  />
                  <p className="mt-2 text-[11px] text-[#8BA3AB]">
                    Configured in <code className="text-[#60CECA]">admin/.env.local</code> as{' '}
                    <code className="text-[#60CECA]">MAKE_AUTOMATION_WEBHOOK_URL</code>.
                  </p>
                </label>
              </div>

              {/* Instant Test Execution Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                <button
                  type="button"
                  disabled={testingRoute1}
                  onClick={() => triggerTestAutomation('host.applied')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-[#60CECA]/40 bg-[#082832] px-4 py-2.5 text-xs font-bold text-[#60CECA] hover:bg-[#0B3442] hover:border-[#60CECA] transition active:scale-[0.98] disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{testingRoute1 ? 'Dispatching...' : '⚡ Test Route 1: Host Application'}</span>
                </button>

                <button
                  type="button"
                  disabled={testingRoute2}
                  onClick={() => triggerTestAutomation('payment.completed')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-[#F59E0B]/40 bg-[#291F0A] px-4 py-2.5 text-xs font-bold text-[#F59E0B] hover:bg-[#382B0E] hover:border-[#F59E0B] transition active:scale-[0.98] disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{testingRoute2 ? 'Dispatching...' : '⚡ Test Route 2: Payment Received'}</span>
                </button>

                {lastTestResult && (
                  <div className="flex items-center gap-2 text-xs ml-auto">
                    <CheckCircle2
                      className={`h-4 w-4 ${lastTestResult.success ? 'text-[#2FE5A7]' : 'text-[#FB7185]'}`}
                    />
                    <span className="text-[#8BA3AB]">
                      {lastTestResult.event} ({lastTestResult.timestamp}):{' '}
                      <strong className="text-white">{lastTestResult.message}</strong>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </SectionCard>

          {/* App Config */}
          <SectionCard
            icon={<Sliders className="h-5 w-5" />}
            title="Operational Rules Engine"
            badge="Live Sync"
            description="Configured parameters take effect instantly across client call sessions and coin wallets."
          >
            <form onSubmit={save} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-white/[0.06] bg-[#05131A]/70 p-4 backdrop-blur-md">
                  <label className="block">
                    <span className="mb-2 block text-xs font-medium text-[#8BA3AB]">Welcome Bonus Coins</span>
                    <input
                      type="number"
                      min={0}
                      value={settings.welcomeBonusCoins ?? 0}
                      onChange={(event) =>
                        setSettings((current) => ({ ...current, welcomeBonusCoins: Number(event.target.value) }))
                      }
                      className="w-full rounded-lg border border-[#17333D] bg-[#071922]/90 px-3.5 py-2.5 text-sm font-mono text-white outline-none transition placeholder:text-[#526B75] focus:border-[#60CECA] focus:ring-1 focus:ring-[#60CECA]"
                    />
                    <p className="mt-2 text-[11px] text-[#526B75]">Credited upon first user phone onboarding.</p>
                  </label>
                </div>

                <div className="rounded-xl border border-white/[0.06] bg-[#05131A]/70 p-4 backdrop-blur-md">
                  <label className="block">
                    <span className="mb-2 block text-xs font-medium text-[#8BA3AB]">Min Coin Balance to Call</span>
                    <input
                      type="number"
                      min={0}
                      value={settings.minCoinBalanceToStartCall ?? 0}
                      onChange={(event) =>
                        setSettings((current) => ({ ...current, minCoinBalanceToStartCall: Number(event.target.value) }))
                      }
                      className="w-full rounded-lg border border-[#17333D] bg-[#071922]/90 px-3.5 py-2.5 text-sm font-mono text-white outline-none transition placeholder:text-[#526B75] focus:border-[#60CECA] focus:ring-1 focus:ring-[#60CECA]"
                    />
                    <p className="mt-2 text-[11px] text-[#526B75]">Minimum wallet reserve required before dialing.</p>
                  </label>
                </div>

                <div className="rounded-xl border border-white/[0.06] bg-[#05131A]/70 p-4 backdrop-blur-md">
                  <label className="block">
                    <span className="mb-2 block text-xs font-medium text-[#8BA3AB]">Max Call Duration (Minutes)</span>
                    <input
                      type="number"
                      min={1}
                      value={settings.maxCallDurationMinutes ?? 60}
                      onChange={(event) =>
                        setSettings((current) => ({ ...current, maxCallDurationMinutes: Number(event.target.value) }))
                      }
                      className="w-full rounded-lg border border-[#17333D] bg-[#071922]/90 px-3.5 py-2.5 text-sm font-mono text-white outline-none transition placeholder:text-[#526B75] focus:border-[#60CECA] focus:ring-1 focus:ring-[#60CECA]"
                    />
                    <p className="mt-2 text-[11px] text-[#526B75]">Automatic circuit-breaker ceiling per call session.</p>
                  </label>
                </div>
              </div>

              <label className="flex items-center gap-3.5 rounded-xl border border-white/[0.06] bg-[#05131A]/70 p-4 text-sm text-[#D7E3E7] cursor-pointer hover:border-[#60CECA]/30 transition backdrop-blur-md">
                <input
                  type="checkbox"
                  checked={Boolean(settings.maintenanceMode)}
                  onChange={(event) =>
                    setSettings((current) => ({ ...current, maintenanceMode: event.target.checked }))
                  }
                  className="h-4 w-4 rounded border-[#17333D] bg-[#051016] text-[#60CECA] accent-[#60CECA]"
                />
                <div className="flex-1">
                  <span className="font-medium text-white">Enable Global Maintenance Mode</span>
                  <p className="text-xs text-[#8BA3AB]">
                    Pauses caller-host matching and displays a courteous maintenance overlay.
                  </p>
                </div>
              </label>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-1">
                <div className="flex items-center gap-2 text-xs text-[#8BA3AB]">
                  <span>Last synchronized:</span>
                  <span className="font-mono text-[#60CECA]">{formatDateTime(settings.updatedAt)}</span>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#60CECA] px-6 py-2.5 text-sm font-bold text-[#032024] shadow-[0_4px_20px_rgba(96,206,202,0.25)] transition hover:bg-[#72DFDB] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? 'Synchronizing...' : 'Save Operational Rules'}
                </button>
              </div>
            </form>
          </SectionCard>

          {/* Gateway Connectivity & Security Matrix */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Agora RTC Card */}
            <SectionCard
              icon={<PhoneCall className="h-5 w-5" />}
              title="Agora RTC Audio Gateway"
              badge="Encrypted"
              description="Low-latency WebRTC infrastructure powering 1-on-1 audio & video calls."
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#05131A]/70 p-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-[#2FE5A7] shadow-[0_0_8px_#2FE5A7]"></span>
                    <span className="text-xs font-semibold text-white">Channel State:</span>
                    <span className="text-xs font-mono text-[#2FE5A7]">Active · asia-south1</span>
                  </div>
                  <span className="rounded-md bg-[#2FE5A7]/10 px-2 py-0.5 text-[11px] font-mono text-[#2FE5A7]">
                    3600s dynamic tokens
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl border border-white/[0.04] bg-[#05131A]/50 p-3">
                    <p className="text-[#8BA3AB]">App Identifier</p>
                    <p className="mt-1 font-mono text-white">Vaulted in Server Secret</p>
                  </div>
                  <div className="rounded-xl border border-white/[0.04] bg-[#05131A]/50 p-3">
                    <p className="text-[#8BA3AB]">Token Authority</p>
                    <p className="mt-1 font-mono text-white">Edge Function HMAC</p>
                  </div>
                </div>

                <div className="rounded-xl border border-[#60CECA]/15 bg-[#60CECA]/5 p-3.5 text-xs text-[#8BA3AB] flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-[#60CECA] mt-0.5 shrink-0" />
                  <p>
                    <strong className="text-white">Security Guarantee:</strong> Agora certificates are never sent to client browsers. RTC tokens are minted dynamically with 1-hour expiry strictly upon call handshake.
                  </p>
                </div>
              </div>
            </SectionCard>

            {/* Cashfree Payment Gateway Card */}
            <SectionCard
              icon={<CreditCard className="h-5 w-5" />}
              title="Cashfree Financial Gateway"
              badge="PCI-DSS"
              description="Payment gateway for user coin topups and direct bank payouts to hosts."
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#05131A]/70 p-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-[#F59E0B] shadow-[0_0_8px_#F59E0B]"></span>
                    <span className="text-xs font-semibold text-white">Gateway Mode:</span>
                    <span className="text-xs font-mono text-[#F59E0B]">Production Mode Active</span>
                  </div>
                  <span className="rounded-md bg-[#F59E0B]/10 px-2 py-0.5 text-[11px] font-mono text-[#F59E0B]">
                    Webhooks Active
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl border border-white/[0.04] bg-[#05131A]/50 p-3">
                    <p className="text-[#8BA3AB]">App ID Status</p>
                    <p className="mt-1 font-mono text-white">Configured in .env.local</p>
                  </div>
                  <div className="rounded-xl border border-white/[0.04] bg-[#05131A]/50 p-3">
                    <p className="text-[#8BA3AB]">Payout Secret</p>
                    <p className="mt-1 font-mono text-white">Securely Vaulted</p>
                  </div>
                </div>

                <div className="rounded-xl border border-[#2FE5A7]/15 bg-[#2FE5A7]/5 p-3.5 text-xs text-[#8BA3AB] flex items-start gap-2.5">
                  <Lock className="h-4 w-4 text-[#2FE5A7] mt-0.5 shrink-0" />
                  <p>
                    <strong className="text-white">Zero Exposure:</strong> Cashfree API secrets never leave the server process. Signature verification for topups is handled server-side before coins are minted.
                  </p>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* AdMob & Security Shield Card */}
          <div className="grid gap-6 lg:grid-cols-2">
            <SectionCard
              icon={<Tv className="h-5 w-5" />}
              title="Google AdMob Reward Engine"
              badge="App Mon"
              description="Reward coin economy for caller rewarded video ads."
            >
              <div className="rounded-xl border border-white/[0.06] bg-[#05131A]/70 p-4 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[#8BA3AB]">Reward per completed ad:</span>
                  <span className="font-mono text-sm font-bold text-[#60CECA]">5 Coins</span>
                </div>
                <div className="flex items-center justify-between border-t border-white/[0.04] pt-2.5">
                  <span className="text-[#8BA3AB]">AdMob SDK Client Integration:</span>
                  <span className="font-mono text-white">Embedded in Android APK</span>
                </div>
                <p className="text-[11px] text-[#526B75] pt-1">
                  Ad unit IDs are configured in native Android resources; server listens to verified reward callback webhooks.
                </p>
              </div>
            </SectionCard>

            <SectionCard
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Credential Storage & Vault"
              badge="Server Only"
              description="How environment secrets are safeguarded in Friendoo."
            >
              <div className="rounded-xl border border-white/[0.06] bg-[#05131A]/70 p-4 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[#8BA3AB]">Master Storage File:</span>
                  <code className="rounded bg-[#071922] px-2 py-0.5 font-mono text-[#60CECA]">admin/.env.local</code>
                </div>
                <div className="flex items-center justify-between border-t border-white/[0.04] pt-2.5">
                  <span className="text-[#8BA3AB]">Session Token Algorithm:</span>
                  <span className="font-mono text-white">HMAC-SHA256 (Constant-Time)</span>
                </div>
                <p className="text-[11px] text-[#526B75] pt-1">
                  To rotate admin password or API keys, update <code className="text-[#60CECA]">admin/.env.local</code> and restart the daemon.
                </p>
              </div>
            </SectionCard>
          </div>
        </>
      )}
    </div>
  )
}
