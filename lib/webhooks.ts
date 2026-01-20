import { randomBytes, createHmac } from 'crypto'
import { prisma } from './db'

export type WebhookEventType =
  | 'anomaly.detected'
  | 'daily_report.ready'
  | 'threshold.exceeded'
  | 'weekly_report.ready'

export interface WebhookPayload {
  event: WebhookEventType
  merchant_id: string
  timestamp: string
  data: Record<string, any>
}

/**
 * Generate a webhook secret
 */
export function generateWebhookSecret(): string {
  return 'whsec_' + randomBytes(32).toString('hex')
}

/**
 * Sign a webhook payload
 */
export function signWebhookPayload(payload: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000)
  const signedPayload = `${timestamp}.${payload}`
  const signature = createHmac('sha256', secret).update(signedPayload).digest('hex')
  return `t=${timestamp},v1=${signature}`
}

/**
 * Configure webhooks for a merchant
 */
export async function configureMerchantWebhook(
  merchantId: string,
  webhookUrl: string,
  events: WebhookEventType[]
): Promise<{ secret: string }> {
  const secret = generateWebhookSecret()

  await prisma.merchants.update({
    where: { id: merchantId },
    data: {
      webhook_url: webhookUrl,
      webhook_secret: secret,
      webhook_events: events
    }
  })

  return { secret }
}

/**
 * Remove webhook configuration for a merchant
 */
export async function removeMerchantWebhook(merchantId: string): Promise<boolean> {
  try {
    await prisma.merchants.update({
      where: { id: merchantId },
      data: {
        webhook_url: null,
        webhook_secret: null,
        webhook_events: []
      }
    })
    return true
  } catch (error) {
    console.error('Error removing webhook:', error)
    return false
  }
}

/**
 * Send a webhook to a merchant
 */
export async function sendWebhook(
  merchantId: string,
  event: WebhookEventType,
  data: Record<string, any>
): Promise<boolean> {
  try {
    // Get merchant webhook config
    const merchant = await prisma.merchants.findUnique({
      where: { id: merchantId },
      select: {
        webhook_url: true,
        webhook_secret: true,
        webhook_events: true
      }
    })

    if (!merchant?.webhook_url || !merchant?.webhook_secret) {
      return false
    }

    // Check if merchant is subscribed to this event
    if (!merchant.webhook_events.includes(event)) {
      return false
    }

    const payload: WebhookPayload = {
      event,
      merchant_id: merchantId,
      timestamp: new Date().toISOString(),
      data
    }

    const payloadString = JSON.stringify(payload)
    const signature = signWebhookPayload(payloadString, merchant.webhook_secret)

    // Send the webhook
    const response = await fetch(merchant.webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-KaChing-Signature': signature,
        'X-KaChing-Event': event
      },
      body: payloadString
    })

    // Log the webhook
    await prisma.webhook_logs.create({
      data: {
        merchant_id: merchantId,
        event_type: event,
        payload: payload as any,
        status_code: response.status,
        success: response.ok
      }
    })

    return response.ok
  } catch (error) {
    console.error('Error sending webhook:', error)

    // Log failed webhook
    await prisma.webhook_logs.create({
      data: {
        merchant_id: merchantId,
        event_type: event,
        payload: data as any,
        success: false,
        response: error instanceof Error ? error.message : 'Unknown error'
      }
    }).catch(() => {})

    return false
  }
}

/**
 * Send webhooks for detected anomalies
 */
export async function sendAnomalyWebhooks(
  merchantId: string,
  anomalies: Array<{
    metric: string
    type: string
    severity: string
    value: number
    expectedValue: number
    deviation: number
  }>
): Promise<void> {
  if (anomalies.length === 0) return

  await sendWebhook(merchantId, 'anomaly.detected', {
    anomaly_count: anomalies.length,
    anomalies: anomalies.map(a => ({
      metric: a.metric,
      type: a.type,
      severity: a.severity,
      actual_value: a.value,
      expected_value: a.expectedValue,
      deviation_percent: a.deviation
    }))
  })
}

/**
 * Send daily report webhook
 */
export async function sendDailyReportWebhook(
  merchantId: string,
  report: {
    date: string
    transactions: number
    revenue: number
    customers: number
    cashback: number
  }
): Promise<void> {
  await sendWebhook(merchantId, 'daily_report.ready', report)
}

/**
 * Get webhook logs for a merchant
 */
export async function getWebhookLogs(
  merchantId: string,
  limit: number = 50
): Promise<Array<{
  id: string
  eventType: string
  success: boolean
  statusCode?: number
  createdAt: Date
}>> {
  const logs = await prisma.webhook_logs.findMany({
    where: { merchant_id: merchantId },
    orderBy: { created_at: 'desc' },
    take: limit,
    select: {
      id: true,
      event_type: true,
      success: true,
      status_code: true,
      created_at: true
    }
  })

  return logs.map(log => ({
    id: log.id,
    eventType: log.event_type,
    success: log.success,
    statusCode: log.status_code || undefined,
    createdAt: log.created_at
  }))
}
