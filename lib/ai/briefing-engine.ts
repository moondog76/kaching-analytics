// Executive Briefing Engine
import { prisma } from '@/lib/db'
import { ExecutiveBriefing, BriefingPeriod, MetricComparison, Recommendation } from './types'
import { getMetricHistory, calculateStatistics } from './data-context'

export async function generateExecutiveBriefing(
  merchantId: string,
  period: BriefingPeriod = 'daily'
): Promise<ExecutiveBriefing | null> {
  const merchant = await prisma.merchants.findUnique({
    where: { id: merchantId }
  })

  if (!merchant) return null

  // Define period boundaries
  const now = new Date()
  const periodDays = period === 'daily' ? 1 : 7
  const periodEnd = new Date(now)
  periodEnd.setHours(23, 59, 59, 999)

  const periodStart = new Date(now)
  periodStart.setDate(periodStart.getDate() - periodDays + 1)
  periodStart.setHours(0, 0, 0, 0)

  const previousPeriodEnd = new Date(periodStart)
  previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 1)
  previousPeriodEnd.setHours(23, 59, 59, 999)

  const previousPeriodStart = new Date(previousPeriodEnd)
  previousPeriodStart.setDate(previousPeriodStart.getDate() - periodDays + 1)
  previousPeriodStart.setHours(0, 0, 0, 0)

  // Fetch metrics for current and previous periods
  const [currentMetrics, previousMetrics] = await Promise.all([
    getPeriodMetrics(merchantId, periodStart, periodEnd),
    getPeriodMetrics(merchantId, previousPeriodStart, previousPeriodEnd)
  ])

  // Calculate comparisons
  const metrics = {
    transactions: calculateComparison(currentMetrics.transactions, previousMetrics.transactions),
    revenue: calculateComparison(currentMetrics.revenue, previousMetrics.revenue),
    customers: calculateComparison(currentMetrics.customers, previousMetrics.customers),
    cashback: calculateComparison(currentMetrics.cashback, previousMetrics.cashback),
    avgTransactionValue: calculateComparison(currentMetrics.avgTransactionValue, previousMetrics.avgTransactionValue)
  }

  // Generate highlights based on metric performance
  const highlights = generateHighlights(metrics, currentMetrics, period)

  // Generate alerts for critical issues
  const alerts = generateAlerts(metrics)

  // Get top recommendations (reuse recommendation logic)
  const topRecommendations = await getTopRecommendations(merchantId)

  // Calculate overall performance score
  const performanceScore = calculatePerformanceScore(metrics)

  // Generate executive summary
  const summary = generateSummary(merchant.name, metrics, period, performanceScore)

  return {
    id: `briefing-${merchantId}-${period}-${now.toISOString().split('T')[0]}`,
    merchantId,
    merchantName: merchant.name,
    period,
    periodStart,
    periodEnd,
    generatedAt: now,
    summary,
    metrics,
    highlights,
    alerts,
    topRecommendations,
    performanceScore
  }
}

async function getPeriodMetrics(
  merchantId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  transactions: number
  revenue: number
  customers: number
  cashback: number
  avgTransactionValue: number
}> {
  const dailyMetrics = await prisma.daily_metrics.findMany({
    where: {
      merchant_id: merchantId,
      date: { gte: startDate, lte: endDate }
    }
  })

  const transactions = dailyMetrics.reduce((sum, dm) => sum + (dm.transactions_count || 0), 0)
  const revenue = dailyMetrics.reduce((sum, dm) => sum + Number(dm.revenue || 0), 0)
  const customers = dailyMetrics.reduce((sum, dm) => sum + (dm.unique_customers || 0), 0)
  const cashback = dailyMetrics.reduce((sum, dm) => sum + Number(dm.cashback_paid || 0), 0)
  const avgTransactionValue = transactions > 0 ? revenue / transactions : 0

  return { transactions, revenue, customers, cashback, avgTransactionValue }
}

function calculateComparison(current: number, previous: number): MetricComparison {
  const change = current - previous
  const changePercent = previous > 0 ? (change / previous) * 100 : current > 0 ? 100 : 0

  let trend: 'up' | 'down' | 'stable'
  if (Math.abs(changePercent) < 2) {
    trend = 'stable'
  } else {
    trend = changePercent > 0 ? 'up' : 'down'
  }

  return { current, previous, change, changePercent, trend }
}

