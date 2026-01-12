import { Transaction, MerchantMetrics, CompetitorData, TimeSeriesPoint } from './types'
import { format, subDays } from 'date-fns'

/**
 * Load and process transaction data
 */
export class DataLoader {
  
  /**
   * Process raw transactions into merchant metrics
   */
  static processTransactions(transactions: Transaction[]): {
    carrefour: MerchantMetrics
    competitors: CompetitorData[]
    historical: MerchantMetrics[]
    timeSeries: Record<string, TimeSeriesPoint[]>
  } {
    
    // If no transactions, return demo data
    if (!transactions || transactions.length === 0) {
      const demoData = this.loadDemoData()
      const historical = this.generateHistoricalData(demoData.carrefour, 30)
      
      const timeSeries = {
        transactions: historical.map((d, i) => ({
          date: format(subDays(new Date(), 30 - i), 'yyyy-MM-dd'),
          value: d.transactions,
          metric: 'transactions'
        })),
        revenue: historical.map((d, i) => ({
          date: format(subDays(new Date(), 30 - i), 'yyyy-MM-dd'),
          value: d.revenue,
          metric: 'revenue'
        })),
        customers: historical.map((d, i) => ({
          date: format(subDays(new Date(), 30 - i), 'yyyy-MM-dd'),
          value: d.customers,
          metric: 'customers'
        }))
      }
      
      return {
        carrefour: demoData.carrefour,
        competitors: demoData.competitors,
        historical,
        timeSeries
      }
    }
    
    // Group by merchant
    const byMerchant = this.groupByMerchant(transactions)
    
    // Calculate metrics for each merchant
    const merchantMetrics = Object.entries(byMerchant).map(([name, txns]) => 
      this.calculateMetrics(name, txns)
    )
    
    // Sort by transactions to get rankings
    merchantMetrics.sort((a, b) => b.transactions - a.transactions)
    
    // Add rankings
    const competitors: CompetitorData[] = merchantMetrics.map((m, index) => ({
      ...m,
      rank: index + 1,
      isYou: m.merchant_name === 'Carrefour',
      market_share: (m.transactions / transactions.length) * 100
    }))
    
    // Get Carrefour data
    const carrefour = competitors.find(c => c.isYou) || competitors[0]
    
    // Generate historical data (simulate past 30 days)
    const historical = this.generateHistoricalData(carrefour, 30)
    
    // Generate time series for forecasting
    const timeSeries = {
      transactions: historical.map((d, i) => ({
        date: format(subDays(new Date(), 30 - i), 'yyyy-MM-dd'),
        value: d.transactions,
        metric: 'transactions'
      })),
      revenue: historical.map((d, i) => ({
        date: format(subDays(new Date(), 30 - i), 'yyyy-MM-dd'),
        value: d.revenue,
        metric: 'revenue'
      })),
      customers: historical.map((d, i) => ({
        date: format(subDays(new Date(), 30 - i), 'yyyy-MM-dd'),
        value: d.customers,
        metric: 'customers'
      }))
    }
    
    return {
      carrefour,
      competitors,
      historical,
      timeSeries
    }
  }
  
  /**
   * Group transactions by merchant
   */
  private static groupByMerchant(transactions: Transaction[]): Record<string, Transaction[]> {
    const grouped: Record<string, Transaction[]> = {}
    
    transactions.forEach(txn => {
      if (!grouped[txn.merchant_name]) {
        grouped[txn.merchant_name] = []
      }
      grouped[txn.merchant_name].push(txn)
    })
    
    return grouped
  }
  
  /**
   * Calculate metrics for a merchant
   */
  private static calculateMetrics(
    merchantName: string,
    transactions: Transaction[]
  ): MerchantMetrics {
    
    const totalRevenue = transactions.reduce((sum, t) => sum + t.amount_cents, 0)
    const totalCashback = transactions.reduce((sum, t) => sum + (t.cashback_amount || 0), 0)
    const uniqueCustomers = new Set(transactions.map(t => t.user_id)).size
    const campaignActive = transactions.some(t => t.has_campaign)
    const cashbackPercent = transactions.find(t => t.cashback_percent)?.cashback_percent || 0
    
    return {
      merchant_name: merchantName,
      transactions: transactions.length,
      revenue: totalRevenue,
      customers: uniqueCustomers,
      cashback_paid: totalCashback,
      cashback_percent: cashbackPercent,
      campaign_active: campaignActive,
      avg_transaction: totalRevenue / transactions.length,
      period: format(new Date(), 'yyyy-MM-dd')
    }
  }
  
  /**
   * Generate realistic historical data based on current metrics
   */
  private static generateHistoricalData(
    current: MerchantMetrics,
    days: number
  ): MerchantMetrics[] {
    
    // Safety check
    if (!current || !current.merchant_name) {
      console.error('Invalid current data for generateHistoricalData')
      return []
    }
    
    const historical: MerchantMetrics[] = []
    
    for (let i = days; i > 0; i--) {
      const date = subDays(new Date(), i)
      const dayOfWeek = date.getDay()
      
      // Weekend effect: 20% fewer transactions
      const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.8 : 1.0
      
      // General trend: slight growth over time
      const trendFactor = 0.95 + (0.10 * (days - i) / days)
      
      // Random daily variation: +/- 15%
      const randomFactor = 0.85 + Math.random() * 0.30
      
      const factor = weekendFactor * trendFactor * randomFactor
      
      historical.push({
        merchant_name: current.merchant_name,
        transactions: Math.round(current.transactions * factor),
        revenue: Math.round(current.revenue * factor),
        customers: Math.round(current.customers * factor),
        cashback_paid: Math.round(current.cashback_paid * factor),
        cashback_percent: current.cashback_percent,
        campaign_active: current.campaign_active,
        avg_transaction: current.avg_transaction,
        period: format(date, 'yyyy-MM-dd')
      })
    }
    
    return historical
  }
  
  /**
   * Load demo data (for initial testing without CSV)
   */
  static loadDemoData() {
    return {
      carrefour: {
        merchant_name: 'Carrefour',
        transactions: 482,
        revenue: 272978.3,
        customers: 416,
        cashback_paid: 13648.92,
        cashback_percent: 5,
        campaign_active: true,
        avg_transaction: 566.36,
        period: format(new Date(), 'yyyy-MM-dd')
      },
      competitors: [
        { rank: 1, merchant_name: 'Lidl', transactions: 797, revenue: 811667.2, customers: 670, cashback_percent: 3, cashback_paid: 24350, campaign_active: true, avg_transaction: 1018, market_share: 15.94 },
        { rank: 2, merchant_name: 'Kaufland', transactions: 490, revenue: 470711.1, customers: 427, cashback_percent: 4, cashback_paid: 18828, campaign_active: true, avg_transaction: 961, market_share: 9.8 },
        { rank: 3, merchant_name: 'Mega Image', transactions: 734, revenue: 307126.2, customers: 621, cashback_percent: 2.5, cashback_paid: 7678, campaign_active: true, avg_transaction: 418, market_share: 14.68 },
        { rank: 4, merchant_name: 'Profi', transactions: 659, revenue: 279538.3, customers: 568, cashback_percent: 3, cashback_paid: 8386, campaign_active: true, avg_transaction: 424, market_share: 13.18 },
        { rank: 5, merchant_name: 'Carrefour', transactions: 482, revenue: 272978.3, customers: 416, cashback_percent: 5, cashback_paid: 13648.92, campaign_active: true, avg_transaction: 566, isYou: true, market_share: 9.64 }
      ] as CompetitorData[]
    }
  }
}
