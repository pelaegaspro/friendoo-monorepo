import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/guard'
import { getAdminStats } from '@/lib/admin/data'

export async function GET() {
  const unauthorized = await requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    const stats = await getAdminStats()
    return NextResponse.json(stats)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
