import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import {
  onAuthStateChanged,
  User,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import type { UserProfile } from '@/types'

interface AuthContextValue {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  sendOtp: (phone: string, verifier: RecaptchaVerifier) => Promise<ConfirmationResult>
  confirmOtp: (result: ConfirmationResult, code: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(uid: string) {
    const snap = await getDoc(doc(db, 'users', uid))
    if (snap.exists()) {
      setProfile({ uid, ...(snap.data() as Omit<UserProfile, 'uid'>) })
    }
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        await loadProfile(firebaseUser.uid)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  async function sendOtp(phone: string, verifier: RecaptchaVerifier) {
    return signInWithPhoneNumber(auth, phone, verifier)
  }

  async function confirmOtp(result: ConfirmationResult, code: string) {
    const credential = await result.confirm(code)
    const uid = credential.user.uid
    const ref = doc(db, 'users', uid)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      await setDoc(ref, {
        displayName: '',
        username: '',
        phoneNumber: credential.user.phoneNumber ?? '',
        photoURL: '',
        bio: '',
        city: '',
        languages: [],
        interests: [],
        gender: '',
        age: null,
        coinBalance: 50,
        isHost: false,
        hostStatus: null,
        totalSpent: 0,
        joinedAt: serverTimestamp(),
      })
    }
    await loadProfile(uid)
  }

  async function signOut() {
    await firebaseSignOut(auth)
    setProfile(null)
  }

  async function refreshProfile() {
    if (user) await loadProfile(user.uid)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, sendOtp, confirmOtp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used inside AuthProvider')
  return ctx
}
