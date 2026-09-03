import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/guard'
import { setUserBanState } from '@/lib/admin/data'

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    const body = (await request.json().catch(() => null)) as { userId?: string; isBanned?: boolean } | null
    if (!body?.userId || typeof body.isBanned !== 'boolean') {
      return NextResponse.json({ error: 'Missing userId or isBanned' }, { status: 400 })
    }

    await setUserBanState(body.userId, body.isBanned)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 })
  }
}
