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
      <div className="bg-[#141932] border border-[#252B4A] rounded-xl p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-2">
            <div className="w-3 h-3 bg-[#FF6B35] rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
            <div className="w-3 h-3 bg-[#FF6B35] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="w-3 h-3 bg-[#FF6B35] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
          </div>
          <div className="text-white">Generating forecast...</div>
        </div>
      </div>
    )
  }
  
  if (!forecastData) {
    return (
      <div className="bg-[#141932] border border-[#252B4A] rounded-xl p-8 text-center">
        <div className="text-4xl mb-3">⚠️</div>
        <div className="text-white font-semibold mb-2">Forecast Unavailable</div>
        <div className="text-[#8B92B8] text-sm">Unable to generate forecast with current data</div>
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
        <div className="bg-[#141932] border border-[#252B4A] rounded-lg p-4 shadow-xl">
          <p className="text-white font-semibold mb-2">{label}</p>
          {data.actual !== undefined && (
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-[#FF6B35]" />
              <span className="text-[#8B92B8] text-sm">Actual:</span>
              <span className="text-white font-mono font-semibold">{formatValue(data.actual)}</span>
            </div>
          )}
          {data.forecast !== undefined && (
            <>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full bg-[#7B61FF]" />
                <span className="text-[#8B92B8] text-sm">Forecast:</span>
                <span className="text-white font-mono font-semibold">{formatValue(data.forecast)}</span>
              </div>
              <div className="text-xs text-[#8B92B8] mt-2 pt-2 border-t border-[#252B4A]">
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
          <h3 className="text-2xl font-bold text-white mb-2">🔮 Forecast: {metric}</h3>
          <p className="text-[#8B92B8]">
            Statistical prediction with 95% confidence intervals
          </p>
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className="text-[#8B92B8] hover:text-white text-2xl transition-colors"
          >
            ×
          </button>
        )}
      </div>
      
      {/* Controls */}
      <div className="bg-[#141932] border border-[#252B4A] rounded-xl p-4 flex items-center justify-between">
        <div className="text-white font-medium">Forecast Horizon</div>
        <div className="flex gap-2">
          {[7, 14, 30].map(days => (
            <button
              key={days}
              onClick={() => setDaysAhead(days)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                daysAhead === days
                  ? 'bg-[#FF6B35] text-white'
                  : 'bg-[#0A0E27] text-[#8B92B8] hover:bg-[#1C2342]'
              }`}
            >
              {days} Days
            </button>
          ))}
        </div>
      </div>
      
      {/* Chart */}
      <div className="bg-[#141932] border border-[#252B4A] rounded-xl p-6">
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={chartData}>
            <defs>
              <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7B61FF" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#7B61FF" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#252B4A" />
            <XAxis dataKey="date" stroke="#8B92B8" />
            <YAxis stroke="#8B92B8" />
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
              fill="#141932"
              fillOpacity={1}
            />
            
            {/* Actual values */}
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#FF6B35"
              strokeWidth={3}
              dot={{ fill: '#FF6B35', r: 4 }}
              name="Historical"
            />
            
            {/* Forecast */}
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="#7B61FF"
              strokeWidth={3}
              strokeDasharray="5 5"
              dot={{ fill: '#7B61FF', r: 4 }}
              name="Forecast"
            />
          </ComposedChart>
        </ResponsiveContainer>
        
        {/* Stats */}
        <div className="mt-6 pt-6 border-t border-[#252B4A] grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#0A0E27] rounded-lg p-4">
            <div className="text-xs text-[#8B92B8] mb-1">Avg Forecast</div>
            <div className="text-lg font-bold font-mono text-white">{formatValue(avgForecast)}</div>
          </div>
          
          <div className="bg-[#0A0E27] rounded-lg p-4">
            <div className="text-xs text-[#8B92B8] mb-1">Trend</div>
            <div className={`text-lg font-bold ${trend === 'up' ? 'text-[#00D9A3]' : 'text-[#FF4757]'}`}>
              {trend === 'up' ? '↑ Increasing' : '↓ Decreasing'}
            </div>
          </div>
          
          <div className="bg-[#0A0E27] rounded-lg p-4">
            <div className="text-xs text-[#8B92B8] mb-1">Accuracy (MAPE)</div>
            <div className="text-lg font-bold font-mono text-white">
              {forecastData.accuracy_metrics.mape.toFixed(1)}%
            </div>
          </div>
          
          <div className="bg-[#0A0E27] rounded-lg p-4">
            <div className="text-xs text-[#8B92B8] mb-1">Methodology</div>
            <div className="text-xs text-white">Time Series Decomposition</div>
          </div>
        </div>
      </div>
      
      {/* Insights */}
      <div className="bg-[#141932] border border-[#252B4A] rounded-xl p-6">
        <h4 className="text-white font-semibold mb-4">📊 Forecast Insights</h4>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-[#0A0E27] rounded-lg">
            <span className="text-2xl">{trend === 'up' ? '📈' : '📉'}</span>
            <div className="flex-1">
              <div className="text-white font-medium mb-1">
                Expected {trend === 'up' ? 'Growth' : 'Decline'}
              </div>
              <div className="text-sm text-[#8B92B8]">
                Based on historical patterns, your {metric} is trending {trend === 'up' ? 'upward' : 'downward'} over the next {daysAhead} days.
              </div>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-[#0A0E27] rounded-lg">
            <span className="text-2xl">🎯</span>
            <div className="flex-1">
              <div className="text-white font-medium mb-1">
                Confidence Level: High
              </div>
              <div className="text-sm text-[#8B92B8]">
                MAPE of {forecastData.accuracy_metrics.mape.toFixed(1)}% indicates reliable predictions. 
                Historical accuracy suggests these forecasts are trustworthy.
              </div>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-[#0A0E27] rounded-lg">
            <span className="text-2xl">⚡</span>
            <div className="flex-1">
              <div className="text-white font-medium mb-1">
                Seasonality Detected
              </div>
              <div className="text-sm text-[#8B92B8]">
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
