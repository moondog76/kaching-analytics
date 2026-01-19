import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Anomaly, MetricType } from '@/lib/ai/types'
import { calculateStatistics } from '@/lib/ai/data-context'

const METRICS: MetricType[] = ['transactions', 'revenue', 'customers', 'cashback']
const Z_THRESHOLD = 2.0

export async function GET(request: NextRequest) {
  const merchantId = request.nextUrl.searchParams.get('merchantId')
  
  if (!merchantId) {
    return NextResponse.json({ error: 'merchantId required' }, { status: 400 })
  }
  
  try {
    // Check if merchant exists
    const merchant = await prisma.merchants.findFirst({
      where: { name: { contains: 'Carrefour', mode: 'insensitive' } }
    })
    
    if (!merchant) {
      return NextResponse.json({ 
        error: 'Merchant not found', 
        merchantId,
        anomalies: [],
        count: 0
      })
    }
    
    // Get daily metrics for the last 90 days
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 90)
    
    const dailyMetrics = await prisma.daily_metrics.findMany({
      where: {
        merchant_id: merchantId,
        date: { gte: startDate, lte: endDate }
      },
      orderBy: { date: 'asc' }
    })
    
    if (dailyMetrics.length < 7) {
      return NextResponse.json({
        merchantId,
        merchantName: merchant.name,
        anomalies: [],
        count: 0,
        message: `Insufficient data: only ${dailyMetrics.length} days of metrics found (need at least 7)`
      })
    }
    
    // Detect anomalies
    const anomalies: Anomaly[] = []
    
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
      
      // Check last 7 days for anomalies
      const recentDays = dailyMetrics.slice(-7)
      const recentValues = values.slice(-7)
      
      recentValues.forEach((value, i) => {
        const zScore = (value - stats.mean) / stats.stdDev
        
        if (Math.abs(zScore) > Z_THRESHOLD) {
          const isSpike = zScore > 0
          anomalies.push({
            id: `${merchantId}-${metric}-${recentDays[i].date.toISOString()}`,
            merchantId,
            metric,
            type: isSpike ? 'spike' : 'drop',
            severity: Math.abs(zScore) > 3 ? 'high' : 'medium',
            value,
            expectedValue: stats.mean,
            deviation: ((value - stats.mean) / stats.mean) * 100,
            date: recentDays[i].date,
            description: `${metric} ${isSpike ? 'spike' : 'drop'}: ${value.toFixed(0)} vs expected ${stats.mean.toFixed(0)}`,
            recommendation: isSpike 
              ? `Investigate what caused the ${metric} increase` 
              : `Review factors that may have reduced ${metric}`
          })
        }
      })
    }
    
    return NextResponse.json({
      merchantId,
      merchantName: merchant.name,
      anomalies,
      count: anomalies.length,
      date: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Anomaly detection error:', error)
    return NextResponse.json({ 
      error: 'Failed to detect anomalies',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
