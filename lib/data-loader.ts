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
    carrefour: MerchantMetrics
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
        carrefour: merchantData,
        competitors,
        historical
      }
    } catch (error) {
      console.error('Error loading merchant data:', error)
      return this.loadDemoData() // Fallback to demo
    }
  }

  /**
   * Get metrics for a specific merchant
   */
  static async getMerchantMetrics(merchantId: string): Promise<MerchantMetrics> {
    const merchant = await prisma.merchants.findUnique({
      where: { id: merchantId }
    })

    if (!merchant) {
      throw new Error('Merchant not found')
    }

    // Get today's metrics or calculate from transactions
    const today = new Date()
    const dailyMetric = await prisma.daily_metrics.findFirst({
      where: {
        merchant_id: merchantId,
        date: today
      }
    })

    // If no daily metrics, calculate from transactions
    if (!dailyMetric) {
      const transactions = await prisma.transactions.findMany({
        where: {
          merchant_id: merchantId,
          transaction_date: {
            gte: subDays(today, 30)
          }
        }
      })

      const totalRevenue = transactions.reduce((sum, t) => sum + Number(t.amount), 0)
      const totalCashback = transactions.reduce((sum, t) => sum + Number(t.cashback_amount || 0), 0)
      const uniqueCustomers = new Set(transactions.map(t => t.customer_id)).size

      return {
        merchant_name: merchant.name,
        transactions: transactions.length,
        revenue: Math.round(totalRevenue * 100), // Convert to cents
        customers: uniqueCustomers,
        cashback_paid: Math.round(totalCashback * 100),
        cashback_percent: Number(merchant.cashback_percent || 0),
        campaign_active: true,
        avg_transaction: transactions.length > 0 ? totalRevenue / transactions.length : 0,
        period: format(today, 'yyyy-MM-dd')
      }
    }

    // Use daily metrics
    return {
      merchant_name: merchant.name,
      transactions: dailyMetric.transactions_count || 0,
      revenue: Math.round(Number(dailyMetric.revenue) * 100),
      customers: dailyMetric.unique_customers || 0,
      cashback_paid: Math.round(Number(dailyMetric.cashback_paid) * 100),
      cashback_percent: Number(merchant.cashback_percent || 0),
      campaign_active: true,
      avg_transaction: dailyMetric.transactions_count ? Number(dailyMetric.revenue) / dailyMetric.transactions_count : 0,
      period: format(dailyMetric.date, 'yyyy-MM-dd')
    }
  }

  /**
   * Get competitor data
   */
  static async getCompetitors(excludeMerchantId: string): Promise<CompetitorData[]> {
    const merchants = await prisma.merchants.findMany({
      where: {
        id: {
          not: excludeMerchantId
        }
      }
    })

    const competitorData: CompetitorData[] = []

    for (const merchant of merchants) {
      const metrics = await this.getMerchantMetrics(merchant.id)
      competitorData.push({
        ...metrics,
        rank: 0, // Will be calculated after sorting
        isYou: false
      })
    }

    // Sort by revenue and assign ranks
    competitorData.sort((a, b) => b.revenue - a.revenue)
    competitorData.forEach((comp, index) => {
      comp.rank = index + 1
    })

    return competitorData
  }

  /**
   * Get historical metrics for a merchant
   */
  static async getHistoricalMetrics(merchantId: string, days: number): Promise<MerchantMetrics[]> {
    const endDate = new Date()
    const startDate = subDays(endDate, days)

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
    carrefour: MerchantMetrics
    competitors: CompetitorData[]
    historical: MerchantMetrics[]
  } {
    const carrefour: MerchantMetrics = {
      merchant_name: 'Carrefour',
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
      { merchant_name: 'Lidl', transactions: 845, revenue: 402350, customers: 723, cashback_paid: 12071, cashback_percent: 3.0, campaign_active: true, avg_transaction: 476.2, period: format(new Date(), 'yyyy-MM-dd'), rank: 1, isYou: false },
      { merchant_name: 'Kaufland', transactions: 723, revenue: 389200, customers: 634, cashback_paid: 13622, cashback_percent: 3.5, campaign_active: true, avg_transaction: 538.4, period: format(new Date(), 'yyyy-MM-dd'), rank: 2, isYou: false },
      { merchant_name: 'Auchan', transactions: 634, revenue: 325600, customers: 542, cashback_paid: 8768, cashback_percent: 2.7, campaign_active: true, avg_transaction: 513.6, period: format(new Date(), 'yyyy-MM-dd'), rank: 3, isYou: false },
      { merchant_name: 'Mega Image', transactions: 567, revenue: 289400, customers: 489, cashback_paid: 9812, cashback_percent: 3.4, campaign_active: true, avg_transaction: 510.4, period: format(new Date(), 'yyyy-MM-dd'), rank: 4, isYou: false },
      { merchant_name: 'Carrefour', transactions: 482, revenue: 272978, customers: 416, cashback_paid: 13649, cashback_percent: 5.0, campaign_active: true, avg_transaction: 566.1, period: format(new Date(), 'yyyy-MM-dd'), rank: 5, isYou: true },
      { merchant_name: 'Profi', transactions: 423, revenue: 198700, customers: 367, cashback_paid: 5961, cashback_percent: 3.0, campaign_active: true, avg_transaction: 469.7, period: format(new Date(), 'yyyy-MM-dd'), rank: 6, isYou: false },
      { merchant_name: 'Penny', transactions: 389, revenue: 176300, customers: 334, cashback_paid: 4408, cashback_percent: 2.5, campaign_active: true, avg_transaction: 453.3, period: format(new Date(), 'yyyy-MM-dd'), rank: 7, isYou: false },
    ]

    const historical = this.generateHistoricalData(carrefour, 30)

    return { carrefour, competitors, historical }
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
