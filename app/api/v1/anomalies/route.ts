import { NextRequest, NextResponse } from 'next/server'
import { withApiKeyAuth } from '@/lib/api-keys'
import { prisma } from '@/lib/db'
import { calculateStatistics } from '@/lib/ai/data-context'

const METRICS = ['transactions', 'revenue', 'customers', 'cashback'] as const
const Z_THRESHOLD = 2.0

/**
 * GET /api/v1/anomalies
 * Public API endpoint for merchants to fetch detected anomalies
 *
 * Query params:
 * - days: lookback period for historical data (default: 90)
 * - threshold: z-score threshold (default: 2.0)
 *
 * Headers:
 * - Authorization: Bearer ka_live_xxx
 */
export async function GET(request: NextRequest) {
  return withApiKeyAuth(request, async (merchantId) => {
    const { searchParams } = new URL(request.url)
    const days = Math.min(parseInt(searchParams.get('days') || '90'), 180)
    const threshold = parseFloat(searchParams.get('threshold') || String(Z_THRESHOLD))

    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get daily metrics
    const dailyMetrics = await prisma.daily_metrics.findMany({
      where: {
        merchant_id: merchantId,
        date: { gte: startDate, lte: endDate }
      },
      orderBy: { date: 'asc' }
    })

    if (dailyMetrics.length < 7) {
      return NextResponse.json({
        merchant_id: merchantId,
        anomalies: [],
        message: `Insufficient data: only ${dailyMetrics.length} days of metrics found (need at least 7)`
      })
    }

    // Detect anomalies
    const anomalies: Array<{
      metric: string
      type: 'spike' | 'drop'
      severity: 'medium' | 'high'
      date: string
      value: number
      expected_value: number
      deviation_percent: number
      z_score: number
    }> = []

    for (const metric of METRICS) {
      const values = dailyMetrics.map(dm => {
        switch (metric) {
          case 'transactions': return dm.transactions_count || 0
          case 'revenue': return Number(dm.revenue || 0)
          case 'customers': return dm.unique_customers || 0
          case 'cashback': return Number(dm.cashback_paid || 0)
          default: return 0
        }
      })

      const stats = calculateStatistics(values)
      if (stats.stdDev === 0) continue

      // Check last 7 days
      const recentDays = dailyMetrics.slice(-7)
      const recentValues = values.slice(-7)

      recentValues.forEach((value, i) => {
        const zScore = (value - stats.mean) / stats.stdDev

        if (Math.abs(zScore) > threshold) {
          const isSpike = zScore > 0
          anomalies.push({
            metric,
            type: isSpike ? 'spike' : 'drop',
            severity: Math.abs(zScore) > 3 ? 'high' : 'medium',
            date: recentDays[i].date.toISOString().split('T')[0],
            value: Math.round(value * 100) / 100,
            expected_value: Math.round(stats.mean * 100) / 100,
            deviation_percent: Math.round(((value - stats.mean) / stats.mean) * 10000) / 100,
            z_score: Math.round(zScore * 100) / 100
          })
        }
      })
    }

    // Sort by date descending, then severity
    anomalies.sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date)
      return a.severity === 'high' ? -1 : 1
    })

    return NextResponse.json({
      merchant_id: merchantId,
      threshold_z_score: threshold,
      lookback_days: days,
      anomaly_count: anomalies.length,
      anomalies
    })
  })
}
