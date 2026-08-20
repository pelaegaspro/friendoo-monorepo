import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/guard'
import { reviewHostApplication } from '@/lib/admin/data'

export async function POST(request: Request) {
  const unauthorized = requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    const body = (await request.json().catch(() => null)) as { applicationId?: string; notes?: string } | null
    if (!body?.applicationId) {
      return NextResponse.json({ error: 'Missing applicationId' }, { status: 400 })
    }

    const result = await reviewHostApplication(body.applicationId, {
      action: 'approve',
      notes: body.notes,
    })
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 })
  }
}
