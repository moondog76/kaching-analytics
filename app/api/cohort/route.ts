import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { startOfMonth, subMonths, format, differenceInMonths } from 'date-fns'

// GET /api/cohort - Get cohort analysis data
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const months = parseInt(searchParams.get('months') || '6')
    const merchantId = searchParams.get('merchantId') || user.merchantId

    if (!merchantId) {
      // Return demo cohort data
      return NextResponse.json(generateDemoCohortData(months))
    }

    // Build cohort data from transactions
    const endDate = new Date()
    const startDate = startOfMonth(subMonths(endDate, months))

    // Get transactions for the period
    const transactions = await prisma.transactions.findMany({
      where: {
        merchant_id: merchantId,
        transaction_date: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        customer_id: true,
        transaction_date: true,
        amount: true
      },
      orderBy: {
        transaction_date: 'asc'
      }
    })

    if (transactions.length === 0) {
      return NextResponse.json(generateDemoCohortData(months))
    }

    // Group transactions by customer and identify first purchase month
    const customerFirstPurchase = new Map<string, Date>()
    const customerPurchaseMonths = new Map<string, Set<string>>()

    transactions.forEach(tx => {
      if (!tx.customer_id) return

      const txMonth = format(tx.transaction_date, 'yyyy-MM')

      // Track first purchase
      if (!customerFirstPurchase.has(tx.customer_id)) {
        customerFirstPurchase.set(tx.customer_id, tx.transaction_date)
      }

      // Track all purchase months
      if (!customerPurchaseMonths.has(tx.customer_id)) {
        customerPurchaseMonths.set(tx.customer_id, new Set())
      }
      customerPurchaseMonths.get(tx.customer_id)!.add(txMonth)
    })

    // Build cohort matrix
    const cohorts: Array<{
      cohortMonth: string
      cohortSize: number
      retention: number[]
    }> = []

    for (let i = months - 1; i >= 0; i--) {
      const cohortDate = startOfMonth(subMonths(endDate, i))
      const cohortMonth = format(cohortDate, 'yyyy-MM')

      // Find customers whose first purchase was in this month
      const cohortCustomers: string[] = []
      customerFirstPurchase.forEach((firstDate, customerId) => {
        if (format(firstDate, 'yyyy-MM') === cohortMonth) {
          cohortCustomers.push(customerId)
        }
      })

      if (cohortCustomers.length === 0) continue

      // Calculate retention for each subsequent month
      const retention: number[] = []
      for (let j = 0; j <= i; j++) {
        const targetMonth = format(subMonths(endDate, i - j), 'yyyy-MM')
        let retained = 0

        cohortCustomers.forEach(customerId => {
          const purchaseMonths = customerPurchaseMonths.get(customerId)
          if (purchaseMonths?.has(targetMonth)) {
            retained++
          }
        })

        retention.push(Math.round((retained / cohortCustomers.length) * 100))
      }

      cohorts.push({
        cohortMonth,
        cohortSize: cohortCustomers.length,
        retention
      })
    }

    // Calculate summary stats
    const totalCohorts = cohorts.length
    const avgFirstMonthRetention = totalCohorts > 0
      ? cohorts.reduce((sum, c) => sum + (c.retention[1] || 0), 0) / totalCohorts
      : 0

    const avgThirdMonthRetention = totalCohorts > 0
      ? cohorts.filter(c => c.retention.length > 3).reduce((sum, c) => sum + (c.retention[3] || 0), 0) /
        cohorts.filter(c => c.retention.length > 3).length || 0
      : 0

    return NextResponse.json({
      cohorts,
      summary: {
        totalCustomers: customerFirstPurchase.size,
        avgFirstMonthRetention: Math.round(avgFirstMonthRetention),
        avgThirdMonthRetention: Math.round(avgThirdMonthRetention),
        period: { start: format(startDate, 'MMM yyyy'), end: format(endDate, 'MMM yyyy') }
      }
    })
  } catch (error) {
    console.error('Error generating cohort analysis:', error)
    return NextResponse.json(
      { error: 'Failed to generate cohort analysis' },
      { status: 500 }
    )
  }
}

function generateDemoCohortData(months: number) {
  const cohorts: Array<{
    cohortMonth: string
    cohortSize: number
    retention: number[]
  }> = []

  const endDate = new Date()

  for (let i = months - 1; i >= 0; i--) {
    const cohortDate = startOfMonth(subMonths(endDate, i))
    const cohortMonth = format(cohortDate, 'yyyy-MM')
    const cohortSize = Math.floor(Math.random() * 100) + 50

    // Generate realistic retention curve (starts at 100%, decreases over time)
    const retention: number[] = [100]
    for (let j = 1; j <= i; j++) {
      // Typical retention decay: lose 20-40% each month, stabilizing around 10-20%
      const prevRetention = retention[j - 1]
      const decay = Math.random() * 0.25 + 0.15 // 15-40% decay
      const minRetention = 10 + Math.random() * 10 // Floor at 10-20%
      const newRetention = Math.max(minRetention, prevRetention * (1 - decay))
      retention.push(Math.round(newRetention))
    }

    cohorts.push({
      cohortMonth,
      cohortSize,
      retention
    })
  }

  const avgFirstMonthRetention = cohorts.reduce((sum, c) => sum + (c.retention[1] || 0), 0) / cohorts.length
  const cohortsWithThreeMonths = cohorts.filter(c => c.retention.length > 3)
  const avgThirdMonthRetention = cohortsWithThreeMonths.length > 0
    ? cohortsWithThreeMonths.reduce((sum, c) => sum + (c.retention[3] || 0), 0) / cohortsWithThreeMonths.length
    : 0

  return {
    cohorts,
    summary: {
      totalCustomers: cohorts.reduce((sum, c) => sum + c.cohortSize, 0),
      avgFirstMonthRetention: Math.round(avgFirstMonthRetention),
      avgThirdMonthRetention: Math.round(avgThirdMonthRetention),
      period: {
        start: format(startOfMonth(subMonths(endDate, months - 1)), 'MMM yyyy'),
        end: format(endDate, 'MMM yyyy')
      }
    }
  }
}
