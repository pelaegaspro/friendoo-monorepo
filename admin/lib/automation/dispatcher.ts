/**
 * Automation Webhook Dispatcher
 * Bridges Friendoo events (Host Applications, Payment Orders) to Make.com & Google Automations
 */

export interface HostAppliedEvent {
  event: 'host.applied'
  data: {
    applicationId: string
    name: string
    phone: string
    city: string
    age?: number
    languages: string[]
    bio?: string
    payoutType?: string
    appliedAt: string
    adminReviewUrl: string
  }
}

export interface PaymentCompletedEvent {
  event: 'payment.completed'
  data: {
    orderId: string
    customerName: string
    customerPhone?: string
    amountInr: number
    coinsCredited: number
    paymentMode?: string
    status: 'completed' | 'success'
    completedAt: string
  }
}

export interface ReportFlaggedEvent {
  event: 'report.flagged'
  data: {
    reportId: string
    reporterId: string
    reportedHostId: string
    reason: string
    createdAt: string
  }
}

export type AutomationEvent = HostAppliedEvent | PaymentCompletedEvent | ReportFlaggedEvent

export interface DispatchResult {
  success: boolean
  status?: number
  message?: string
}

export async function dispatchAutomationEvent(
  payload: AutomationEvent,
  customWebhookUrl?: string
): Promise<DispatchResult> {
  const webhookUrl =
    customWebhookUrl ||
    process.env.MAKE_AUTOMATION_WEBHOOK_URL ||
    process.env.AUTOMATION_WEBHOOK_URL

  if (!webhookUrl || !webhookUrl.trim().startsWith('http')) {
    // If webhook is not yet configured, log cleanly without throwing
    console.info('[Automation Dispatcher] No webhook URL configured. Skipping event:', payload.event)
    return { success: false, message: 'No webhook URL configured in environment or settings' }
  }

  const enrichedPayload = {
    ...payload,
    source: 'friendoo-backend',
    environment: process.env.NODE_ENV || 'production',
    dispatchedAt: new Date().toISOString(),
  }

  try {
    const response = await fetch(webhookUrl.trim(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Friendoo-Automation-Engine/1.0',
        'X-Friendoo-Event': payload.event,
      },
      body: JSON.stringify(enrichedPayload),
      signal: AbortSignal.timeout(6000), // 6-second timeout
    })

    if (!response.ok) {
      console.warn(
        `[Automation Dispatcher] Webhook returned status ${response.status} for event ${payload.event}`
      )
      return { success: false, status: response.status, message: `Webhook responded with status ${response.status}` }
    }

    return { success: true, status: response.status, message: 'Dispatched successfully' }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error(`[Automation Dispatcher] Failed to deliver ${payload.event}:`, errorMsg)
    return { success: false, message: errorMsg }
  }
}

