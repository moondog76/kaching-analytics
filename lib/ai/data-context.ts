// Data context service for AI features
import { prisma } from '@/lib/db'
import { DataContext, MetricType } from './types'

export async function getMerchantDataContext(
  merchantId: string,
  days: number = 30
): Promise<DataContext | null> {
  const merchant = await prisma.merchants.findUnique({
    where: { id: merchantId }
  })
  
  if (!merchant) return null
  
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  // Get aggregated metrics
  const txns = await prisma.transactions.aggregate({
    where: {
      merchant_id: merchantId,
      transaction_date: { gte: startDate, lte: endDate }
    },
    _sum: { amount: true, cashback_amount: true },
    _count: true
  })
  
  // Get unique customers
  const customers = await prisma.transactions.groupBy({
    by: ['customer_id'],
    where: {
      merchant_id: merchantId,
      transaction_date: { gte: startDate, lte: endDate }
    }
  })
  
  // Get daily metrics
  const dailyMetrics = await prisma.daily_metrics.findMany({
    where: {
      merchant_id: merchantId,
      date: { gte: startDate, lte: endDate }
    },
    orderBy: { date: 'asc' }
  })
  
  const totalRevenue = Number(txns._sum.amount || 0)
  const totalCashback = Number(txns._sum.cashback_amount || 0)
  const totalTransactions = txns._count || 0
  
  return {
    merchantId,
    merchantName: merchant.name,
    dateRange: { start: startDate, end: endDate },
    transactions: totalTransactions,
    revenue: totalRevenue,
    customers: customers.length,
    cashback: totalCashback,
    avgTransaction: totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
    dailyMetrics: dailyMetrics.map(dm => ({
      date: dm.date,
      transactions: dm.transactions_count || 0,
      revenue: Number(dm.revenue || 0),
      customers: dm.unique_customers || 0
    }))
  }
}

export async function getMetricHistory(
  merchantId: string,
  metric: MetricType,
  days: number = 90
): Promise<Array<{ date: Date; value: number }>> {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  const dailyMetrics = await prisma.daily_metrics.findMany({
    where: {
      merchant_id: merchantId,
      date: { gte: startDate, lte: endDate }
    },
    orderBy: { date: 'asc' }
  })
  
  return dailyMetrics.map(dm => {
    let value: number
    switch (metric) {
      case 'transactions':
        value = dm.transactions_count || 0
        break
      case 'revenue':
        value = Number(dm.revenue || 0)
        break
      case 'customers':
        value = dm.unique_customers || 0
        break
      case 'cashback':
        value = Number(dm.cashback_paid || 0)
        break
      case 'avg_transaction':
        value = (dm.transactions_count || 0) > 0 
          ? Number(dm.revenue || 0) / (dm.transactions_count || 1)
          : 0
        break
      default:
        value = 0
    }
    return { date: dm.date, value }
  })
}

export function calculateStatistics(values: number[]): {
  mean: number
  stdDev: number
  min: number
  max: number
} {
  if (values.length === 0) {
    return { mean: 0, stdDev: 0, min: 0, max: 0 }
  }
  
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2))
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length
  const stdDev = Math.sqrt(avgSquaredDiff)
  
  return {
    mean,
    stdDev,
    min: Math.min(...values),
    max: Math.max(...values)
  }
}
