'use client'

import { FormEvent, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import SectionCard from '@/components/admin/SectionCard'
import LoadingBlock from '@/components/admin/LoadingBlock'
import { adminFetch } from '@/lib/admin/client'
import type { AppSettingsRecord } from '@/lib/admin/types'
import { formatDateTime } from '@/lib/admin/format'

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

  const load = async () => {
    setLoading(true)
    try {
      const nextSettings = await adminFetch<AppSettingsRecord>('/api/admin/settings')
      setSettings(nextSettings)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    try {
      await adminFetch('/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify(settings),
      })
      toast.success('Settings saved')
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {loading ? (
        <LoadingBlock rows={5} />
      ) : (
        <>
          <SectionCard
            title="App Config"
            description="Stored in config/appSettings and applied by the main app."
          >
            <form onSubmit={save} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-zinc-300">Welcome bonus coins</span>
                  <input
                    type="number"
                    min={0}
                    value={settings.welcomeBonusCoins}
                    onChange={(event) =>
                      setSettings((current) => ({ ...current, welcomeBonusCoins: Number(event.target.value) }))
                    }
                    className="w-full rounded-2xl border border-[#343434] bg-[#111111] px-4 py-3 text-white outline-none focus:border-purple-500"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-zinc-300">Min balance to start call</span>
                  <input
                    type="number"
                    min={0}
                    value={settings.minCoinBalanceToStartCall}
                    onChange={(event) =>
                      setSettings((current) => ({ ...current, minCoinBalanceToStartCall: Number(event.target.value) }))
                    }
                    className="w-full rounded-2xl border border-[#343434] bg-[#111111] px-4 py-3 text-white outline-none focus:border-purple-500"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-zinc-300">Max call duration (minutes)</span>
                  <input
                    type="number"
                    min={1}
                    value={settings.maxCallDurationMinutes}
                    onChange={(event) =>
                      setSettings((current) => ({ ...current, maxCallDurationMinutes: Number(event.target.value) }))
                    }
                    className="w-full rounded-2xl border border-[#343434] bg-[#111111] px-4 py-3 text-white outline-none focus:border-purple-500"
                  />
                </label>
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-[#2d2d2d] bg-[#141414] px-4 py-3 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(event) =>
                    setSettings((current) => ({ ...current, maintenanceMode: event.target.checked }))
                  }
                  className="h-4 w-4 accent-purple-500"
                />
                Enable maintenance mode banner in the main app
              </label>

              <div className="flex items-center justify-between rounded-2xl border border-[#2d2d2d] bg-[#141414] px-4 py-3 text-sm text-zinc-400">
                <span>Last updated</span>
                <span>{formatDateTime(settings.updatedAt)}</span>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="rounded-2xl bg-purple-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </form>
          </SectionCard>

          <SectionCard
            title="Admin Password"
            description="Environment-based configuration for the password-protected portal."
          >
            <div className="space-y-3 rounded-2xl border border-[#2d2d2d] bg-[#141414] p-4 text-sm text-zinc-300">
              <p>
                The admin password is controlled by <code className="rounded bg-[#101010] px-1.5 py-0.5 text-purple-200">ADMIN_PASSWORD</code> in
                <code className="ml-1 rounded bg-[#101010] px-1.5 py-0.5 text-purple-200">admin/.env.local</code>.
              </p>
              <p>
                To change it, update the environment variable, restart the admin server, and log in again.
              </p>
            </div>
          </SectionCard>
        </>
      )}
    </div>
  )
}
