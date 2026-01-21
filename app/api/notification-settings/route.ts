import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser, logAuditEvent } from '@/lib/auth'

// GET /api/notification-settings - Get user's notification preferences
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let settings = await prisma.notification_settings.findUnique({
      where: { user_id: user.id }
    })

    // If no settings exist, return defaults
    if (!settings) {
      settings = {
        id: '',
        user_id: user.id,
        email_anomalies: true,
        email_weekly_digest: true,
        email_threshold: true,
        slack_webhook_url: null,
        slack_anomalies: false,
        slack_threshold: false,
        threshold_revenue: null,
        threshold_txn: null,
        created_at: new Date(),
        updated_at: new Date()
      }
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error fetching notification settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notification settings' },
      { status: 500 }
    )
  }
}

// PUT /api/notification-settings - Update notification preferences
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      email_anomalies,
      email_weekly_digest,
      email_threshold,
      slack_webhook_url,
      slack_anomalies,
      slack_threshold,
      threshold_revenue,
      threshold_txn
    } = body

    // Validate Slack webhook URL if provided
    if (slack_webhook_url && !slack_webhook_url.startsWith('https://hooks.slack.com/')) {
      return NextResponse.json(
        { error: 'Invalid Slack webhook URL. It should start with https://hooks.slack.com/' },
        { status: 400 }
      )
    }

    // Upsert notification settings
    const settings = await prisma.notification_settings.upsert({
      where: { user_id: user.id },
      update: {
        email_anomalies: email_anomalies ?? true,
        email_weekly_digest: email_weekly_digest ?? true,
        email_threshold: email_threshold ?? true,
        slack_webhook_url: slack_webhook_url || null,
        slack_anomalies: slack_anomalies ?? false,
        slack_threshold: slack_threshold ?? false,
        threshold_revenue: threshold_revenue ? parseFloat(threshold_revenue) : null,
        threshold_txn: threshold_txn ? parseInt(threshold_txn) : null
      },
      create: {
        user_id: user.id,
        email_anomalies: email_anomalies ?? true,
        email_weekly_digest: email_weekly_digest ?? true,
        email_threshold: email_threshold ?? true,
        slack_webhook_url: slack_webhook_url || null,
        slack_anomalies: slack_anomalies ?? false,
        slack_threshold: slack_threshold ?? false,
        threshold_revenue: threshold_revenue ? parseFloat(threshold_revenue) : null,
        threshold_txn: threshold_txn ? parseInt(threshold_txn) : null
      }
    })

    // Log the action
    await logAuditEvent(
      user.id,
      user.merchantId || '',
      'update_notification_settings',
      'notification_settings',
      settings.id,
      { updated: Object.keys(body) },
      request
    )

    return NextResponse.json({
      success: true,
      settings
    })
  } catch (error) {
    console.error('Error updating notification settings:', error)
    return NextResponse.json(
      { error: 'Failed to update notification settings' },
      { status: 500 }
    )
  }
}

// POST /api/notification-settings/test - Test notifications
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, webhookUrl } = body

    if (type === 'slack') {
      if (!webhookUrl) {
        return NextResponse.json(
          { error: 'Slack webhook URL is required' },
          { status: 400 }
        )
      }

      // Import Slack utility
      const { sendSlackMessage } = await import('@/lib/slack')

      const result = await sendSlackMessage(webhookUrl, {
        text: 'Test notification from KaChing Analytics',
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '✅ Test Notification',
              emoji: true
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: 'This is a test notification from KaChing Analytics. If you received this, your Slack integration is working correctly!'
            }
          },
          {
            type: 'context',
            text: {
              type: 'mrkdwn',
              text: `Sent by ${user.name || user.email} at ${new Date().toLocaleString()}`
            }
          }
        ]
      })

      if (result.success) {
        return NextResponse.json({ success: true, message: 'Test notification sent to Slack' })
      } else {
        return NextResponse.json(
          { error: result.error || 'Failed to send test notification' },
          { status: 400 }
        )
      }
    }

    if (type === 'email') {
      const { sendEmail } = await import('@/lib/email')

      const result = await sendEmail({
        to: user.email,
        subject: 'KaChing Analytics - Test Notification',
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>Test Notification</h2>
            <p>This is a test notification from KaChing Analytics.</p>
            <p>If you received this, your email notifications are working correctly!</p>
            <p style="color: #666; font-size: 12px;">Sent at: ${new Date().toISOString()}</p>
          </div>
        `
      })

      if (result.success) {
        return NextResponse.json({ success: true, message: 'Test notification sent to your email' })
      } else {
        return NextResponse.json(
          { error: result.error || 'Failed to send test notification' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Invalid notification type. Use "slack" or "email"' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error sending test notification:', error)
    return NextResponse.json(
      { error: 'Failed to send test notification' },
      { status: 500 }
    )
  }
}
