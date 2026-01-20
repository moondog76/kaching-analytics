'use client'

import { useState, useEffect } from 'react'

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
  low: 'bg-blue-100 border-blue-200 text-blue-700',
  medium: 'bg-amber-100 border-amber-200 text-amber-700',
  high: 'bg-orange-100 border-orange-200 text-orange-700',
  critical: 'bg-red-100 border-red-200 text-red-700'
}

const severityIconColors = {
  low: 'bg-blue-100 text-blue-600',
  medium: 'bg-amber-100 text-amber-600',
  high: 'bg-orange-100 text-orange-600',
  critical: 'bg-red-100 text-red-600'
}

const typeIconPaths = {
  spike: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  drop: 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6',
  trend_change: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  unusual_pattern: 'M13 10V3L4 14h7v7l9-11h-7z'
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
      const response = await fetch(`/api/anomalies?merchantId=${merchantId}`, { credentials: 'include' })
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
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Anomaly Detection</h3>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-16 bg-slate-100 rounded-lg"></div>
          <div className="h-16 bg-slate-100 rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800">Anomaly Detection</h3>
          </div>
          <button onClick={fetchAnomalies} className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Anomaly Detection</h3>
          {anomalies.length > 0 && (
            <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium">
              {anomalies.length} detected
            </span>
          )}
        </div>
        <button
          onClick={fetchAnomalies}
          className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors"
          title="Refresh"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {anomalies.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-3 bg-emerald-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-slate-700 font-medium">No anomalies detected</p>
          <p className="text-slate-500 text-sm">All metrics are within normal range</p>
        </div>
      ) : (
        <div className="space-y-3">
          {anomalies.map((anomaly) => {
            const isExpanded = expanded === anomaly.id

            return (
              <div
                key={anomaly.id}
                className={`rounded-lg border p-4 cursor-pointer transition-all ${severityColors[anomaly.severity]}`}
                onClick={() => setExpanded(isExpanded ? null : anomaly.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${severityIconColors[anomaly.severity]}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={typeIconPaths[anomaly.type]} />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium capitalize">{anomaly.type.replace('_', ' ')}</span>
                      <span className="text-xs opacity-70 uppercase font-medium">{anomaly.severity}</span>
                    </div>
                    <p className="text-sm opacity-90">{anomaly.description}</p>

                    {isExpanded && anomaly.recommendation && (
                      <div className="mt-3 pt-3 border-t border-current/20">
                        <p className="text-xs font-medium mb-1">Recommendation</p>
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
