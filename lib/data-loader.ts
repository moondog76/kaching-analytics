import { prisma } from './db'
import { MerchantMetrics, CompetitorData, TimeSeriesPoint } from './types'
import { format, subDays } from 'date-fns'

/**
 * Load and process data from PostgreSQL database
 */
export class DataLoader {
  
  /**
   * Load merchant data by email (for logged-in user)
   */
  static async loadMerchantDataByEmail(email: string): Promise<{
    merchant: MerchantMetrics
    competitors: CompetitorData[]
    historical: MerchantMetrics[]
  } | null> {
    try {
      // Find user and their merchant
      const user = await prisma.users.findUnique({
        where: { email },
        include: { merchant: true }
      })

      if (!user || !user.merchant) {
        console.error('User or merchant not found')
        return this.loadDemoData() // Fallback to demo
      }

      // Get current merchant metrics
      const merchantData = await this.getMerchantMetrics(user.merchant.id)

      // Get competitors
      const competitors = await this.getCompetitors(user.merchant.id)

      // Get historical data (last 30 days)
      const historical = await this.getHistoricalMetrics(user.merchant.id, 30)

      return {
        merchant: merchantData,
        competitors,
        historical
      }
    } catch (error) {
      console.error('Error loading merchant data:', error)
      return this.loadDemoData() // Fallback to demo
    }
  }

  /**
   * Load merchant data by merchant ID (for multi-tenant support)
   */
  static async loadMerchantDataById(
    merchantId: string,
    options?: { startDate?: Date; endDate?: Date }
  ): Promise<{
    merchant: MerchantMetrics
    competitors: CompetitorData[]
    historical: MerchantMetrics[]
    dateRange: { startDate: string; endDate: string }
  } | null> {
    try {
      const endDate = options?.endDate || new Date()
      const startDate = options?.startDate || subDays(endDate, 30)

      // Get current merchant metrics for date range
      const merchantData = await this.getMerchantMetrics(merchantId, startDate, endDate)

      // Get competitors for the same date range
      const competitors = await this.getCompetitors(merchantId, startDate, endDate)

      // Get historical data for the date range
      const historical = await this.getHistoricalMetricsByRange(merchantId, startDate, endDate)

      return {
        merchant: merchantData,
        competitors,
        historical,
        dateRange: {
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd')
        }
      }
    } catch (error) {
      console.error('Error loading merchant data by ID:', error)
      return null
    }
  }

