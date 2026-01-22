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
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-pluxee-deep-blue">Gender Distribution</h3>
            <span className="text-sm text-slate-500">{formatNumber(totalGender)} total</span>
          </div>

          <div className="flex items-center gap-6">
            {/* Donut Chart */}
            <div className="relative w-40 h-40 flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {/* Background */}
                <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="14" />
                {/* Segments */}
                {genderData.reduce((acc, segment, index) => {
                  const percentage = (segment.value / totalGender) * 100
                  const circumference = 2 * Math.PI * 40
                  const segmentLength = (percentage / 100) * circumference
                  const colors: Record<string, string> = {
                    'bg-pluxee-coral': '#FF6B6B',
                    'bg-pluxee-boldly-blue': '#17CCF9',
                    'bg-slate-300': '#cbd5e1'
                  }

                  acc.elements.push(
                    <circle
                      key={index}
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke={colors[segment.color] || '#94a3b8'}
                      strokeWidth="14"
                      strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
                      strokeDashoffset={-acc.offset}
                      className="transition-all duration-700"
                    />
                  )
                  acc.offset += segmentLength
                  return acc
                }, { elements: [] as JSX.Element[], offset: 0 }).elements}
              </svg>
              {/* Center icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Legend Cards */}
            <div className="flex-1 space-y-2">
              {genderData.map((segment, index) => {
                const percentage = ((segment.value / totalGender) * 100).toFixed(1)
                const icons: Record<string, JSX.Element> = {
                  'Female': <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="8" r="5" /><path d="M12 13c-4 0-7 2-7 4v2h14v-2c0-2-3-4-7-4z" /></svg>,
                  'Male': <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="8" r="5" /><path d="M12 13c-4 0-7 2-7 4v2h14v-2c0-2-3-4-7-4z" /></svg>,
                  'Unknown': <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" /></svg>
                }
                return (
                  <div
                    key={index}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      segment.label === 'Female' ? 'border-[#FF6B6B]/30 bg-[#FF6B6B]/5' :
                      segment.label === 'Male' ? 'border-[#17CCF9]/30 bg-[#17CCF9]/5' :
                      'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${segment.color} text-white`}>
                          {icons[segment.label]}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-700">{segment.label}</div>
                          <div className="text-xs text-slate-500">{formatNumber(segment.value)}</div>
                        </div>
                      </div>
                      <div className="text-xl font-bold text-pluxee-deep-blue">{percentage}%</div>
                    </div>
                  </div>
                )
              })}
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
      <div className="pluxee-card overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pluxee-ultra-green to-pluxee-boldly-blue flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-pluxee-deep-blue">Top Spenders</h3>
              <p className="text-sm text-slate-500">Highest-value campaign customers</p>
            </div>
          </div>
          <div className="px-3 py-1 rounded-full bg-pluxee-ultra-green/10 border border-pluxee-ultra-green/30">
            <span className="text-sm font-semibold text-pluxee-deep-blue">Top 10%</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Customer Count Card */}
          <div className="relative bg-gradient-to-br from-pluxee-ultra-green/10 to-pluxee-ultra-green/5 rounded-xl p-5 border border-pluxee-ultra-green/20 overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
              <svg className="w-full h-full text-pluxee-ultra-green" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-pluxee-ultra-green/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-pluxee-ultra-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-slate-600">Top Spenders</span>
              </div>
              <div className="text-3xl font-bold text-pluxee-deep-blue">
                {formatNumber(data.topSpendersCount)}
              </div>
              <div className="text-sm text-slate-500 mt-1">
                {((data.topSpendersCount / data.totalCustomers) * 100).toFixed(1)}% of customers
              </div>
            </div>
          </div>

          {/* Average Spend Card */}
          <div className="relative bg-gradient-to-br from-pluxee-boldly-blue/10 to-pluxee-boldly-blue/5 rounded-xl p-5 border border-pluxee-boldly-blue/20 overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
              <svg className="w-full h-full text-pluxee-boldly-blue" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-pluxee-boldly-blue/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-pluxee-boldly-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-slate-600">Avg Spend</span>
              </div>
              <div className="text-3xl font-bold text-pluxee-deep-blue">
                {formatCurrency(data.avgSpendPerTopSpender)}
              </div>
              <div className="text-sm text-slate-500 mt-1">
                per top spender
              </div>
            </div>
          </div>
        </div>

        {/* Bottom insight bar */}
        <div className="mt-4 p-3 bg-slate-50 rounded-lg flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-pluxee-ultra-green/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-pluxee-ultra-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <p className="text-sm text-slate-600">
            <span className="font-medium">Insight:</span> Top spenders contribute{' '}
            <span className="font-semibold text-pluxee-deep-blue">
              {formatCurrency(data.topSpendersCount * data.avgSpendPerTopSpender)}
            </span>{' '}
            in total campaign revenue
          </p>
        </div>
      </div>
    </div>
  )
}
