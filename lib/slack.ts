/**
 * Slack notification utility
 * Sends messages to Slack via incoming webhooks
 */

export interface SlackMessage {
  text: string
  blocks?: SlackBlock[]
  attachments?: SlackAttachment[]
}

export interface SlackBlock {
  type: 'section' | 'header' | 'divider' | 'context'
  text?: {
    type: 'plain_text' | 'mrkdwn'
    text: string
    emoji?: boolean
  }
  fields?: Array<{
    type: 'plain_text' | 'mrkdwn'
    text: string
  }>
  accessory?: any
}

export interface SlackAttachment {
  color?: string
  pretext?: string
  author_name?: string
  title?: string
  title_link?: string
  text?: string
  fields?: Array<{
    title: string
    value: string
    short?: boolean
  }>
  footer?: string
  ts?: number
}

export interface SlackResult {
  success: boolean
  error?: string
}

/**
 * Send a message to Slack via webhook
 */
export async function sendSlackMessage(
  webhookUrl: string,
  message: SlackMessage
): Promise<SlackResult> {
  try {
    if (!webhookUrl) {
      return { success: false, error: 'No webhook URL provided' }
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    })

    if (!response.ok) {
      const text = await response.text()
      return { success: false, error: text || 'Slack API error' }
    }

    return { success: true }
  } catch (error) {
    console.error('Slack notification error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send Slack message'
    }
  }
}

/**
 * Send an anomaly alert to Slack
 */
export async function sendAnomalyAlert(
  webhookUrl: string,
  anomaly: {
    type: string
    metric: string
    expectedValue: number
    actualValue: number
    deviationPercent: number
    merchantName: string
    dashboardUrl?: string
  }
): Promise<SlackResult> {
  const isNegative = anomaly.actualValue < anomaly.expectedValue
  const color = isNegative ? '#EF4444' : '#F59E0B' // Red for drops, yellow for spikes

  const message: SlackMessage = {
    text: `Anomaly detected for ${anomaly.merchantName}: ${anomaly.metric}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `⚠️ Anomaly Alert: ${anomaly.merchantName}`,
          emoji: true
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Metric:*\n${anomaly.metric}`
          },
          {
            type: 'mrkdwn',
            text: `*Type:*\n${anomaly.type}`
          },
          {
            type: 'mrkdwn',
            text: `*Expected:*\n${formatNumber(anomaly.expectedValue)}`
          },
          {
            type: 'mrkdwn',
            text: `*Actual:*\n${formatNumber(anomaly.actualValue)}`
          },
          {
            type: 'mrkdwn',
            text: `*Deviation:*\n${isNegative ? '' : '+'}${anomaly.deviationPercent.toFixed(1)}%`
          }
        ]
      },
      {
        type: 'divider'
      },
      {
        type: 'context',
        text: {
          type: 'mrkdwn',
          text: anomaly.dashboardUrl
            ? `<${anomaly.dashboardUrl}|View Dashboard> | KaChing Analytics`
            : 'KaChing Analytics'
        }
      }
    ],
    attachments: [
      {
        color,
        footer: `Detected at ${new Date().toISOString()}`
      }
    ]
  }

  return sendSlackMessage(webhookUrl, message)
}

/**
 * Send a threshold alert to Slack
 */
export async function sendThresholdAlert(
  webhookUrl: string,
  alert: {
    metric: string
    threshold: number
    actualValue: number
    merchantName: string
    dashboardUrl?: string
  }
): Promise<SlackResult> {
  const message: SlackMessage = {
    text: `Threshold alert for ${alert.merchantName}: ${alert.metric} dropped below ${formatNumber(alert.threshold)}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `🚨 Threshold Alert: ${alert.merchantName}`,
          emoji: true
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Metric:*\n${alert.metric}`
          },
          {
            type: 'mrkdwn',
            text: `*Threshold:*\n${formatNumber(alert.threshold)}`
          },
          {
            type: 'mrkdwn',
            text: `*Current Value:*\n${formatNumber(alert.actualValue)}`
          }
        ]
      },
      {
        type: 'context',
        text: {
          type: 'mrkdwn',
          text: alert.dashboardUrl
            ? `<${alert.dashboardUrl}|View Dashboard> | KaChing Analytics`
            : 'KaChing Analytics'
        }
      }
    ],
    attachments: [
      {
        color: '#EF4444',
        footer: `Alert triggered at ${new Date().toISOString()}`
      }
    ]
  }

  return sendSlackMessage(webhookUrl, message)
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toLocaleString()
}
