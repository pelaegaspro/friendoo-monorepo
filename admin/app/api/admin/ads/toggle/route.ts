import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/guard'
import { toggleBannerAd } from '@/lib/admin/data'

export async function POST(req: Request) {
  const unauthorized = requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    const { adId, isActive } = await req.json()
    if (!adId || typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'adId and isActive boolean are required' }, { status: 400 })
    }

    await toggleBannerAd(adId, isActive)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
