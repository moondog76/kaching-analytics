'use client'

import { CashbackReceiptComparison, CashbackVisitComparison, CampaignDistribution } from '@/types/analytics'

interface CampaignPerformanceProps {
  receiptComparison: CashbackReceiptComparison
  visitComparison: CashbackVisitComparison
  distribution: CampaignDistribution
  currency?: string
}

export default function CampaignPerformance({
  receiptComparison,
  visitComparison,
  distribution,
  currency = 'RON'
}: CampaignPerformanceProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

  // Calculate bar widths for comparison
  const maxReceipt = Math.max(receiptComparison.domesticAvgReceipt, receiptComparison.campaignAvgReceipt)
  const domesticReceiptWidth = (receiptComparison.domesticAvgReceipt / maxReceipt) * 100
  const campaignReceiptWidth = (receiptComparison.campaignAvgReceipt / maxReceipt) * 100

  const maxVisits = Math.max(visitComparison.domesticAvgVisits, visitComparison.campaignAvgVisits)
  const domesticVisitsWidth = (visitComparison.domesticAvgVisits / maxVisits) * 100
  const campaignVisitsWidth = (visitComparison.campaignAvgVisits / maxVisits) * 100

  // Distribution data for donut chart simulation
  const distributionItems = [
    { label: 'Sector Growth', value: distribution.sectorGrowth, color: 'bg-pluxee-ultra-green' },
    { label: 'New Customers', value: distribution.newCustomers, color: 'bg-pluxee-boldly-blue' },
    { label: 'Loyalty', value: distribution.loyalty, color: 'bg-pluxee-very-yellow' },
    { label: 'Maximum Reach', value: distribution.maximumReach, color: 'bg-pluxee-coral' }
  ]

  return (
    <div className="space-y-6">
      <h2 className="pluxee-section-header">Campaign Performance</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receipt Comparison */}
        <div className="pluxee-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-pluxee-deep-blue">Average Receipt</h3>
            <span className={`text-sm font-medium ${receiptComparison.upliftPercentage >= 0 ? 'text-pluxee-ultra-green' : 'text-pluxee-coral'}`}>
              {formatPercent(receiptComparison.upliftPercentage)} uplift
            </span>
          </div>

          <div className="space-y-4">
            {/* Domestic */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-500">Domestic Average</span>
                <span className="font-medium text-pluxee-deep-blue">{formatCurrency(receiptComparison.domesticAvgReceipt)}</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-300 rounded-full transition-all duration-500"
                  style={{ width: `${domesticReceiptWidth}%` }}
                />
              </div>
            </div>

            {/* Campaign */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-500">Campaign Average</span>
                <span className="font-medium text-pluxee-deep-blue">{formatCurrency(receiptComparison.campaignAvgReceipt)}</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-pluxee-ultra-green rounded-full transition-all duration-500"
                  style={{ width: `${campaignReceiptWidth}%` }}
                />
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400 mt-4">
            Campaign customers spend {receiptComparison.upliftPercentage.toFixed(1)}% more per visit
          </p>
        </div>

        {/* Visit Comparison */}
        <div className="pluxee-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-pluxee-deep-blue">Average Visits</h3>
            <span className={`text-sm font-medium ${visitComparison.changePercentage >= 0 ? 'text-pluxee-ultra-green' : 'text-pluxee-coral'}`}>
              {formatPercent(visitComparison.changePercentage)} change
            </span>
          </div>

          <div className="space-y-4">
            {/* Domestic */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-500">Domestic Average</span>
                <span className="font-medium text-pluxee-deep-blue">{visitComparison.domesticAvgVisits.toFixed(1)} visits</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-300 rounded-full transition-all duration-500"
                  style={{ width: `${domesticVisitsWidth}%` }}
                />
              </div>
            </div>

            {/* Campaign */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-500">Campaign Average</span>
                <span className="font-medium text-pluxee-deep-blue">{visitComparison.campaignAvgVisits.toFixed(1)} visits</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-pluxee-boldly-blue rounded-full transition-all duration-500"
                  style={{ width: `${campaignVisitsWidth}%` }}
                />
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400 mt-4">
            Campaign customers visit {Math.abs(visitComparison.changePercentage).toFixed(1)}% {visitComparison.changePercentage >= 0 ? 'more' : 'less'} frequently
          </p>
        </div>
      </div>

      {/* Campaign Distribution - Donut Chart */}
      <div className="pluxee-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-pluxee-deep-blue">Campaign Distribution</h3>
            <p className="text-sm text-slate-500">Breakdown of campaign objectives</p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          {/* Donut Chart */}
          <div className="relative w-48 h-48 flex-shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#f1f5f9"
                strokeWidth="12"
              />
              {/* Segments */}
              {distributionItems.reduce((acc, item, index) => {
                const circumference = 2 * Math.PI * 40
                const segmentLength = (item.value / 100) * circumference
                const gapLength = circumference - segmentLength
                const colors: Record<string, string> = {
                  'bg-pluxee-ultra-green': '#00EB5E',
                  'bg-pluxee-boldly-blue': '#17CCF9',
                  'bg-pluxee-very-yellow': '#FFE566',
                  'bg-pluxee-coral': '#FF6B6B'
                }

                acc.elements.push(
                  <circle
                    key={index}
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={colors[item.color] || '#94a3b8'}
                    strokeWidth="12"
                    strokeDasharray={`${segmentLength} ${gapLength}`}
                    strokeDashoffset={-acc.offset}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />
                )
                acc.offset += segmentLength
                return acc
              }, { elements: [] as JSX.Element[], offset: 0 }).elements}
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-pluxee-deep-blue">100%</span>
              <span className="text-xs text-slate-500">Total</span>
            </div>
          </div>

          {/* Legend with bars */}
          <div className="flex-1 space-y-3">
            {distributionItems.map((item, index) => (
              <div key={index} className="group">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="text-sm font-medium text-slate-700">{item.label}</span>
                  </div>
                  <span className="text-sm font-bold text-pluxee-deep-blue">{item.value}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-500`}
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
