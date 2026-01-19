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
      case 'high': return 'border-l-red-500 bg-red-500/10'
      case 'medium': return 'border-l-yellow-500 bg-yellow-500/10'
      case 'low': return 'border-l-blue-500 bg-blue-500/10'
      default: return 'border-l-gray-500 bg-gray-500/10'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'optimization': return '⚡'
      case 'retention': return '🎯'
      case 'growth': return '📈'
      default: return '💡'
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
      <div className="bg-[#1a1f2e] rounded-lg p-6 border border-[#2a3142]">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">💡</span>
          <h3 className="text-lg font-semibold text-white">AI Recommendations</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-pulse text-gray-400">Analyzing your data...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-[#1a1f2e] rounded-lg p-6 border border-[#2a3142]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">💡</span>
            <h3 className="text-lg font-semibold text-white">AI Recommendations</h3>
          </div>
          <button onClick={fetchRecommendations} className="text-slate-400 hover:text-white">🔄</button>
        </div>
        <p className="text-red-400">{error}</p>
      </div>
    )
  }

  return (
    <div className="bg-[#1a1f2e] rounded-lg p-6 border border-[#2a3142]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">💡</span>
          <h3 className="text-lg font-semibold text-white">AI Recommendations</h3>
          {recommendations.length > 0 && (
            <span className="bg-[#FF6B35] text-white text-xs px-2 py-0.5 rounded-full">
              {recommendations.length} actions
            </span>
          )}
        </div>
        <button onClick={fetchRecommendations} className="text-slate-400 hover:text-white">🔄</button>
      </div>

      {recommendations.length === 0 ? (
        <div className="text-center py-6">
          <span className="text-4xl mb-2 block">✨</span>
          <p className="text-gray-400">All metrics look healthy! No recommendations at this time.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className={`border-l-4 rounded-r-lg p-4 cursor-pointer transition-all ${getPriorityColor(rec.priority)}`}
              onClick={() => setExpandedId(expandedId === rec.id ? null : rec.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span>{getTypeIcon(rec.type)}</span>
                    <span className="text-xs text-gray-400 uppercase">{getTypeLabel(rec.type)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      rec.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                      rec.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {rec.priority}
                    </span>
                  </div>
                  <h4 className="text-white font-medium">{rec.title}</h4>
                  
                  {expandedId === rec.id && (
                    <div className="mt-3 space-y-3">
                      <p className="text-gray-300 text-sm">{rec.description}</p>
                      
                      {rec.impact && (
                        <div className="bg-[#0d1117] rounded p-3">
                          <p className="text-xs text-gray-400 mb-1">Expected Impact</p>
                          <div className="flex items-center gap-4">
                            <span className="text-green-400 font-semibold">
                              {rec.impact.estimatedChange > 0 ? '+' : ''}{rec.impact.estimatedChange}% {rec.impact.metric}
                            </span>
                            <span className="text-xs text-gray-500">
                              {Math.round(rec.impact.confidence * 100)}% confidence
                            </span>
                          </div>
                        </div>
                      )}
                      
                      <div className="bg-[#FF6B35]/10 border border-[#FF6B35]/30 rounded p-3">
                        <p className="text-xs text-[#FF6B35] mb-1">Recommended Action</p>
                        <p className="text-white text-sm">{rec.action}</p>
                      </div>
                    </div>
                  )}
                </div>
                <span className="text-gray-400 ml-2">
                  {expandedId === rec.id ? '▼' : '▶'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
