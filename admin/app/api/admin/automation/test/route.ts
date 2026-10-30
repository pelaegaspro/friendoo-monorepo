import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/guard'
import { dispatchAutomationEvent, AutomationEvent } from '@/lib/automation/dispatcher'

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    const body = await req.json()
    const { routeType, customWebhookUrl } = body

    let testEvent: AutomationEvent

    if (routeType === 'host.applied') {
      testEvent = {
        event: 'host.applied',
        data: {
          applicationId: 'test_app_' + Math.floor(Math.random() * 10000),
          name: 'Priya Sharma (Sample Applicant)',
          phone: '+919876543210',
          city: 'Bengaluru, Karnataka',
          age: 24,
          languages: ['Hindi', 'Tamil', 'English'],
          bio: 'Experienced RJ & active conversationalist excited to join Friendoo.',
          payoutType: 'upi',
          appliedAt: new Date().toISOString(),
          adminReviewUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/hosts`,
        },
      }
    } else {
      // Default to payment.completed
      testEvent = {
        event: 'payment.completed',
        data: {
          orderId: 'order_test_' + Date.now(),
          customerName: 'Rahul Verma (Sample Caller)',
          customerPhone: '+919812345678',
          amountInr: 100,
          coinsCredited: 100,
          paymentMode: 'UPI_GPay',
          status: 'success',
          completedAt: new Date().toISOString(),
        },
      }
    }

    const result = await dispatchAutomationEvent(testEvent, customWebhookUrl)

    return NextResponse.json({
      ok: result.success,
      eventSent: testEvent,
      dispatcherResult: result,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send test automation' },
      { status: 500 }
    )
  }
}

