'use client'

import { OwnCustomerProfile, AgeDistributionBucket } from '@/types/analytics'
import { GDPR_MIN_USERS, applyGDPRProtection } from '@/lib/access-tier'

interface CustomerProfileProps {
  data: OwnCustomerProfile
  currency?: string
}

export default function CustomerProfile({ data, currency = 'RON' }: CustomerProfileProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('ro-RO').format(value)
  }

  // Apply GDPR protection
  const gdprProtected = applyGDPRProtection(data, data.totalCustomers)

  if (gdprProtected.isProtected) {
    return (
      <div className="pluxee-gdpr-protected">
        <svg className="w-12 h-12 mb-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <h3 className="text-lg font-semibold text-pluxee-deep-blue mb-2">Data Protected</h3>
        <p className="text-sm text-slate-500 max-w-xs">
          {gdprProtected.message || `Minimum ${GDPR_MIN_USERS} customers required to display demographic data.`}
        </p>
      </div>
    )
  }

  // Gender distribution for pie chart
  const genderData = [
    { label: 'Female', value: data.genderDistribution.female, color: 'bg-pluxee-coral' },
    { label: 'Male', value: data.genderDistribution.male, color: 'bg-pluxee-boldly-blue' },
    { label: 'Unknown', value: data.genderDistribution.unknown, color: 'bg-slate-300' }
  ].filter(g => g.value > 0)

  const totalGender = genderData.reduce((acc, g) => acc + g.value, 0)

  // Find max age bucket for scaling histogram
  const maxAgeBucket = Math.max(...data.ageDistribution.map(b => b.percentage))

  return (
    <div className="space-y-6">
      <h2 className="pluxee-section-header">Own Customer Profile</h2>
      <p className="pluxee-section-subheader">Demographics of your cashback campaign customers</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gender Distribution */}
        <div className="pluxee-card">
          <h3 className="font-semibold text-pluxee-deep-blue mb-6">Gender Distribution</h3>

          <div className="flex items-center gap-8">
            {/* Pie Chart Simulation */}
            <div className="relative w-36 h-36">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {genderData.reduce((acc, segment, index) => {
                  const percentage = (segment.value / totalGender) * 100
                  const strokeDasharray = `${percentage * 3.14} 314`
                  const strokeDashoffset = -acc.offset * 3.14

                  acc.elements.push(
                    <circle
                      key={index}
                      cx="50"
                      cy="50"
                      r="40"
                      className={segment.color.replace('bg-', 'stroke-')}
                      strokeWidth="20"
                      fill="none"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                    />
                  )

                  acc.offset += percentage
                  return acc
                }, { elements: [] as JSX.Element[], offset: 0 }).elements}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-medium text-slate-500">{formatNumber(totalGender)}</span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex-1 space-y-3">
              {genderData.map((segment, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${segment.color}`} />
                    <span className="text-sm text-slate-600">{segment.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-pluxee-deep-blue">
                      {((segment.value / totalGender) * 100).toFixed(1)}%
                    </span>
                    <span className="text-xs text-slate-400 ml-2">
                      ({formatNumber(segment.value)})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Age Distribution */}
        <div className="pluxee-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-pluxee-deep-blue">Age Distribution</h3>
            <span className="text-sm text-slate-500">Avg: {data.avgAge.toFixed(0)} years</span>
          </div>

          <div className="space-y-2">
            {data.ageDistribution.map((bucket, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="w-16 text-xs text-slate-500 text-right">{bucket.label}</span>
                <div className="flex-1 h-6 bg-slate-100 rounded overflow-hidden">
                  <div
                    className="h-full bg-pluxee-ultra-green rounded transition-all duration-500 flex items-center justify-end pr-2"
                    style={{ width: `${(bucket.percentage / maxAgeBucket) * 100}%`, minWidth: bucket.percentage > 0 ? '40px' : '0' }}
                  >
                    {bucket.percentage > 5 && (
                      <span className="text-xs font-medium text-pluxee-deep-blue">
                        {bucket.percentage.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
                {bucket.percentage <= 5 && (
                  <span className="text-xs text-slate-400 w-12">{bucket.percentage.toFixed(1)}%</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Spenders */}
      <div className="pluxee-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-pluxee-deep-blue">Top Spenders</h3>
            <p className="text-sm text-slate-500">Your highest-value campaign customers</p>
          </div>
          <div className="pluxee-badge pluxee-badge--premium">Top 10%</div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-pluxee-ultra-green-05 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-pluxee-deep-blue mb-1">
              {formatNumber(data.topSpendersCount)}
            </div>
            <div className="text-sm text-slate-500">Top Spenders</div>
          </div>
          <div className="bg-pluxee-boldly-blue-05 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-pluxee-deep-blue mb-1">
              {formatCurrency(data.avgSpendPerTopSpender)}
            </div>
            <div className="text-sm text-slate-500">Avg Spend per Top Spender</div>
          </div>
        </div>

        <p className="text-xs text-slate-400 mt-4 text-center">
          Top spenders represent {((data.topSpendersCount / data.totalCustomers) * 100).toFixed(1)}% of your customer base
        </p>
      </div>
    </div>
  )
}
