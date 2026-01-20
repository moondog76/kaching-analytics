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
    if (score >= 70) return 'text-green-400'
    if (score >= 50) return 'text-yellow-400'
    if (score >= 30) return 'text-orange-400'
    return 'text-red-400'
  }

  const getScoreGradient = (score: number) => {
    if (score >= 70) return 'from-green-500 to-emerald-500'
    if (score >= 50) return 'from-yellow-500 to-amber-500'
    if (score >= 30) return 'from-orange-500 to-amber-500'
    return 'from-red-500 to-rose-500'
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return '↑'
      case 'down': return '↓'
      case 'stable': return '→'
    }
  }

  const getTrendColor = (trend: 'up' | 'down' | 'stable', isPositiveGood: boolean = true) => {
    if (trend === 'stable') return 'text-gray-400'
    if (trend === 'up') return isPositiveGood ? 'text-green-400' : 'text-red-400'
    return isPositiveGood ? 'text-red-400' : 'text-green-400'
  }

  const formatCurrency = (amount: number) =>
    `${amount.toLocaleString('ro-RO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} RON`

  const formatNumber = (num: number) => num.toLocaleString()

  const formatPercent = (percent: number) =>
    `${percent >= 0 ? '+' : ''}${percent.toFixed(1)}%`

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-[#1a1f2e] to-[#141932] rounded-xl p-6 border border-[#2a3142]">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">📊</span>
          <h3 className="text-xl font-semibold text-white">Executive Briefing</h3>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="flex gap-2">
              <div className="w-3 h-3 bg-[#FF6B35] rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
              <div className="w-3 h-3 bg-[#FF6B35] rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
              <div className="w-3 h-3 bg-[#FF6B35] rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
            </div>
            <div className="text-gray-400">Generating your briefing...</div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !briefing) {
    return (
      <div className="bg-gradient-to-br from-[#1a1f2e] to-[#141932] rounded-xl p-6 border border-[#2a3142]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <h3 className="text-xl font-semibold text-white">Executive Briefing</h3>
          </div>
          <button onClick={fetchBriefing} className="text-slate-400 hover:text-white transition-colors">
            🔄
          </button>
        </div>
        <p className="text-red-400">{error || 'Unable to generate briefing'}</p>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-[#1a1f2e] to-[#141932] rounded-xl border border-[#2a3142] overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-[#2a3142]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <div>
              <h3 className="text-xl font-semibold text-white">Executive Briefing</h3>
              <p className="text-sm text-gray-400">
                {briefing.period === 'daily' ? 'Daily' : 'Weekly'} summary for {briefing.merchantName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Period Toggle */}
            <div className="flex bg-[#0d1117] rounded-lg p-1">
              <button
                onClick={() => setPeriod('daily')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  period === 'daily'
                    ? 'bg-[#FF6B35] text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setPeriod('weekly')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  period === 'weekly'
                    ? 'bg-[#FF6B35] text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Weekly
              </button>
            </div>

            <button
              onClick={fetchBriefing}
              className="text-slate-400 hover:text-white transition-colors p-2"
            >
              🔄
            </button>
          </div>
        </div>
      </div>

      {/* Performance Score */}
      <div className="p-6 border-b border-[#2a3142] bg-[#0d1117]/50">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${getScoreGradient(briefing.performanceScore)} flex items-center justify-center`}>
              <div className="w-16 h-16 rounded-full bg-[#0d1117] flex items-center justify-center">
                <span className={`text-2xl font-bold ${getScoreColor(briefing.performanceScore)}`}>
                  {briefing.performanceScore}
                </span>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-gray-300 leading-relaxed">{briefing.summary}</p>
          </div>
        </div>
      </div>

      {/* Alerts (if any) */}
      {briefing.alerts.length > 0 && (
        <div className="p-4 border-b border-[#2a3142]">
          <div className="space-y-2">
            {briefing.alerts.map((alert, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                  alert.severity === 'critical'
                    ? 'bg-red-500/10 border border-red-500/30'
                    : 'bg-yellow-500/10 border border-yellow-500/30'
                }`}
              >
                <span className="text-lg">
                  {alert.severity === 'critical' ? '🚨' : '⚠️'}
                </span>
                <span className={`text-sm ${
                  alert.severity === 'critical' ? 'text-red-400' : 'text-yellow-400'
                }`}>
                  {alert.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="p-6 border-b border-[#2a3142]">
        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
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
      <div className="p-6 border-b border-[#2a3142]">
        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Highlights
        </h4>
        <div className="space-y-3">
          {briefing.highlights.map((highlight, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 p-4 rounded-lg ${
                highlight.sentiment === 'positive'
                  ? 'bg-green-500/5 border border-green-500/20'
                  : highlight.sentiment === 'negative'
                  ? 'bg-red-500/5 border border-red-500/20'
                  : 'bg-gray-500/5 border border-gray-500/20'
              }`}
            >
              <span className="text-xl">{highlight.icon}</span>
              <div>
                <h5 className="font-medium text-white">{highlight.title}</h5>
                <p className="text-sm text-gray-400 mt-1">{highlight.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Recommendations */}
      {briefing.topRecommendations.length > 0 && (
        <div className="p-6">
          <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Top Recommendations
          </h4>
          <div className="space-y-3">
            {briefing.topRecommendations.map((rec, idx) => (
              <div
                key={rec.id}
                className="flex items-start gap-3 p-4 rounded-lg bg-[#FF6B35]/5 border border-[#FF6B35]/20"
              >
                <div className="w-6 h-6 rounded-full bg-[#FF6B35] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {idx + 1}
                </div>
                <div>
                  <h5 className="font-medium text-white">{rec.title}</h5>
                  <p className="text-sm text-gray-400 mt-1">{rec.action}</p>
                  {rec.impact && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-green-400">
                        Expected: {rec.impact.estimatedChange > 0 ? '+' : ''}{rec.impact.estimatedChange}% {rec.impact.metric}
                      </span>
                      <span className="text-xs text-gray-500">
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
      <div className="px-6 py-4 bg-[#0d1117]/50 border-t border-[#2a3142]">
        <p className="text-xs text-gray-500 text-center">
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
    <div className="bg-[#0d1117] rounded-lg p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-lg font-semibold text-white truncate">{value}</p>
      <p className={`text-sm ${getTrendColor(trend)}`}>
        {getTrendIcon(trend)} {change}
      </p>
    </div>
  )
}
