import { useState } from 'react'
import { Layout } from '@/components/Layout'
import { useAuthContext } from '@/contexts/AuthContext'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { initials } from '@/lib/utils'
import { LogOut, ChevronRight, User, Shield, Info } from 'lucide-react'
import toast from 'react-hot-toast'

export function Profile() {
  const { user, profile, signOut, refreshProfile } = useAuthContext()
  const [editing, setEditing] = useState(false)
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [city, setCity] = useState(profile?.city ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!user) return
    setSaving(true)
    try {
      await updateDoc(doc(db, 'users', user.uid), { displayName, bio, city })
      await refreshProfile()
      setEditing(false)
      toast.success('Profile updated')
    } catch (err) {
      console.error(err)
      toast.error('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  async function handleSignOut() {
    await signOut()
  }

  if (!profile) return null

  return (
    <Layout title="Profile">
      <div className="px-4 py-6">
        <div className="flex flex-col items-center gap-3 mb-8">
          {profile.photoURL ? (
            <img
              src={profile.photoURL}
              alt={profile.displayName}
              className="w-20 h-20 rounded-full object-cover ring-2 ring-[#7c5cff]/40"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#7c5cff] to-[#ff7ab6] flex items-center justify-center text-2xl font-bold">
              {initials(profile.displayName || profile.phoneNumber)}
            </div>
          )}
          <div className="text-center">
            <p className="font-bold text-lg">{profile.displayName || 'Set your name'}</p>
            <p className="text-white/40 text-sm">{profile.phoneNumber}</p>
          </div>
        </div>

        {editing ? (
          <div className="flex flex-col gap-3 mb-6">
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Display name</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-white/[0.06] border border-white/[0.10] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#7c5cff]/70 placeholder-white/25"
              />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">City</label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Mumbai, Chennai…"
                className="w-full bg-white/[0.06] border border-white/[0.10] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#7c5cff]/70 placeholder-white/25"
              />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell hosts about yourself…"
                rows={3}
                className="w-full bg-white/[0.06] border border-white/[0.10] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#7c5cff]/70 placeholder-white/25 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setEditing(false)}
                className="flex-1 py-3 rounded-xl border border-white/[0.12] text-sm font-semibold text-white/60"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 rounded-xl bg-[#7c5cff] text-sm font-bold transition hover:bg-[#9375ff] disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl bg-white/[0.05] border border-white/[0.07] mb-6 transition hover:bg-white/[0.09]"
          >
            <div className="flex items-center gap-3">
              <User size={16} className="text-white/50" />
              <span className="text-sm font-medium">Edit profile</span>
            </div>
            <ChevronRight size={16} className="text-white/30" />
          </button>
        )}

        <div className="rounded-xl border border-white/[0.07] overflow-hidden divide-y divide-white/[0.06]">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <Shield size={16} className="text-white/40 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/60">Account status</p>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              profile.status === 'banned'
                ? 'bg-red-500/20 text-red-300'
                : 'bg-green-500/20 text-green-300'
            }`}>
              {profile.status === 'banned' ? 'Banned' : 'Active'}
            </span>
          </div>

          <div className="flex items-center gap-3 px-4 py-3.5">
            <Info size={16} className="text-white/40 shrink-0" />
            <div>
              <p className="text-sm text-white/60">Languages</p>
              <p className="text-xs text-white/30 mt-0.5">
                {(profile.languages ?? []).join(', ') || 'Not set'}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-red-500/20 bg-red-500/[0.06] mt-6 transition hover:bg-red-500/10"
        >
          <LogOut size={16} className="text-red-400" />
          <span className="text-sm font-medium text-red-400">Sign out</span>
        </button>

        <p className="text-center text-white/20 text-xs mt-8">
          Friendoo v0.1.0 · <a href="https://friendoo.app/privacy" className="underline hover:text-white/40">Privacy</a> · <a href="https://friendoo.app/terms" className="underline hover:text-white/40">Terms</a>
        </p>
      </div>
    </Layout>
  )
}
