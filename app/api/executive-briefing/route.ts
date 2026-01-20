import { NextRequest, NextResponse } from 'next/server'
import { generateExecutiveBriefing } from '@/lib/ai/briefing-engine'
import { BriefingPeriod } from '@/lib/ai/types'
import { getCurrentUser, canAccessMerchant } from '@/lib/auth'

export async function GET(request: NextRequest) {
  // Auth check
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const requestedMerchantId = searchParams.get('merchantId')
    const merchantId = requestedMerchantId || user.merchantId
    const period = (searchParams.get('period') || 'daily') as BriefingPeriod

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId required' }, { status: 400 })
    }

    if (period !== 'daily' && period !== 'weekly') {
      return NextResponse.json({ error: 'period must be daily or weekly' }, { status: 400 })
    }

    // Permission check
    const hasAccess = await canAccessMerchant(user, merchantId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const briefing = await generateExecutiveBriefing(merchantId, period)

    if (!briefing) {
      return NextResponse.json({
        error: 'Merchant not found',
        merchantId
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      briefing,
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Executive briefing error:', error)
    return NextResponse.json({
      error: 'Failed to generate executive briefing',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
