import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/guard'
import { getDb, getAdminApp, adminFieldValue } from '@/lib/firebaseAdmin'
import admin from 'firebase-admin'

export async function POST(req: NextRequest) {
  const unauthorized = requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    const { title, body, target, userId, topic } = await req.json() as {
      title: string; body: string; target: 'all' | 'topic' | 'user'; userId?: string; topic?: string
    }

    if (!title?.trim() || !body?.trim()) {
      return NextResponse.json({ error: 'title and body are required' }, { status: 400 })
    }

    getAdminApp() // ensure initialized
    const db = getDb()
    const messaging = admin.messaging()

    let targetLabel = 'all'
    let successCount = 0

    if (target === 'user' && userId) {
      // Send to specific user via their FCM tokens
      const userSnap = await db.collection('users').doc(userId).get()
      const tokens: string[] = []
      const d = userSnap.data() ?? {}
      if (typeof d.fcmToken === 'string' && d.fcmToken) tokens.push(d.fcmToken)
      if (Array.isArray(d.fcmTokens)) tokens.push(...d.fcmTokens.filter((t: unknown) => typeof t === 'string'))

      if (tokens.length === 0) {
        return NextResponse.json({ error: 'User has no registered FCM token' }, { status: 400 })
      }

      const result = await messaging.sendEachForMulticast({ tokens, notification: { title, body } })
      successCount = result.successCount
      targetLabel = `user:${userId}`
    } else if (target === 'topic' && topic) {
      // Send to topic
      await messaging.send({ topic, notification: { title, body } })
      successCount = 1
      targetLabel = `topic:${topic}`
    } else {
      // Send to all — fetch all FCM tokens
      const usersSnap = await db.collection('users').get()
      const tokens: string[] = []
      usersSnap.forEach((doc) => {
        const d = doc.data()
        if (typeof d.fcmToken === 'string' && d.fcmToken) tokens.push(d.fcmToken)
        if (Array.isArray(d.fcmTokens)) tokens.push(...d.fcmTokens.filter((t: unknown) => typeof t === 'string'))
      })

      // FCM multicast max 500 per batch
      const batches = []
      for (let i = 0; i < tokens.length; i += 500) {
        batches.push(tokens.slice(i, i + 500))
      }
      for (const batch of batches) {
        const result = await messaging.sendEachForMulticast({ tokens: batch, notification: { title, body } })
        successCount += result.successCount
      }
      targetLabel = `all (${tokens.length} tokens)`
    }

    // Log the notification
    await db.collection('notificationLogs').add({
      title,
      body,
      target: targetLabel,
      sentAt: adminFieldValue.serverTimestamp(),
      sentBy: 'admin',
      successCount,
    })

    return NextResponse.json({ success: true, successCount })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function GET() {
  const unauthorized = requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    const db = getDb()
    const snap = await db.collection('notificationLogs').orderBy('sentAt', 'desc').limit(50).get()
    const logs = snap.docs.map((doc) => {
      const d = doc.data()
      return {
        id: doc.id,
        title: typeof d.title === 'string' ? d.title : '',
        body: typeof d.body === 'string' ? d.body : '',
        target: typeof d.target === 'string' ? d.target : 'all',
        sentAt: d.sentAt?.toDate?.()?.toISOString() ?? null,
        sentBy: typeof d.sentBy === 'string' ? d.sentBy : 'admin',
      }
    })
    return NextResponse.json({ logs })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
