import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/guard'
import { upsertPackage } from '@/lib/admin/data'

export async function POST(request: Request) {
  const unauthorized = requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    const body = await request.json()
    const result = await upsertPackage(body)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 })
  }
}
