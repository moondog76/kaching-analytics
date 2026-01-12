import { NextRequest, NextResponse } from 'next/server'
import { AIAgent } from '@/lib/ai-agent'
import { DataLoader } from '@/lib/data-loader'
import { ConversationMessage, MerchantMetrics } from '@/lib/types'

// Remove edge runtime - use Node.js runtime for env variables
// export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const { query, conversationHistory = [] } = await request.json()
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }
    
    // Check for API key - Vercel environment variable
    const apiKey = process.env.ANTHROPIC_API_KEY
    
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
      const response = await agent.processQuery(
        query,
        context,
        demoData.carrefour,
        demoData.competitors,
        historicalData
      )
      
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
  if (q.includes('insight') || q.includes('what') && q.includes('top')) {
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

*Note: Add ANTHROPIC_API_KEY for real-time AI analysis with deeper insights*`,
      followups: [
        'Compare me to Lidl in detail',
        'What can I do to improve my rank?',
        'Forecast my next week performance'
      ]
    }
  }
  
  // Competitor comparison
  if (q.includes('competitor') || q.includes('compar') || q.includes('lidl') || q.includes('vs')) {
    const lidl = competitors.find((c: any) => c.merchant_name === 'Lidl')
    return {
      message: `**Competitive Analysis: You vs Lidl**

**Transactions:**
• Lidl: ${formatNumber(lidl.transactions)} (#1 rank)
• You: ${formatNumber(carrefour.transactions)} (#5 rank)
• Gap: ${formatNumber(lidl.transactions - carrefour.transactions)} transactions (${((lidl.transactions - carrefour.transactions) / carrefour.transactions * 100).toFixed(0)}% difference)

**Strategy Comparison:**
• Lidl: 3% cashback, volume-focused
• You: 5% cashback, premium positioning

**Customer Base:**
• Lidl: ${formatNumber(lidl.customers)} customers
• You: ${formatNumber(carrefour.customers)} customers

**Your Competitive Advantages:**
✓ Highest cashback rate attracts price-sensitive customers
✓ Premium positioning allows for higher margins per transaction
✓ Strong brand recognition in retail

**Opportunities:**
• Your higher cashback rate should drive 40-50% more transactions than Lidl (currently at 60% of their volume)
• Focus on converting your cashback advantage into customer loyalty
• Test if 4% rate maintains acquisition while improving margins

*Add Claude API key for deeper competitive intelligence with market trends*`,
      followups: [
        'How can I close the gap with Lidl?',
        'What if I reduced my cashback to 4%?',
        'Compare my customer retention vs Lidl'
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

**🎯 Available Insights:**
• Competitive positioning (#5 of ${competitors.length} merchants)
• Performance trends and forecasts
• Efficiency metrics and ROI analysis
• Strategic recommendations

**💡 Try asking:**
• "What are my top insights?"
• "Compare me to Lidl"
• "How can I improve my ranking?"

*Note: Running in demo mode. Add ANTHROPIC_API_KEY to enable full AI-powered analysis!*`,
    followups: [
      'What are my top insights?',
      'How do I compare to competitors?',
      'What should I focus on?'
    ]
  }
}
