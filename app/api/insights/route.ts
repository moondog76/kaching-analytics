import { NextRequest, NextResponse } from 'next/server'
import { InsightsEngine } from '@/lib/insights-engine'
import { DataLoader } from '@/lib/data-loader'


export async function GET(request: NextRequest) {
  try {
    // Load data
    const data = DataLoader.loadDemoData()
    const { historical } = DataLoader.processTransactions([])
    
    // Detect insights
    const insights = await InsightsEngine.detectInsights(
      data.carrefour,
      historical,
      data.competitors
    )
    
    return NextResponse.json({
      success: true,
      insights,
      detected_at: new Date().toISOString(),
      count: insights.length
    })
    
  } catch (error) {
    console.error('Insights detection error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to detect insights',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
