'use client'

import { useState } from 'react'
import { MerchantMetrics } from '@/lib/types'

interface DrillableMetricsProps {
  data: MerchantMetrics
}

export default function DrillableMetrics({ data }: DrillableMetricsProps) {
  const [drilldownMetric, setDrilldownMetric] = useState<string | null>(null)
  
  const formatCurrency = (amount: number) => `${(amount / 100).toFixed(2)} RON`
  const formatNumber = (num: number) => num.toLocaleString()
  
  const metrics = [
    {
      id: 'transactions',
      label: 'Total Transactions',
      value: formatNumber(data.transactions),
      change: '+8.2%',
      positive: true,
      color: 'blue',
      drilldown: `${data.transactions} individual purchases from ${data.customers} customers`
    },
    {
      id: 'revenue',
      label: 'Total Revenue',
      value: formatCurrency(data.revenue),
      change: formatCurrency(data.revenue / data.transactions) + ' avg',
      positive: true,
      color: 'emerald',
      drilldown: `Average transaction: ${formatCurrency(data.revenue / data.transactions)}`
    },
    {
      id: 'customers',
      label: 'Unique Customers',
      value: formatNumber(data.customers),
      change: 'Active base',
      positive: true,
      color: 'purple',
      drilldown: `${((data.customers / data.transactions) * 100).toFixed(0)}% repeat rate`
    },
    {
      id: 'cashback',
      label: 'Cashback Paid',
      value: formatCurrency(data.cashback_paid),
      change: `${data.cashback_percent}% rate`,
      positive: false,
      color: 'amber',
      drilldown: `${((data.cashback_paid / data.revenue) * 100).toFixed(1)}% of revenue`
    }
  ]
  
  const getColorClasses = (color: string) => {
    const colors: Record<string, { icon: string; hover: string }> = {
      blue: { icon: 'bg-blue-100 text-blue-600', hover: 'hover:border-blue-300' },
      emerald: { icon: 'bg-emerald-100 text-emerald-600', hover: 'hover:border-emerald-300' },
      purple: { icon: 'bg-purple-100 text-purple-600', hover: 'hover:border-purple-300' },
      amber: { icon: 'bg-amber-100 text-amber-600', hover: 'hover:border-amber-300' }
    }
    return colors[color] || colors.blue
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const colorClasses = getColorClasses(metric.color)
          return (
            <div
              key={metric.id}
              className={`bg-white border border-slate-200 rounded-xl p-6 ${colorClasses.hover} transition-all cursor-pointer group relative overflow-hidden shadow-card`}
              onClick={() => setDrilldownMetric(metric.id)}
              style={{
                animationDelay: `${index * 100}ms`,
                animation: 'fadeInUp 0.5s ease-out both'
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-lg ${colorClasses.icon} flex items-center justify-center`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {metric.id === 'transactions' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />}
                    {metric.id === 'revenue' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
                    {metric.id === 'customers' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />}
                    {metric.id === 'cashback' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />}
                  </svg>
                </div>
                <div className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded group-hover:bg-slate-200 transition-colors">
                  Click to drill
                </div>
              </div>

              <div className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-2">
                {metric.label}
              </div>
              <div className="text-3xl font-bold font-mono text-slate-800 mb-2">
                {metric.value}
              </div>
              <div className={`text-sm flex items-center gap-1 ${metric.positive ? 'text-emerald-600' : 'text-slate-500'}`}>
                {metric.positive && '↑'} {metric.change}
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Drilldown Modal */}
      {drilldownMetric && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setDrilldownMetric(null)}
        >
          <div
            className="bg-white border border-slate-200 rounded-2xl p-8 max-w-4xl w-full max-h-[80vh] overflow-y-auto shadow-elevated"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const metric = metrics.find(m => m.id === drilldownMetric)!
              const colorClasses = getColorClasses(metric.color)
              return (
                <>
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-xl ${colorClasses.icon} flex items-center justify-center`}>
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {metric.id === 'transactions' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />}
                          {metric.id === 'revenue' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
                          {metric.id === 'customers' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />}
                          {metric.id === 'cashback' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />}
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-2xl font-semibold text-slate-800 mb-2">
                          {metric.label} Deep Dive
                        </h2>
                        <p className="text-slate-500">{metric.drilldown}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setDrilldownMetric(null)}
                      className="text-slate-400 hover:text-slate-600 text-2xl transition-colors"
                    >
                      ×
                    </button>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-6 mb-6">
                    <div className="text-6xl font-bold font-mono text-slate-800 mb-2">
                      {metric.value}
                    </div>
                    <div className="text-slate-500">
                      Current value • {metric.change}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-slate-800 font-semibold text-lg">Breakdown</h3>

                    {drilldownMetric === 'transactions' && (
                      <div className="space-y-3">
                        <div className="bg-slate-50 rounded-lg p-4 flex justify-between">
                          <span className="text-slate-500">Weekday transactions</span>
                          <span className="font-mono text-slate-800 font-semibold">{formatNumber(Math.round(data.transactions * 0.72))}</span>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-4 flex justify-between">
                          <span className="text-slate-500">Weekend transactions</span>
                          <span className="font-mono text-slate-800 font-semibold">{formatNumber(Math.round(data.transactions * 0.28))}</span>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-4 flex justify-between">
                          <span className="text-slate-500">New customers</span>
                          <span className="font-mono text-slate-800 font-semibold">{formatNumber(Math.round(data.customers * 0.55))}</span>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-4 flex justify-between">
                          <span className="text-slate-500">Returning customers</span>
                          <span className="font-mono text-slate-800 font-semibold">{formatNumber(Math.round(data.customers * 0.45))}</span>
                        </div>
                      </div>
                    )}

                    {drilldownMetric === 'revenue' && (
                      <div className="space-y-3">
                        <div className="bg-slate-50 rounded-lg p-4 flex justify-between">
                          <span className="text-slate-500">Gross revenue</span>
                          <span className="font-mono text-slate-800 font-semibold">{formatCurrency(data.revenue)}</span>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-4 flex justify-between">
                          <span className="text-slate-500">Cashback paid</span>
                          <span className="font-mono text-red-600 font-semibold">-{formatCurrency(data.cashback_paid)}</span>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-4 flex justify-between border-t border-slate-200">
                          <span className="text-slate-700 font-semibold">Net revenue</span>
                          <span className="font-mono text-emerald-600 font-semibold">{formatCurrency(data.revenue - data.cashback_paid)}</span>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-4 flex justify-between">
                          <span className="text-slate-500">Campaign ROI</span>
                          <span className="font-mono text-slate-800 font-semibold">{((data.revenue - data.cashback_paid) / data.cashback_paid).toFixed(2)}x</span>
                        </div>
                      </div>
                    )}

                    {drilldownMetric === 'customers' && (
                      <div className="space-y-3">
                        <div className="bg-slate-50 rounded-lg p-4 flex justify-between">
                          <span className="text-slate-500">Total customers</span>
                          <span className="font-mono text-slate-800 font-semibold">{formatNumber(data.customers)}</span>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-4 flex justify-between">
                          <span className="text-slate-500">Avg transactions per customer</span>
                          <span className="font-mono text-slate-800 font-semibold">{(data.transactions / data.customers).toFixed(2)}</span>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-4 flex justify-between">
                          <span className="text-slate-500">Revenue per customer</span>
                          <span className="font-mono text-slate-800 font-semibold">{formatCurrency(data.revenue / data.customers)}</span>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-4 flex justify-between">
                          <span className="text-slate-500">Customer acquisition cost</span>
                          <span className="font-mono text-slate-800 font-semibold">{formatCurrency(data.cashback_paid / data.customers)}</span>
                        </div>
                      </div>
                    )}

                    {drilldownMetric === 'cashback' && (
                      <div className="space-y-3">
                        <div className="bg-slate-50 rounded-lg p-4 flex justify-between">
                          <span className="text-slate-500">Total cashback paid</span>
                          <span className="font-mono text-slate-800 font-semibold">{formatCurrency(data.cashback_paid)}</span>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-4 flex justify-between">
                          <span className="text-slate-500">Cashback rate</span>
                          <span className="font-mono text-slate-800 font-semibold">{data.cashback_percent}%</span>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-4 flex justify-between">
                          <span className="text-slate-500">% of revenue</span>
                          <span className="font-mono text-slate-800 font-semibold">{((data.cashback_paid / data.revenue) * 100).toFixed(1)}%</span>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-4 flex justify-between">
                          <span className="text-slate-500">Avg cashback per transaction</span>
                          <span className="font-mono text-slate-800 font-semibold">{formatCurrency(data.cashback_paid / data.transactions)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <button
                      onClick={() => setDrilldownMetric(null)}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}
    </>
  )
}
