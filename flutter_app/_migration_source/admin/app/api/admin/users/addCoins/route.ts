import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/guard'
import { addCoinsToUser } from '@/lib/admin/data'

export async function POST(request: Request) {
  const unauthorized = requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    const body = (await request.json().catch(() => null)) as { userId?: string; amountCoins?: number } | null
    if (!body?.userId || typeof body.amountCoins !== 'number') {
      return NextResponse.json({ error: 'Missing userId or amountCoins' }, { status: 400 })
    }

    await addCoinsToUser(body.userId, body.amountCoins)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 })
  }
}
