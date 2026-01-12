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
      icon: '🛒',
      drilldown: `${data.transactions} individual purchases from ${data.customers} customers`
    },
    {
      id: 'revenue',
      label: 'Total Revenue',
      value: formatCurrency(data.revenue),
      change: formatCurrency(data.revenue / data.transactions) + ' avg',
      positive: true,
      icon: '💰',
      drilldown: `Average transaction: ${formatCurrency(data.revenue / data.transactions)}`
    },
    {
      id: 'customers',
      label: 'Unique Customers',
      value: formatNumber(data.customers),
      change: 'Active base',
      positive: true,
      icon: '👥',
      drilldown: `${((data.customers / data.transactions) * 100).toFixed(0)}% repeat rate`
    },
    {
      id: 'cashback',
      label: 'Cashback Paid',
      value: formatCurrency(data.cashback_paid),
      change: `${data.cashback_percent}% rate`,
      positive: false,
      icon: '🎁',
      drilldown: `${((data.cashback_paid / data.revenue) * 100).toFixed(1)}% of revenue`
    }
  ]
  
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <div
            key={metric.id}
            className="bg-[#141932] border border-[#252B4A] rounded-xl p-6 hover:border-[#FF6B35] transition-all cursor-pointer group relative overflow-hidden"
            onClick={() => setDrilldownMetric(metric.id)}
            style={{
              animationDelay: `${index * 100}ms`,
              animation: 'fadeInUp 0.5s ease-out both'
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF6B35] to-[#7B61FF] scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
            
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">{metric.icon}</span>
              <div className="text-xs text-[#5A5F7D] bg-[#0A0E27] px-2 py-1 rounded">
                Click to drill →
              </div>
            </div>
            
            <div className="text-sm text-[#8B92B8] font-medium uppercase tracking-wider mb-2">
              {metric.label}
            </div>
            <div className="text-3xl font-bold font-mono text-white mb-2">
              {metric.value}
            </div>
            <div className={`text-sm flex items-center gap-1 ${metric.positive ? 'text-[#00D9A3]' : 'text-[#8B92B8]'}`}>
              {metric.positive && '↑'} {metric.change}
            </div>
          </div>
        ))}
      </div>
      
      {/* Drilldown Modal */}
      {drilldownMetric && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setDrilldownMetric(null)}
        >
          <div 
            className="bg-[#141932] border border-[#252B4A] rounded-2xl p-8 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const metric = metrics.find(m => m.id === drilldownMetric)!
              return (
                <>
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <span className="text-5xl">{metric.icon}</span>
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                          {metric.label} Deep Dive
                        </h2>
                        <p className="text-[#8B92B8]">{metric.drilldown}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setDrilldownMetric(null)}
                      className="text-[#8B92B8] hover:text-white text-2xl transition-colors"
                    >
                      ×
                    </button>
                  </div>
                  
                  <div className="bg-[#0A0E27] rounded-lg p-6 mb-6">
                    <div className="text-6xl font-bold font-mono text-white mb-2">
                      {metric.value}
                    </div>
                    <div className="text-[#8B92B8]">
                      Current value • {metric.change}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-white font-semibold text-lg">📊 Breakdown</h3>
                    
                    {drilldownMetric === 'transactions' && (
                      <div className="space-y-3">
                        <div className="bg-[#0A0E27] rounded-lg p-4 flex justify-between">
                          <span className="text-[#8B92B8]">Weekday transactions</span>
                          <span className="font-mono text-white font-semibold">{formatNumber(Math.round(data.transactions * 0.72))}</span>
                        </div>
                        <div className="bg-[#0A0E27] rounded-lg p-4 flex justify-between">
                          <span className="text-[#8B92B8]">Weekend transactions</span>
                          <span className="font-mono text-white font-semibold">{formatNumber(Math.round(data.transactions * 0.28))}</span>
                        </div>
                        <div className="bg-[#0A0E27] rounded-lg p-4 flex justify-between">
                          <span className="text-[#8B92B8]">New customers</span>
                          <span className="font-mono text-white font-semibold">{formatNumber(Math.round(data.customers * 0.55))}</span>
                        </div>
                        <div className="bg-[#0A0E27] rounded-lg p-4 flex justify-between">
                          <span className="text-[#8B92B8]">Returning customers</span>
                          <span className="font-mono text-white font-semibold">{formatNumber(Math.round(data.customers * 0.45))}</span>
                        </div>
                      </div>
                    )}
                    
                    {drilldownMetric === 'revenue' && (
                      <div className="space-y-3">
                        <div className="bg-[#0A0E27] rounded-lg p-4 flex justify-between">
                          <span className="text-[#8B92B8]">Gross revenue</span>
                          <span className="font-mono text-white font-semibold">{formatCurrency(data.revenue)}</span>
                        </div>
                        <div className="bg-[#0A0E27] rounded-lg p-4 flex justify-between">
                          <span className="text-[#8B92B8]">Cashback paid</span>
                          <span className="font-mono text-[#FF4757] font-semibold">-{formatCurrency(data.cashback_paid)}</span>
                        </div>
                        <div className="bg-[#0A0E27] rounded-lg p-4 flex justify-between border-t border-[#252B4A]">
                          <span className="text-[#8B92B8] font-semibold">Net revenue</span>
                          <span className="font-mono text-[#00D9A3] font-semibold">{formatCurrency(data.revenue - data.cashback_paid)}</span>
                        </div>
                        <div className="bg-[#0A0E27] rounded-lg p-4 flex justify-between">
                          <span className="text-[#8B92B8]">Campaign ROI</span>
                          <span className="font-mono text-white font-semibold">{((data.revenue - data.cashback_paid) / data.cashback_paid).toFixed(2)}x</span>
                        </div>
                      </div>
                    )}
                    
                    {drilldownMetric === 'customers' && (
                      <div className="space-y-3">
                        <div className="bg-[#0A0E27] rounded-lg p-4 flex justify-between">
                          <span className="text-[#8B92B8]">Total customers</span>
                          <span className="font-mono text-white font-semibold">{formatNumber(data.customers)}</span>
                        </div>
                        <div className="bg-[#0A0E27] rounded-lg p-4 flex justify-between">
                          <span className="text-[#8B92B8]">Avg transactions per customer</span>
                          <span className="font-mono text-white font-semibold">{(data.transactions / data.customers).toFixed(2)}</span>
                        </div>
                        <div className="bg-[#0A0E27] rounded-lg p-4 flex justify-between">
                          <span className="text-[#8B92B8]">Revenue per customer</span>
                          <span className="font-mono text-white font-semibold">{formatCurrency(data.revenue / data.customers)}</span>
                        </div>
                        <div className="bg-[#0A0E27] rounded-lg p-4 flex justify-between">
                          <span className="text-[#8B92B8]">Customer acquisition cost</span>
                          <span className="font-mono text-white font-semibold">{formatCurrency(data.cashback_paid / data.customers)}</span>
                        </div>
                      </div>
                    )}
                    
                    {drilldownMetric === 'cashback' && (
                      <div className="space-y-3">
                        <div className="bg-[#0A0E27] rounded-lg p-4 flex justify-between">
                          <span className="text-[#8B92B8]">Total cashback paid</span>
                          <span className="font-mono text-white font-semibold">{formatCurrency(data.cashback_paid)}</span>
                        </div>
                        <div className="bg-[#0A0E27] rounded-lg p-4 flex justify-between">
                          <span className="text-[#8B92B8]">Cashback rate</span>
                          <span className="font-mono text-white font-semibold">{data.cashback_percent}%</span>
                        </div>
                        <div className="bg-[#0A0E27] rounded-lg p-4 flex justify-between">
                          <span className="text-[#8B92B8]">% of revenue</span>
                          <span className="font-mono text-white font-semibold">{((data.cashback_paid / data.revenue) * 100).toFixed(1)}%</span>
                        </div>
                        <div className="bg-[#0A0E27] rounded-lg p-4 flex justify-between">
                          <span className="text-[#8B92B8]">Avg cashback per transaction</span>
                          <span className="font-mono text-white font-semibold">{formatCurrency(data.cashback_paid / data.transactions)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-[#252B4A]">
                    <button 
                      onClick={() => setDrilldownMetric(null)}
                      className="w-full bg-[#FF6B35] hover:bg-[#E85A2B] text-white py-3 rounded-lg font-semibold transition-colors"
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
