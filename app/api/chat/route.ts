import { NextRequest, NextResponse } from 'next/server'
import { AIAgent } from '@/lib/ai-agent'
import { DataLoader } from '@/lib/data-loader'
import { ConversationMessage } from '@/lib/types'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const { query, conversationHistory = [] } = await request.json()
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }
    
    // Check for API key
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { 
          error: 'AI features require ANTHROPIC_API_KEY to be set',
          fallback: true,
          message: 'Using fallback responses. Add your Claude API key to enable full AI capabilities.'
        },
        { status: 200 }
      )
    }
    
    // Load data
    const data = DataLoader.loadDemoData()
    const { historical } = DataLoader.processTransactions([])
    
    // Create AI agent
    const agent = new AIAgent(apiKey)
    
    // Build conversation context
    const context = {
      conversation_id: 'demo-conversation',
      merchant_id: 'carrefour',
      messages: conversationHistory as ConversationMessage[],
      active_filters: [],
      computed_metrics: {},
      visualizations: []
    }
    
    // Process query
    const response = await agent.processQuery(
      query,
      context,
      data.carrefour,
      data.competitors,
      historical
    )
    
    return NextResponse.json({
      success: true,
      response: response.message,
      suggested_followups: response.suggested_followups,
      data_sources: response.data_sources_used,
      confidence: response.confidence
    })
    
  } catch (error) {
    console.error('AI chat error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to process query',
        details: error instanceof Error ? error.message : 'Unknown error',
        fallback: true
      },
      { status: 500 }
    )
  }
}
