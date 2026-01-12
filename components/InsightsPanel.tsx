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
      case 'high': return 'bg-red-500/10 text-red-400 border-red-500/30'
      case 'medium': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
      case 'low': return 'bg-blue-500/10 text-blue-400 border-blue-500/30'
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/30'
    }
  }
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return '🎯'
      case 'warning': return '⚠️'
      case 'trend': return '📈'
      case 'comparison': return '⚖️'
      case 'forecast': return '🔮'
      default: return '💡'
    }
  }
  
  if (loading) {
    return (
      <div className="bg-[#141932] border border-[#252B4A] rounded-xl p-8">
        <div className="flex items-center justify-center">
          <div className="flex gap-2">
            <div className="w-3 h-3 bg-[#FF6B35] rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
            <div className="w-3 h-3 bg-[#FF6B35] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="w-3 h-3 bg-[#FF6B35] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">🤖 AI-Detected Insights</h2>
          <p className="text-[#8B92B8] mt-1">
            Automatically analyzed from your campaign data • {insights.length} insights found
          </p>
        </div>
        <button
          onClick={loadInsights}
          className="px-4 py-2 bg-[#1C2342] hover:bg-[#252B4A] border border-[#252B4A] rounded-lg text-sm text-white transition-colors"
        >
          🔄 Refresh
        </button>
      </div>
      
      {insights.length === 0 ? (
        <div className="bg-[#141932] border border-[#252B4A] rounded-xl p-8 text-center">
          <div className="text-4xl mb-3">✨</div>
          <div className="text-white font-semibold mb-2">No significant insights detected</div>
          <div className="text-[#8B92B8] text-sm">Everything looks normal. Check back later for updates.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {insights.map((insight, index) => (
            <div
              key={insight.id}
              className="bg-[#141932] border border-[#252B4A] rounded-xl p-6 hover:border-[#FF6B35] transition-all cursor-pointer group"
              onClick={() => setSelectedInsight(insight)}
              style={{
                animationDelay: `${index * 100}ms`,
                animation: 'fadeInUp 0.5s ease-out both'
              }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{getTypeIcon(insight.type)}</span>
                  <div>
                    <div className={`inline-block px-2 py-1 rounded text-xs font-semibold border ${getSeverityColor(insight.severity)}`}>
                      {insight.severity.toUpperCase()}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-[#5A5F7D]">
                  {(insight.confidence * 100).toFixed(0)}% confidence
                </div>
              </div>
              
              {/* Title */}
              <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-[#FF6B35] transition-colors">
                {insight.title}
              </h3>
              
              {/* Description */}
              <p className="text-[#8B92B8] text-sm mb-4 line-clamp-2">
                {insight.description}
              </p>
              
              {/* Impact */}
              <div className="bg-[#0A0E27] rounded-lg p-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#8B92B8]">Impact</span>
                  <span className={`text-lg font-bold font-mono ${
                    insight.impact.change_percent > 0 ? 'text-[#00D9A3]' : 'text-[#FF4757]'
                  }`}>
                    {insight.impact.change_percent > 0 ? '+' : ''}
                    {insight.impact.change_percent.toFixed(1)}%
                  </span>
                </div>
              </div>
              
              {/* Actions */}
              {insight.actionable_recommendations.length > 0 && (
                <div>
                  <div className="text-xs text-[#8B92B8] mb-2">💡 Recommended actions:</div>
                  <ul className="space-y-1">
                    {insight.actionable_recommendations.slice(0, 2).map((action, i) => (
                      <li key={i} className="text-sm text-[#8B92B8] flex items-start gap-2">
                        <span className="text-[#FF6B35] mt-0.5">•</span>
                        <span className="flex-1">{action}</span>
                      </li>
                    ))}
                  </ul>
                  {insight.actionable_recommendations.length > 2 && (
                    <div className="text-xs text-[#5A5F7D] mt-2">
                      +{insight.actionable_recommendations.length - 2} more
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Insight Detail Modal */}
      {selectedInsight && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setSelectedInsight(null)}
        >
          <div 
            className="bg-[#141932] border border-[#252B4A] rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <span className="text-5xl">{getTypeIcon(selectedInsight.type)}</span>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {selectedInsight.title}
                  </h2>
                  <div className={`inline-block px-3 py-1 rounded-lg text-sm font-semibold border ${getSeverityColor(selectedInsight.severity)}`}>
                    {selectedInsight.severity.toUpperCase()} PRIORITY
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedInsight(null)}
                className="text-[#8B92B8] hover:text-white text-2xl transition-colors"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-white font-semibold mb-2">📊 Analysis</h3>
                <p className="text-[#8B92B8]">{selectedInsight.description}</p>
              </div>
              
              <div>
                <h3 className="text-white font-semibold mb-2">📈 Impact</h3>
                <div className="bg-[#0A0E27] rounded-lg p-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-xs text-[#8B92B8] mb-1">Current Value</div>
                      <div className="text-lg font-bold font-mono text-white">
                        {selectedInsight.impact.current_value.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[#8B92B8] mb-1">Change</div>
                      <div className={`text-lg font-bold font-mono ${
                        selectedInsight.impact.change_percent > 0 ? 'text-[#00D9A3]' : 'text-[#FF4757]'
                      }`}>
                        {selectedInsight.impact.change_percent > 0 ? '+' : ''}
                        {selectedInsight.impact.change_percent.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[#8B92B8] mb-1">Absolute</div>
                      <div className="text-lg font-bold font-mono text-white">
                        {selectedInsight.impact.change_percent > 0 ? '+' : ''}
                        {selectedInsight.impact.change_absolute.toFixed(0)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-white font-semibold mb-2">🎯 Context</h3>
                <p className="text-[#8B92B8]">{selectedInsight.context}</p>
              </div>
              
              {selectedInsight.actionable_recommendations.length > 0 && (
                <div>
                  <h3 className="text-white font-semibold mb-3">💡 Recommended Actions</h3>
                  <ul className="space-y-3">
                    {selectedInsight.actionable_recommendations.map((action, i) => (
                      <li key={i} className="flex items-start gap-3 bg-[#0A0E27] rounded-lg p-3">
                        <span className="text-[#FF6B35] font-bold">{i + 1}.</span>
                        <span className="flex-1 text-[#8B92B8]">{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="flex gap-3 pt-4 border-t border-[#252B4A]">
                <button className="flex-1 bg-[#FF6B35] hover:bg-[#E85A2B] text-white py-3 rounded-lg font-semibold transition-colors">
                  Take Action
                </button>
                <button 
                  onClick={() => setSelectedInsight(null)}
                  className="px-6 bg-[#1C2342] hover:bg-[#252B4A] text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