  /**
   * Get metrics for a specific merchant - optimized
   */
  static async getMerchantMetrics(
    merchantId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<MerchantMetrics> {
    const end = endDate || new Date()
    const start = startDate || subDays(end, 30)

    // Single query: get merchant with recent daily metrics
    const merchant = await prisma.merchants.findUnique({
      where: { id: merchantId },
      include: {
        daily_metrics: {
          where: {
            date: { gte: start, lte: end }
          },
          orderBy: { date: 'desc' }
        }
      }
    })

    if (!merchant) {
      throw new Error('Merchant not found')
    }

    const metrics = merchant.daily_metrics

    // If we have daily metrics, aggregate them
    if (metrics.length > 0) {
      const totalTransactions = metrics.reduce((sum, m) => sum + (m.transactions_count || 0), 0)
      const totalRevenue = metrics.reduce((sum, m) => sum + Number(m.revenue || 0), 0)
      const totalCustomers = metrics.reduce((sum, m) => sum + (m.unique_customers || 0), 0)
      const totalCashback = metrics.reduce((sum, m) => sum + Number(m.cashback_paid || 0), 0)

      return {
        merchant_id: merchantId,
        merchant_name: merchant.name,
        transactions: totalTransactions,
        revenue: Math.round(totalRevenue * 100),
        customers: totalCustomers,
        cashback_paid: Math.round(totalCashback * 100),
        cashback_percent: Number(merchant.cashback_percent || 0),
        campaign_active: true,
        avg_transaction: totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
        period: format(end, 'yyyy-MM-dd')
      }
    }

    // Fallback: no daily metrics, return zeros
    return {
      merchant_id: merchantId,
      merchant_name: merchant.name,
      transactions: 0,
      revenue: 0,
      customers: 0,
      cashback_paid: 0,
      cashback_percent: Number(merchant.cashback_percent || 0),
      campaign_active: true,
      avg_transaction: 0,
      period: format(end, 'yyyy-MM-dd')
    }
  }

  /**
   * Get competitor data - optimized with single query
   */
  static async getCompetitors(
    excludeMerchantId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<CompetitorData[]> {
    // Get all merchants with their latest daily metrics in a single query
    const end = endDate || new Date()
    const start = startDate || subDays(end, 30)

    // Fetch all merchants and aggregate their metrics in one go
    const merchantsWithMetrics = await prisma.merchants.findMany({
      where: {
        id: { not: excludeMerchantId }
      },
      include: {
        daily_metrics: {
          where: {
            date: { gte: start, lte: end }
          },
          orderBy: { date: 'desc' }
        }
      },
      take: 10 // Limit to top competitors for performance
    })

    const competitorData: CompetitorData[] = merchantsWithMetrics.map(merchant => {
      // Aggregate metrics from daily_metrics
      const metrics = merchant.daily_metrics
      const totalTransactions = metrics.reduce((sum, m) => sum + (m.transactions_count || 0), 0)
      const totalRevenue = metrics.reduce((sum, m) => sum + Number(m.revenue || 0), 0)
      const totalCustomers = metrics.reduce((sum, m) => sum + (m.unique_customers || 0), 0)
      const totalCashback = metrics.reduce((sum, m) => sum + Number(m.cashback_paid || 0), 0)

      return {
        merchant_id: merchant.id,
        merchant_name: merchant.name,
        transactions: totalTransactions,
        revenue: Math.round(totalRevenue * 100),
        customers: totalCustomers,
        cashback_paid: Math.round(totalCashback * 100),
        cashback_percent: Number(merchant.cashback_percent || 0),
        campaign_active: true,
        avg_transaction: totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
        period: format(end, 'yyyy-MM-dd'),
        rank: 0,
        isYou: false
      }
    })

    // Sort by revenue and assign ranks
    competitorData.sort((a, b) => b.revenue - a.revenue)
    competitorData.forEach((comp, index) => {
      comp.rank = index + 1
    })

    return competitorData
  }

  /**
   * Get historical metrics for a merchant (by days)
   */
  static async getHistoricalMetrics(merchantId: string, days: number): Promise<MerchantMetrics[]> {
    const endDate = new Date()
    const startDate = subDays(endDate, days)
    return this.getHistoricalMetricsByRange(merchantId, startDate, endDate)
  }

  /**
   * Get historical metrics for a merchant by date range
   */
  static async getHistoricalMetricsByRange(
    merchantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<MerchantMetrics[]> {
    const dailyMetrics = await prisma.daily_metrics.findMany({
      where: {
        merchant_id: merchantId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        date: 'asc'
      }
    })

    const merchant = await prisma.merchants.findUnique({
      where: { id: merchantId }
    })

    if (!merchant) {
      return []
    }

    return dailyMetrics.map(dm => ({
      merchant_id: merchantId,
      merchant_name: merchant.name,
      transactions: dm.transactions_count || 0,
      revenue: Math.round(Number(dm.revenue) * 100),
      customers: dm.unique_customers || 0,
      cashback_paid: Math.round(Number(dm.cashback_paid) * 100),
      cashback_percent: Number(merchant.cashback_percent || 0),
      campaign_active: true,
      avg_transaction: dm.transactions_count ? Number(dm.revenue) / dm.transactions_count : 0,
      period: format(dm.date, 'yyyy-MM-dd')
    }))
  }

  /**
   * Fallback to demo data (for development/demo purposes)
   */
  static loadDemoData(): {
    merchant: MerchantMetrics
    competitors: CompetitorData[]
    historical: MerchantMetrics[]
  } {
    const merchant: MerchantMetrics = {
      merchant_id: 'demo-store-id',
      merchant_name: 'Demo Store',
      transactions: 482,
      revenue: 272978,
      customers: 416,
      cashback_paid: 13649,
      cashback_percent: 5.0,
      campaign_active: true,
      avg_transaction: 566.1,
      period: format(new Date(), 'yyyy-MM-dd')
    }

    const competitors: CompetitorData[] = [
      { merchant_id: 'demo-lidl-id', merchant_name: 'Lidl', transactions: 845, revenue: 402350, customers: 723, cashback_paid: 12071, cashback_percent: 3.0, campaign_active: true, avg_transaction: 476.2, period: format(new Date(), 'yyyy-MM-dd'), rank: 1, isYou: false },
      { merchant_id: 'demo-kaufland-id', merchant_name: 'Kaufland', transactions: 723, revenue: 389200, customers: 634, cashback_paid: 13622, cashback_percent: 3.5, campaign_active: true, avg_transaction: 538.4, period: format(new Date(), 'yyyy-MM-dd'), rank: 2, isYou: false },
      { merchant_id: 'demo-auchan-id', merchant_name: 'Auchan', transactions: 634, revenue: 325600, customers: 542, cashback_paid: 8768, cashback_percent: 2.7, campaign_active: true, avg_transaction: 513.6, period: format(new Date(), 'yyyy-MM-dd'), rank: 3, isYou: false },
      { merchant_id: 'demo-megaimage-id', merchant_name: 'Mega Image', transactions: 567, revenue: 289400, customers: 489, cashback_paid: 9812, cashback_percent: 3.4, campaign_active: true, avg_transaction: 510.4, period: format(new Date(), 'yyyy-MM-dd'), rank: 4, isYou: false },
      { merchant_id: 'demo-store-id', merchant_name: 'Demo Store', transactions: 482, revenue: 272978, customers: 416, cashback_paid: 13649, cashback_percent: 5.0, campaign_active: true, avg_transaction: 566.1, period: format(new Date(), 'yyyy-MM-dd'), rank: 5, isYou: true },
      { merchant_id: 'demo-profi-id', merchant_name: 'Profi', transactions: 423, revenue: 198700, customers: 367, cashback_paid: 5961, cashback_percent: 3.0, campaign_active: true, avg_transaction: 469.7, period: format(new Date(), 'yyyy-MM-dd'), rank: 6, isYou: false },
      { merchant_id: 'demo-penny-id', merchant_name: 'Penny', transactions: 389, revenue: 176300, customers: 334, cashback_paid: 4408, cashback_percent: 2.5, campaign_active: true, avg_transaction: 453.3, period: format(new Date(), 'yyyy-MM-dd'), rank: 7, isYou: false },
    ]

    const historical = this.generateHistoricalData(merchant, 30)

    return { merchant, competitors, historical }
  }

  /**
   * Generate historical data for demo purposes
   */
  static generateHistoricalData(current: MerchantMetrics, days: number): MerchantMetrics[] {
    if (!current || !current.merchant_name) {
      console.error('Invalid current data for historical generation')
      return []
    }

    const historical: MerchantMetrics[] = []
    
    for (let i = days; i > 0; i--) {
      const variance = 0.85 + Math.random() * 0.30
      const dayOfWeek = (new Date().getDay() - i + 7) % 7
      const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.8 : 1.0
      const factor = variance * weekendFactor
      
      historical.push({
        merchant_id: current.merchant_id,
        merchant_name: current.merchant_name,
        transactions: Math.round(current.transactions * factor),
        revenue: Math.round(current.revenue * factor),
        customers: Math.round(current.customers * factor),
        cashback_paid: Math.round(current.cashback_paid * factor),
        cashback_percent: current.cashback_percent,
        campaign_active: current.campaign_active,
        avg_transaction: current.avg_transaction,
        period: format(subDays(new Date(), i), 'yyyy-MM-dd')
      })
    }
    
    return historical
  }

  /**
   * Process transactions (for backward compatibility)
   */
  static processTransactions(transactions: any[]) {
    // If called with empty array, return demo data
    return {
      ...this.loadDemoData(),
      timeSeries: {}
    }
  }
}
