import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/guard'
import { listCalls } from '@/lib/admin/data'

export async function GET() {
  const unauthorized = await requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    const calls = await listCalls()
    return NextResponse.json({ calls })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
