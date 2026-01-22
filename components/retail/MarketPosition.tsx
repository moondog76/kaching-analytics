'use client'

import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts'
import { MarketShareTimeSeries } from '@/types/analytics'

// Pluxee chart colors
const CHART_COLORS = [
  '#00EB5E', // Ultra Green (you)
  '#17CCF9', // Boldly Blue
  '#FFDC37', // Very Yellow
  '#FF7375', // Coral
  '#221C46', // Deep Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6'  // Teal
]

interface MarketPositionProps {
  marketShareData: MarketShareTimeSeries[]
  merchants: { id: string; name: string; isYou?: boolean }[]
  marketReachData?: { merchantName: string; reach3m: number; reach6m: number }[]
}

export default function MarketPosition({
  marketShareData,
  merchants,
  marketReachData
}: MarketPositionProps) {
  const [viewMode, setViewMode] = useState<'sales' | 'transactions'>('sales')

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-pluxee-deep-blue mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-slate-600">{entry.name}:</span>
              <span className="font-medium text-pluxee-deep-blue">
                {entry.value.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="pluxee-section-header">Market Position</h2>
          <p className="pluxee-section-subheader">Your market share compared to competitors</p>
        </div>

        {/* View Toggle */}
        <div className="flex bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('sales')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              viewMode === 'sales'
                ? 'bg-white text-pluxee-deep-blue shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            By Sales
          </button>
          <button
            onClick={() => setViewMode('transactions')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              viewMode === 'transactions'
                ? 'bg-white text-pluxee-deep-blue shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            By Transactions
          </button>
        </div>
      </div>

      {/* Market Share Time Series */}
      <div className="pluxee-card">
        <h3 className="font-semibold text-pluxee-deep-blue mb-4">
          Market Share {viewMode === 'sales' ? 'by Sales' : 'by Transactions'}
        </h3>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={marketShareData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="0" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#64748B' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#64748B' }}
                tickFormatter={(value) => `${value}%`}
                domain={[0, 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                formatter={(value) => <span className="text-sm text-slate-600">{value}</span>}
              />
              {merchants.map((merchant, index) => (
                <Line
                  key={merchant.id}
                  type="monotone"
                  dataKey={merchant.name}
                  name={merchant.name}
                  stroke={CHART_COLORS[index % CHART_COLORS.length]}
                  strokeWidth={merchant.isYou ? 3 : 2}
                  dot={false}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Market Reach Comparison */}
      {marketReachData && marketReachData.length > 0 && (
        <div className="pluxee-card">
          <h3 className="font-semibold text-pluxee-deep-blue mb-4">Market Reach</h3>
          <p className="text-sm text-slate-500 mb-4">
            Percentage of total market customers who shopped at each merchant
          </p>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={marketReachData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="0" stroke="#F1F5F9" horizontal={true} vertical={false} />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748B' }}
                  tickFormatter={(value) => `${value}%`}
                  domain={[0, 100]}
                />
                <YAxis
                  type="category"
                  dataKey="merchantName"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748B' }}
                  width={90}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, '']}
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  formatter={(value) => <span className="text-sm text-slate-600">{value}</span>}
                />
                <Bar dataKey="reach3m" name="3 Month Reach" fill="#17CCF9" radius={[0, 4, 4, 0]} />
                <Bar dataKey="reach6m" name="6 Month Reach" fill="#00EB5E" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Market Position Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {merchants.slice(0, 4).map((merchant, index) => {
          const latestData = marketShareData[marketShareData.length - 1]
          const previousData = marketShareData[marketShareData.length - 2]
          const currentShare = latestData?.[merchant.name] as number || 0
          const previousShare = previousData?.[merchant.name] as number || 0
          const change = currentShare - previousShare

          return (
            <div
              key={merchant.id}
              className={`pluxee-card ${merchant.isYou ? 'ring-2 ring-pluxee-ultra-green' : ''}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                />
                <span className="text-sm font-medium text-slate-600 truncate">
                  {merchant.name}
                </span>
                {merchant.isYou && (
                  <span className="pluxee-badge pluxee-badge--premium text-xs">You</span>
                )}
              </div>
              <div className="text-2xl font-bold text-pluxee-deep-blue">
                {currentShare.toFixed(1)}%
              </div>
              <div className={`text-sm font-medium ${change >= 0 ? 'text-pluxee-ultra-green' : 'text-pluxee-coral'}`}>
                {change >= 0 ? '+' : ''}{change.toFixed(2)}pp vs last period
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
