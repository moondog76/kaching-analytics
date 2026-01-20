'use client'

import { useState, useRef, useEffect } from 'react'
import { ConversationMessage } from '@/lib/types'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  suggested_followups?: string[]
}

export default function AIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your AI analyst. I've already analyzed your campaign data and found some interesting patterns. Ask me anything about your performance, competitors, or what you should do next.",
      timestamp: new Date(),
      suggested_followups: [
        'What are my top insights right now?',
        'How am I doing vs competitors?',
        'Forecast next week\'s transactions'
      ]
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  useEffect(() => {
    scrollToBottom()
  }, [messages])
  
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
    
    try {
      // Call AI API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content,
            timestamp: m.timestamp
          }))
        })
      })
      
      const data = await response.json()
      
      if (data.fallback) {
        // Fallback response if no API key
        const fallbackResponse: ChatMessage = {
          role: 'assistant',
          content: generateFallbackResponse(query),
          timestamp: new Date(),
          suggested_followups: [
            'Tell me more about my efficiency',
            'Compare me to Lidl',
            'What should I focus on?'
          ]
        }
        setMessages(prev => [...prev, fallbackResponse])
      } else {
        // Real AI response
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          suggested_followups: data.suggested_followups
        }
        setMessages(prev => [...prev, assistantMessage])
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: "Sorry, I encountered an error. Please try again or check your API configuration.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
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
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div>
            <div className="font-semibold text-slate-800">AI Analyst</div>
            <div className="text-xs text-slate-500">
              {isLoading ? 'Analyzing...' : 'Ready to help'}
            </div>
          </div>
        </div>
        <div className="text-2xl text-slate-400 hover:text-slate-600 transition-colors">
          {isMinimized ? '▲' : '▼'}
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
                      ? 'bg-blue-500 text-white ml-auto'
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
                            onClick={() => handleSend(followup)}
                            className="text-left text-sm bg-slate-50 hover:bg-slate-100 border border-slate-200 text-blue-600 rounded-lg px-3 py-2 transition-colors"
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
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
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
                className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors placeholder-slate-400"
                placeholder="Ask about your campaign..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
              />
              <button
                className="bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
              >
                Send
              </button>
            </div>
            <div className="text-xs text-slate-400 mt-2">
              Powered by Claude AI • Press Enter to send
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Fallback responses when no API key is configured
function generateFallbackResponse(query: string): string {
  const q = query.toLowerCase()
  
  if (q.includes('insight')) {
    return "Based on your data, I see 3 key insights:\n\n1. Your 5% cashback rate is highest in market - great for acquisition but watch profitability\n2. Transaction trend is positive (+8% vs last week)\n3. You're #5 in transactions but could climb with targeted improvements\n\nAdd your Claude API key to get real-time AI analysis with full context!"
  }
  
  if (q.includes('competitor') || q.includes('compar')) {
    return "Competitive Analysis:\n\n• Lidl leads with 797 transactions (3% cashback)\n• You're at 482 transactions (5% cashback)\n• Your higher rate attracts customers but costs more\n• Focus on retention to maximize ROI\n\nFor deep competitive intelligence, add your Claude API key!"
  }
  
  if (q.includes('forecast') || q.includes('predict')) {
    return "Based on current trends:\n\n📈 Next 7 days forecast:\n• 510-530 transactions (95% confidence)\n• Slight upward trend continuing\n• Weekend dip expected as usual\n\nAdd Claude API key for statistical forecasting with confidence intervals!"
  }
  
  return "I can help you with:\n\n• Campaign performance analysis\n• Competitive benchmarking\n• Forecasting and predictions\n• Efficiency optimization\n• Strategic recommendations\n\nTo unlock full AI capabilities, add your ANTHROPIC_API_KEY to the .env.local file. For now, I'm using pre-programmed responses based on your data!"
}
