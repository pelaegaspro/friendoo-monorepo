/**
 * Admin Authentication Library
 *
 * FIRST ADMIN SETUP INSTRUCTIONS:
 * ================================
 * 1. Go to Firebase Console → Authentication → Users tab
 * 2. Create a user with email/password (or find existing UID)
 * 3. Copy the UID from the Users list
 * 4. Go to Firestore → Create collection: "admins"
 * 5. Create a document with ID = the UID you copied
 * 6. Add these fields:
 *    - email: "pelaegaspro27@gmail.com" (string)
 *    - name: "Pelae Admin" (string)
 *    - role: "superadmin" (string)
 *    - createdAt: (server timestamp)
 * 7. Now you can log in to the admin panel with that email/password
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  UserCredential,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from './firebase'

/** Sign in with Firebase Email/Password */
export async function signInAdmin(
  email: string,
  password: string
): Promise<UserCredential> {
  return signInWithEmailAndPassword(auth, email, password)
}

/** Sign out the current Firebase user */
export async function signOutAdmin(): Promise<void> {
  return signOut(auth)
}

/** Check if a UID exists in the Firestore admins/ collection */
export async function checkIsAdmin(uid: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, 'admins', uid))
    return snap.exists()
  } catch {
    return false
  }
}

export interface AdminAuthState {
  user: User | null
  isAdmin: boolean
  loading: boolean
}

/** React hook: returns current admin auth state */
export function useAdminAuth(): AdminAuthState {
  const [state, setState] = useState<AdminAuthState>({
    user: null,
    isAdmin: false,
    loading: true,
  })
  // Cache last checked UID to avoid redundant Firestore reads
  const lastCheckedUid = useRef<string | null>(null)
  const lastIsAdmin = useRef<boolean>(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        lastCheckedUid.current = null
        lastIsAdmin.current = false
        setState({ user: null, isAdmin: false, loading: false })
        return
      }
      // Memoize: skip Firestore read if same UID
      if (user.uid === lastCheckedUid.current) {
        setState({ user, isAdmin: lastIsAdmin.current, loading: false })
        return
      }
      const isAdmin = await checkIsAdmin(user.uid)
      lastCheckedUid.current = user.uid
      lastIsAdmin.current = isAdmin
      setState({ user, isAdmin, loading: false })
    })
    return unsubscribe
  }, [])

  return state
}
