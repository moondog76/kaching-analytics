import { NextRequest, NextResponse } from 'next/server'
import { generateRecommendations } from '@/lib/ai/recommendation-engine'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    
    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId required' }, { status: 400 })
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
