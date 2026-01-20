'use client'

import { useState, useEffect } from 'react'
import { Recommendation } from '@/lib/ai/types'

interface RecommendationCardsProps {
  merchantId: string
}

export function RecommendationCards({ merchantId }: RecommendationCardsProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchRecommendations = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/recommendations?merchantId=${merchantId}`, {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch recommendations')
      const data = await response.json()
      setRecommendations(data.recommendations || [])
      setError(null)
    } catch (err) {
      setError('Failed to load recommendations')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecommendations()
  }, [merchantId])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-400 bg-red-50'
      case 'medium': return 'border-l-amber-400 bg-amber-50'
      case 'low': return 'border-l-blue-400 bg-blue-50'
      default: return 'border-l-slate-400 bg-slate-50'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'optimization': return { bg: 'bg-amber-100', color: 'text-amber-600', path: 'M13 10V3L4 14h7v7l9-11h-7z' }
      case 'retention': return { bg: 'bg-blue-100', color: 'text-blue-600', path: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' }
      case 'growth': return { bg: 'bg-emerald-100', color: 'text-emerald-600', path: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' }
      default: return { bg: 'bg-purple-100', color: 'text-purple-600', path: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' }
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'optimization': return 'Optimization'
      case 'retention': return 'Retention'
      case 'growth': return 'Growth'
      default: return 'Insight'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-800">AI Recommendations</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-pulse text-slate-500">Analyzing your data...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800">AI Recommendations</h3>
          </div>
          <button onClick={fetchRecommendations} className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors">
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
    <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-800">AI Recommendations</h3>
          {recommendations.length > 0 && (
            <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
              {recommendations.length} actions
            </span>
          )}
        </div>
        <button onClick={fetchRecommendations} className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {recommendations.length === 0 ? (
        <div className="text-center py-6">
          <div className="w-12 h-12 mx-auto mb-3 bg-emerald-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-slate-700 font-medium">All metrics look healthy!</p>
          <p className="text-slate-500 text-sm">No recommendations at this time.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recommendations.map((rec) => {
            const typeIcon = getTypeIcon(rec.type)
            return (
              <div
                key={rec.id}
                className={`border-l-4 rounded-r-lg p-4 cursor-pointer transition-all ${getPriorityColor(rec.priority)}`}
                onClick={() => setExpandedId(expandedId === rec.id ? null : rec.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-6 h-6 rounded flex items-center justify-center ${typeIcon.bg}`}>
                        <svg className={`w-3 h-3 ${typeIcon.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={typeIcon.path} />
                        </svg>
                      </div>
                      <span className="text-xs text-slate-500 uppercase font-medium">{getTypeLabel(rec.type)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                        rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                        rec.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {rec.priority}
                      </span>
                    </div>
                    <h4 className="text-slate-800 font-medium">{rec.title}</h4>

                    {expandedId === rec.id && (
                      <div className="mt-3 space-y-3">
                        <p className="text-slate-600 text-sm">{rec.description}</p>

                        {rec.impact && (
                          <div className="bg-white border border-slate-200 rounded p-3">
                            <p className="text-xs text-slate-500 mb-1">Expected Impact</p>
                            <div className="flex items-center gap-4">
                              <span className="text-emerald-600 font-semibold">
                                {rec.impact.estimatedChange > 0 ? '+' : ''}{rec.impact.estimatedChange}% {rec.impact.metric}
                              </span>
                              <span className="text-xs text-slate-400">
                                {Math.round(rec.impact.confidence * 100)}% confidence
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="bg-blue-50 border border-blue-200 rounded p-3">
                          <p className="text-xs text-blue-600 mb-1 font-medium">Recommended Action</p>
                          <p className="text-slate-700 text-sm">{rec.action}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="text-slate-400 ml-2">
                    {expandedId === rec.id ? '▼' : '▶'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
