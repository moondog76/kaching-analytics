'use client'

import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import { CompetitorData, MerchantMetrics } from '@/lib/types'

interface CompetitorComparisonProps {
  yourData: MerchantMetrics
  competitors: CompetitorData[]
}

type ViewMode = 'bars' | 'radar' | 'table'

export default function CompetitorComparison({ yourData, competitors }: CompetitorComparisonProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('bars')
  const [selectedMetrics, setSelectedMetrics] = useState(['transactions', 'revenue', 'customers'])
  
  const availableMetrics = [
    { id: 'transactions', label: 'Transactions', unit: '' },
    { id: 'revenue', label: 'Revenue', unit: 'RON' },
    { id: 'customers', label: 'Customers', unit: '' },
    { id: 'cashback_percent', label: 'Cashback %', unit: '%' },
  ]
  
  // Prepare data for charts
  const barChartData = competitors.slice(0, 5).map(comp => ({
    name: comp.merchant_name,
    transactions: comp.transactions,
    revenue: comp.revenue / 100,
    customers: comp.customers,
    cashback: comp.cashback_percent,
    isYou: comp.isYou
  }))
  
  // Normalize data for radar chart (0-100 scale)
  const normalizeValue = (value: number, max: number) => (value / max) * 100
  
  const maxValues = {
    transactions: Math.max(...competitors.map(c => c.transactions)),
    revenue: Math.max(...competitors.map(c => c.revenue)),
    customers: Math.max(...competitors.map(c => c.customers)),
    cashback_percent: Math.max(...competitors.map(c => c.cashback_percent)),
    market_share: Math.max(...competitors.map(c => c.market_share || 0))
  }
  
  const radarData = [
    {
      metric: 'Transactions',
      you: normalizeValue(yourData.transactions, maxValues.transactions),
      leader: 100
    },
    {
      metric: 'Revenue',
      you: normalizeValue(yourData.revenue, maxValues.revenue),
      leader: 100
    },
    {
      metric: 'Customers',
      you: normalizeValue(yourData.customers, maxValues.customers),
      leader: 100
    },
    {
      metric: 'Cashback %',
      you: normalizeValue(yourData.cashback_percent, maxValues.cashback_percent),
      leader: normalizeValue(competitors[0].cashback_percent, maxValues.cashback_percent)
    },
    {
      metric: 'Market Share',
      you: normalizeValue(competitors.find(c => c.isYou)?.market_share || 0, maxValues.market_share),
      leader: 100
    }
  ]
  
  const formatValue = (value: number, metric: string) => {
    if (metric.includes('revenue')) {
      return `${value.toFixed(0)} RON`
    }
    if (metric.includes('cashback')) {
      return `${value}%`
    }
    return Math.round(value).toLocaleString()
  }
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-elevated">
          <p className="text-slate-800 font-semibold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-500 text-sm">{entry.name}:</span>
              <span className="text-slate-800 font-mono font-semibold">{formatValue(entry.value, entry.dataKey)}</span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-2xl font-semibold text-slate-800 mb-2">Competitive Analysis</h3>
          <p className="text-slate-500">See how you stack up against the competition</p>
        </div>

        <div className="flex gap-2">
          {['bars', 'radar', 'table'].map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode as ViewMode)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                viewMode === mode
                  ? 'bg-blue-500 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card">
          <div className="text-sm text-slate-500 mb-2">Your Rank</div>
          <div className="text-4xl font-bold text-slate-800 mb-2">
            #{competitors.find(c => c.isYou)?.rank}
          </div>
          <div className="text-sm text-slate-500">out of {competitors.length} merchants</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card">
          <div className="text-sm text-slate-500 mb-2">Market Share</div>
          <div className="text-4xl font-bold text-slate-800 mb-2">
            {(competitors.find(c => c.isYou)?.market_share || 0).toFixed(1)}%
          </div>
          <div className="text-sm text-slate-500">of total market</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card">
          <div className="text-sm text-slate-500 mb-2">Gap to Leader</div>
          <div className="text-4xl font-bold text-slate-800 mb-2">
            {(competitors[0].transactions - yourData.transactions).toLocaleString()}
          </div>
          <div className="text-sm text-slate-500">transactions behind</div>
        </div>
      </div>
      
      {/* Visualization */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card">

        {viewMode === 'bars' && (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={barChartData}>
              <CartesianGrid strokeDasharray="0" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar
                dataKey="transactions"
                fill="#3B82F6"
                radius={[8, 8, 0, 0]}
                name="Transactions"
              />
              <Bar
                dataKey="customers"
                fill="#A78BFA"
                radius={[8, 8, 0, 0]}
                name="Customers"
              />
            </BarChart>
          </ResponsiveContainer>
        )}

        {viewMode === 'radar' && (
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#E2E8F0" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: '#64748B' }} />
              <PolarRadiusAxis tick={{ fontSize: 10, fill: '#94A3B8' }} />
              <Radar
                name="You"
                dataKey="you"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Radar
                name="Market Leader"
                dataKey="leader"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.1}
                strokeWidth={2}
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        )}

        {viewMode === 'table' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Rank</th>
                  <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Merchant</th>
                  <th className="text-right p-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Transactions</th>
                  <th className="text-right p-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Revenue</th>
                  <th className="text-right p-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Customers</th>
                  <th className="text-right p-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Cashback</th>
                  <th className="text-right p-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Share</th>
                </tr>
              </thead>
              <tbody>
                {competitors.map((comp) => (
                  <tr
                    key={comp.merchant_name}
                    className={`border-b border-slate-100 ${
                      comp.isYou ? 'bg-blue-50/50' : 'hover:bg-slate-50'
                    } transition-colors`}
                  >
                    <td className="p-3">
                      <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold ${
                        comp.isYou
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {comp.rank}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-800">{comp.merchant_name}</div>
                      {comp.isYou && (
                        <div className="text-xs text-blue-600">That's you!</div>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-700">{comp.transactions.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono text-slate-700">{(comp.revenue / 100).toFixed(0)}</td>
                    <td className="p-3 text-right font-mono text-slate-700">{comp.customers.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono text-slate-700">{comp.cashback_percent}%</td>
                    <td className="p-3 text-right font-mono text-slate-700">{(comp.market_share || 0).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Strategic Insights */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card">
        <h4 className="text-slate-800 font-semibold mb-4">Strategic Insights</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-slate-800 font-semibold">Positioning</span>
            </div>
            <p className="text-sm text-slate-500">
              Your 5% cashback is the highest in market. This aggressive strategy drives acquisition
              but requires strong retention to maintain profitability.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <span className="text-slate-800 font-semibold">Opportunity</span>
            </div>
            <p className="text-sm text-slate-500">
              You're {(competitors[0].transactions - yourData.transactions).toLocaleString()} transactions
              behind the leader. At current growth rate, this gap is closeable in 2-3 quarters.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-slate-800 font-semibold">Quick Win</span>
            </div>
            <p className="text-sm text-slate-500">
              Focus on customer retention. You're acquiring well but need to improve repeat rate
              to maximize your high cashback investment.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <span className="text-slate-800 font-semibold">Watch Out</span>
            </div>
            <p className="text-sm text-slate-500">
              Your cashback-to-revenue ratio of {((yourData.cashback_paid / yourData.revenue) * 100).toFixed(1)}%
              is sustainable but leaves little room for error. Monitor closely.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
