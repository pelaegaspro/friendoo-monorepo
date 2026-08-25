import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/guard'
import { listBannerAds } from '@/lib/admin/data'

export async function GET() {
  const unauthorized = requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    const ads = await listBannerAds()
    return NextResponse.json({ ads })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
