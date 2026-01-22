'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Conversation {
  sessionId: string
  merchantId: string
  merchantName: string
  contextMode: string
  messageCount: number
  firstMessage: string | null
  startedAt: string
  lastMessageAt: string
  userId: string | null
  userName: string | null
  userEmail: string | null
  flagged: boolean
  starred: boolean
  tags: string[]
}

interface ConversationDetail extends Conversation {
  messages: Array<{
    role: string
    content: string
    timestamp: string
  }>
  summary: string | null
}

interface Insights {
  period: { start: string; end: string }
  totalConversations: number
  topTopics: Array<{ topic: string; count: number; percentage: number }> | null
  painPoints: Array<{ issue: string; count: number; severity: string }> | null
  featureRequests: Array<{ request: string; count: number }> | null
  confusionPoints: Array<{ area: string; count: number }> | null
  aiPerformance: {
    avgMessagesPerConversation: number
    resolutionRate: number | null
    failedConversations?: number
  }
  fullAnalysis: string | null
  generatedAt: string | null
  needsGeneration?: boolean
  isDemo?: boolean
}

export default function AIConversationsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const userRole = (session?.user as any)?.role

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<ConversationDetail | null>(null)
  const [insights, setInsights] = useState<Insights | null>(null)
  const [loading, setLoading] = useState(true)
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [generatingInsights, setGeneratingInsights] = useState(false)
  const [totalConversations, setTotalConversations] = useState(0)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({
    contextMode: '',
    flagged: false,
    starred: false,
    search: ''
  })

  // Check admin access
  useEffect(() => {
    if (session && userRole !== 'super_admin' && userRole !== 'admin') {
      router.push('/')
    }
  }, [session, userRole, router])

  // Load conversations
  useEffect(() => {
    loadConversations()
  }, [page, filters])

  // Load insights on mount
  useEffect(() => {
    loadInsights()
  }, [])

  const loadConversations = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '20')
      if (filters.contextMode) params.set('contextMode', filters.contextMode)
      if (filters.flagged) params.set('flagged', 'true')
      if (filters.starred) params.set('starred', 'true')
      if (filters.search) params.set('search', filters.search)

      const response = await fetch(`/api/admin/ai-conversations?${params.toString()}`)
      const data = await response.json()

      if (data.conversations) {
        setConversations(data.conversations)
        setTotalConversations(data.total)
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadInsights = async () => {
    setInsightsLoading(true)
    try {
      const response = await fetch('/api/admin/ai-insights?period=week')
      const data = await response.json()
      setInsights(data)
    } catch (error) {
      console.error('Error loading insights:', error)
    } finally {
      setInsightsLoading(false)
    }
  }

  const generateInsights = async () => {
    setGeneratingInsights(true)
    try {
      const response = await fetch('/api/admin/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period: 'week' })
      })
      const data = await response.json()
      setInsights(data)
    } catch (error) {
      console.error('Error generating insights:', error)
    } finally {
      setGeneratingInsights(false)
    }
  }

  const loadConversationDetail = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/admin/ai-conversations/${sessionId}`)
      const data = await response.json()
      setSelectedConversation(data)
    } catch (error) {
      console.error('Error loading conversation detail:', error)
    }
  }

  const toggleFlag = async (sessionId: string, currentFlagged: boolean) => {
    try {
      await fetch(`/api/admin/ai-conversations/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flagged: !currentFlagged })
      })
      loadConversations()
      if (selectedConversation?.sessionId === sessionId) {
        setSelectedConversation({ ...selectedConversation, flagged: !currentFlagged })
      }
    } catch (error) {
      console.error('Error toggling flag:', error)
    }
  }

  const toggleStar = async (sessionId: string, currentStarred: boolean) => {
    try {
      await fetch(`/api/admin/ai-conversations/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ starred: !currentStarred })
      })
      loadConversations()
      if (selectedConversation?.sessionId === sessionId) {
        setSelectedConversation({ ...selectedConversation, starred: !currentStarred })
      }
    } catch (error) {
      console.error('Error toggling star:', error)
    }
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Unknown'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Invalid date'
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

      if (diffHours < 1) return 'Just now'
      if (diffHours < 24) return `${diffHours} hours ago`
      if (diffDays < 7) return `${diffDays} days ago`
      return date.toLocaleDateString()
    } catch {
      return 'Unknown'
    }
  }

  if (!session || (userRole !== 'super_admin' && userRole !== 'admin')) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Access denied</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-8 py-5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="text-slate-500 hover:text-slate-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-pluxee-deep-blue">AI Conversation Analytics</h1>
              <p className="text-sm text-slate-500">Monitor and analyze Pluxee Analyst conversations</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        {/* AI Insights Summary Panel */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-pluxee-deep-blue">AI Insights Summary</h2>
            <button
              onClick={generateInsights}
              disabled={generatingInsights}
              className="px-4 py-2 bg-pluxee-ultra-green text-pluxee-deep-blue font-medium rounded-lg hover:bg-pluxee-ultra-green/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {generatingInsights ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Generate Insights
                </>
              )}
            </button>
          </div>

          {insightsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex gap-2">
                <div className="w-3 h-3 bg-pluxee-ultra-green rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                <div className="w-3 h-3 bg-pluxee-ultra-green rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-3 h-3 bg-pluxee-ultra-green rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          ) : insights && insights.period ? (
            <div className="space-y-6">
              {insights.isDemo && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
                  Demo data shown. Add ANTHROPIC_API_KEY for real AI-powered analysis.
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="text-sm text-slate-500">Total Conversations</div>
                  <div className="text-2xl font-bold text-pluxee-deep-blue">{insights.totalConversations}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="text-sm text-slate-500">Avg Messages/Conv</div>
                  <div className="text-2xl font-bold text-pluxee-deep-blue">
                    {insights.aiPerformance?.avgMessagesPerConversation?.toFixed(1) || '-'}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="text-sm text-slate-500">Resolution Rate</div>
                  <div className="text-2xl font-bold text-pluxee-ultra-green">
                    {insights.aiPerformance?.resolutionRate ? `${insights.aiPerformance.resolutionRate}%` : '-'}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="text-sm text-slate-500">Period</div>
                  <div className="text-sm font-medium text-pluxee-deep-blue">
                    {new Date(insights.period.start).toLocaleDateString()} - {new Date(insights.period.end).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {insights.topTopics && insights.topTopics.length > 0 && (
                <div>
                  <h3 className="font-medium text-pluxee-deep-blue mb-3">Top Topics Users Ask About</h3>
                  <div className="space-y-2">
                    {insights.topTopics.slice(0, 5).map((topic, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-pluxee-boldly-blue/20 flex items-center justify-center text-xs font-medium text-pluxee-deep-blue">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-700">{topic.topic}</span>
                            <span className="text-sm text-slate-500">{topic.count} conversations ({topic.percentage}%)</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                            <div
                              className="h-full bg-pluxee-boldly-blue rounded-full"
                              style={{ width: `${topic.percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {insights.painPoints && insights.painPoints.length > 0 && (
                  <div>
                    <h3 className="font-medium text-pluxee-deep-blue mb-3">Identified Pain Points</h3>
                    <div className="space-y-2">
                      {insights.painPoints.map((point, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            point.severity === 'high' ? 'bg-red-200 text-red-800' :
                            point.severity === 'medium' ? 'bg-amber-200 text-amber-800' :
                            'bg-slate-200 text-slate-700'
                          }`}>
                            {point.severity}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm text-slate-700">{point.issue}</p>
                            <p className="text-xs text-slate-500 mt-1">{point.count} occurrences</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {insights.featureRequests && insights.featureRequests.length > 0 && (
                  <div>
                    <h3 className="font-medium text-pluxee-deep-blue mb-3">Feature Requests Detected</h3>
                    <div className="space-y-2">
                      {insights.featureRequests.map((req, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-pluxee-ultra-green/10 border border-pluxee-ultra-green/20 rounded-lg">
                          <span className="text-sm text-slate-700">"{req.request}"</span>
                          <span className="text-xs text-slate-500">{req.count} mentions</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {insights.fullAnalysis && (
                <div className="pt-4 border-t border-slate-100">
                  <h3 className="font-medium text-pluxee-deep-blue mb-2">AI Analysis Summary</h3>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{insights.fullAnalysis}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              No insights available. Click "Generate Insights" to analyze conversations.
            </div>
          )}
        </div>

        {/* Conversation Log */}
        <div className="bg-white border border-slate-200 rounded-xl">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-pluxee-deep-blue mb-4">Conversation Log</h2>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <select
                value={filters.contextMode}
                onChange={(e) => setFilters({ ...filters, contextMode: e.target.value })}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pluxee-ultra-green/20"
              >
                <option value="">All Contexts</option>
                <option value="cashback">Cashback Insights</option>
                <option value="retail">Retail Insights</option>
              </select>

              <label className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={filters.flagged}
                  onChange={(e) => setFilters({ ...filters, flagged: e.target.checked })}
                  className="rounded text-pluxee-ultra-green focus:ring-pluxee-ultra-green"
                />
                <span className="text-sm text-slate-700">Flagged only</span>
              </label>

              <label className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={filters.starred}
                  onChange={(e) => setFilters({ ...filters, starred: e.target.checked })}
                  className="rounded text-pluxee-ultra-green focus:ring-pluxee-ultra-green"
                />
                <span className="text-sm text-slate-700">Starred only</span>
              </label>

              <input
                type="text"
                placeholder="Search conversations..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-pluxee-ultra-green/20"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex gap-2">
                <div className="w-3 h-3 bg-pluxee-ultra-green rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                <div className="w-3 h-3 bg-pluxee-ultra-green rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-3 h-3 bg-pluxee-ultra-green rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No conversations found. AI chat messages will appear here once users interact with the Pluxee Analyst.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {conversations.map((conv) => (
                <div
                  key={conv.sessionId}
                  className="p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => loadConversationDetail(conv.sessionId)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-pluxee-deep-blue">{conv.merchantName}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          conv.contextMode === 'retail'
                            ? 'bg-pluxee-boldly-blue/20 text-pluxee-boldly-blue'
                            : 'bg-pluxee-ultra-green/20 text-pluxee-deep-blue'
                        }`}>
                          {conv.contextMode === 'retail' ? 'Retail' : 'Cashback'}
                        </span>
                        <span className="text-xs text-slate-400">{formatDate(conv.lastMessageAt)}</span>
                        <span className="text-xs text-slate-400">{conv.messageCount} messages</span>
                      </div>
                      {conv.firstMessage && (
                        <p className="text-sm text-slate-600 line-clamp-2">{conv.firstMessage}</p>
                      )}
                      {conv.userEmail && (
                        <p className="text-xs text-slate-400 mt-1">{conv.userEmail}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFlag(conv.sessionId, conv.flagged)
                        }}
                        className={`p-2 rounded-lg transition-colors ${
                          conv.flagged ? 'bg-red-100 text-red-600' : 'hover:bg-slate-100 text-slate-400'
                        }`}
                        title={conv.flagged ? 'Remove flag' : 'Flag for review'}
                      >
                        <svg className="w-4 h-4" fill={conv.flagged ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleStar(conv.sessionId, conv.starred)
                        }}
                        className={`p-2 rounded-lg transition-colors ${
                          conv.starred ? 'bg-amber-100 text-amber-600' : 'hover:bg-slate-100 text-slate-400'
                        }`}
                        title={conv.starred ? 'Remove star' : 'Star conversation'}
                      >
                        <svg className="w-4 h-4" fill={conv.starred ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalConversations > 20 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm text-slate-500">
                Showing {(page - 1) * 20 + 1} - {Math.min(page * 20, totalConversations)} of {totalConversations}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border border-slate-200 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page * 20 >= totalConversations}
                  className="px-3 py-1 border border-slate-200 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Conversation Detail Modal */}
      {selectedConversation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-pluxee-deep-blue">
                  {selectedConversation.merchantName}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    selectedConversation.contextMode === 'retail'
                      ? 'bg-pluxee-boldly-blue/20 text-pluxee-boldly-blue'
                      : 'bg-pluxee-ultra-green/20 text-pluxee-deep-blue'
                  }`}>
                    {selectedConversation.contextMode === 'retail' ? 'Retail Insights' : 'Cashback Insights'}
                  </span>
                  <span className="text-sm text-slate-500">
                    {selectedConversation.messageCount} messages
                  </span>
                  <span className="text-sm text-slate-500">
                    {formatDate(selectedConversation.startedAt)}
                  </span>
                </div>
                {selectedConversation.userEmail && (
                  <p className="text-sm text-slate-500 mt-1">{selectedConversation.userEmail}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleFlag(selectedConversation.sessionId, selectedConversation.flagged)}
                  className={`p-2 rounded-lg transition-colors ${
                    selectedConversation.flagged ? 'bg-red-100 text-red-600' : 'hover:bg-slate-100 text-slate-400'
                  }`}
                >
                  <svg className="w-5 h-5" fill={selectedConversation.flagged ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                  </svg>
                </button>
                <button
                  onClick={() => toggleStar(selectedConversation.sessionId, selectedConversation.starred)}
                  className={`p-2 rounded-lg transition-colors ${
                    selectedConversation.starred ? 'bg-amber-100 text-amber-600' : 'hover:bg-slate-100 text-slate-400'
                  }`}
                >
                  <svg className="w-5 h-5" fill={selectedConversation.starred ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </button>
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
              {selectedConversation.messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-xl ${
                      msg.role === 'user'
                        ? 'bg-pluxee-deep-blue text-white'
                        : 'bg-white border border-slate-200 text-slate-700'
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                    <p className={`text-xs mt-2 ${msg.role === 'user' ? 'text-white/60' : 'text-slate-400'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
