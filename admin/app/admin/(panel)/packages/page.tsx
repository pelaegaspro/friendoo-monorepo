'use client'

import { FormEvent, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import SectionCard from '@/components/admin/SectionCard'
import LoadingBlock from '@/components/admin/LoadingBlock'
import DataState from '@/components/admin/DataState'
import SideSheet from '@/components/admin/SideSheet'
import Badge from '@/components/ui/Badge'
import { adminFetch } from '@/lib/admin/client'
import type { CoinPackageRecord } from '@/lib/admin/types'
import { formatDateTime, formatInr } from '@/lib/admin/format'

type PackageForm = {
  id?: string
  displayName: string
  coins: number
  bonus: number
  priceInr: number
  active: boolean
}

const blankPackage: PackageForm = {
  displayName: '',
  coins: 100,
  bonus: 0,
  priceInr: 99,
  active: true,
}

export default function PackagesAdminPage() {
  const [packages, setPackages] = useState<CoinPackageRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [form, setForm] = useState<PackageForm>(blankPackage)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const response = await adminFetch<{ packages: CoinPackageRecord[] }>('/api/admin/packages/list')
      setPackages(response.packages)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load packages')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [])

  const openCreate = () => {
    setForm(blankPackage)
    setSheetOpen(true)
  }

  const openEdit = (item: CoinPackageRecord) => {
    setForm({
      id: item.id,
      displayName: item.displayName,
      coins: item.coins,
      bonus: item.bonus,
      priceInr: item.priceInr,
      active: item.active,
    })
    setSheetOpen(true)
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    try {
      await adminFetch('/api/admin/packages/upsert', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      toast.success(form.id ? 'Package updated' : 'Package created')
      setSheetOpen(false)
      setForm(blankPackage)
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save package')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (item: CoinPackageRecord) => {
    try {
      await adminFetch('/api/admin/packages/upsert', {
        method: 'POST',
        body: JSON.stringify({ ...item, active: !item.active }),
      })
      toast.success(item.active ? 'Package deactivated' : 'Package activated')
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update package')
    }
  }

  const removePackage = async (packageId: string) => {
    const confirmed = window.confirm('Delete this package?')
    if (!confirmed) return

    try {
      await adminFetch(`/api/admin/packages/${packageId}`, { method: 'DELETE' })
      toast.success('Package deleted')
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete package')
    }
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title="Coin Packages"
        description="Create, edit, activate, and retire top-up packages."
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="rounded-xl bg-purple-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-400"
          >
            Add Package
          </button>
        }
      >
        <p className="text-sm text-zinc-400">
          Active packages appear in the main app top-up flow immediately.
        </p>
      </SectionCard>

      {loading ? (
        <LoadingBlock rows={5} />
      ) : (
        <SectionCard>
          {packages.length === 0 ? (
            <DataState title="No packages yet" body="Create the first coin package to enable top-ups." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#2b2b2b] text-zinc-400">
                    <th className="px-3 py-3 font-medium">Package</th>
                    <th className="px-3 py-3 font-medium">Coins</th>
                    <th className="px-3 py-3 font-medium">Bonus</th>
                    <th className="px-3 py-3 font-medium">Price</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium">Created</th>
                    <th className="px-3 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {packages.map((item) => (
                    <tr key={item.id} className="border-b border-[#202020]">
                      <td className="px-3 py-4 font-medium text-white">{item.displayName}</td>
                      <td className="px-3 py-4 text-zinc-300">{item.coins.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-4 text-zinc-300">{item.bonus.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-4 text-zinc-300">{formatInr(item.priceInr)}</td>
                      <td className="px-3 py-4">
                        <Badge label={item.active ? 'active' : 'inactive'} variant={item.active ? 'active' : 'default'} />
                      </td>
                      <td className="px-3 py-4 text-zinc-300">{formatDateTime(item.createdAt)}</td>
                      <td className="px-3 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => toggleActive(item)}
                            className="rounded-lg border border-[#343434] px-3 py-1.5 text-xs font-medium text-zinc-200"
                          >
                            {item.active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-200"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => removePackage(item.id)}
                            className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      )}

      <SideSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={form.id ? 'Edit Package' : 'Add Package'}
        description="Configure display name, coin value, bonus, and price."
        widthClassName="max-w-md"
      >
        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-zinc-300">Display Name</span>
            <input
              value={form.displayName}
              onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
              className="w-full rounded-2xl border border-[#343434] bg-[#111111] px-4 py-3 text-white outline-none focus:border-purple-500"
              required
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-zinc-300">Coins</span>
              <input
                type="number"
                min={0}
                value={form.coins}
                onChange={(event) => setForm((current) => ({ ...current, coins: Number(event.target.value) }))}
                className="w-full rounded-2xl border border-[#343434] bg-[#111111] px-4 py-3 text-white outline-none focus:border-purple-500"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-zinc-300">Bonus</span>
              <input
                type="number"
                min={0}
                value={form.bonus}
                onChange={(event) => setForm((current) => ({ ...current, bonus: Number(event.target.value) }))}
                className="w-full rounded-2xl border border-[#343434] bg-[#111111] px-4 py-3 text-white outline-none focus:border-purple-500"
              />
            </label>
          </div>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-zinc-300">Price (INR)</span>
            <input
              type="number"
              min={0}
              value={form.priceInr}
              onChange={(event) => setForm((current) => ({ ...current, priceInr: Number(event.target.value) }))}
              className="w-full rounded-2xl border border-[#343434] bg-[#111111] px-4 py-3 text-white outline-none focus:border-purple-500"
            />
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-[#2d2d2d] bg-[#141414] px-4 py-3 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))}
              className="h-4 w-4 accent-purple-500"
            />
            Active package
          </label>
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-2xl bg-purple-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Package'}
          </button>
        </form>
      </SideSheet>
    </div>
  )
}
