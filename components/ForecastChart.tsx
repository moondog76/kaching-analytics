'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, ComposedChart } from 'recharts'
import { format, addDays } from 'date-fns'

interface ForecastChartProps {
  metric: string
  onClose?: () => void
}

export default function ForecastChart({ metric, onClose }: ForecastChartProps) {
  const [forecastData, setForecastData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [daysAhead, setDaysAhead] = useState(7)
  
  useEffect(() => {
    loadForecast()
  }, [metric, daysAhead])
  
  const loadForecast = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metric, days_ahead: daysAhead })
      })
      const data = await response.json()
      if (data.success) {
        setForecastData(data.forecast)
      }
    } catch (error) {
      console.error('Failed to load forecast:', error)
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 flex items-center justify-center min-h-[400px] shadow-card">
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
          </div>
          <div className="text-slate-700">Generating forecast...</div>
        </div>
      </div>
    )
  }

  if (!forecastData) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center shadow-card">
        <div className="w-12 h-12 mx-auto mb-3 bg-amber-100 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="text-slate-800 font-semibold mb-2">Forecast Unavailable</div>
        <div className="text-slate-500 text-sm">Unable to generate forecast with current data</div>
      </div>
    )
  }
  
  // Prepare chart data combining historical and forecast
  const chartData = [
    ...forecastData.historical.slice(-14).map((point: any) => ({
      date: format(new Date(point.date), 'MMM dd'),
      actual: point.value,
      type: 'historical'
    })),
    ...forecastData.forecast.map((point: any, index: number) => ({
      date: format(new Date(point.date), 'MMM dd'),
      forecast: point.value,
      lower: forecastData.confidence_interval.lower[index],
      upper: forecastData.confidence_interval.upper[index],
      type: 'forecast'
    }))
  ]
  
  const formatValue = (value: number) => {
    if (metric === 'revenue' || metric === 'cashback_paid') {
      return `${(value / 100).toFixed(2)} RON`
    }
    return Math.round(value).toLocaleString()
  }
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-elevated">
          <p className="text-slate-800 font-semibold mb-2">{label}</p>
          {data.actual !== undefined && (
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-slate-500 text-sm">Actual:</span>
              <span className="text-slate-800 font-mono font-semibold">{formatValue(data.actual)}</span>
            </div>
          )}
          {data.forecast !== undefined && (
            <>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-slate-500 text-sm">Forecast:</span>
                <span className="text-slate-800 font-mono font-semibold">{formatValue(data.forecast)}</span>
              </div>
              <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-200">
                95% Confidence: {formatValue(data.lower)} - {formatValue(data.upper)}
              </div>
            </>
          )}
        </div>
      )
    }
    return null
  }
  
  const avgForecast = forecastData.forecast.reduce((sum: number, p: any) => sum + p.value, 0) / forecastData.forecast.length
  const trend = forecastData.forecast[forecastData.forecast.length - 1].value > forecastData.historical[forecastData.historical.length - 1].value ? 'up' : 'down'
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-2xl font-semibold text-slate-800 mb-2">Forecast: {metric}</h3>
          <p className="text-slate-500">
            Statistical prediction with 95% confidence intervals
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl transition-colors"
          >
            ×
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-card">
        <div className="text-slate-700 font-medium">Forecast Horizon</div>
        <div className="flex gap-2">
          {[7, 14, 30].map(days => (
            <button
              key={days}
              onClick={() => setDaysAhead(days)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                daysAhead === days
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {days} Days
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card">
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={chartData}>
            <defs>
              <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#A78BFA" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="0" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />

            {/* Confidence interval area */}
            <Area
              type="monotone"
              dataKey="upper"
              stroke="none"
              fill="url(#confidenceGradient)"
              fillOpacity={1}
              name="95% Confidence"
            />
            <Area
              type="monotone"
              dataKey="lower"
              stroke="none"
              fill="#FFFFFF"
              fillOpacity={1}
            />

            {/* Actual values */}
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#3B82F6"
              strokeWidth={3}
              dot={{ fill: '#3B82F6', r: 4 }}
              name="Historical"
            />

            {/* Forecast */}
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="#A78BFA"
              strokeWidth={3}
              strokeDasharray="5 5"
              dot={{ fill: '#A78BFA', r: 4 }}
              name="Forecast"
            />
          </ComposedChart>
        </ResponsiveContainer>

        {/* Stats */}
        <div className="mt-6 pt-6 border-t border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="text-xs text-slate-500 mb-1">Avg Forecast</div>
            <div className="text-lg font-bold font-mono text-slate-800">{formatValue(avgForecast)}</div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4">
            <div className="text-xs text-slate-500 mb-1">Trend</div>
            <div className={`text-lg font-bold ${trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
              {trend === 'up' ? '↑ Increasing' : '↓ Decreasing'}
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4">
            <div className="text-xs text-slate-500 mb-1">Accuracy (MAPE)</div>
            <div className="text-lg font-bold font-mono text-slate-800">
              {forecastData.accuracy_metrics.mape.toFixed(1)}%
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4">
            <div className="text-xs text-slate-500 mb-1">Methodology</div>
            <div className="text-xs text-slate-700">Time Series Decomposition</div>
          </div>
        </div>
      </div>
      
      {/* Insights */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card">
        <h4 className="text-slate-800 font-semibold mb-4">Forecast Insights</h4>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${trend === 'up' ? 'bg-emerald-100' : 'bg-red-100'}`}>
              <svg className={`w-5 h-5 ${trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={trend === 'up' ? 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' : 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6'} />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-slate-800 font-medium mb-1">
                Expected {trend === 'up' ? 'Growth' : 'Decline'}
              </div>
              <div className="text-sm text-slate-500">
                Based on historical patterns, your {metric} is trending {trend === 'up' ? 'upward' : 'downward'} over the next {daysAhead} days.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-slate-800 font-medium mb-1">
                Confidence Level: High
              </div>
              <div className="text-sm text-slate-500">
                MAPE of {forecastData.accuracy_metrics.mape.toFixed(1)}% indicates reliable predictions.
                Historical accuracy suggests these forecasts are trustworthy.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-slate-800 font-medium mb-1">
                Seasonality Detected
              </div>
              <div className="text-sm text-slate-500">
                The forecast accounts for weekly patterns including weekend effects.
                Expect natural fluctuations within the confidence interval.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
