'use client'

import { CashbackHeroKPIs as KPIData } from '@/types/analytics'

interface CashbackHeroKPIsProps {
  data: KPIData
  currency?: string
}

export default function CashbackHeroKPIs({ data, currency = 'RON' }: CashbackHeroKPIsProps) {
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

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const formatMultiplier = (value: number) => {
    return `${value.toFixed(1)}x`
  }

  const TrendIndicator = ({ value, isPositive }: { value: number; isPositive?: boolean }) => {
    const positive = isPositive ?? value >= 0
    return (
      <span className={`pluxee-kpi-trend ${positive ? 'pluxee-kpi-trend--positive' : 'pluxee-kpi-trend--negative'}`}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={positive ? 'M5 10l7-7m0 0l7 7m-7-7v18' : 'M19 14l-7 7m0 0l-7-7m7 7V3'}
          />
        </svg>
        {formatPercent(value)}
      </span>
    )
  }

  const kpis = [
    {
      label: 'Campaign Budget',
      value: formatCurrency(data.campaignBudget),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'bg-pluxee-deep-blue-05'
    },
    {
      label: 'Campaign Revenue',
      value: formatCurrency(data.campaignRevenue),
      trend: data.revenueTrend,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-pluxee-ultra-green-05'
    },
    {
      label: 'ROI',
      value: formatMultiplier(data.roi),
      trend: data.roiTrend,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      color: 'bg-pluxee-boldly-blue-05'
    },
    {
      label: 'CAC',
      value: formatCurrency(data.cac),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      color: 'bg-pluxee-very-yellow-05'
    }
  ]

  const customerKpis = [
    {
      label: 'Campaign Customers',
      value: formatNumber(data.totalCampaignCustomers),
      trend: data.customersTrend,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      label: 'New Customers',
      value: formatNumber(data.newCustomers),
      subtext: `${((data.newCustomers / data.totalCampaignCustomers) * 100).toFixed(1)}% of total`,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      )
    },
    {
      label: 'Repeat Customers',
      value: formatNumber(data.repeatCustomers),
      subtext: `${data.repeatRate.toFixed(1)}% repeat rate`,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* Primary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <div key={index} className="pluxee-card">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 ${kpi.color} rounded-lg flex items-center justify-center text-pluxee-deep-blue`}>
                {kpi.icon}
              </div>
              {kpi.trend !== undefined && <TrendIndicator value={kpi.trend} />}
            </div>
            <div className="pluxee-kpi-value">{kpi.value}</div>
            <div className="pluxee-kpi-label">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Customer KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {customerKpis.map((kpi, index) => (
          <div key={index} className="pluxee-card flex items-center gap-4">
            <div className="w-12 h-12 bg-pluxee-ultra-green-20 rounded-xl flex items-center justify-center text-pluxee-deep-blue">
              {kpi.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-pluxee-deep-blue">{kpi.value}</span>
                {kpi.trend !== undefined && <TrendIndicator value={kpi.trend} />}
              </div>
              <div className="text-sm text-slate-500">{kpi.label}</div>
              {kpi.subtext && (
                <div className="text-xs text-pluxee-ultra-green font-medium mt-0.5">{kpi.subtext}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
