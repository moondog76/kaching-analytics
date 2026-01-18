import { logAuditEvent } from '@/lib/security/audit';
import { NextRequest, NextResponse } from 'next/server'
import { AIAgent } from '@/lib/ai-agent'
import { DataLoader } from '@/lib/data-loader'
import { ConversationMessage, MerchantMetrics } from '@/lib/types'

// NO EDGE RUNTIME - Use Node.js runtime for environment variables

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
    
    console.log('=== API KEY CHECK ===')
    console.log('Key exists:', !!apiKey)
    console.log('Key length:', apiKey?.length || 0)
    console.log('====================')
    
    // Load demo data
    const demoData = DataLoader.loadDemoData()
    
    // Generate simple historical data for forecasting
    const currentData = demoData.carrefour
    const historicalData: MerchantMetrics[] = []
    
    // Generate 30 days of historical data
    for (let i = 30; i > 0; i--) {
      const variance = 0.85 + Math.random() * 0.30
      const weekendFactor = (i % 7 === 0 || i % 7 === 6) ? 0.8 : 1.0
      const factor = variance * weekendFactor
      
      historicalData.push({
        merchant_name: currentData.merchant_name,
        transactions: Math.round(currentData.transactions * factor),
        revenue: Math.round(currentData.revenue * factor),
        customers: Math.round(currentData.customers * factor),
        cashback_paid: Math.round(currentData.cashback_paid * factor),
        cashback_percent: currentData.cashback_percent,
        campaign_active: currentData.campaign_active,
        avg_transaction: currentData.avg_transaction,
        period: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      })
    }
    
    if (!apiKey) {
      // Fallback response without API key
      const fallbackResponse = generateFallbackResponse(query, demoData)
      return NextResponse.json({
        success: true,
        fallback: true,
        response: fallbackResponse.message,
        suggested_followups: fallbackResponse.followups,
        data_sources: [],
        confidence: 0.7
      })
    }
    
    try {
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
      
      // Process query with AI
      console.log('Calling Claude API...')
      const response = await agent.processQuery(
        query,
        context,
        demoData.carrefour,
        demoData.competitors,
        historicalData
      )
      
      console.log('Claude API response received')
      
      return NextResponse.json({
        success: true,
        response: response.message,
        suggested_followups: response.suggested_followups,
        data_sources: response.data_sources_used,
        confidence: response.confidence
      })
    } catch (aiError) {
      console.error('AI processing error:', aiError)
      
      // Fallback to smart responses if AI fails
      const fallbackResponse = generateFallbackResponse(query, demoData)
      return NextResponse.json({
        success: true,
        fallback: true,
        response: fallbackResponse.message,
        suggested_followups: fallbackResponse.followups,
        data_sources: ['fallback'],
        confidence: 0.7
      })
    }
    
  } catch (error) {
    console.error('Chat route error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'An error occurred processing your request',
        fallback: true,
        response: "I'm having trouble processing that request. Try asking:\n\n• What are my top insights?\n• How do I compare to competitors?\n• Forecast my performance",
        suggested_followups: [
          "What are my key metrics?",
          "Show competitive analysis",
          "What should I improve?"
        ]
      },
      { status: 200 }
    )
  }
}

// Generate intelligent fallback responses
function generateFallbackResponse(query: string, data: any) {
  const q = query.toLowerCase()
  const carrefour = data.carrefour
  const competitors = data.competitors
  
  const formatCurrency = (amount: number) => `${(amount / 100).toFixed(2)} RON`
  const formatNumber = (num: number) => num.toLocaleString()
  
  // Insights
  if (q.includes('insight') || (q.includes('what') && q.includes('top'))) {
    return {
      message: `I've analyzed your campaign data. Here are your top insights:

**1. 🎯 Highest Cashback Rate in Market**
Your 5% cashback rate is the most aggressive among competitors (vs 3% average). This drives strong customer acquisition but impacts margins.
→ Recommendation: Monitor ROI closely and consider tiered rates for high-value customers

**2. 📊 Strong Position with Room to Grow**  
You're #5 out of ${competitors.length} active merchants with ${formatNumber(carrefour.transactions)} transactions. You're only ${competitors[3].transactions - carrefour.transactions} transactions behind #4.
→ Recommendation: Focus on customer retention to climb rankings efficiently

**3. 💰 Healthy Campaign ROI**
Your ROI is ${((carrefour.revenue - carrefour.cashback_paid) / carrefour.cashback_paid).toFixed(2)}x - in the healthy range of 2-4x.
→ Recommendation: Maintain current strategy while testing optimization

*Note: This is using fallback mode. API key may not be configured correctly.*`,
      followups: [
        'Compare me to Lidl in detail',
        'What can I do to improve my rank?',
        'Forecast my next week performance'
      ]
    }
  }
  
  // Default helpful response
  return {
    message: `I can help you analyze your Carrefour campaign! Here's what I can do:

**📊 Campaign Analysis:**
• ${formatNumber(carrefour.transactions)} transactions generating ${formatCurrency(carrefour.revenue)}
• ${formatNumber(carrefour.customers)} active customers
• ${carrefour.cashback_percent}% cashback rate (highest in market)

**💡 Try asking:**
• "What are my top insights?"
• "Compare me to Lidl"
• "How can I improve my ranking?"

*Note: Running in fallback mode. Check API key configuration.*`,
    followups: [
      'What are my top insights?',
      'How do I compare to competitors?',
      'What should I focus on?'
    ]
  }
}
