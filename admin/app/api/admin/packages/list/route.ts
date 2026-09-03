import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/guard'
import { listPackages } from '@/lib/admin/data'

export async function GET() {
  const unauthorized = await requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    const packages = await listPackages()
    return NextResponse.json({ packages })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
