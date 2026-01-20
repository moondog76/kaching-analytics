// Predictive Recommendations Engine
import { prisma } from '@/lib/db'
import { Recommendation } from './types'
import { getMetricHistory, calculateStatistics } from './data-context'

export async function generateRecommendations(merchantId: string): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = []
  
  // Get merchant data
  const merchant = await prisma.merchants.findUnique({
    where: { id: merchantId }
  })
  if (!merchant) return recommendations

  // Get recent metrics
  const [revenueHistory, txnHistory, customerHistory, cashbackHistory] = await Promise.all([
    getMetricHistory(merchantId, 'revenue', 60),
    getMetricHistory(merchantId, 'transactions', 60),
    getMetricHistory(merchantId, 'customers', 60),
    getMetricHistory(merchantId, 'cashback', 60)
  ])

  // Calculate trends
  const revenueTrend = calculateTrend(revenueHistory.map(h => h.value))
  const txnTrend = calculateTrend(txnHistory.map(h => h.value))
  const customerTrend = calculateTrend(customerHistory.map(h => h.value))
  
  // Get current cashback rate
  const recentRevenue = revenueHistory.slice(-7).reduce((sum, h) => sum + h.value, 0)
  const recentCashback = cashbackHistory.slice(-7).reduce((sum, h) => sum + h.value, 0)
  const currentCashbackRate = recentRevenue > 0 ? (recentCashback / recentRevenue) * 100 : 0

  // 1. Cashback Optimization Recommendations
  if (txnTrend < -0.05) {
    // Declining transactions - suggest cashback increase
    recommendations.push({
      id: `rec-cashback-${Date.now()}`,
      type: 'optimization',
      priority: 'high',
      title: 'Increase Cashback to Boost Transactions',
      description: `Transaction volume is declining (${(txnTrend * 100).toFixed(1)}% trend). Consider increasing cashback rate from ${currentCashbackRate.toFixed(1)}% to ${(currentCashbackRate + 0.5).toFixed(1)}% to attract more customers.`,
      impact: {
        metric: 'transactions',
        estimatedChange: 12,
        confidence: 0.75
      },
      action: `Increase cashback rate by 0.5% for 2 weeks`,
      createdAt: new Date()
    })
  } else if (txnTrend > 0.1 && currentCashbackRate > 3) {
    // Strong growth with high cashback - suggest optimization
    recommendations.push({
      id: `rec-cashback-opt-${Date.now()}`,
      type: 'optimization',
      priority: 'medium',
      title: 'Optimize Cashback Spending',
      description: `Strong transaction growth (${(txnTrend * 100).toFixed(1)}% trend) suggests you can reduce cashback rate from ${currentCashbackRate.toFixed(1)}% to ${(currentCashbackRate - 0.3).toFixed(1)}% while maintaining momentum.`,
      impact: {
        metric: 'cashback',
        estimatedChange: -10,
        confidence: 0.7
      },
      action: `Reduce cashback rate by 0.3% and monitor for 1 week`,
      createdAt: new Date()
    })
  }

  // 2. Customer Retention Recommendations
  if (customerTrend < -0.08) {
    recommendations.push({
      id: `rec-retention-${Date.now()}`,
      type: 'retention',
      priority: 'high',
      title: '⚠️ Customer Retention Risk Detected',
      description: `Unique customer count is declining (${(customerTrend * 100).toFixed(1)}% trend). This could indicate customers switching to competitors.`,
      impact: {
        metric: 'customers',
        estimatedChange: 15,
        confidence: 0.8
      },
      action: `Launch a loyalty bonus: 2x cashback for returning customers this week`,
      createdAt: new Date()
    })
  }

  // 3. Growth Opportunity Recommendations
  if (revenueTrend > 0.05 && txnTrend > 0.05) {
    recommendations.push({
      id: `rec-growth-${Date.now()}`,
      type: 'growth',
      priority: 'medium',
      title: '📈 Growth Momentum Detected',
      description: `Both revenue (${(revenueTrend * 100).toFixed(1)}%) and transactions (${(txnTrend * 100).toFixed(1)}%) are trending upward. This is a good time to expand.`,
      impact: {
        metric: 'revenue',
        estimatedChange: 20,
        confidence: 0.65
      },
      action: `Consider launching a new category promotion to accelerate growth`,
      createdAt: new Date()
    })
  }

  // 4. Weekend Performance Recommendations
  const weekdayAvg = calculateWeekdayAverage(txnHistory)
  const weekendAvg = calculateWeekendAverage(txnHistory)
  
  if (weekendAvg < weekdayAvg * 0.6) {
    recommendations.push({
      id: `rec-weekend-${Date.now()}`,
      type: 'optimization',
      priority: 'medium',
      title: 'Weekend Performance Gap',
      description: `Weekend transactions are ${((1 - weekendAvg/weekdayAvg) * 100).toFixed(0)}% lower than weekdays. Consider weekend-specific promotions.`,
      impact: {
        metric: 'transactions',
        estimatedChange: 25,
        confidence: 0.7
      },
      action: `Launch "Weekend Bonus": +1% extra cashback on Sat-Sun`,
      createdAt: new Date()
    })
  }

  // 5. Average Transaction Value Recommendations
  const recentTxns = txnHistory.slice(-14).reduce((sum, h) => sum + h.value, 0)
  const recentRev = revenueHistory.slice(-14).reduce((sum, h) => sum + h.value, 0)
  const avgTxnValue = recentTxns > 0 ? recentRev / recentTxns : 0
  
  if (avgTxnValue < 50) {
    recommendations.push({
      id: `rec-basket-${Date.now()}`,
      type: 'growth',
      priority: 'low',
      title: 'Increase Average Basket Size',
      description: `Average transaction is ${avgTxnValue.toFixed(0)} RON. Consider tiered cashback to encourage larger purchases.`,
      impact: {
        metric: 'revenue',
        estimatedChange: 15,
        confidence: 0.6
      },
      action: `Offer bonus cashback for purchases over 100 RON`,
      createdAt: new Date()
    })
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  return recommendations.slice(0, 5) // Return top 5 recommendations
}

function calculateTrend(values: number[]): number {
  if (values.length < 7) return 0
  
  const recent = values.slice(-7)
  const previous = values.slice(-14, -7)
  
  if (previous.length === 0) return 0
  
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
  const previousAvg = previous.reduce((a, b) => a + b, 0) / previous.length
  
  if (previousAvg === 0) return 0
  return (recentAvg - previousAvg) / previousAvg
}

function calculateWeekdayAverage(history: Array<{ date: Date; value: number }>): number {
  const weekdays = history.filter(h => {
    const day = new Date(h.date).getDay()
    return day >= 1 && day <= 5
  })
  if (weekdays.length === 0) return 0
  return weekdays.reduce((sum, h) => sum + h.value, 0) / weekdays.length
}

function calculateWeekendAverage(history: Array<{ date: Date; value: number }>): number {
  const weekends = history.filter(h => {
    const day = new Date(h.date).getDay()
    return day === 0 || day === 6
  })
  if (weekends.length === 0) return 0
  return weekends.reduce((sum, h) => sum + h.value, 0) / weekends.length
}
