import { logApiAccess } from '@/lib/security/audit';
import { NextRequest, NextResponse } from 'next/server'
import { ForecastingEngine } from '@/lib/forecasting-engine'
import { DataLoader } from '@/lib/data-loader'

export async function POST(request: NextRequest) {
  try {
    const { metric = 'transactions', days_ahead = 7 } = await request.json()
    
    // Load data and get time series
    const { timeSeries } = DataLoader.processTransactions([])
    
    const metricData = (timeSeries as any)[metric]
    
    if (!metricData) {
      return NextResponse.json(
        { error: `Invalid metric: ${metric}` },
        { status: 400 }
      )
    }
    
    // Generate forecast
    const forecast = await ForecastingEngine.forecastMetric(metricData, days_ahead)
    
    return NextResponse.json(forecast)
  } catch (error) {
    console.error('Forecast error:', error)
    return NextResponse.json(
      { error: 'Failed to generate forecast' },
      { status: 500 }
    )
  }
}
