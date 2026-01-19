// Anomaly Detection Service
import { prisma } from '@/lib/db'
import { Anomaly, AnomalySeverity, AnomalyType, MetricType } from './types'
import { getMetricHistory, calculateStatistics } from './data-context'

interface AnomalyConfig {
  // Number of standard deviations for each severity level
  thresholds: {
    low: number      // 1.5 std dev
    medium: number   // 2.0 std dev
    high: number     // 2.5 std dev
    critical: number // 3.0 std dev
  }
  // Minimum data points needed for reliable detection
  minDataPoints: number
  // Days to look back for baseline calculation
  baselineDays: number
}

const DEFAULT_CONFIG: AnomalyConfig = {
  thresholds: {
    low: 1.5,
    medium: 2.0,
    high: 2.5,
    critical: 3.0
  },
  minDataPoints: 7,
  baselineDays: 30
}

function generateId(): string {
  return `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function getSeverity(deviation: number, config: AnomalyConfig): AnomalySeverity {
  const absDeviation = Math.abs(deviation)
  if (absDeviation >= config.thresholds.critical) return 'critical'
  if (absDeviation >= config.thresholds.high) return 'high'
  if (absDeviation >= config.thresholds.medium) return 'medium'
  return 'low'
}

function getAnomalyType(currentValue: number, expectedValue: number, trend: number[]): AnomalyType {
  const percentChange = ((currentValue - expectedValue) / expectedValue) * 100
  
  // Check for trend change (last 3 days vs previous 3 days)
  if (trend.length >= 6) {
    const recent = trend.slice(-3)
    const previous = trend.slice(-6, -3)
    const recentAvg = recent.reduce((a, b) => a + b, 0) / 3
    const previousAvg = previous.reduce((a, b) => a + b, 0) / 3
    const trendChange = ((recentAvg - previousAvg) / previousAvg) * 100
    
    if (Math.abs(trendChange) > 20) {
      return 'trend_change'
    }
  }
  
  if (percentChange > 0) return 'spike'
  if (percentChange < 0) return 'drop'
  return 'unusual_pattern'
}

function generateDescription(
  metric: MetricType,
  type: AnomalyType,
  value: number,
  expectedValue: number,
  deviation: number
): string {
  const metricLabels: Record<MetricType, string> = {
    transactions: 'transactions',
    revenue: 'revenue',
    customers: 'unique customers',
    cashback: 'cashback paid',
    avg_transaction: 'average transaction value'
  }
  
  const metricLabel = metricLabels[metric]
  const percentChange = Math.abs(((value - expectedValue) / expectedValue) * 100).toFixed(1)
  
  switch (type) {
    case 'spike':
      return `${metricLabel.charAt(0).toUpperCase() + metricLabel.slice(1)} spiked ${percentChange}% above expected (${value.toLocaleString()} vs ${expectedValue.toLocaleString()} expected)`
    case 'drop':
      return `${metricLabel.charAt(0).toUpperCase() + metricLabel.slice(1)} dropped ${percentChange}% below expected (${value.toLocaleString()} vs ${expectedValue.toLocaleString()} expected)`
    case 'trend_change':
      return `Significant trend change detected in ${metricLabel} - ${deviation > 0 ? 'upward' : 'downward'} shift of ${percentChange}%`
    case 'unusual_pattern':
      return `Unusual pattern detected in ${metricLabel} - deviation of ${percentChange}% from normal`
  }
}

function generateRecommendation(
  metric: MetricType,
  type: AnomalyType,
  severity: AnomalySeverity
): string {
  const recommendations: Record<MetricType, Record<AnomalyType, string>> = {
    transactions: {
      spike: 'Investigate what drove increased activity. Consider if this can be replicated.',
      drop: 'Check for technical issues, competitor promotions, or seasonal factors.',
      trend_change: 'Monitor closely over next few days to confirm trend direction.',
      unusual_pattern: 'Review transaction logs for any unusual customer behavior.'
    },
    revenue: {
      spike: 'Analyze which products/categories drove growth. Consider inventory impact.',
      drop: 'Review pricing, promotions, and customer feedback for issues.',
      trend_change: 'Evaluate if trend aligns with business strategy or needs intervention.',
      unusual_pattern: 'Check for large transactions or refunds affecting totals.'
    },
    customers: {
      spike: 'Great acquisition! Ensure onboarding experience meets expectations.',
      drop: 'Review customer feedback, check for churn indicators.',
      trend_change: 'Assess marketing campaign effectiveness and customer lifecycle.',
      unusual_pattern: 'Investigate customer demographics and acquisition channels.'
    },
    cashback: {
      spike: 'Review if cashback rates are sustainable. Check for abuse patterns.',
      drop: 'Ensure cashback is being properly tracked and credited.',
      trend_change: 'Evaluate cashback strategy effectiveness.',
      unusual_pattern: 'Audit cashback transactions for irregularities.'
    },
    avg_transaction: {
      spike: 'Identify high-value transactions. Opportunity for premium segment.',
      drop: 'Check for discount abuse or product mix shift.',
      trend_change: 'Review pricing strategy and product recommendations.',
      unusual_pattern: 'Analyze basket composition for insights.'
    }
  }
  
  return recommendations[metric][type]
}

export async function detectAnomalies(
  merchantId: string,
  config: AnomalyConfig = DEFAULT_CONFIG
): Promise<Anomaly[]> {
  const anomalies: Anomaly[] = []
  const metrics: MetricType[] = ['transactions', 'revenue', 'customers', 'cashback', 'avg_transaction']
  
  // Get merchant name
  const merchant = await prisma.merchants.findFirst({
    where: { name: { contains: 'Carrefour', mode: 'insensitive' } },
    select: { name: true }
  })
  
  for (const metric of metrics) {
    const history = await getMetricHistory(merchantId, metric, config.baselineDays)
    
    if (history.length < config.minDataPoints) {
      continue // Not enough data for reliable detection
    }
    
    const values = history.map(h => h.value)
    const stats = calculateStatistics(values.slice(0, -1)) // Exclude latest for baseline
    const latestValue = values[values.length - 1]
    
    if (stats.stdDev === 0) continue // No variation, skip
    
    // Calculate z-score (number of standard deviations from mean)
    const zScore = (latestValue - stats.mean) / stats.stdDev
    
    // Check if anomaly threshold is exceeded
    if (Math.abs(zScore) >= config.thresholds.low) {
      const severity = getSeverity(zScore, config)
      const type = getAnomalyType(latestValue, stats.mean, values)
      
      anomalies.push({
        id: generateId(),
        type,
        severity,
        metric,
        merchantId,
        
        date: new Date(),
        value: latestValue,
        expectedValue: stats.mean,
        deviation: zScore,
        description: generateDescription(metric, type, latestValue, stats.mean, zScore),
        recommendation: generateRecommendation(metric, type, severity)
      })
    }
  }
  
  // Sort by severity (critical first)
  const severityOrder: Record<AnomalySeverity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3
  }
  
  return anomalies.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
}

export async function detectAnomaliesForAllMerchants(
  config: AnomalyConfig = DEFAULT_CONFIG
): Promise<Map<string, Anomaly[]>> {
  const merchants = await prisma.merchants.findMany({
    select: { id: true }
  })
  
  const results = new Map<string, Anomaly[]>()
  
  for (const merchant of merchants) {
    const anomalies = await detectAnomalies(merchant.id, config)
    if (anomalies.length > 0) {
      results.set(merchant.id, anomalies)
    }
  }
  
  return results
}

export { DEFAULT_CONFIG as ANOMALY_CONFIG }
