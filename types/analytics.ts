/**
 * KaChing Analytics Pro - Type Definitions
 * Comprehensive types for Cashback and Retail Insights
 */

// =============================================================================
// ENUMS & BASIC TYPES
// =============================================================================

export type Gender = 'male' | 'female' | 'unknown'
export type AccessTier = 'standard' | 'premium'
export type ChurnStatus = 'new' | 'retained' | 'churned'
export type AIContextMode = 'cashback' | 'retail'
export type ExportFormat = 'pdf' | 'jpeg' | 'pptx' | 'csv' | 'xlsx'
export type Severity = 'low' | 'medium' | 'high' | 'critical'
export type Priority = 'low' | 'medium' | 'high'

// =============================================================================
// CASHBACK INSIGHTS TYPES
// =============================================================================

export interface CashbackHeroKPIs {
  campaignBudget: number
  campaignRevenue: number
  roi: number
  cac: number
  totalCampaignCustomers: number
  repeatCustomers: number
  newCustomers: number
  repeatRate: number
  roiTrend: number
  revenueTrend: number
  customersTrend: number
}

export interface CashbackReceiptComparison {
  domesticAvgReceipt: number
  campaignAvgReceipt: number
  upliftPercentage: number
}

export interface CashbackVisitComparison {
  domesticAvgVisits: number
  campaignAvgVisits: number
  changePercentage: number
}

export interface CampaignDistribution {
  sectorGrowth: number
  newCustomers: number
  loyalty: number
  maximumReach: number
}

export interface OwnCustomerProfile {
  totalCustomers: number
  genderDistribution: { male: number; female: number; unknown: number }
  ageDistribution: AgeDistributionBucket[]
  avgAge: number
  topSpendersCount: number
  avgSpendPerTopSpender: number
}

// =============================================================================
// RETAIL INSIGHTS TYPES
// =============================================================================

export interface AgeDistributionBucket {
  ageMin: number
  ageMax: number
  label: string
  count: number
  percentage: number
}

export interface MarketShareData {
  date: string
  merchantId: string
  merchantName: string
  totalSales: number
  marketShareBySales: number
  totalTransactions: number
  marketShareByTransactions: number
  marketReach3m?: number
  marketReach6m?: number
}

export interface MarketShareTimeSeries {
  date: string
  [merchantName: string]: number | string  // Dynamic merchant names as keys
}

export interface ReceiptDistributionByMerchant {
  merchantId: string
  merchantName: string
  avgReceipt: number
  medianReceipt: number
  distribution: { minValue: number; maxValue: number; percentage: number }[]
}

export interface ReturnIntervalByMerchant {
  merchantId: string
  merchantName: string
  avgDays: number
  medianDays: number
  distribution: { minDays: number; maxDays: number; percentage: number }[]
}

export interface MobilityMatrixCell {
  fromMerchantId: string
  toMerchantId: string
  overlapPercentage: number
  customerCount: number
}

export interface MobilityMatrix {
  merchants: { id: string; name: string }[]
  cells: MobilityMatrixCell[]
  singleMerchantLoyalty: { merchantId: string; merchantName: string; percentage: number }[]
}

export interface ChurnSummary {
  merchantId: string
  periodStart: string
  periodEnd: string
  totalCustomers: number
  newCustomers: number
  newCustomersPercentage: number
  retainedCustomers: number
  retainedCustomersPercentage: number
  churnedCustomers: number
  churnedCustomersPercentage: number
}

export interface ChurnDestination {
  competitorId: string
  competitorName: string
  customerCount: number
  sowPreviousPeriod: number
  sowCurrentPeriod: number
  sowDifference: number
}

export interface ChurnAnalysis {
  summary: ChurnSummary
  churnDestinations: ChurnDestination[]
  newCustomerSources: ChurnDestination[]
}

// =============================================================================
// AI TYPES
// =============================================================================

export interface Anomaly {
  id: string
  type: string
  severity: Severity
  title: string
  description: string
  metric: string
  expectedValue: number
  actualValue: number
  percentageChange: number
  detectedAt: string
  contextMode: AIContextMode
  isRead: boolean
  isDismissed: boolean
}

export interface Recommendation {
  id: string
  type: string
  priority: Priority
  title: string
  description: string
  rationale: string
  suggestedActions: string[]
  contextMode: AIContextMode
  isRead: boolean
  isDismissed: boolean
}

export interface AIChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  contextMode: AIContextMode
}

// =============================================================================
// FILTER TYPES
// =============================================================================

export interface FilterState {
  dateRange: { start: Date; end: Date }
  gender: Gender | 'all'
  ageRange: { min: number; max: number } | null
  ticketSizeRange: { min: number; max: number } | null
  daysOfWeek: number[] | 'all'  // 0=Sunday, 6=Saturday
  timeOfDay: { start: string; end: string } | null
  selectedCompetitors?: string[]
  comparisonGroupId?: string
}

export const DEFAULT_FILTER_STATE: FilterState = {
  dateRange: {
    start: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000),  // 2 years ago
    end: new Date()
  },
  gender: 'all',
  ageRange: null,
  ticketSizeRange: null,
  daysOfWeek: 'all',
  timeOfDay: null
}

// =============================================================================
// CHART DATA TYPES
// =============================================================================

export interface TimeSeriesDataPoint {
  date: string
  [key: string]: number | string
}

export interface BarChartDataPoint {
  name: string
  value: number
  [key: string]: number | string
}

export interface PieChartDataPoint {
  name: string
  value: number
  color?: string
}

export interface HeatmapCell {
  row: string
  col: string
  value: number
  label?: string
}

// =============================================================================
// COMPONENT PROPS
// =============================================================================

export interface KPICardProps {
  label: string
  value: string | number
  trend?: { value: number; isPositive: boolean }
  format?: 'number' | 'currency' | 'percentage' | 'multiplier'
  icon?: React.ReactNode
}

export interface TabNavigationProps {
  activeTab: 'cashback' | 'retail'
  onTabChange: (tab: 'cashback' | 'retail') => void
  hasRetailAccess: boolean
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface CashbackInsightsData {
  heroKPIs: CashbackHeroKPIs
  receiptComparison: CashbackReceiptComparison
  visitComparison: CashbackVisitComparison
  distribution: CampaignDistribution
  customerProfile: OwnCustomerProfile
  receiptHistory: TimeSeriesDataPoint[]
  transactionHistory: TimeSeriesDataPoint[]
}

export interface RetailInsightsData {
  marketShare: MarketShareTimeSeries[]
  demographics: {
    ageDistribution: { merchantName: string; distribution: AgeDistributionBucket[] }[]
    genderByCustomers: BarChartDataPoint[]
    avgAgeHistory: TimeSeriesDataPoint[]
  }
  behavior: {
    receiptDistribution: ReceiptDistributionByMerchant[]
    receiptHistory: TimeSeriesDataPoint[]
    returnInterval: ReturnIntervalByMerchant[]
    shareOfWallet: TimeSeriesDataPoint[]
  }
  mobility: MobilityMatrix
  churn: ChurnAnalysis
}
