'use client'

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import Badge from '@/components/ui/Badge'
import SectionCard from '@/components/admin/SectionCard'
import DataState from '@/components/admin/DataState'
import LoadingBlock from '@/components/admin/LoadingBlock'
import SideSheet from '@/components/admin/SideSheet'
import { adminFetch } from '@/lib/admin/client'
import type { AdminHost, HostApplicationRecord } from '@/lib/admin/types'
import { formatDateTime } from '@/lib/admin/format'
import { useRouter } from 'next/navigation'
const languageOptions = [
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
]

type HostTab = 'hosts' | 'applications'
type HostFilter = 'all' | 'approved' | 'pending' | 'suspended'

type HostFormState = {
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

const emptyForm: HostFormState = {
  displayName: '',
  phoneNumber: '+91',
  age: 24,
  city: '',
  languages: ['Hindi'],
  coinsPerMinute: 20,
  photoURL: '',
  bio: '',
  gender: 'Female',
  status: 'approved',
}

function HostFormFields({
  form,
  onChange,
  onToggleLanguage,
  onPhotoChange,
  submitting,
}: {
  form: HostFormState
  onChange: (patch: Partial<HostFormState>) => void
  onToggleLanguage: (language: string) => void
  onPhotoChange: (event: ChangeEvent<HTMLInputElement>) => void
  submitting: boolean
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-zinc-300">Display Name</span>
          <input
            value={form.displayName}
            onChange={(event) => onChange({ displayName: event.target.value })}
            className="w-full rounded-2xl border border-[#343434] bg-[#111111] px-4 py-3 text-white outline-none focus:border-purple-500"
            required
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-zinc-300">Phone Number</span>
          <input
            value={form.phoneNumber}
            onChange={(event) => onChange({ phoneNumber: event.target.value })}
            className="w-full rounded-2xl border border-[#343434] bg-[#111111] px-4 py-3 text-white outline-none focus:border-purple-500"
            placeholder="+91XXXXXXXXXX"
            required
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-zinc-300">Age</span>
          <input
            type="number"
            min={18}
            max={35}
            value={form.age}
            onChange={(event) => onChange({ age: Number(event.target.value) })}
            className="w-full rounded-2xl border border-[#343434] bg-[#111111] px-4 py-3 text-white outline-none focus:border-purple-500"
            required
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-zinc-300">City</span>
          <input
            value={form.city}
            onChange={(event) => onChange({ city: event.target.value })}
            className="w-full rounded-2xl border border-[#343434] bg-[#111111] px-4 py-3 text-white outline-none focus:border-purple-500"
            required
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-zinc-300">Rate per Minute</span>
          <input
            type="number"
            min={1}
            value={form.coinsPerMinute}
            onChange={(event) => onChange({ coinsPerMinute: Number(event.target.value) })}
            className="w-full rounded-2xl border border-[#343434] bg-[#111111] px-4 py-3 text-white outline-none focus:border-purple-500"
            required
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-zinc-300">Gender</span>
          <select
            value={form.gender}
            onChange={(event) => onChange({ gender: event.target.value })}
            className="w-full rounded-2xl border border-[#343434] bg-[#111111] px-4 py-3 text-white outline-none focus:border-purple-500"
          >
            <option>Female</option>
            <option>Male</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-zinc-300">Status</span>
          <select
            value={form.status}
            onChange={(event) => onChange({ status: event.target.value as HostFormState['status'] })}
            className="w-full rounded-2xl border border-[#343434] bg-[#111111] px-4 py-3 text-white outline-none focus:border-purple-500"
          >
            <option value="approved">approved</option>
            <option value="pending">pending</option>
          </select>
        </label>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-zinc-300">Languages</p>
        <div className="flex flex-wrap gap-2">
          {languageOptions.map((language) => {
            const selected = form.languages.includes(language)
            return (
              <button
                key={language}
                type="button"
                onClick={() => onToggleLanguage(language)}
                className={`rounded-full border px-3 py-2 text-sm transition ${
                  selected
                    ? 'border-purple-500 bg-purple-500/15 text-purple-200'
                    : 'border-[#343434] bg-[#131313] text-zinc-400 hover:text-white'
                }`}
              >
                {language}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">Profile Photo</label>
        <input
          type="file"
          accept="image/*"
          onChange={onPhotoChange}
          className="w-full rounded-2xl border border-dashed border-[#343434] bg-[#111111] px-4 py-3 text-sm text-zinc-400"
        />
        {form.photoURL ? (
          <a
            href={form.photoURL}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-xs text-purple-300 underline-offset-4 hover:underline"
          >
            Current uploaded photo
          </a>
        ) : null}
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-zinc-300">Bio</span>
        <textarea
          value={form.bio}
          onChange={(event) => onChange({ bio: event.target.value.slice(0, 150) })}
          rows={4}
          maxLength={150}
          className="w-full rounded-2xl border border-[#343434] bg-[#111111] px-4 py-3 text-white outline-none focus:border-purple-500"
        />
        <span className="mt-1 block text-right text-xs text-zinc-500">{form.bio.length}/150</span>
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-2xl bg-purple-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'Saving...' : 'Save Host'}
      </button>
    </div>
  )
}

export default function HostsAdminPage() {
  const [tab, setTab] = useState<HostTab>('hosts')
  const [filter, setFilter] = useState<HostFilter>('all')
  const [search, setSearch] = useState('')
  const [hosts, setHosts] = useState<AdminHost[]>([])
  const [applications, setApplications] = useState<HostApplicationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingHost, setEditingHost] = useState<AdminHost | null>(null)
  const [form, setForm] = useState<HostFormState>(emptyForm)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const response = await adminFetch<{ hosts: AdminHost[]; applications: HostApplicationRecord[] }>(
        '/api/admin/hosts/list'
      )
      setHosts(response.hosts)
      setApplications(response.applications)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load hosts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const filteredHosts = useMemo(() => {
    const query = search.trim().toLowerCase()
    return hosts.filter((host) => {
      const matchesFilter = filter === 'all' ? true : host.hostStatus === filter
      const matchesSearch = query
        ? [host.displayName, host.phoneNumber, host.city].some((value) =>
            value.toLowerCase().includes(query)
          )
        : true
      return matchesFilter && matchesSearch
    })
  }, [filter, hosts, search])

  const router = useRouter()

  const openCreate = () => {
    router.push('/admin/hosts/create')
  }

  const openEdit = (host: AdminHost) => {
    setEditingHost(host)
    setForm({
      displayName: host.displayName,
      phoneNumber: host.phoneNumber,
      age: host.age ?? 24,
      city: host.city,
      languages: host.languages.length ? host.languages : ['Hindi'],
      coinsPerMinute: host.ratePerMinute,
      photoURL: host.photoURL,
      bio: host.bio,
      gender: host.gender || 'Female',
      status: host.hostStatus === 'pending' ? 'pending' : 'approved',
    })
    setPhotoFile(null)
    setSheetOpen(true)
  }

  const toggleLanguage = (language: string) => {
    setForm((current) => {
      const exists = current.languages.includes(language)
      const nextLanguages = exists
        ? current.languages.filter((item) => item !== language)
        : [...current.languages, language]

      return {
        ...current,
        languages: nextLanguages.length ? nextLanguages : ['Hindi'],
      }
    })
  }

  const uploadPhotoIfNeeded = async () => {
    if (!photoFile) return form.photoURL
    const body = new FormData()
    body.append('file', photoFile)
    if (editingHost?.id) {
      body.append('uid', editingHost.id)
    }
    const response = await adminFetch<{ photoURL: string }>('/api/admin/hosts/upload-photo', {
      method: 'POST',
      body,
    })
    return response.photoURL
  }

  const submitHost = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      const photoURL = await uploadPhotoIfNeeded()
      const payload = { ...form, photoURL }

      if (editingHost) {
        await adminFetch(`/api/admin/hosts/${editingHost.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            action: 'edit',
            updates: payload,
          }),
        })
        toast.success('Host updated successfully')
      } else {
        await adminFetch('/api/admin/hosts/create', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        toast.success('Host added successfully')
      }

      setSheetOpen(false)
      setForm(emptyForm)
      setPhotoFile(null)
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save host')
    } finally {
      setSubmitting(false)
    }
  }

  const performHostAction = async (host: AdminHost, action: 'suspend' | 'restore' | 'delete') => {
    try {
      if (action === 'delete') {
        const confirmed = window.confirm(`Delete ${host.displayName}? This removes the host account.`)
        if (!confirmed) return
        await adminFetch(`/api/admin/hosts/${host.id}`, { method: 'DELETE' })
        toast.success('Host deleted')
      } else {
        await adminFetch(`/api/admin/hosts/${host.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ action }),
        })
        toast.success(action === 'suspend' ? 'Host suspended' : 'Host restored')
      }

      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Host action failed')
    }
  }

  const reviewApplication = async (applicationId: string, action: 'approve' | 'reject') => {
    const notes =
      action === 'reject'
        ? window.prompt('Add rejection note')
        : window.prompt('Optional approval note')

    if (action === 'reject' && !notes?.trim()) {
      toast.error('Rejection note is required')
      return
    }

    try {
      await adminFetch(`/api/admin/hosts/applications/${applicationId}`, {
        method: 'POST',
        body: JSON.stringify({ action, notes }),
      })
      toast.success(action === 'approve' ? 'Application approved' : 'Application rejected')
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to review application')
    }
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title="Host Management"
        description="Add hosts manually, manage live host accounts, and review pending applications."
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="rounded-xl bg-purple-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-400"
          >
            Add Host
          </button>
        }
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {(['hosts', 'applications'] as HostTab[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setTab(value)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  tab === value
                    ? 'bg-purple-500 text-white'
                    : 'border border-[#333333] bg-[#111111] text-zinc-400 hover:text-white'
                }`}
              >
                {value === 'hosts' ? 'Hosts List' : 'Application Reviews'}
              </button>
            ))}
          </div>

          {tab === 'hosts' ? (
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name or phone"
                className="w-full rounded-xl border border-[#343434] bg-[#111111] px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500 md:w-72"
              />
              <div className="flex flex-wrap gap-2">
                {(['all', 'approved', 'pending', 'suspended'] as HostFilter[]).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFilter(value)}
                    className={`rounded-full px-3 py-2 text-sm transition ${
                      filter === value
                        ? 'bg-purple-500/15 text-purple-200 ring-1 ring-purple-500/30'
                        : 'border border-[#343434] bg-[#111111] text-zinc-400'
                    }`}
                  >
                    {value === 'all' ? 'All' : value.charAt(0).toUpperCase() + value.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </SectionCard>

      {loading ? (
        <LoadingBlock rows={6} />
      ) : tab === 'hosts' ? (
        <SectionCard>
          {filteredHosts.length === 0 ? (
            <DataState
              title="No hosts found"
              body="Try a different search or status filter, or add a new host manually."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#2b2b2b] text-zinc-400">
                    <th className="px-3 py-3 font-medium">Photo</th>
                    <th className="px-3 py-3 font-medium">Name</th>
                    <th className="px-3 py-3 font-medium">Phone</th>
                    <th className="px-3 py-3 font-medium">City</th>
                    <th className="px-3 py-3 font-medium">Language</th>
                    <th className="px-3 py-3 font-medium">Rate/min</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium">Calls Made</th>
                    <th className="px-3 py-3 font-medium">Coins Earned</th>
                    <th className="px-3 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHosts.map((host) => (
                    <tr key={host.id} className="border-b border-[#202020] align-top">
                      <td className="px-3 py-4">
                        {host.photoURL ? (
                          <img
                            src={host.photoURL}
                            alt={host.displayName}
                            className="h-11 w-11 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-purple-500/20 text-sm font-semibold text-purple-200">
                            {host.displayName.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-4 text-white">
                        <div className="font-medium">{host.displayName}</div>
                        <div className="mt-1 text-xs text-zinc-500">{host.createdAt ? formatDateTime(host.createdAt) : '--'}</div>
                      </td>
                      <td className="px-3 py-4 text-zinc-300">{host.phoneNumber || '--'}</td>
                      <td className="px-3 py-4 text-zinc-300">{host.city || '--'}</td>
                      <td className="px-3 py-4 text-zinc-300">{host.languages.join(', ') || '--'}</td>
                      <td className="px-3 py-4 text-zinc-300">{host.ratePerMinute}</td>
                      <td className="px-3 py-4">
                        <Badge label={host.hostStatus} variant={host.hostStatus} />
                      </td>
                      <td className="px-3 py-4 text-zinc-300">{host.callsMade.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-4 text-zinc-300">{host.coinsEarned.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(host)}
                            className="rounded-lg border border-[#343434] px-3 py-1.5 text-xs font-medium text-zinc-200"
                          >
                            Edit
                          </button>
                          {host.hostStatus === 'suspended' ? (
                            <button
                              type="button"
                              onClick={() => performHostAction(host, 'restore')}
                              className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-300"
                            >
                              Restore
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => performHostAction(host, 'suspend')}
                              className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-1.5 text-xs font-medium text-yellow-300"
                            >
                              Suspend
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => performHostAction(host, 'delete')}
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
      ) : (
        <SectionCard title="Host Applications" description="Approve or reject incoming host requests.">
          {applications.length === 0 ? (
            <DataState
              title="No applications found"
              body="New host applications will appear here as soon as they are submitted."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {applications.map((application) => {
                const waNumber = application.phone.replace(/\D/g, '')
                const waMsg = encodeURIComponent(
                  `Hi ${application.name}, your Friendoo host application has been received. Our team will review it shortly.`
                )
                const waLink = `https://wa.me/${waNumber}?text=${waMsg}`
                const statusVariant =
                  application.status === 'pending' ? 'pending' :
                  application.status === 'approved' ? 'approved' : 'suspended'
                return (
                  <div key={application.id} className="rounded-2xl border border-[#2d2d2d] bg-[#151515] p-4">
                    <div className="flex items-start gap-4">
                      {application.photoURL ? (
                        <img
                          src={application.photoURL}
                          alt={application.name}
                          className="h-16 w-16 rounded-2xl object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/15 text-lg font-semibold text-purple-200">
                          {application.name.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="truncate text-base font-semibold text-white">{application.name}</h3>
                          <Badge label={application.status} variant={statusVariant} />
                        </div>
                        <p className="mt-1 text-sm text-zinc-400">{application.phone}</p>
                        <p className="mt-1 text-sm text-zinc-500">
                          {application.city || '--'} | {application.language || 'Hindi'}
                        </p>
                        {application.about ? (
                          <p className="mt-2 line-clamp-2 text-xs text-zinc-400 italic">&ldquo;{application.about}&rdquo;</p>
                        ) : null}
                        <p className="mt-2 text-xs text-zinc-500">
                          Submitted {application.submittedAt ? formatDateTime(application.submittedAt) : '--'}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {application.idProofUrl ? (
                            <a
                              href={application.idProofUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300 transition hover:bg-blue-500/20"
                            >
                              📄 View ID
                            </a>
                          ) : (
                            <span className="text-xs text-zinc-600">No ID uploaded</span>
                          )}
                          {application.phone ? (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-300 transition hover:bg-green-500/20"
                            >
                              💬 WhatsApp
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    {application.status === 'pending' && (
                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() => reviewApplication(application.id, 'approve')}
                          className="flex-1 rounded-xl bg-purple-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-400"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => reviewApplication(application.id, 'reject')}
                          className="flex-1 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {application.status !== 'pending' && (
                      <p className="mt-3 text-xs text-zinc-500">
                        Reviewed {application.reviewedAt ? formatDateTime(application.reviewedAt) : '--'}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </SectionCard>
      )}

      <SideSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={editingHost ? 'Edit Host' : 'Add Host'}
        description="Create or update a Friendoo host profile."
      >
        <form onSubmit={submitHost}>
          {editingHost && (
            <div className="mb-6 grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-purple-300">Total Coins</p>
                <p className="mt-1 text-lg font-bold text-white">{editingHost.coinsEarned.toLocaleString('en-IN')}</p>
              </div>
              <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-green-300">Earnings (₹)</p>
                <p className="mt-1 text-lg font-bold text-white">₹{editingHost.coinsEarned.toLocaleString('en-IN')}</p>
              </div>
              <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-blue-300">Calls Made</p>
                <p className="mt-1 text-lg font-bold text-white">{editingHost.callsMade.toLocaleString('en-IN')}</p>
              </div>
            </div>
          )}
          <HostFormFields
            form={form}
            onChange={(patch) => setForm((current) => ({ ...current, ...patch }))}
            onToggleLanguage={toggleLanguage}
            onPhotoChange={(event) => setPhotoFile(event.target.files?.[0] ?? null)}
            submitting={submitting}
          />
        </form>
      </SideSheet>
    </div>
  )
}
