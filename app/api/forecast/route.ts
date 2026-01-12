import { NextRequest, NextResponse } from 'next/server'
import { ForecastingEngine } from '@/lib/forecasting-engine'
import { DataLoader } from '@/lib/data-loader'


export async function POST(request: NextRequest) {
  try {
    const { metric = 'transactions', days_ahead = 7 } = await request.json()
    
    // Load data and get time series
    const { timeSeries } = DataLoader.processTransactions([])
    
    if (!timeSeries[metric]) {
      return NextResponse.json(
        { error: `Invalid metric: ${metric}` },
        { status: 400 }
      )
    }
    
    // Generate forecast
    const forecast = await ForecastingEngine.forecastMetric(
      timeSeries[metric],
      days_ahead
    )
    
    return NextResponse.json({
      success: true,
      forecast,
      generated_at: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Forecasting error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to generate forecast',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
