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

      {/* Campaign Distribution */}
      <div className="pluxee-card">
        <h3 className="font-semibold text-pluxee-deep-blue mb-6">Campaign Distribution</h3>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {distributionItems.map((item, index) => (
            <div key={index} className="text-center">
              {/* Circular Progress Indicator */}
              <div className="relative w-24 h-24 mx-auto mb-3">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    className="stroke-slate-100"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    className={item.color.replace('bg-', 'stroke-')}
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${item.value * 2.51} 251`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-pluxee-deep-blue">{item.value}%</span>
                </div>
              </div>
              <div className="text-sm font-medium text-pluxee-deep-blue">{item.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-center gap-6 text-xs text-slate-500">
            {distributionItems.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${item.color}`} />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
