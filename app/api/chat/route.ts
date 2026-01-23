import { NextRequest, NextResponse } from 'next/server'
import { DataLoader } from '@/lib/data-loader'
import { MerchantMetrics } from '@/lib/types'
import { AIContextMode } from '@/types/analytics'
import { buildAISystemPrompt } from '@/lib/ai-prompts'
import { opperStreamCall, opperCall, buildConversationInput, OpperMessage } from '@/lib/opper-client'

// POST /api/chat - AI chat endpoint using Opper
export async function POST(request: NextRequest) {
  try {
    const {
      query,
      conversationHistory = [],
      contextMode = 'cashback' as AIContextMode,
      merchantName = 'Demo Store',
      merchantId = 'demo-store',
      stream = true // Default to streaming
    } = await request.json()

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    // Check for API key
    const apiKey = process.env.OPPER_API_KEY

    // Load demo data for context
    const demoData = DataLoader.loadDemoData()

    // Generate historical data for context
    const currentData = demoData.merchant
    const historicalData: MerchantMetrics[] = []

    for (let i = 30; i > 0; i--) {
      const variance = 0.85 + Math.random() * 0.30
      const weekendFactor = (i % 7 === 0 || i % 7 === 6) ? 0.8 : 1.0
      const factor = variance * weekendFactor

      historicalData.push({
        merchant_id: currentData.merchant_id,
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
      // Build system prompt with merchant context
      const systemPrompt = buildAISystemPrompt({
        mode: contextMode,
        merchantName,
        merchantId
      })

      // Add data context to the system prompt
      const enrichedInstructions = `${systemPrompt}

## Current Data Context

**Merchant: ${merchantName}**
- Transactions: ${currentData.transactions.toLocaleString()}
- Revenue: ${(currentData.revenue / 100).toFixed(2)} RON
- Customers: ${currentData.customers.toLocaleString()}
- Cashback Rate: ${currentData.cashback_percent}%
- Cashback Paid: ${(currentData.cashback_paid / 100).toFixed(2)} RON
- Campaign Status: ${currentData.campaign_active ? 'Active' : 'Inactive'}
- Average Transaction: ${(currentData.avg_transaction / 100).toFixed(2)} RON

**Market Position:**
- Rank: #${demoData.competitors.find(c => c.isYou)?.rank || '?'} out of ${demoData.competitors.length} competitors
- Top Competitor: ${demoData.competitors[0]?.merchant_name || 'N/A'} with ${demoData.competitors[0]?.transactions?.toLocaleString() || 'N/A'} transactions

**Key Metrics:**
- ROI: ${((currentData.revenue - currentData.cashback_paid) / currentData.cashback_paid).toFixed(2)}x
- Customer Acquisition Cost: ${((currentData.cashback_paid / currentData.customers) / 100).toFixed(2)} RON
- Revenue per Transaction: ${((currentData.revenue / currentData.transactions) / 100).toFixed(2)} RON

Use this data to provide specific, actionable insights. Always cite actual numbers.`

      // Build conversation input
      const input = buildConversationInput(
        query,
        conversationHistory as OpperMessage[]
      )

      // Handle streaming vs non-streaming
      if (stream) {
        const streamResponse = await opperStreamCall({
          name: `pluxee-analyst-${contextMode}`,
          instructions: enrichedInstructions,
          input,
        })

        // Return streaming response
        return new Response(streamResponse, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Transfer-Encoding': 'chunked',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        })
      } else {
        // Non-streaming response
        const response = await opperCall({
          name: `pluxee-analyst-${contextMode}`,
          instructions: enrichedInstructions,
          input,
        })

        return NextResponse.json({
          success: true,
          response: response.message,
          suggested_followups: generateFollowups(query, contextMode),
          data_sources: ['opper'],
          confidence: 0.9
        })
      }
    } catch (aiError) {
      console.error('Opper API error:', aiError)

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

// Generate follow-up suggestions based on context
function generateFollowups(query: string, contextMode: AIContextMode): string[] {
  const q = query.toLowerCase()

  if (q.includes('forecast') || q.includes('predict')) {
    return [
      'What factors might affect this forecast?',
      'How can I improve these numbers?',
      'Compare to last month'
    ]
  }

  if (q.includes('competitor') || q.includes('compare')) {
    return [
      'Which competitor is gaining market share?',
      'How can I close the gap with the leader?',
      'What are they doing differently?'
    ]
  }

  if (contextMode === 'retail') {
    return [
      'What market trends should I watch?',
      'How is my category performing?',
      'Show me growth opportunities'
    ]
  }

  return [
    'How does this compare to competitors?',
    'What should I do to improve?',
    'Show me a forecast for next week'
  ]
}

// Generate intelligent fallback responses
function generateFallbackResponse(query: string, data: any) {
  const q = query.toLowerCase()
  const merchant = data.merchant
  const competitors = data.competitors

  const formatCurrency = (amount: number) => `${(amount / 100).toFixed(2)} RON`
  const formatNumber = (num: number) => num.toLocaleString()

  // Insights
  if (q.includes('insight') || (q.includes('what') && q.includes('top'))) {
    return {
      message: `I've analyzed your campaign data. Here are your top insights:

**1. Highest Cashback Rate in Market**
Your ${merchant.cashback_percent}% cashback rate is the most aggressive among competitors (vs 3% average). This drives strong customer acquisition but impacts margins.
→ Recommendation: Monitor ROI closely and consider tiered rates for high-value customers

**2. Strong Position with Room to Grow**
You're #5 out of ${competitors.length} active merchants with ${formatNumber(merchant.transactions)} transactions. You're only ${competitors[3].transactions - merchant.transactions} transactions behind #4.
→ Recommendation: Focus on customer retention to climb rankings efficiently

**3. Healthy Campaign ROI**
Your ROI is ${((merchant.revenue - merchant.cashback_paid) / merchant.cashback_paid).toFixed(2)}x - in the healthy range of 2-4x.
→ Recommendation: Maintain current strategy while testing optimization

*Note: Running in fallback mode. OPPER_API_KEY may not be configured.*`,
      followups: [
        'Compare me to Lidl in detail',
        'What can I do to improve my rank?',
        'Forecast my next week performance'
      ]
    }
  }

  // Default helpful response
  return {
    message: `I can help you analyze your campaign! Here's what I can see:

**Campaign Overview:**
• ${formatNumber(merchant.transactions)} transactions generating ${formatCurrency(merchant.revenue)}
• ${formatNumber(merchant.customers)} active customers
• ${merchant.cashback_percent}% cashback rate (highest in market)

**Try asking:**
• "What are my top insights?"
• "Compare me to competitors"
• "How can I improve my ranking?"

*Note: Running in fallback mode. Check OPPER_API_KEY configuration.*`,
    followups: [
      'What are my top insights?',
      'How do I compare to competitors?',
      'What should I focus on?'
    ]
  }
}
