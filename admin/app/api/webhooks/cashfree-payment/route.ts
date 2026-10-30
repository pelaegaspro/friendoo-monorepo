import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseServer'
import { dispatchAutomationEvent } from '@/lib/automation/dispatcher'

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    let payload: Record<string, unknown>

    try {
      payload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 })
    }

    const data = (payload.data || payload) as Record<string, unknown>
    const orderData = (data.order || data) as Record<string, unknown>
    const paymentData = (data.payment || {}) as Record<string, unknown>
    const customerDetails = (data.customer_details || {}) as Record<string, unknown>

    const orderId = String(orderData.order_id || orderData.orderId || '')
    const orderAmount = Number(orderData.order_amount || orderData.amount || 0)
    const orderStatus = String(
      paymentData.payment_status || orderData.order_status || data.status || ''
    ).toUpperCase()

    if (!orderId) {
      return NextResponse.json({ status: 'ignored', message: 'No order_id in webhook' })
    }

    // Only process successful payments
    if (orderStatus === 'SUCCESS') {
      const supabase = getSupabaseAdmin()

      // 1. Update payment order record in database if present
      await supabase
        .from('payment_orders')
        .update({
          status: 'success',
          updated_at: new Date().toISOString(),
        })
        .eq('order_id', orderId)

      // 2. Dispatch Route 2: payment.completed -> Make.com -> Google Sheets (Accounting) & Telegram (Revenue Alert)
      const customerName = String(
        customerDetails.customer_name || customerDetails.name || 'Friendoo User'
      )
      const customerPhone = String(
        customerDetails.customer_phone || customerDetails.phone || ''
      )

      void dispatchAutomationEvent({
        event: 'payment.completed',
        data: {
          orderId,
          customerName,
          customerPhone,
          amountInr: orderAmount,
          coinsCredited: Math.round(orderAmount), // 1 coin = ₹1 or based on package
          paymentMode: String(paymentData.payment_group || 'UPI'),
          status: 'success',
          completedAt: new Date().toISOString(),
        },
      }).catch((err) => {
        console.warn('Non-blocking payment automation warning:', err);
      })
    }

    return NextResponse.json({
      ok: true,
      orderId,
      status: orderStatus,
    })
  } catch (error) {
    console.error('Cashfree PG payment webhook error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook error' },
      { status: 500 }
    )
  }
}

