// Shared AI types for Phase 3 features

export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical'
export type AnomalyType = 'spike' | 'drop' | 'trend_change' | 'unusual_pattern'
export type MetricType = 'transactions' | 'revenue' | 'customers' | 'cashback' | 'avg_transaction'

export interface Anomaly {
  id: string
  type: AnomalyType
  severity: AnomalySeverity
  metric: MetricType
  merchantId: string
  merchantName?: string
  detectedAt: Date
  value: number
  expectedValue: number
  deviation: number // percentage deviation from expected
  description: string
  recommendation?: string
}

export interface Recommendation {
  id: string
  type: 'cashback_optimization' | 'growth_opportunity' | 'retention_risk' | 'competitive_action'
  priority: 'low' | 'medium' | 'high'
  title: string
  description: string
  impact: string
  confidence: number // 0-100
  merchantId: string
  metrics?: {
    current: number
    projected: number
    change: number
  }
}

export interface AIBriefing {
  id: string
  merchantId: string
  type: 'daily' | 'weekly'
  generatedAt: Date
  summary: string
  highlights: string[]
  anomalies: Anomaly[]
  recommendations: Recommendation[]
  metrics: {
    transactions: { value: number; change: number }
    revenue: { value: number; change: number }
    customers: { value: number; change: number }
  }
}

export interface NLQueryResult {
  query: string
  intent: 'comparison' | 'lookup' | 'trend' | 'recommendation' | 'unknown'
  confidence: number
  response: string
  data?: Record<string, unknown>
  visualization?: 'chart' | 'table' | 'metric' | 'none'
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
