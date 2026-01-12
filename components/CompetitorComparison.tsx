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
        <div className="bg-[#141932] border border-[#252B4A] rounded-lg p-4 shadow-xl">
          <p className="text-white font-semibold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-[#8B92B8] text-sm">{entry.name}:</span>
              <span className="text-white font-mono font-semibold">{formatValue(entry.value, entry.dataKey)}</span>
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
          <h3 className="text-2xl font-bold text-white mb-2">⚖️ Competitive Analysis</h3>
          <p className="text-[#8B92B8]">See how you stack up against the competition</p>
        </div>
        
        <div className="flex gap-2">
          {['bars', 'radar', 'table'].map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode as ViewMode)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                viewMode === mode
                  ? 'bg-[#FF6B35] text-white'
                  : 'bg-[#1C2342] text-[#8B92B8] hover:bg-[#252B4A]'
              }`}
            >
              {mode === 'bars' && '📊'}
              {mode === 'radar' && '🎯'}
              {mode === 'table' && '📋'}
              {' '}{mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#141932] border border-[#252B4A] rounded-xl p-6">
          <div className="text-sm text-[#8B92B8] mb-2">Your Rank</div>
          <div className="text-4xl font-bold text-white mb-2">
            #{competitors.find(c => c.isYou)?.rank}
          </div>
          <div className="text-sm text-[#8B92B8]">out of {competitors.length} merchants</div>
        </div>
        
        <div className="bg-[#141932] border border-[#252B4A] rounded-xl p-6">
          <div className="text-sm text-[#8B92B8] mb-2">Market Share</div>
          <div className="text-4xl font-bold text-white mb-2">
            {(competitors.find(c => c.isYou)?.market_share || 0).toFixed(1)}%
          </div>
          <div className="text-sm text-[#8B92B8]">of total market</div>
        </div>
        
        <div className="bg-[#141932] border border-[#252B4A] rounded-xl p-6">
          <div className="text-sm text-[#8B92B8] mb-2">Gap to Leader</div>
          <div className="text-4xl font-bold text-white mb-2">
            {(competitors[0].transactions - yourData.transactions).toLocaleString()}
          </div>
          <div className="text-sm text-[#8B92B8]">transactions behind</div>
        </div>
      </div>
      
      {/* Visualization */}
      <div className="bg-[#141932] border border-[#252B4A] rounded-xl p-6">
        
        {viewMode === 'bars' && (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={barChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#252B4A" />
              <XAxis dataKey="name" stroke="#8B92B8" />
              <YAxis stroke="#8B92B8" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar
                dataKey="transactions"
                fill="#FF6B35"
                radius={[8, 8, 0, 0]}
                name="Transactions"
              />
              <Bar
                dataKey="customers"
                fill="#7B61FF"
                radius={[8, 8, 0, 0]}
                name="Customers"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
        
        {viewMode === 'radar' && (
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#252B4A" />
              <PolarAngleAxis dataKey="metric" stroke="#8B92B8" />
              <PolarRadiusAxis stroke="#8B92B8" />
              <Radar
                name="You"
                dataKey="you"
                stroke="#FF6B35"
                fill="#FF6B35"
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Radar
                name="Market Leader"
                dataKey="leader"
                stroke="#00D9A3"
                fill="#00D9A3"
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
                <tr className="border-b border-[#252B4A]">
                  <th className="text-left p-3 text-sm font-semibold text-[#8B92B8]">Rank</th>
                  <th className="text-left p-3 text-sm font-semibold text-[#8B92B8]">Merchant</th>
                  <th className="text-right p-3 text-sm font-semibold text-[#8B92B8]">Transactions</th>
                  <th className="text-right p-3 text-sm font-semibold text-[#8B92B8]">Revenue</th>
                  <th className="text-right p-3 text-sm font-semibold text-[#8B92B8]">Customers</th>
                  <th className="text-right p-3 text-sm font-semibold text-[#8B92B8]">Cashback</th>
                  <th className="text-right p-3 text-sm font-semibold text-[#8B92B8]">Share</th>
                </tr>
              </thead>
              <tbody>
                {competitors.map((comp) => (
                  <tr
                    key={comp.merchant_name}
                    className={`border-b border-[#252B4A] ${
                      comp.isYou ? 'bg-[#FF6B35]/10' : 'hover:bg-[#0A0E27]'
                    } transition-colors`}
                  >
                    <td className="p-3">
                      <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold ${
                        comp.isYou
                          ? 'bg-gradient-to-br from-[#FF6B35] to-[#7B61FF] text-white'
                          : 'bg-[#1C2342] text-white'
                      }`}>
                        {comp.rank}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold font-mono text-white">{comp.merchant_name}</div>
                      {comp.isYou && (
                        <div className="text-xs text-[#FF6B35]">That's you!</div>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono text-white">{comp.transactions.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono text-white">{(comp.revenue / 100).toFixed(0)}</td>
                    <td className="p-3 text-right font-mono text-white">{comp.customers.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono text-white">{comp.cashback_percent}%</td>
                    <td className="p-3 text-right font-mono text-white">{(comp.market_share || 0).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Strategic Insights */}
      <div className="bg-[#141932] border border-[#252B4A] rounded-xl p-6">
        <h4 className="text-white font-semibold mb-4">💡 Strategic Insights</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-[#0A0E27] rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🎯</span>
              <span className="text-white font-semibold">Positioning</span>
            </div>
            <p className="text-sm text-[#8B92B8]">
              Your 5% cashback is the highest in market. This aggressive strategy drives acquisition 
              but requires strong retention to maintain profitability.
            </p>
          </div>
          
          <div className="p-4 bg-[#0A0E27] rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">📊</span>
              <span className="text-white font-semibold">Opportunity</span>
            </div>
            <p className="text-sm text-[#8B92B8]">
              You're {(competitors[0].transactions - yourData.transactions).toLocaleString()} transactions 
              behind the leader. At current growth rate, this gap is closeable in 2-3 quarters.
            </p>
          </div>
          
          <div className="p-4 bg-[#0A0E27] rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">⚡</span>
              <span className="text-white font-semibold">Quick Win</span>
            </div>
            <p className="text-sm text-[#8B92B8]">
              Focus on customer retention. You're acquiring well but need to improve repeat rate 
              to maximize your high cashback investment.
            </p>
          </div>
          
          <div className="p-4 bg-[#0A0E27] rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">⚠️</span>
              <span className="text-white font-semibold">Watch Out</span>
            </div>
            <p className="text-sm text-[#8B92B8]">
              Your cashback-to-revenue ratio of {((yourData.cashback_paid / yourData.revenue) * 100).toFixed(1)}% 
              is sustainable but leaves little room for error. Monitor closely.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
