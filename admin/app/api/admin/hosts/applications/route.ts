import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/guard'
import { listHostApplications } from '@/lib/admin/data'

export async function GET() {
  const unauthorized = requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    const applications = await listHostApplications()
    return NextResponse.json({ applications })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
