// Shared types for AI features

export type MetricType = 'transactions' | 'revenue' | 'customers' | 'cashback' | 'avg_transaction'

export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical'

export type AnomalyType = 'spike' | 'drop' | 'trend_change' | 'unusual_pattern'

export interface Anomaly {
  merchantId: string
  id: string
  metric: MetricType
  type: AnomalyType
  severity: AnomalySeverity
  value: number
  expectedValue: number
  deviation: number
  date: Date
  description: string
  recommendation?: string
}

export interface RecommendationImpact {
  metric: string
  estimatedChange: number
  confidence: number
}

export interface Recommendation {
  id: string
  type: 'optimization' | 'retention' | 'growth'
  priority: 'low' | 'medium' | 'high'
  title: string
  description: string
  impact?: RecommendationImpact
  action: string
  createdAt: Date
}

export interface AIBriefing {
  id: string
  merchantId: string
  date: Date
  summary: string
  highlights: string[]
  alerts: string[]
  recommendations: Recommendation[]
}

export type BriefingPeriod = 'daily' | 'weekly'

export interface MetricSnapshot {
  transactions: number
  revenue: number
  customers: number
  cashback: number
  avgTransactionValue: number
}

export interface MetricComparison {
  current: number
  previous: number
  change: number
  changePercent: number
  trend: 'up' | 'down' | 'stable'
}

export interface ExecutiveBriefing {
  id: string
  merchantId: string
  merchantName: string
  period: BriefingPeriod
  periodStart: Date
  periodEnd: Date
  generatedAt: Date

  // Executive summary - AI-generated narrative
  summary: string

  // Key metrics with comparison to previous period
  metrics: {
    transactions: MetricComparison
    revenue: MetricComparison
    customers: MetricComparison
    cashback: MetricComparison
    avgTransactionValue: MetricComparison
  }

  // Top highlights (3-5 key points)
  highlights: Array<{
    icon: string
    title: string
    description: string
    sentiment: 'positive' | 'negative' | 'neutral'
  }>

  // Critical alerts that need attention
  alerts: Array<{
    severity: 'warning' | 'critical'
    message: string
    metric?: string
  }>

  // Top recommendations (max 3 for executive view)
  topRecommendations: Recommendation[]

  // Performance score (0-100)
  performanceScore: number
}

export interface NLQueryResult {
  query: string
  interpretation: string
  data: Record<string, unknown>
  visualization?: 'chart' | 'table' | 'metric'
  confidence: number
}

export interface DataContext {
  merchantId: string
  merchantName: string
  dateRange: { start: Date; end: Date }
  transactions: number
  revenue: number
  customers: number
  cashback: number
  avgTransaction: number
  dailyMetrics: Array<{
    date: Date
    transactions: number
    revenue: number
    customers: number
  }>
}
