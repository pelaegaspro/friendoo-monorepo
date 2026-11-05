import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/guard'
import { getSupabaseAdmin, getOperationalAdminActorId } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdminApi()
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
      amount_paise: Math.round(amountInr * 100),
      upi_id: utr.trim(),
      status: 'paid',
      provider: 'manual_admin',
      provider_transfer_id: utr.trim(),
      provider_reference_id: utr.trim(),
      reviewed_by: actorId,
      reviewed_at: new Date().toISOString(),
      paid_at: new Date().toISOString(),
      processed_at: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function GET() {
  const unauthorized = await requireAdminApi()
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
      amountInr: Number(d.amount_paise || 0) / 100,
      status: d.status,
      utr: d.provider_transfer_id || d.provider_reference_id || d.upi_id,
      paidAt: d.paid_at || d.reviewed_at || d.created_at,
    }))

    return NextResponse.json({ payouts })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
