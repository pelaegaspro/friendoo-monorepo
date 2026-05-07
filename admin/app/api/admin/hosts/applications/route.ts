import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/guard'
import { listHostApplications } from '@/lib/admin/data'

export async function GET(request: Request) {
  const unauthorized = requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') ?? undefined
    const applications = await listHostApplications(status)
    return NextResponse.json({ applications })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