function generateHighlights(
  metrics: ExecutiveBriefing['metrics'],
  currentMetrics: { transactions: number; revenue: number; customers: number; cashback: number; avgTransactionValue: number },
  period: BriefingPeriod
): ExecutiveBriefing['highlights'] {
  const highlights: ExecutiveBriefing['highlights'] = []
  const periodLabel = period === 'daily' ? 'today' : 'this week'

  // Revenue highlight
  if (metrics.revenue.trend === 'up' && metrics.revenue.changePercent > 5) {
    highlights.push({
      icon: '💰',
      title: 'Revenue Growth',
      description: `Revenue increased by ${metrics.revenue.changePercent.toFixed(1)}% ${periodLabel}, reaching ${formatCurrency(currentMetrics.revenue)}.`,
      sentiment: 'positive'
    })
  } else if (metrics.revenue.trend === 'down' && metrics.revenue.changePercent < -5) {
    highlights.push({
      icon: '📉',
      title: 'Revenue Decline',
      description: `Revenue decreased by ${Math.abs(metrics.revenue.changePercent).toFixed(1)}% ${periodLabel}.`,
      sentiment: 'negative'
    })
  }

  // Transaction volume highlight
  if (metrics.transactions.trend === 'up' && metrics.transactions.changePercent > 10) {
    highlights.push({
      icon: '🛒',
      title: 'Transaction Surge',
      description: `${metrics.transactions.current.toLocaleString()} transactions processed, up ${metrics.transactions.changePercent.toFixed(1)}% from the previous period.`,
      sentiment: 'positive'
    })
  }

  // Customer highlight
  if (metrics.customers.trend === 'up' && metrics.customers.changePercent > 5) {
    highlights.push({
      icon: '👥',
      title: 'Customer Growth',
      description: `${metrics.customers.current.toLocaleString()} unique customers, an increase of ${metrics.customers.changePercent.toFixed(1)}%.`,
      sentiment: 'positive'
    })
  } else if (metrics.customers.trend === 'down' && metrics.customers.changePercent < -10) {
    highlights.push({
      icon: '⚠️',
      title: 'Customer Decline',
      description: `Unique customers dropped by ${Math.abs(metrics.customers.changePercent).toFixed(1)}%. Consider retention strategies.`,
      sentiment: 'negative'
    })
  }

  // Average transaction value highlight
  if (metrics.avgTransactionValue.trend === 'up' && metrics.avgTransactionValue.changePercent > 5) {
    highlights.push({
      icon: '📊',
      title: 'Higher Basket Size',
      description: `Average transaction value increased to ${formatCurrency(currentMetrics.avgTransactionValue)}, up ${metrics.avgTransactionValue.changePercent.toFixed(1)}%.`,
      sentiment: 'positive'
    })
  }

  // Cashback efficiency
  const cashbackRate = currentMetrics.revenue > 0 ? (currentMetrics.cashback / currentMetrics.revenue) * 100 : 0
  if (cashbackRate < 3 && currentMetrics.revenue > 0) {
    highlights.push({
      icon: '✨',
      title: 'Efficient Cashback',
      description: `Cashback rate at ${cashbackRate.toFixed(1)}% of revenue - healthy ROI on campaign spend.`,
      sentiment: 'positive'
    })
  }

  // If no highlights, add a neutral one
  if (highlights.length === 0) {
    highlights.push({
      icon: '📋',
      title: 'Steady Performance',
      description: `Metrics are stable ${periodLabel} with no significant changes from the previous period.`,
      sentiment: 'neutral'
    })
  }

  return highlights.slice(0, 5) // Max 5 highlights
}

