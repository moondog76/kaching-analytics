'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, TrendingUp, TrendingDown, Activity, RefreshCw } from 'lucide-react'

interface Anomaly {
  id: string
  type: 'spike' | 'drop' | 'trend_change' | 'unusual_pattern'
  severity: 'low' | 'medium' | 'high' | 'critical'
  metric: string
  description: string
  recommendation?: string
  value: number
  expectedValue: number
  deviation: number
}

interface AnomalyAlertsProps {
  merchantId: string
}

const severityColors = {
  low: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  medium: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
  high: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
  critical: 'bg-red-500/10 border-red-500/30 text-red-400'
}

const severityIcons = {
  low: '📊',
  medium: '⚠️',
  high: '🔔',
  critical: '🚨'
}

const typeIcons = {
  spike: TrendingUp,
  drop: TrendingDown,
  trend_change: Activity,
  unusual_pattern: AlertTriangle
}

export function AnomalyAlerts({ merchantId }: AnomalyAlertsProps) {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  const fetchAnomalies = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/anomalies?merchantId=${merchantId}`)
      if (!response.ok) throw new Error('Failed to fetch anomalies')
      const data = await response.json()
      setAnomalies(data.anomalies || [])
    } catch (err) {
      setError('Failed to load anomalies')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (merchantId) {
      fetchAnomalies()
    }
  }, [merchantId])

  if (loading) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-orange-400" />
          <h3 className="text-lg font-semibold text-white">Anomaly Detection</h3>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-16 bg-slate-700/50 rounded-lg"></div>
          <div className="h-16 bg-slate-700/50 rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            <h3 className="text-lg font-semibold text-white">Anomaly Detection</h3>
          </div>
          <button onClick={fetchAnomalies} className="text-slate-400 hover:text-white">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <p className="text-red-400">{error}</p>
      </div>
    )
  }

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-400" />
          <h3 className="text-lg font-semibold text-white">Anomaly Detection</h3>
          {anomalies.length > 0 && (
            <span className="bg-orange-500/20 text-orange-400 text-xs px-2 py-0.5 rounded-full">
              {anomalies.length} detected
            </span>
          )}
        </div>
        <button 
          onClick={fetchAnomalies} 
          className="text-slate-400 hover:text-white transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {anomalies.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">✅</div>
          <p className="text-slate-400">No anomalies detected</p>
          <p className="text-slate-500 text-sm">All metrics are within normal range</p>
        </div>
      ) : (
        <div className="space-y-3">
          {anomalies.map((anomaly) => {
            const Icon = typeIcons[anomaly.type]
            const isExpanded = expanded === anomaly.id
            
            return (
              <div
                key={anomaly.id}
                className={`rounded-lg border p-4 cursor-pointer transition-all ${severityColors[anomaly.severity]}`}
                onClick={() => setExpanded(isExpanded ? null : anomaly.id)}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl">{severityIcons[anomaly.severity]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4" />
                      <span className="font-medium capitalize">{anomaly.type.replace('_', ' ')}</span>
                      <span className="text-xs opacity-70 uppercase">{anomaly.severity}</span>
                    </div>
                    <p className="text-sm opacity-90">{anomaly.description}</p>
                    
                    {isExpanded && anomaly.recommendation && (
                      <div className="mt-3 pt-3 border-t border-current/20">
                        <p className="text-xs font-medium mb-1">💡 Recommendation</p>
                        <p className="text-sm opacity-80">{anomaly.recommendation}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default AnomalyAlerts
