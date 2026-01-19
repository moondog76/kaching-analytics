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
