'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { AIContextMode } from '@/types/analytics'
import { getInitialGreeting, isCompetitorQuery, AI_QUICK_RESPONSES } from '@/lib/ai-prompts'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  suggested_followups?: string[]
}

interface AIChatProps {
  contextMode?: AIContextMode
  merchantName?: string
  merchantId?: string
  onUpgradeClick?: () => void
  embedded?: boolean // When true, renders inline instead of as a floating widget
}

// Generate a unique session ID
function generateSessionId(): string {
  return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export default function AIChat({
  contextMode = 'cashback',
  merchantName = 'Your Store',
  merchantId = 'unknown',
  onUpgradeClick,
  embedded = false
}: AIChatProps) {
  const initialGreeting = getInitialGreeting(contextMode)

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: initialGreeting.content,
      timestamp: new Date(),
      suggested_followups: initialGreeting.suggestedFollowups
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const prevContextMode = useRef(contextMode)
  const sessionIdRef = useRef<string>(generateSessionId())
  const pendingMessagesRef = useRef<ChatMessage[]>([])

  // Log messages to the database
  const logMessages = useCallback(async (messagesToLog: ChatMessage[]) => {
    if (messagesToLog.length === 0 || merchantId === 'unknown') return

    try {
      await fetch('/api/ai-chat/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          merchantId,
          contextMode,
          messages: messagesToLog.map(m => ({
            role: m.role,
            content: m.content,
            timestamp: m.timestamp.toISOString()
          }))
        })
      })
    } catch (error) {
      console.error('Failed to log chat messages:', error)
    }
  }, [merchantId, contextMode])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Reset chat when context mode changes
  useEffect(() => {
    if (prevContextMode.current !== contextMode) {
      // Generate new session ID for new context
      sessionIdRef.current = generateSessionId()
      const newGreeting = getInitialGreeting(contextMode)
      setMessages([
        {
          role: 'assistant',
          content: newGreeting.content,
          timestamp: new Date(),
          suggested_followups: newGreeting.suggestedFollowups
        }
      ])
      prevContextMode.current = contextMode
    }
  }, [contextMode])

  const handleSend = async (messageText?: string) => {
    const query = messageText || input
    if (!query.trim() || isLoading) return

    // Add user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: query,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // In cashback mode, check if user is asking about competitors
    if (contextMode === 'cashback' && isCompetitorQuery(query)) {
      const redirectMessage: ChatMessage = {
        role: 'assistant',
        content: AI_QUICK_RESPONSES.competitorRedirect('competitor data'),
        timestamp: new Date(),
        suggested_followups: [
          'Show my campaign ROI instead',
          'Analyze my customer demographics',
          'What trends do you see in my data?'
        ]
      }
      setMessages(prev => [...prev, redirectMessage])
      setIsLoading(false)
      // Log both messages
      logMessages([userMessage, redirectMessage])
      return
    }

    try {
      // Call AI API with context mode and streaming enabled
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          contextMode,
          merchantName,
          merchantId,
          stream: true,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content,
            timestamp: m.timestamp
          }))
        })
      })

      // Check if response is JSON (fallback/error) or streaming
      const contentType = response.headers.get('content-type') || ''

      if (contentType.includes('application/json')) {
        // Non-streaming fallback response
        const data = await response.json()

        if (data.fallback) {
          const fallbackResponse: ChatMessage = {
            role: 'assistant',
            content: data.response || generateFallbackResponse(query, contextMode),
            timestamp: new Date(),
            suggested_followups: data.suggested_followups || getFallbackFollowups(contextMode)
          }
          setMessages(prev => [...prev, fallbackResponse])
          logMessages([userMessage, fallbackResponse])
        } else {
          const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: data.response,
            timestamp: new Date(),
            suggested_followups: data.suggested_followups
          }
          setMessages(prev => [...prev, assistantMessage])
          logMessages([userMessage, assistantMessage])
        }
      } else {
        // Streaming response - read chunks and update UI progressively
        const reader = response.body?.getReader()
        if (!reader) throw new Error('No response body')

        const decoder = new TextDecoder()
        let accumulatedContent = ''

        // Add empty assistant message that we'll update
        const streamingMessage: ChatMessage = {
          role: 'assistant',
          content: '',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, streamingMessage])

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          accumulatedContent += chunk

          // Update the last message with accumulated content
          setMessages(prev => {
            const updated = [...prev]
            const lastIdx = updated.length - 1
            if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
              updated[lastIdx] = {
                ...updated[lastIdx],
                content: accumulatedContent
              }
            }
            return updated
          })
        }

        // Final update with suggested followups
        const finalMessage: ChatMessage = {
          role: 'assistant',
          content: accumulatedContent,
          timestamp: new Date(),
          suggested_followups: getFallbackFollowups(contextMode)
        }
        setMessages(prev => {
          const updated = [...prev]
          const lastIdx = updated.length - 1
          if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
            updated[lastIdx] = finalMessage
          }
          return updated
        })

        // Log the completed messages
        logMessages([userMessage, finalMessage])
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: "Sorry, I encountered an error. Please try again or check your API configuration.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      logMessages([userMessage, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const getContextLabel = () => {
    return contextMode === 'retail' ? 'Market Intelligence' : 'Campaign Analyst'
  }

  const getContextColor = () => {
    return contextMode === 'retail' ? 'bg-pluxee-boldly-blue' : 'bg-pluxee-ultra-green'
  }

  // Embedded mode - renders inline without fixed positioning
  if (embedded) {
    return (
      <div className="flex flex-col h-[500px] border border-slate-200 rounded-xl overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50">
          {messages.map((msg, idx) => (
            <div key={idx} className="animate-fade-in-up">
              <div
                className={`p-4 rounded-xl max-w-[85%] ${
                  msg.role === 'user'
                    ? 'bg-pluxee-deep-blue text-white ml-auto'
                    : 'bg-white border border-slate-200 text-slate-700'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Suggested follow-ups */}
                {msg.role === 'assistant' && msg.suggested_followups && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <div className="text-xs text-slate-500 mb-2">Suggested questions:</div>
                    <div className="flex flex-col gap-2">
                      {msg.suggested_followups.map((followup, i) => (
                        <button
                          key={i}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSend(followup)
                          }}
                          className="text-left text-sm bg-slate-50 hover:bg-slate-100 border border-slate-200 text-pluxee-deep-blue rounded-lg px-3 py-2 transition-colors"
                          disabled={isLoading}
                        >
                          {followup}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="text-xs text-slate-400 mt-1 px-1">
                {msg.timestamp.toLocaleTimeString()}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-2 p-4">
              <div className="w-2 h-2 bg-pluxee-ultra-green rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
              <div className="w-2 h-2 bg-pluxee-ultra-green rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 bg-pluxee-ultra-green rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={(e) => { e.preventDefault(); handleSend() }} className="p-4 border-t border-slate-200 bg-white">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your data..."
              className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pluxee-ultra-green focus:border-transparent"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-pluxee-ultra-green text-pluxee-deep-blue font-semibold px-5 py-3 rounded-xl hover:bg-pluxee-ultra-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    )
  }

  // Floating widget mode (default)
  return (
    <div
      className={`fixed bottom-8 right-8 w-[450px] bg-white border border-slate-200 rounded-2xl shadow-elevated flex flex-col transition-all duration-300 z-50 ${
        isMinimized ? 'h-[70px]' : 'h-[650px]'
      }`}
    >
      {/* Header */}
      <div
        className="p-5 border-b border-slate-200 flex justify-between items-center cursor-pointer select-none"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-3">
          {/* Pluxee P symbol */}
          <svg className="w-10 h-10" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#221C46"/>
            <path d="M8 8h8c4.418 0 8 3.582 8 8s-3.582 8-8 8h-2v-6h2c1.105 0 2-.895 2-2s-.895-2-2-2h-2v10H8V8z" fill="#00EB5E"/>
            <circle cx="22" cy="10" r="3" fill="#17CCF9"/>
          </svg>
          <div>
            <div className="font-semibold text-pluxee-deep-blue">Pluxee Analyst</div>
            <div className="text-xs text-slate-500">
              {isLoading ? 'Analyzing...' : getContextLabel()}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {contextMode === 'retail' && (
            <span className="pluxee-badge pluxee-badge--premium text-xs">Pro</span>
          )}
          <div className="text-2xl text-slate-400 hover:text-slate-600 transition-colors">
            {isMinimized ? '▲' : '▼'}
          </div>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50">
            {messages.map((msg, idx) => (
              <div key={idx} className="animate-fade-in-up">
                <div
                  className={`p-4 rounded-xl max-w-[85%] ${
                    msg.role === 'user'
                      ? 'bg-pluxee-deep-blue text-white ml-auto'
                      : 'bg-white border border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {/* Suggested follow-ups */}
                  {msg.role === 'assistant' && msg.suggested_followups && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <div className="text-xs text-slate-500 mb-2">Suggested questions:</div>
                      <div className="flex flex-col gap-2">
                        {msg.suggested_followups.map((followup, i) => (
                          <button
                            key={i}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSend(followup)
                            }}
                            className="text-left text-sm bg-slate-50 hover:bg-slate-100 border border-slate-200 text-pluxee-deep-blue rounded-lg px-3 py-2 transition-colors"
                            disabled={isLoading}
                          >
                            {followup}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-xs text-slate-400 mt-1 px-1">
                  {msg.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2 p-4 bg-white border border-slate-200 rounded-xl max-w-[85%]">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-pluxee-ultra-green rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                  <span className="w-2 h-2 bg-pluxee-ultra-green rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <span className="w-2 h-2 bg-pluxee-ultra-green rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-5 border-t border-slate-200 bg-white">
            <div className="flex gap-3">
              <input
                type="text"
                className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-pluxee-deep-blue text-sm outline-none focus:border-pluxee-ultra-green focus:ring-2 focus:ring-pluxee-ultra-green/20 transition-colors placeholder-slate-400"
                placeholder={contextMode === 'retail' ? 'Ask about market trends...' : 'Ask about your campaign...'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
              />
              <button
                className="pluxee-btn-primary"
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
              >
                Send
              </button>
            </div>
            <div className="text-xs text-slate-400 mt-2">
              Powered by Claude AI • {contextMode === 'retail' ? 'Full market access' : 'Own data only'}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Fallback responses when no API key is configured
function generateFallbackResponse(query: string, contextMode: AIContextMode): string {
  const q = query.toLowerCase()

  if (contextMode === 'retail') {
    // Retail Insights fallback responses
    if (q.includes('market share') || q.includes('share')) {
      return "Market Share Analysis:\n\n• Your current market share: 12.3%\n• Top competitor (Lidl): 28.7%\n• You've gained +2.1pp this quarter\n• Key growth opportunity in 35-44 age segment\n\nAdd your Claude API key for real-time market intelligence!"
    }

    if (q.includes('churn') || q.includes('leaving') || q.includes('lost')) {
      return "Churn Analysis:\n\n• 847 customers churned last quarter\n• 42% went to Lidl\n• 28% went to Kaufland\n• Common pattern: younger demographics seeking lower prices\n\nAdd Claude API key for detailed churn insights and recovery strategies!"
    }

    if (q.includes('competitor') || q.includes('compare')) {
      return "Competitive Intelligence:\n\n• Lidl: 28.7% share, strong on price perception\n• Kaufland: 18.2% share, broad assortment\n• You: 12.3% share, opportunity in premium segments\n• Customer overlap with Lidl: 34%\n\nAdd Claude API key for deeper competitive analysis!"
    }

    return "I can help you with:\n\n• Market share trends and positioning\n• Competitive benchmarking\n• Customer mobility and churn\n• Demographic comparisons\n• Strategic recommendations\n\nAdd your ANTHROPIC_API_KEY for full AI capabilities!"
  }

  // Cashback Insights fallback responses
  if (q.includes('insight') || q.includes('performance')) {
    return "Based on your campaign data:\n\n1. Your 5% cashback rate is performing well - good for acquisition\n2. Transaction trend is positive (+8% vs last week)\n3. ROI is 3.2x - healthy campaign performance\n\nAdd your Claude API key for real-time AI analysis!"
  }

  if (q.includes('roi') || q.includes('return')) {
    return "ROI Analysis:\n\n• Current ROI: 3.2x\n• Campaign spend: €15,420\n• Revenue generated: €49,344\n• Cost per acquisition: €4.32\n\nAdd Claude API key for trend analysis and optimization tips!"
  }

  if (q.includes('customer') || q.includes('demographic')) {
    return "Customer Profile:\n\n• Total cashback customers: 3,571\n• Gender: 58% Female, 42% Male\n• Peak age group: 25-34 (34%)\n• Avg receipt: €28.50\n\nAdd Claude API key for deeper demographic insights!"
  }

  return "I can help you with:\n\n• Campaign performance analysis\n• ROI and CAC metrics\n• Customer demographics\n• Trend identification\n• Optimization recommendations\n\nTo unlock full AI capabilities, add your ANTHROPIC_API_KEY to the .env.local file!"
}

function getFallbackFollowups(contextMode: AIContextMode): string[] {
  if (contextMode === 'retail') {
    return [
      'Show market share trends',
      'Where are my churned customers going?',
      'Compare me to top competitors'
    ]
  }
  return [
    'Show my campaign ROI',
    'Analyze my customers',
    'What trends do you see?'
  ]
}
