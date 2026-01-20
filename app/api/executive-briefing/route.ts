import { NextRequest, NextResponse } from 'next/server'
import { generateExecutiveBriefing } from '@/lib/ai/briefing-engine'
import { BriefingPeriod } from '@/lib/ai/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    const period = (searchParams.get('period') || 'daily') as BriefingPeriod

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId required' }, { status: 400 })
    }

    if (period !== 'daily' && period !== 'weekly') {
      return NextResponse.json({ error: 'period must be daily or weekly' }, { status: 400 })
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
