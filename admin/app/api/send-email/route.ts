import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { to, subject, html, template = 'custom' } = body

    if (!to || !subject || !html) {
      return NextResponse.json({ success: false, error: 'Missing required fields: to, subject, html' }, { status: 400 })
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    let recipients: string[] = []

    if (to === 'all') {
      // Fetch all user emails from Firestore
      const snap = await getDocs(collection(db, 'users'))
      recipients = snap.docs
        .map((d) => d.data().email as string)
        .filter(Boolean)
    } else {
      recipients = [to]
    }

    if (recipients.length === 0) {
      return NextResponse.json({ success: false, error: 'No recipients found' }, { status: 400 })
    }

    const info = await transporter.sendMail({
      from: `"Friendoo Admin" <${process.env.ADMIN_EMAIL}>`,
      to: recipients.join(', '),
      subject,
      html,
    })

    // Log to Firestore
    await addDoc(collection(db, 'emailLogs'), {
      to: to === 'all' ? 'all_users' : to,
      subject,
      template,
      sentAt: serverTimestamp(),
      status: 'sent',
      adminId: 'admin',
    })

    return NextResponse.json({ success: true, messageId: info.messageId })
  } catch (err) {
    console.error('send-email error:', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
