import { NextRequest, NextResponse } from 'next/server'
import { withApiKeyAuth } from '@/lib/api-keys'
import { prisma } from '@/lib/db'
import { ForecastingEngine } from '@/lib/forecasting-engine'
import { subDays } from 'date-fns'

/**
 * GET /api/v1/forecast
 * Public API endpoint for merchants to get forecasts
 *
 * Query params:
 * - metric: transactions | revenue | customers | cashback (default: transactions)
 * - days: forecast horizon (default: 7, max: 30)
 *
 * Headers:
 * - Authorization: Bearer ka_live_xxx
 */
export async function GET(request: NextRequest) {
  return withApiKeyAuth(request, async (merchantId) => {
    const { searchParams } = new URL(request.url)
    const metric = searchParams.get('metric') || 'transactions'
    const forecastDays = Math.min(parseInt(searchParams.get('days') || '7'), 30)

    // Validate metric
    const validMetrics = ['transactions', 'revenue', 'customers', 'cashback']
    if (!validMetrics.includes(metric)) {
      return NextResponse.json({
        error: 'Invalid metric',
        valid_metrics: validMetrics
      }, { status: 400 })
    }

    // Get historical data (need at least 14 days)
    const endDate = new Date()
    const startDate = subDays(endDate, 60)

    const dailyMetrics = await prisma.daily_metrics.findMany({
      where: {
        merchant_id: merchantId,
        date: { gte: startDate, lte: endDate }
      },
      orderBy: { date: 'asc' }
    })

    if (dailyMetrics.length < 14) {
      return NextResponse.json({
        error: 'Insufficient data',
        message: `Need at least 14 days of data for forecasting, found ${dailyMetrics.length}`
      }, { status: 400 })
    }

    // Prepare time series data
    const historicalData = dailyMetrics.map(dm => {
      let value: number
      switch (metric) {
        case 'transactions': value = dm.transactions_count || 0; break
        case 'revenue': value = Number(dm.revenue || 0); break
        case 'customers': value = dm.unique_customers || 0; break
        case 'cashback': value = Number(dm.cashback_paid || 0); break
        default: value = 0
      }
      return {
        date: dm.date.toISOString().split('T')[0],
        value,
        metric
      }
    })

    try {
      const forecast = await ForecastingEngine.forecastMetric(historicalData, forecastDays)

      return NextResponse.json({
        merchant_id: merchantId,
        metric,
        methodology: forecast.methodology,
        accuracy: {
          mape: Math.round(forecast.accuracy_metrics.mape * 100) / 100,
          rmse: Math.round(forecast.accuracy_metrics.rmse * 100) / 100
        },
        forecast: forecast.forecast.map((point, i) => ({
          date: point.date,
          predicted_value: point.value,
          confidence_interval: {
            lower: forecast.confidence_interval.lower[i],
            upper: forecast.confidence_interval.upper[i]
          }
        }))
      })
    } catch (error) {
      return NextResponse.json({
        error: 'Forecast failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 })
    }
  })
}
