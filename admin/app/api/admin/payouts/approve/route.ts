import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/guard'
import { approveWithdrawal } from '@/lib/actions/payoutActions'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    const body = await req.json() as { hostId: string; payoutId: string; adminNote?: string }
    const { hostId, payoutId, adminNote } = body

    if (!hostId || !payoutId) {
      return NextResponse.json({ error: 'hostId and payoutId are required' }, { status: 400 })
    }

    const res = await approveWithdrawal(hostId, payoutId, adminNote || 'Approved by admin')
    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
