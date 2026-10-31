import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/guard'
import { deleteBannerAd } from '@/lib/admin/data'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ adId: string }> }
) {
  const unauthorized = await requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    const resolvedParams = await Promise.resolve(params)
    const adId = resolvedParams.adId

    if (!adId) {
      return NextResponse.json({ error: 'adId is required' }, { status: 400 })
    }

    await deleteBannerAd(adId)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
