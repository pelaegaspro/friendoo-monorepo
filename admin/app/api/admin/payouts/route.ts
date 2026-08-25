import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/guard'
import { getSupabaseAdmin, getOperationalAdminActorId } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const unauthorized = requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    const body = await req.json() as { hostId: string; utr: string; amountInr: number }
    const { hostId, utr, amountInr } = body

    if (!hostId || !utr || typeof amountInr !== 'number') {
      return NextResponse.json({ error: 'hostId, utr and amountInr are required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const actorId = getOperationalAdminActorId()

    await supabase.from('host_payouts').insert({
      host_id: hostId,
      amount_inr: amountInr,
      amount_paise: Math.round(amountInr * 100),
      status: 'paid',
      payout_method_type: 'upi',
      idempotency_key: `manual_payout:${hostId}:${Date.now()}`,
      provider: 'manual_admin',
      provider_transfer_id: utr.trim(),
      reviewed_by: actorId,
      reviewed_at: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function GET() {
  const unauthorized = requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('host_payouts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error

    const payouts = (data ?? []).map((d) => ({
      id: d.id,
      hostId: d.host_id,
      amountInr: d.amount_inr,
      status: d.status,
      utr: d.provider_transfer_id,
      paidAt: d.reviewed_at || d.created_at,
    }))

    return NextResponse.json({ payouts })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
