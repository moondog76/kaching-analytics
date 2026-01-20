import { NextRequest, NextResponse } from 'next/server'
import { generateRecommendations } from '@/lib/ai/recommendation-engine'
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

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId required' }, { status: 400 })
    }

    // Permission check
    const hasAccess = await canAccessMerchant(user, merchantId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const recommendations = await generateRecommendations(merchantId)

    return NextResponse.json({
      merchantId,
      recommendations,
      count: recommendations.length,
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Recommendations error:', error)
    return NextResponse.json({
      error: 'Failed to generate recommendations',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
