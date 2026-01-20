'use client'

import { useState, useEffect } from 'react'
import { Insight } from '@/lib/types'

export default function InsightsPanel() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null)
  
  useEffect(() => {
    loadInsights()
  }, [])
  
  const loadInsights = async () => {
    try {
      const response = await fetch('/api/insights')
      const data = await response.json()
      if (data.success) {
        setInsights(data.insights)
      }
    } catch (error) {
      console.error('Failed to load insights:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200'
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-200'
      default: return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return { bg: 'bg-emerald-100', color: 'text-emerald-600', path: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' }
      case 'warning': return { bg: 'bg-amber-100', color: 'text-amber-600', path: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' }
      case 'trend': return { bg: 'bg-blue-100', color: 'text-blue-600', path: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' }
      case 'comparison': return { bg: 'bg-purple-100', color: 'text-purple-600', path: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3' }
      case 'forecast': return { bg: 'bg-cyan-100', color: 'text-cyan-600', path: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
      default: return { bg: 'bg-slate-100', color: 'text-slate-600', path: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' }
    }
  }

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-card">
        <div className="flex items-center justify-center">
          <div className="flex gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">AI-Detected Insights</h2>
          <p className="text-slate-500 mt-1">
            Automatically analyzed from your campaign data • {insights.length} insights found
          </p>
        </div>
        <button
          onClick={loadInsights}
          className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {insights.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center shadow-card">
          <div className="w-12 h-12 mx-auto mb-3 bg-emerald-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="text-slate-800 font-semibold mb-2">No significant insights detected</div>
          <div className="text-slate-500 text-sm">Everything looks normal. Check back later for updates.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {insights.map((insight, index) => {
            const typeIcon = getTypeIcon(insight.type)
            return (
              <div
                key={insight.id}
                className="bg-white border border-slate-200 rounded-xl p-6 hover:border-blue-300 transition-all cursor-pointer group shadow-card"
                onClick={() => setSelectedInsight(insight)}
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: 'fadeInUp 0.5s ease-out both'
                }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${typeIcon.bg} flex items-center justify-center`}>
                      <svg className={`w-5 h-5 ${typeIcon.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={typeIcon.path} />
                      </svg>
                    </div>
                    <div>
                      <div className={`inline-block px-2 py-1 rounded text-xs font-semibold border ${getSeverityColor(insight.severity)}`}>
                        {insight.severity.toUpperCase()}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400">
                    {(insight.confidence * 100).toFixed(0)}% confidence
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-slate-800 font-semibold text-lg mb-2 group-hover:text-blue-600 transition-colors">
                  {insight.title}
                </h3>

                {/* Description */}
                <p className="text-slate-500 text-sm mb-4 line-clamp-2">
                  {insight.description}
                </p>

                {/* Impact */}
                <div className="bg-slate-50 rounded-lg p-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Impact</span>
                    <span className={`text-lg font-bold font-mono ${
                      insight.impact.change_percent > 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {insight.impact.change_percent > 0 ? '+' : ''}
                      {insight.impact.change_percent.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Actions */}
                {insight.actionable_recommendations.length > 0 && (
                  <div>
                    <div className="text-xs text-slate-500 mb-2">Recommended actions:</div>
                    <ul className="space-y-1">
                      {insight.actionable_recommendations.slice(0, 2).map((action, i) => (
                        <li key={i} className="text-sm text-slate-500 flex items-start gap-2">
                          <span className="text-blue-500 mt-0.5">•</span>
                          <span className="flex-1">{action}</span>
                        </li>
                      ))}
                    </ul>
                    {insight.actionable_recommendations.length > 2 && (
                      <div className="text-xs text-slate-400 mt-2">
                        +{insight.actionable_recommendations.length - 2} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      
      {/* Insight Detail Modal */}
      {selectedInsight && (() => {
        const typeIcon = getTypeIcon(selectedInsight.type)
        return (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in"
            onClick={() => setSelectedInsight(null)}
          >
            <div
              className="bg-white border border-slate-200 rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-elevated"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl ${typeIcon.bg} flex items-center justify-center`}>
                    <svg className={`w-7 h-7 ${typeIcon.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={typeIcon.path} />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-800 mb-2">
                      {selectedInsight.title}
                    </h2>
                    <div className={`inline-block px-3 py-1 rounded-lg text-sm font-semibold border ${getSeverityColor(selectedInsight.severity)}`}>
                      {selectedInsight.severity.toUpperCase()} PRIORITY
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedInsight(null)}
                  className="text-slate-400 hover:text-slate-600 text-2xl transition-colors"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-slate-800 font-semibold mb-2">Analysis</h3>
                  <p className="text-slate-500">{selectedInsight.description}</p>
                </div>

                <div>
                  <h3 className="text-slate-800 font-semibold mb-2">Impact</h3>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Current Value</div>
                        <div className="text-lg font-bold font-mono text-slate-800">
                          {selectedInsight.impact.current_value.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Change</div>
                        <div className={`text-lg font-bold font-mono ${
                          selectedInsight.impact.change_percent > 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {selectedInsight.impact.change_percent > 0 ? '+' : ''}
                          {selectedInsight.impact.change_percent.toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Absolute</div>
                        <div className="text-lg font-bold font-mono text-slate-800">
                          {selectedInsight.impact.change_percent > 0 ? '+' : ''}
                          {selectedInsight.impact.change_absolute.toFixed(0)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-slate-800 font-semibold mb-2">Context</h3>
                  <p className="text-slate-500">{selectedInsight.context}</p>
                </div>

                {selectedInsight.actionable_recommendations.length > 0 && (
                  <div>
                    <h3 className="text-slate-800 font-semibold mb-3">Recommended Actions</h3>
                    <ul className="space-y-3">
                      {selectedInsight.actionable_recommendations.map((action, i) => (
                        <li key={i} className="flex items-start gap-3 bg-slate-50 rounded-lg p-3">
                          <span className="text-blue-500 font-bold">{i + 1}.</span>
                          <span className="flex-1 text-slate-600">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold transition-colors">
                    Take Action
                  </button>
                  <button
                    onClick={() => setSelectedInsight(null)}
                    className="px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
