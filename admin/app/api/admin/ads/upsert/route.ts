import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/guard'
import { upsertBannerAd } from '@/lib/admin/data'

export async function POST(req: Request) {
  const unauthorized = await requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    const payload = await req.json()
    if (!payload.title || !payload.headline || !payload.subtitle) {
      return NextResponse.json({ error: 'Title, headline, and subtitle are required' }, { status: 400 })
    }

    const saved = await upsertBannerAd(payload)
    return NextResponse.json({ success: true, ad: saved })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
