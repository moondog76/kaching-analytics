import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser, canAccessMerchant } from '@/lib/auth'
import { createMerchantApiKey, revokeMerchantApiKey } from '@/lib/api-keys'
import { configureMerchantWebhook, removeMerchantWebhook, getWebhookLogs, WebhookEventType } from '@/lib/webhooks'
import { updateMerchantBranding } from '@/lib/branding'

/**
 * GET /api/admin/merchants/[id]/settings
 * Get merchant settings including branding, API key status, and webhooks
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (user.role !== 'super_admin' && user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const hasAccess = await canAccessMerchant(user, id)
  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const merchant = await prisma.merchants.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        logo_url: true,
        primary_color: true,
        secondary_color: true,
        custom_domain: true,
        api_key: true,
        api_key_created: true,
        api_rate_limit: true,
        webhook_url: true,
        webhook_events: true
      }
    })

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 })
    }

    // Get recent webhook logs
    const webhookLogs = await getWebhookLogs(id, 10)

    return NextResponse.json({
      branding: {
        logoUrl: merchant.logo_url,
        primaryColor: merchant.primary_color || '#FF6B35',
        secondaryColor: merchant.secondary_color || '#7B61FF',
        customDomain: merchant.custom_domain
      },
      apiAccess: {
        hasApiKey: !!merchant.api_key,
        apiKeyPrefix: merchant.api_key ? merchant.api_key.substring(0, 15) + '...' : null,
        apiKeyCreated: merchant.api_key_created,
        rateLimit: merchant.api_rate_limit || 1000
      },
      webhooks: {
        url: merchant.webhook_url,
        events: merchant.webhook_events,
        recentLogs: webhookLogs
      }
    })
  } catch (error) {
    console.error('Error fetching merchant settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/merchants/[id]/settings
 * Update merchant settings
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (user.role !== 'super_admin' && user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const hasAccess = await canAccessMerchant(user, id)
  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { action, ...data } = body

    // Handle specific actions
    switch (action) {
      case 'generate_api_key': {
        const apiKey = await createMerchantApiKey(id)
        return NextResponse.json({
          success: true,
          apiKey, // Only shown once!
          message: 'API key generated. Save it securely - it will not be shown again.'
        })
      }

      case 'revoke_api_key': {
        await revokeMerchantApiKey(id)
        return NextResponse.json({ success: true, message: 'API key revoked' })
      }

      case 'configure_webhook': {
        const { webhookUrl, webhookEvents } = data
        if (!webhookUrl) {
          return NextResponse.json({ error: 'webhookUrl is required' }, { status: 400 })
        }
        const validEvents: WebhookEventType[] = ['anomaly.detected', 'daily_report.ready', 'threshold.exceeded', 'weekly_report.ready']
        const events = (webhookEvents || []).filter((e: string) => validEvents.includes(e as WebhookEventType))

        const { secret } = await configureMerchantWebhook(id, webhookUrl, events)
        return NextResponse.json({
          success: true,
          webhookSecret: secret, // Only shown once!
          message: 'Webhook configured. Save the secret securely - it will not be shown again.'
        })
      }

      case 'remove_webhook': {
        await removeMerchantWebhook(id)
        return NextResponse.json({ success: true, message: 'Webhook removed' })
      }

      case 'update_branding': {
        const { logoUrl, primaryColor, secondaryColor, customDomain } = data
        await updateMerchantBranding(id, {
          logoUrl,
          primaryColor,
          secondaryColor,
          customDomain
        })
        return NextResponse.json({ success: true, message: 'Branding updated' })
      }

      case 'update_rate_limit': {
        const { rateLimit } = data
        if (user.role !== 'super_admin') {
          return NextResponse.json({ error: 'Only super admins can change rate limits' }, { status: 403 })
        }
        await prisma.merchants.update({
          where: { id },
          data: { api_rate_limit: rateLimit }
        })
        return NextResponse.json({ success: true, message: 'Rate limit updated' })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error updating merchant settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
