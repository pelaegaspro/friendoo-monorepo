import { NextRequest, NextResponse } from 'next/server'
import { collection, getDocs, doc, getDoc, addDoc, serverTimestamp, where, query } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export const dynamic = 'force-dynamic'

// Lazy-initialize Firebase Admin SDK
let adminApp: import('firebase-admin/app').App | null = null

async function getAdminApp() {
  if (adminApp) return adminApp
  const { initializeApp, getApps, cert } = await import('firebase-admin/app')
  if (getApps().length > 0) {
    adminApp = getApps()[0]
    return adminApp
  }
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (!serviceAccountJson || serviceAccountJson === '{}') {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not configured')
  }
  const serviceAccount = JSON.parse(serviceAccountJson)
  adminApp = initializeApp({ credential: cert(serviceAccount) })
  return adminApp
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { target, targetId, title, body: notifBody, data = {} } = body

    if (!target || !title || !notifBody) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: target, title, body' },
        { status: 400 }
      )
    }

    const app = await getAdminApp()
    const { getMessaging } = await import('firebase-admin/messaging')
    const messaging = getMessaging(app)

    let tokens: string[] = []

    if (target === 'user' && targetId) {
      const userDoc = await getDoc(doc(db, 'users', targetId))
      const fcmToken = userDoc.data()?.fcmToken as string | undefined
      if (fcmToken) tokens = [fcmToken]
    } else if (target === 'all_users') {
      const snap = await getDocs(collection(db, 'users'))
      tokens = snap.docs.map((d) => d.data().fcmToken as string).filter(Boolean)
    } else if (target === 'all_hosts') {
      const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'host')))
      tokens = snap.docs.map((d) => d.data().fcmToken as string).filter(Boolean)
    }

    if (tokens.length === 0) {
      return NextResponse.json({ success: false, error: 'No FCM tokens found for target' }, { status: 400 })
    }

    let messageId: string | undefined

    if (tokens.length === 1) {
      messageId = await messaging.send({
        token: tokens[0],
        notification: { title, body: notifBody },
        data,
      })
    } else {
      const response = await messaging.sendEachForMulticast({
        tokens,
        notification: { title, body: notifBody },
        data,
      })
      messageId = `multicast:${response.successCount}/${tokens.length}`
    }

    // Log to Firestore
    await addDoc(collection(db, 'notificationLogs'), {
      target,
      targetId: targetId ?? null,
      title,
      body: notifBody,
      sentAt: serverTimestamp(),
      status: 'sent',
      adminId: 'admin',
    })

    return NextResponse.json({ success: true, messageId })
  } catch (err) {
    console.error('send-notification error:', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
