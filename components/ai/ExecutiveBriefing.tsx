'use client'

import { useState, useEffect } from 'react'
import { ExecutiveBriefing as ExecutiveBriefingType, BriefingPeriod } from '@/lib/ai/types'

interface ExecutiveBriefingProps {
  merchantId: string
}

export function ExecutiveBriefing({ merchantId }: ExecutiveBriefingProps) {
  const [briefing, setBriefing] = useState<ExecutiveBriefingType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<BriefingPeriod>('daily')

  const fetchBriefing = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/executive-briefing?merchantId=${merchantId}&period=${period}`,
        { credentials: 'include' }
      )
      if (!response.ok) throw new Error('Failed to fetch briefing')
      const data = await response.json()
      setBriefing(data.briefing)
      setError(null)
    } catch (err) {
      setError('Failed to load executive briefing')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBriefing()
  }, [merchantId, period])

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-600'
    if (score >= 50) return 'text-amber-600'
    if (score >= 30) return 'text-orange-600'
    return 'text-red-600'
  }

  const getScoreGradient = (score: number) => {
    if (score >= 70) return 'from-emerald-400 to-emerald-500'
    if (score >= 50) return 'from-amber-400 to-amber-500'
    if (score >= 30) return 'from-orange-400 to-orange-500'
    return 'from-red-400 to-red-500'
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return '↑'
      case 'down': return '↓'
      case 'stable': return '→'
    }
  }

  const getTrendColor = (trend: 'up' | 'down' | 'stable', isPositiveGood: boolean = true) => {
    if (trend === 'stable') return 'text-slate-500'
    if (trend === 'up') return isPositiveGood ? 'text-emerald-600' : 'text-red-600'
    return isPositiveGood ? 'text-red-600' : 'text-emerald-600'
  }

  const formatCurrency = (amount: number) =>
    `${amount.toLocaleString('ro-RO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} RON`

  const formatNumber = (num: number) => num.toLocaleString()

  const formatPercent = (percent: number) =>
    `${percent >= 0 ? '+' : ''}${percent.toFixed(1)}%`

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-slate-800">Executive Briefing</h3>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="flex gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
            </div>
            <div className="text-slate-500">Generating your briefing...</div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !briefing) {
    return (
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-800">Executive Briefing</h3>
          </div>
          <button onClick={fetchBriefing} className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        <p className="text-red-600">{error || 'Unable to generate briefing'}</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-card">
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-800">Executive Briefing</h3>
              <p className="text-sm text-slate-500">
                {briefing.period === 'daily' ? 'Daily' : 'Weekly'} summary for {briefing.merchantName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Period Toggle */}
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setPeriod('daily')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  period === 'daily'
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setPeriod('weekly')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  period === 'weekly'
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Weekly
              </button>
            </div>

            <button
              onClick={fetchBriefing}
              className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Performance Score */}
      <div className="p-6 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${getScoreGradient(briefing.performanceScore)} flex items-center justify-center`}>
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
                <span className={`text-2xl font-bold ${getScoreColor(briefing.performanceScore)}`}>
                  {briefing.performanceScore}
                </span>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-slate-600 leading-relaxed">{briefing.summary}</p>
          </div>
        </div>
      </div>

      {/* Alerts (if any) */}
      {briefing.alerts.length > 0 && (
        <div className="p-4 border-b border-slate-200">
          <div className="space-y-2">
            {briefing.alerts.map((alert, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                  alert.severity === 'critical'
                    ? 'bg-red-100 border border-red-200'
                    : 'bg-amber-100 border border-amber-200'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                  alert.severity === 'critical' ? 'bg-red-200' : 'bg-amber-200'
                }`}>
                  <svg className={`w-4 h-4 ${alert.severity === 'critical' ? 'text-red-600' : 'text-amber-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <span className={`text-sm ${
                  alert.severity === 'critical' ? 'text-red-700' : 'text-amber-700'
                }`}>
                  {alert.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="p-6 border-b border-slate-200">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Key Metrics
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <MetricCard
            label="Revenue"
            value={formatCurrency(briefing.metrics.revenue.current)}
            change={formatPercent(briefing.metrics.revenue.changePercent)}
            trend={briefing.metrics.revenue.trend}
            getTrendColor={getTrendColor}
            getTrendIcon={getTrendIcon}
          />
          <MetricCard
            label="Transactions"
            value={formatNumber(briefing.metrics.transactions.current)}
            change={formatPercent(briefing.metrics.transactions.changePercent)}
            trend={briefing.metrics.transactions.trend}
            getTrendColor={getTrendColor}
            getTrendIcon={getTrendIcon}
          />
          <MetricCard
            label="Customers"
            value={formatNumber(briefing.metrics.customers.current)}
            change={formatPercent(briefing.metrics.customers.changePercent)}
            trend={briefing.metrics.customers.trend}
            getTrendColor={getTrendColor}
            getTrendIcon={getTrendIcon}
          />
          <MetricCard
            label="Cashback"
            value={formatCurrency(briefing.metrics.cashback.current)}
            change={formatPercent(briefing.metrics.cashback.changePercent)}
            trend={briefing.metrics.cashback.trend}
            getTrendColor={(trend) => getTrendColor(trend, false)}
            getTrendIcon={getTrendIcon}
          />
          <MetricCard
            label="Avg. Transaction"
            value={formatCurrency(briefing.metrics.avgTransactionValue.current)}
            change={formatPercent(briefing.metrics.avgTransactionValue.changePercent)}
            trend={briefing.metrics.avgTransactionValue.trend}
            getTrendColor={getTrendColor}
            getTrendIcon={getTrendIcon}
          />
        </div>
      </div>

      {/* Highlights */}
      <div className="p-6 border-b border-slate-200">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Highlights
        </h4>
        <div className="space-y-3">
          {briefing.highlights.map((highlight, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 p-4 rounded-lg ${
                highlight.sentiment === 'positive'
                  ? 'bg-emerald-50 border border-emerald-200'
                  : highlight.sentiment === 'negative'
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-slate-50 border border-slate-200'
              }`}
            >
              <span className="text-xl">{highlight.icon}</span>
              <div>
                <h5 className="font-medium text-slate-800">{highlight.title}</h5>
                <p className="text-sm text-slate-500 mt-1">{highlight.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Recommendations */}
      {briefing.topRecommendations.length > 0 && (
        <div className="p-6">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Top Recommendations
          </h4>
          <div className="space-y-3">
            {briefing.topRecommendations.map((rec, idx) => (
              <div
                key={rec.id}
                className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 border border-blue-200"
              >
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {idx + 1}
                </div>
                <div>
                  <h5 className="font-medium text-slate-800">{rec.title}</h5>
                  <p className="text-sm text-slate-500 mt-1">{rec.action}</p>
                  {rec.impact && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-emerald-600">
                        Expected: {rec.impact.estimatedChange > 0 ? '+' : ''}{rec.impact.estimatedChange}% {rec.impact.metric}
                      </span>
                      <span className="text-xs text-slate-400">
                        ({Math.round(rec.impact.confidence * 100)}% confidence)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
        <p className="text-xs text-slate-400 text-center">
          Generated {new Date(briefing.generatedAt).toLocaleString('ro-RO')}
        </p>
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  change,
  trend,
  getTrendColor,
  getTrendIcon
}: {
  label: string
  value: string
  change: string
  trend: 'up' | 'down' | 'stable'
  getTrendColor: (trend: 'up' | 'down' | 'stable') => string
  getTrendIcon: (trend: 'up' | 'down' | 'stable') => string
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-lg font-semibold text-slate-800 truncate">{value}</p>
      <p className={`text-sm ${getTrendColor(trend)}`}>
        {getTrendIcon(trend)} {change}
      </p>
    </div>
  )
}
