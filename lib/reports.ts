import { MerchantMetrics, CompetitorData } from './types'
import { format, subDays } from 'date-fns'

export interface ReportData {
  merchantData: MerchantMetrics
  competitors: CompetitorData[]
  historical: MerchantMetrics[]
  dateRange: {
    startDate: string
    endDate: string
  }
  generatedAt: string
}

export type ReportFrequency = 'daily' | 'weekly' | 'monthly'

export interface ScheduledReport {
  id: string
  merchantId: string
  name: string
  frequency: ReportFrequency
  recipients: string[]
  includeCompetitors: boolean
  includeHistorical: boolean
  isActive: boolean
  lastSentAt?: string
  nextScheduledAt: string
  createdAt: string
  updatedAt: string
}

/**
 * Generate HTML report for email
 */
export function generateHTMLReport(data: ReportData, reportName: string): string {
  const { merchantData, competitors, historical, dateRange, generatedAt } = data

  const formatCurrency = (amount: number) => `${(amount / 100).toFixed(2)} RON`
  const formatNumber = (num: number) => num.toLocaleString()

  // Calculate period-over-period changes
  let revenueChange = 0
  let transactionChange = 0
  let customerChange = 0

  if (historical && historical.length > 1) {
    const midPoint = Math.floor(historical.length / 2)
    const firstHalf = historical.slice(0, midPoint)
    const secondHalf = historical.slice(midPoint)

    const firstRevenue = firstHalf.reduce((sum, d) => sum + d.revenue, 0)
    const secondRevenue = secondHalf.reduce((sum, d) => sum + d.revenue, 0)
    revenueChange = firstRevenue > 0 ? ((secondRevenue - firstRevenue) / firstRevenue) * 100 : 0

    const firstTx = firstHalf.reduce((sum, d) => sum + d.transactions, 0)
    const secondTx = secondHalf.reduce((sum, d) => sum + d.transactions, 0)
    transactionChange = firstTx > 0 ? ((secondTx - firstTx) / firstTx) * 100 : 0

    const firstCust = firstHalf.reduce((sum, d) => sum + d.customers, 0)
    const secondCust = secondHalf.reduce((sum, d) => sum + d.customers, 0)
    customerChange = firstCust > 0 ? ((secondCust - firstCust) / firstCust) * 100 : 0
  }

  const changeIndicator = (change: number) => {
    const color = change >= 0 ? '#10B981' : '#EF4444'
    const arrow = change >= 0 ? '↑' : '↓'
    return `<span style="color: ${color}; font-weight: 600;">${arrow} ${Math.abs(change).toFixed(1)}%</span>`
  }

  // Find merchant rank
  const merchantRank = competitors.find(c => c.isYou)?.rank || '-'

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${reportName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">KaChing Analytics</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">${reportName}</p>
    </div>

    <!-- Main Content -->
    <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
      <!-- Date Range -->
      <div style="text-align: center; margin-bottom: 24px;">
        <p style="color: #64748B; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0;">Report Period</p>
        <p style="color: #1E293B; font-size: 16px; font-weight: 500; margin: 4px 0 0 0;">${dateRange.startDate} to ${dateRange.endDate}</p>
      </div>

      <!-- Merchant Name -->
      <div style="text-align: center; margin-bottom: 32px;">
        <h2 style="color: #1E293B; margin: 0; font-size: 20px;">${merchantData.merchant_name}</h2>
        <p style="color: #64748B; font-size: 14px; margin: 4px 0 0 0;">Market Rank: #${merchantRank}</p>
      </div>

      <!-- Key Metrics -->
      <div style="display: table; width: 100%; margin-bottom: 32px;">
        <div style="display: table-row;">
          <div style="display: table-cell; width: 50%; padding: 16px; background: #F8FAFC; border-radius: 8px 0 0 0;">
            <p style="color: #64748B; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0;">Total Revenue</p>
            <p style="color: #1E293B; font-size: 24px; font-weight: 600; margin: 4px 0;">${formatCurrency(merchantData.revenue)}</p>
            <p style="margin: 0; font-size: 12px;">${changeIndicator(revenueChange)} vs prior period</p>
          </div>
          <div style="display: table-cell; width: 50%; padding: 16px; background: #F8FAFC; border-radius: 0 8px 0 0;">
            <p style="color: #64748B; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0;">Transactions</p>
            <p style="color: #1E293B; font-size: 24px; font-weight: 600; margin: 4px 0;">${formatNumber(merchantData.transactions)}</p>
            <p style="margin: 0; font-size: 12px;">${changeIndicator(transactionChange)} vs prior period</p>
          </div>
        </div>
        <div style="display: table-row;">
          <div style="display: table-cell; width: 50%; padding: 16px; background: #F8FAFC; border-radius: 0 0 0 8px;">
            <p style="color: #64748B; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0;">Customers</p>
            <p style="color: #1E293B; font-size: 24px; font-weight: 600; margin: 4px 0;">${formatNumber(merchantData.customers)}</p>
            <p style="margin: 0; font-size: 12px;">${changeIndicator(customerChange)} vs prior period</p>
          </div>
          <div style="display: table-cell; width: 50%; padding: 16px; background: #F8FAFC; border-radius: 0 0 8px 0;">
            <p style="color: #64748B; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0;">Cashback Paid</p>
            <p style="color: #1E293B; font-size: 24px; font-weight: 600; margin: 4px 0;">${formatCurrency(merchantData.cashback_paid)}</p>
            <p style="margin: 0; font-size: 12px;">at ${merchantData.cashback_percent}% rate</p>
          </div>
        </div>
      </div>

      <!-- Campaign ROI -->
      <div style="background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%); border-radius: 8px; padding: 20px; margin-bottom: 32px; text-align: center;">
        <p style="color: #065F46; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0;">Campaign ROI</p>
        <p style="color: #059669; font-size: 32px; font-weight: 700; margin: 8px 0 0 0;">
          ${((merchantData.revenue - merchantData.cashback_paid) / merchantData.cashback_paid).toFixed(2)}x
        </p>
        <p style="color: #047857; font-size: 12px; margin: 4px 0 0 0;">Return on cashback investment</p>
      </div>

      ${competitors && competitors.length > 0 ? `
      <!-- Competitor Rankings -->
      <div style="margin-bottom: 32px;">
        <h3 style="color: #1E293B; font-size: 14px; font-weight: 600; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 0.5px;">Market Position</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background: #F1F5F9;">
              <th style="padding: 10px; text-align: left; color: #64748B; font-weight: 500;">Rank</th>
              <th style="padding: 10px; text-align: left; color: #64748B; font-weight: 500;">Merchant</th>
              <th style="padding: 10px; text-align: right; color: #64748B; font-weight: 500;">Revenue</th>
            </tr>
          </thead>
          <tbody>
            ${competitors.slice(0, 5).map(comp => `
              <tr style="border-bottom: 1px solid #E2E8F0; ${comp.isYou ? 'background: #EFF6FF;' : ''}">
                <td style="padding: 10px; font-weight: ${comp.isYou ? '600' : '400'};">#${comp.rank}</td>
                <td style="padding: 10px; font-weight: ${comp.isYou ? '600' : '400'};">${comp.merchant_name}${comp.isYou ? ' (You)' : ''}</td>
                <td style="padding: 10px; text-align: right; font-weight: ${comp.isYou ? '600' : '400'};">${formatCurrency(comp.revenue)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}

      <!-- CTA -->
      <div style="text-align: center; margin-top: 32px;">
        <a href="${process.env.NEXTAUTH_URL || 'https://kaching-analytics.com'}" style="display: inline-block; background: #3B82F6; color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 500; font-size: 14px;">View Full Dashboard</a>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 24px;">
      <p style="color: #94A3B8; font-size: 12px; margin: 0;">
        Generated on ${format(new Date(generatedAt), 'MMMM d, yyyy')} at ${format(new Date(generatedAt), 'h:mm a')}
      </p>
      <p style="color: #94A3B8; font-size: 11px; margin: 8px 0 0 0;">
        KaChing Analytics • Cashback Campaign Intelligence
      </p>
    </div>
  </div>
</body>
</html>
`
}

/**
 * Calculate next scheduled time based on frequency
 */
export function calculateNextScheduledTime(frequency: ReportFrequency, fromDate: Date = new Date()): Date {
  const next = new Date(fromDate)

  switch (frequency) {
    case 'daily':
      // Next day at 8 AM
      next.setDate(next.getDate() + 1)
      next.setHours(8, 0, 0, 0)
      break
    case 'weekly':
      // Next Monday at 8 AM
      const daysUntilMonday = (8 - next.getDay()) % 7 || 7
      next.setDate(next.getDate() + daysUntilMonday)
      next.setHours(8, 0, 0, 0)
      break
    case 'monthly':
      // First day of next month at 8 AM
      next.setMonth(next.getMonth() + 1)
      next.setDate(1)
      next.setHours(8, 0, 0, 0)
      break
  }

  return next
}

/**
 * Get date range for report based on frequency
 */
export function getReportDateRange(frequency: ReportFrequency): { startDate: Date; endDate: Date } {
  const endDate = new Date()
  let startDate: Date

  switch (frequency) {
    case 'daily':
      startDate = subDays(endDate, 1)
      break
    case 'weekly':
      startDate = subDays(endDate, 7)
      break
    case 'monthly':
      startDate = subDays(endDate, 30)
      break
    default:
      startDate = subDays(endDate, 7)
  }

  return { startDate, endDate }
}
