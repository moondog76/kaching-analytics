// Core data types for Kaching Analytics Pro

export interface Transaction {
  transaction_id: string
  user_id: string
  transaction_date: string
  amount_cents: number
  currency: string
  merchant_name: string
  has_campaign?: boolean
  cashback_percent?: number
  cashback_amount?: number
}

export interface MerchantMetrics {
  merchant_name: string
  transactions: number
  revenue: number
  customers: number
  cashback_paid: number
  cashback_percent: number
  campaign_active: boolean
  avg_transaction: number
  period?: string
}

export interface CompetitorData extends MerchantMetrics {
  rank: number
  isYou?: boolean
  market_share?: number
}

export interface TimeSeriesPoint {
  date: string
  value: number
  metric: string
}

export interface Forecast {
  metric: string
  historical: TimeSeriesPoint[]
  forecast: TimeSeriesPoint[]
  confidence_interval: {
    lower: number[]
    upper: number[]
  }
  accuracy_metrics: {
    mape: number // Mean Absolute Percentage Error
    rmse: number // Root Mean Square Error
  }
  methodology: string
}

export interface Insight {
  id: string
  type: 'opportunity' | 'warning' | 'trend' | 'comparison' | 'forecast'
  severity: 'high' | 'medium' | 'low'
  title: string
  description: string
  metric: string
  impact: {
    current_value: number
    change_percent: number
    change_absolute: number
  }
  context: string
  actionable_recommendations: string[]
  detected_at: Date
  confidence: number // 0-1
}

export interface Anomaly {
  metric: string
  detected_at: Date
  current_value: number
  expected_value: number
  deviation_stddev: number
  is_significant: boolean
  seasonality_adjusted: boolean
  explanation: string
  severity: 'critical' | 'warning' | 'info'
}

export interface ConversationMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: {
    query_type?: string
    data_accessed?: string[]
    visualizations_generated?: string[]
    insights_referenced?: string[]
  }
}

export interface AnalysisContext {
  conversation_id: string
  merchant_id: string
  messages: ConversationMessage[]
  active_filters: Filter[]
  computed_metrics: Record<string, number>
  visualizations: Visualization[]
  saved_at?: Date
  shared_with?: string[]
}

export interface Filter {
  field: string
  operator: 'equals' | 'gt' | 'lt' | 'gte' | 'lte' | 'between' | 'in'
  value: any
}

export interface Visualization {
  id: string
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'heatmap' | 'table'
  title: string
  data: any[]
  config: {
    x_axis?: string
    y_axis?: string
    color_by?: string
    aggregate?: 'sum' | 'avg' | 'count' | 'min' | 'max'
  }
}

export interface AIAgentResponse {
  message: string
  insights: Insight[]
  visualizations?: Visualization[]
  suggested_followups: string[]
  data_sources_used: string[]
  confidence: number
}

export interface NotificationConfig {
  channels: ('email' | 'slack' | 'mobile')[]
  frequency: 'realtime' | 'hourly' | 'daily' | 'weekly'
  severity_threshold: 'all' | 'medium' | 'high'
  quiet_hours?: {
    start: string // HH:mm
    end: string
  }
}

export interface Alert {
  id: string
  type: 'anomaly' | 'threshold' | 'forecast' | 'insight'
  severity: 'critical' | 'warning' | 'info'
  title: string
  message: string
  metric: string
  current_value: number
  threshold_value?: number
  detected_at: Date
  acknowledged: boolean
  action_taken?: string
  channels_sent: string[]
}

export interface DailyDigest {
  date: string
  merchant_name: string
  summary: string
  top_insights: Insight[]
  alerts: Alert[]
  key_metrics: {
    metric: string
    current: number
    change_vs_yesterday: number
    change_vs_last_week: number
    trend: 'up' | 'down' | 'stable'
  }[]
  recommended_actions: string[]
}

export interface DrilldownPath {
  level: number
  dimension: string
  value: any
  label: string
}

export interface DrilldownData {
  path: DrilldownPath[]
  data: Transaction[] | MerchantMetrics[]
  aggregations: Record<string, number>
  available_dimensions: string[]
}

// Statistical utilities types
export interface TimeSeriesDecomposition {
  trend: number[]
  seasonal: number[]
  residual: number[]
  seasonality_period: number
}

export interface CorrelationResult {
  metric_a: string
  metric_b: string
  correlation_coefficient: number
  p_value: number
  is_significant: boolean
  interpretation: string
  scatter_plot_data: { x: number; y: number }[]
}

export interface PredictiveModel {
  model_type: 'linear_regression' | 'time_series' | 'random_forest'
  target_metric: string
  features: string[]
  accuracy: number
  predictions: {
    value: number
    confidence_interval: [number, number]
    date?: string
  }[]
  feature_importance?: Record<string, number>
}
