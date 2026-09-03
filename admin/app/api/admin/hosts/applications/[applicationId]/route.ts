import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/guard'
import { reviewHostApplication } from '@/lib/admin/data'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  const { applicationId } = await params;
  const unauthorized = await requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    const body = (await request.json().catch(() => ({}))) as { action?: 'approve' | 'reject'; notes?: string }
    if (!body.action) {
      return NextResponse.json({ error: 'Missing action' }, { status: 400 })
    }

    const result = await reviewHostApplication(applicationId, {
      action: body.action,
      notes: body.notes,
    })
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 })
  }
}
