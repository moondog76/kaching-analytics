'use client'

import { useState, useMemo } from 'react'
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { MerchantMetrics, CompetitorData } from '@/lib/types'
import { format, subDays } from 'date-fns'

interface ChartBuilderProps {
  merchantData: MerchantMetrics
  competitorData: CompetitorData[]
  historicalData: MerchantMetrics[]
}

type MetricType = 'transactions' | 'revenue' | 'customers' | 'cashback_paid' | 'roi' | 'avg_transaction'
type ChartType = 'line' | 'bar' | 'area' | 'comparison'
type TimePeriod = '7d' | '30d' | '90d' | 'custom'

export default function ChartBuilder({ merchantData, competitorData, historicalData }: ChartBuilderProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('transactions')
  const [chartType, setChartType] = useState<ChartType>('line')
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('30d')
  const [compareMode, setCompareMode] = useState(false)
  const [selectedCompetitor, setSelectedCompetitor] = useState<string>('Lidl')
  
  // Metric configurations - updated with new chart colors
  const metrics = [
    { id: 'transactions' as MetricType, label: 'Transactions', color: '#3B82F6' },
    { id: 'revenue' as MetricType, label: 'Revenue', color: '#2DD4BF' },
    { id: 'customers' as MetricType, label: 'Customers', color: '#A78BFA' },
    { id: 'cashback_paid' as MetricType, label: 'Cashback', color: '#F87171' },
    { id: 'roi' as MetricType, label: 'ROI', color: '#FBBF24' },
    { id: 'avg_transaction' as MetricType, label: 'Avg Transaction', color: '#22D3EE' }
  ]
  
  // Time period configurations
  const periods = [
    { id: '7d' as TimePeriod, label: '7 Days', days: 7 },
    { id: '30d' as TimePeriod, label: '30 Days', days: 30 },
    { id: '90d' as TimePeriod, label: '90 Days', days: 90 }
  ]
  
  // Chart type configurations
  const chartTypes = [
    { id: 'line' as ChartType, label: 'Line' },
    { id: 'bar' as ChartType, label: 'Bar' },
    { id: 'area' as ChartType, label: 'Area' },
    { id: 'comparison' as ChartType, label: 'Compare' }
  ]
  
  // Calculate chart data based on selections
  const chartData = useMemo(() => {
    const days = periods.find(p => p.id === timePeriod)?.days || 30
    const data = historicalData.slice(-days)
    
    return data.map((item, index) => {
      const date = format(subDays(new Date(), days - index), 'MMM dd')
      let value = 0
      
      // Calculate value based on selected metric
      switch (selectedMetric) {
        case 'transactions':
          value = item.transactions
          break
        case 'revenue':
          value = item.revenue / 100 // Convert to RON
          break
        case 'customers':
          value = item.customers
          break
        case 'cashback_paid':
          value = item.cashback_paid / 100
          break
        case 'roi':
          value = (item.revenue - item.cashback_paid) / item.cashback_paid
          break
        case 'avg_transaction':
          value = item.revenue / item.transactions / 100
          break
      }
      
      const result: any = {
        date,
        value: Math.round(value * 100) / 100,
        [merchantData.merchant_name]: Math.round(value * 100) / 100
      }
      
      // Add competitor data if in compare mode
      if (compareMode) {
        const competitorVariance = 0.8 + Math.random() * 0.4
        result[selectedCompetitor] = Math.round(value * competitorVariance * 100) / 100
      }
      
      return result
    })
  }, [selectedMetric, timePeriod, compareMode, selectedCompetitor, historicalData, merchantData])
  
  // Format value for display
  const formatValue = (value: number) => {
    const metric = metrics.find(m => m.id === selectedMetric)
    if (selectedMetric === 'revenue' || selectedMetric === 'cashback_paid' || selectedMetric === 'avg_transaction') {
      return `${value.toFixed(2)} RON`
    }
    if (selectedMetric === 'roi') {
      return `${value.toFixed(2)}x`
    }
    return Math.round(value).toLocaleString()
  }
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-elevated">
          <p className="text-slate-800 font-semibold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-500 text-sm">{entry.name}:</span>
              <span className="text-slate-800 font-mono font-semibold">{formatValue(entry.value)}</span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }
  
  // Render chart based on type
  const renderChart = () => {
    const currentMetric = metrics.find(m => m.id === selectedMetric)!

    if (chartType === 'line' || chartType === 'comparison') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="0" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey={merchantData.merchant_name}
              stroke={currentMetric.color}
              strokeWidth={3}
              dot={{ fill: currentMetric.color, r: 4 }}
              activeDot={{ r: 6 }}
            />
            {compareMode && (
              <Line
                type="monotone"
                dataKey={selectedCompetitor}
                stroke="#94A3B8"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#94A3B8', r: 3 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      )
    }

    if (chartType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="0" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              dataKey={merchantData.merchant_name}
              fill={currentMetric.color}
              radius={[8, 8, 0, 0]}
            />
            {compareMode && (
              <Bar
                dataKey={selectedCompetitor}
                fill="#94A3B8"
                radius={[8, 8, 0, 0]}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      )
    }

    if (chartType === 'area') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={currentMetric.color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={currentMetric.color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="0" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey={merchantData.merchant_name}
              stroke={currentMetric.color}
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorValue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )
    }
  }
  
  // Calculate insights
  const currentValue = chartData[chartData.length - 1]?.value || 0
  const previousValue = chartData[chartData.length - 8]?.value || currentValue
  const change = ((currentValue - previousValue) / previousValue) * 100
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800 mb-2">Interactive Analytics</h2>
          <p className="text-slate-500">Build custom visualizations to explore your data</p>
        </div>

        <button className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export PNG
        </button>
      </div>

      {/* Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-card">

        {/* Metric Selector */}
        <div>
          <label className="text-sm font-semibold text-slate-800 mb-3 block">Select Metric</label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {metrics.map(metric => (
              <button
                key={metric.id}
                onClick={() => setSelectedMetric(metric.id)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedMetric === metric.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 bg-white hover:border-blue-300'
                }`}
              >
                <div className="w-4 h-4 rounded-full mb-2" style={{ backgroundColor: metric.color }} />
                <div className={`text-xs font-medium ${selectedMetric === metric.id ? 'text-blue-600' : 'text-slate-700'}`}>{metric.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Time Period & Chart Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Time Period */}
          <div>
            <label className="text-sm font-semibold text-slate-800 mb-3 block">Time Period</label>
            <div className="flex gap-2">
              {periods.map(period => (
                <button
                  key={period.id}
                  onClick={() => setTimePeriod(period.id)}
                  className={`flex-1 py-2 px-4 rounded-lg border text-sm font-semibold transition-all ${
                    timePeriod === period.id
                      ? 'border-blue-500 bg-blue-50 text-blue-600'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chart Type */}
          <div>
            <label className="text-sm font-semibold text-slate-800 mb-3 block">Chart Type</label>
            <div className="flex gap-2">
              {chartTypes.map(type => (
                <button
                  key={type.id}
                  onClick={() => {
                    setChartType(type.id)
                    if (type.id === 'comparison') setCompareMode(true)
                  }}
                  className={`flex-1 py-2 px-4 rounded-lg border text-sm font-semibold transition-all ${
                    chartType === type.id
                      ? 'border-blue-500 bg-blue-50 text-blue-600'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Compare Mode */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="compareMode"
              checked={compareMode}
              onChange={(e) => setCompareMode(e.target.checked)}
              className="w-5 h-5 rounded border-slate-300 bg-white text-blue-500 focus:ring-blue-500"
            />
            <label htmlFor="compareMode" className="text-slate-700 font-medium cursor-pointer">
              Compare with Competitor
            </label>
          </div>

          {compareMode && (
            <select
              value={selectedCompetitor}
              onChange={(e) => setSelectedCompetitor(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-700 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              {competitorData.filter(c => !c.isYou).map(comp => (
                <option key={comp.merchant_name} value={comp.merchant_name}>
                  {comp.merchant_name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
      
      {/* Chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card">

        {/* Chart Header with Stats */}
        <div className="flex justify-between items-start mb-6 pb-6 border-b border-slate-200">
          <div>
            <h3 className="text-xl font-semibold text-slate-800 mb-1">
              {metrics.find(m => m.id === selectedMetric)?.label} Trend
            </h3>
            <p className="text-slate-500 text-sm">
              {periods.find(p => p.id === timePeriod)?.label} • {chartTypes.find(t => t.id === chartType)?.label} Chart
            </p>
          </div>

          <div className="text-right">
            <div className="text-3xl font-bold font-mono text-slate-800 mb-1">
              {formatValue(currentValue)}
            </div>
            <div className={`text-sm font-semibold flex items-center gap-1 justify-end ${
              change >= 0 ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
              <span className="text-slate-500">vs 7 days ago</span>
            </div>
          </div>
        </div>

        {/* Chart Visualization */}
        {renderChart()}

        {/* Chart Footer with Insights */}
        <div className="mt-6 pt-6 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="text-xs text-slate-500 mb-1">Current Value</div>
            <div className="text-lg font-bold font-mono text-slate-800">{formatValue(currentValue)}</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="text-xs text-slate-500 mb-1">Trend</div>
            <div className={`text-lg font-bold ${change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {change >= 0 ? 'Increasing' : 'Decreasing'}
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="text-xs text-slate-500 mb-1">Change</div>
            <div className={`text-lg font-bold font-mono ${change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {change >= 0 ? '+' : ''}{change.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
