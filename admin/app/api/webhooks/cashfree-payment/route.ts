import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { getSupabaseAdmin } from '@/lib/supabaseServer'
import { dispatchAutomationEvent } from '@/lib/automation/dispatcher'

function verifyCashfreePaymentSignature(
  secret: string,
  timestamp: string,
  rawBody: string,
  signature: string
): boolean {
  if (!secret || !timestamp || !rawBody || !signature) return false
  try {
    const expected = createHmac('sha256', secret).update(`${timestamp}${rawBody}`).digest('base64')
    const expectedBuffer = Buffer.from(expected, 'utf8')
    const signatureBuffer = Buffer.from(signature, 'utf8')
    if (expectedBuffer.length !== signatureBuffer.length) return false
    return timingSafeEqual(expectedBuffer, signatureBuffer)
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()

    // 1. Enforce payload size limit (max 64KB)
    if (rawBody.length > 64 * 1024) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
    }

    // 2. Validate Cashfree HMAC-SHA256 signature
    const secret = process.env.CASHFREE_SECRET_KEY?.trim()
    const signature = req.headers.get('x-webhook-signature')
    const timestamp = req.headers.get('x-webhook-timestamp')

    if (secret) {
      if (!signature || !timestamp) {
        return NextResponse.json({ error: 'Missing webhook signature headers' }, { status: 401 })
      }

      // Anti-replay: reject payloads older than 10 minutes
      const tsNum = Number(timestamp)
      if (Number.isFinite(tsNum) && Math.abs(Date.now() - tsNum) > 10 * 60 * 1000) {
        return NextResponse.json({ error: 'Webhook timestamp expired (replay attack detected)' }, { status: 401 })
      }

      const isValid = verifyCashfreePaymentSignature(secret, timestamp, rawBody, signature)
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid Cashfree webhook signature' }, { status: 401 })
      }
    }

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
      const paymentId = String(paymentData.cf_payment_id || paymentData.payment_id || `cf_pay_${orderId}`)
      const paymentMethod = String(paymentData.payment_group || paymentData.payment_method || 'UPI').slice(0, 64)

      // 1. Authoritative double-entry coin crediting via database RPC
      try {
        await supabase.rpc('credit_friendoo_payment', {
          p_provider_order_id: orderId,
          p_payment_id: paymentId,
          p_payment_method: paymentMethod,
        })
      } catch (rpcErr) {
        console.warn('credit_friendoo_payment RPC fallback note:', rpcErr)
        // Fallback update payment order record directly if provider_order_id differs
        await supabase
          .from('payment_orders')
          .update({
            status: 'success',
            updated_at: new Date().toISOString(),
          })
          .eq('order_id', orderId)
      }

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
        console.warn('Non-blocking payment automation warning:', err)
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