function generateAlerts(metrics: ExecutiveBriefing['metrics']): ExecutiveBriefing['alerts'] {
  const alerts: ExecutiveBriefing['alerts'] = []

  // Critical: Revenue drop > 20%
  if (metrics.revenue.changePercent < -20) {
    alerts.push({
      severity: 'critical',
      message: `Revenue dropped ${Math.abs(metrics.revenue.changePercent).toFixed(1)}% - immediate attention required`,
      metric: 'revenue'
    })
  } else if (metrics.revenue.changePercent < -10) {
    alerts.push({
      severity: 'warning',
      message: `Revenue down ${Math.abs(metrics.revenue.changePercent).toFixed(1)}% from previous period`,
      metric: 'revenue'
    })
  }

  // Critical: Customer drop > 25%
  if (metrics.customers.changePercent < -25) {
    alerts.push({
      severity: 'critical',
      message: `Customer count dropped ${Math.abs(metrics.customers.changePercent).toFixed(1)}% - potential churn issue`,
      metric: 'customers'
    })
  } else if (metrics.customers.changePercent < -15) {
    alerts.push({
      severity: 'warning',
      message: `Unique customers down ${Math.abs(metrics.customers.changePercent).toFixed(1)}%`,
      metric: 'customers'
    })
  }

  // Warning: Transaction drop > 15%
  if (metrics.transactions.changePercent < -15) {
    alerts.push({
      severity: 'warning',
      message: `Transaction volume decreased by ${Math.abs(metrics.transactions.changePercent).toFixed(1)}%`,
      metric: 'transactions'
    })
  }

  return alerts
}

async function getTopRecommendations(merchantId: string): Promise<Recommendation[]> {
  try {
    // Import and call the recommendation engine directly
    const { generateRecommendations } = await import('./recommendation-engine')
    const recommendations = await generateRecommendations(merchantId)
    return recommendations.slice(0, 3) // Top 3 for executive view
  } catch (error) {
    console.error('Error generating recommendations for briefing:', error)
    return []
  }
}

function calculatePerformanceScore(metrics: ExecutiveBriefing['metrics']): number {
  // Score based on trends (0-100)
  let score = 50 // Base score

  // Revenue impact (most important)
  if (metrics.revenue.trend === 'up') {
    score += Math.min(metrics.revenue.changePercent * 1.5, 20)
  } else if (metrics.revenue.trend === 'down') {
    score += Math.max(metrics.revenue.changePercent * 1.5, -25)
  }

  // Transaction impact
  if (metrics.transactions.trend === 'up') {
    score += Math.min(metrics.transactions.changePercent * 0.8, 15)
  } else if (metrics.transactions.trend === 'down') {
    score += Math.max(metrics.transactions.changePercent * 0.8, -15)
  }

  // Customer impact
  if (metrics.customers.trend === 'up') {
    score += Math.min(metrics.customers.changePercent * 0.7, 10)
  } else if (metrics.customers.trend === 'down') {
    score += Math.max(metrics.customers.changePercent * 0.7, -10)
  }

  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, Math.round(score)))
}

function generateSummary(
  merchantName: string,
  metrics: ExecutiveBriefing['metrics'],
  period: BriefingPeriod,
  score: number
): string {
  const periodLabel = period === 'daily' ? 'Today' : 'This week'

  // Determine overall sentiment
  const positiveCount = Object.values(metrics).filter(m => m.trend === 'up').length
  const negativeCount = Object.values(metrics).filter(m => m.trend === 'down').length

  let sentiment: string
  if (score >= 70) {
    sentiment = 'strong performance'
  } else if (score >= 50) {
    sentiment = 'steady performance'
  } else if (score >= 30) {
    sentiment = 'mixed results'
  } else {
    sentiment = 'challenging conditions'
  }

  // Build summary
  const parts: string[] = []

  parts.push(`${periodLabel}, ${merchantName} showed ${sentiment} with a score of ${score}/100.`)

  // Highlight the most significant change
  const allMetrics = [
    { name: 'Revenue', ...metrics.revenue },
    { name: 'Transactions', ...metrics.transactions },
    { name: 'Customers', ...metrics.customers }
  ]

  const mostSignificant = allMetrics.reduce((prev, curr) =>
    Math.abs(curr.changePercent) > Math.abs(prev.changePercent) ? curr : prev
  )

  if (Math.abs(mostSignificant.changePercent) > 5) {
    const direction = mostSignificant.trend === 'up' ? 'increased' : 'decreased'
    parts.push(`${mostSignificant.name} ${direction} by ${Math.abs(mostSignificant.changePercent).toFixed(1)}%.`)
  }

  // Add recommendation teaser
  if (negativeCount > positiveCount) {
    parts.push('Review the recommendations below for improvement strategies.')
  } else if (positiveCount > 2) {
    parts.push('Continue current strategies to maintain momentum.')
  }

  return parts.join(' ')
}

function formatCurrency(amount: number): string {
  return `${amount.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RON`
}
