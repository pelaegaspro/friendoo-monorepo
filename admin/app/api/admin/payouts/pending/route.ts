import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/guard'
import { getSupabaseAdmin } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

export async function GET() {
  const unauthorized = await requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('host_payouts')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error

    const pendingPayouts = (data ?? []).map((d) => {
      const details = (d.payout_details && typeof d.payout_details === 'object' ? d.payout_details : {}) as Record<string, unknown>
      return {
        id: d.id,
        hostId: d.host_id,
        amount: d.amount_inr,
        upiId: typeof details.upi_id === 'string' ? details.upi_id : (typeof details.upiId === 'string' ? details.upiId : 'Encrypted on file'),
        status: d.status,
        requestedAt: d.created_at,
      }
    })

    return NextResponse.json({ pendingPayouts })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
