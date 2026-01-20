import { NextRequest, NextResponse } from 'next/server'
import { withApiKeyAuth } from '@/lib/api-keys'
import { prisma } from '@/lib/db'
import { subDays } from 'date-fns'

/**
 * GET /api/v1/metrics
 * Public API endpoint for merchants to fetch their metrics
 *
 * Query params:
 * - days: number of days (default: 30, max: 90)
 *
 * Headers:
 * - Authorization: Bearer ka_live_xxx
 */
export async function GET(request: NextRequest) {
  return withApiKeyAuth(request, async (merchantId) => {
    const { searchParams } = new URL(request.url)
    const days = Math.min(parseInt(searchParams.get('days') || '30'), 90)

    const endDate = new Date()
    const startDate = subDays(endDate, days)

    // Get daily metrics
    const metrics = await prisma.daily_metrics.findMany({
      where: {
        merchant_id: merchantId,
        date: { gte: startDate, lte: endDate }
      },
      orderBy: { date: 'asc' },
      select: {
        date: true,
        transactions_count: true,
        revenue: true,
        unique_customers: true,
        cashback_paid: true
      }
    })

    // Calculate totals
    const totals = metrics.reduce(
      (acc, m) => ({
        transactions: acc.transactions + (m.transactions_count || 0),
        revenue: acc.revenue + Number(m.revenue || 0),
        customers: acc.customers + (m.unique_customers || 0),
        cashback: acc.cashback + Number(m.cashback_paid || 0)
      }),
      { transactions: 0, revenue: 0, customers: 0, cashback: 0 }
    )

    return NextResponse.json({
      merchant_id: merchantId,
      period: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
        days
      },
      totals: {
        transactions: totals.transactions,
        revenue: Math.round(totals.revenue * 100) / 100,
        unique_customers: totals.customers,
        cashback_paid: Math.round(totals.cashback * 100) / 100
      },
      daily: metrics.map(m => ({
        date: m.date.toISOString().split('T')[0],
        transactions: m.transactions_count || 0,
        revenue: Number(m.revenue || 0),
        customers: m.unique_customers || 0,
        cashback: Number(m.cashback_paid || 0)
      }))
    })
  })
}
