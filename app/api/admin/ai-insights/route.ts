import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'
import Anthropic from '@anthropic-ai/sdk'

// GET /api/admin/ai-insights - Get AI-generated insights summary
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin access
    const userRole = (session.user as any)?.role
    if (userRole !== 'super_admin' && userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'week'

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    switch (period) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1)
        break
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1)
        break
      default: // week
        startDate.setDate(startDate.getDate() - 7)
    }

    // Check for existing recent insights
    const existingInsights = await prisma.admin_conversation_insights.findFirst({
      where: {
        period_start: { gte: startDate },
        period_end: { lte: endDate }
      },
      orderBy: { created_at: 'desc' }
    })

    if (existingInsights) {
      return NextResponse.json({
        period: { start: existingInsights.period_start, end: existingInsights.period_end },
        totalConversations: existingInsights.total_conversations,
        topTopics: existingInsights.top_topics,
        painPoints: existingInsights.pain_points,
        featureRequests: existingInsights.feature_requests,
        confusionPoints: existingInsights.confusion_points,
        aiPerformance: {
          avgMessagesPerConversation: existingInsights.avg_messages_per_conv,
          resolutionRate: existingInsights.resolution_rate
        },
        fullAnalysis: existingInsights.full_analysis_text,
        generatedAt: existingInsights.created_at
      })
    }

    // No cached insights - return basic stats
    const [totalConversations, avgMessages] = await Promise.all([
      prisma.ai_chat_sessions.count({
        where: {
          started_at: { gte: startDate, lte: endDate }
        }
      }),
      prisma.ai_chat_sessions.aggregate({
        where: {
          started_at: { gte: startDate, lte: endDate }
        },
        _avg: { message_count: true }
      })
    ])

    return NextResponse.json({
      period: { start: startDate, end: endDate },
      totalConversations,
      topTopics: null,
      painPoints: null,
      featureRequests: null,
      confusionPoints: null,
      aiPerformance: {
        avgMessagesPerConversation: avgMessages._avg.message_count || 0,
        resolutionRate: null
      },
      fullAnalysis: null,
      generatedAt: null,
      needsGeneration: true
    })
  } catch (error) {
    console.error('Error fetching AI insights:', error)
    return NextResponse.json(
      { error: 'Failed to fetch insights' },
      { status: 500 }
    )
  }
}

// POST /api/admin/ai-insights - Generate new AI insights
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin access
    const userRole = (session.user as any)?.role
    if (userRole !== 'super_admin' && userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const period = body.period || 'week'

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    switch (period) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1)
        break
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1)
        break
      default: // week
        startDate.setDate(startDate.getDate() - 7)
    }

    // Fetch conversations for analysis
    const sessions = await prisma.ai_chat_sessions.findMany({
      where: {
        started_at: { gte: startDate, lte: endDate }
      },
      include: {
        merchant: { select: { name: true } }
      },
      orderBy: { started_at: 'desc' },
      take: 100 // Limit for API call
    })

    // Fetch messages for these sessions
    const sessionIds = sessions.map(s => s.session_id)
    const messages = await prisma.ai_chat_messages.findMany({
      where: {
        session_id: { in: sessionIds }
      },
      orderBy: { timestamp: 'asc' }
    })

    // Group messages by session
    const conversationData = sessions.map(s => {
      const sessionMessages = messages.filter(m => m.session_id === s.session_id)
      return {
        sessionId: s.session_id,
        merchant: s.merchant?.name || 'Unknown',
        contextMode: s.context_mode,
        messages: sessionMessages.map(m => ({
          role: m.role,
          content: m.content.substring(0, 500) // Truncate for API
        }))
      }
    })

    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      // Return mock insights without AI
      const mockInsights = generateMockInsights(sessions.length, startDate, endDate)
      return NextResponse.json(mockInsights)
    }

    // Call Claude for meta-analysis
    const anthropic = new Anthropic()

    const analysisPrompt = `You are analyzing AI Analyst conversations from KaChing Analytics Pro to help the product team improve the platform.

Here are ${conversationData.length} recent conversations:

${JSON.stringify(conversationData, null, 2)}

Analyze these conversations and provide a JSON response with:

{
  "topTopics": [
    {"topic": "string", "count": number, "percentage": number}
  ],
  "painPoints": [
    {"issue": "string", "count": number, "severity": "low"|"medium"|"high"}
  ],
  "featureRequests": [
    {"request": "string", "count": number}
  ],
  "confusionPoints": [
    {"area": "string", "count": number}
  ],
  "aiPerformance": {
    "resolutionRate": number,
    "failedConversations": number
  },
  "summary": "string - 2-3 paragraph executive summary of findings"
}

Be specific and quantitative. Focus on actionable insights.`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: analysisPrompt }]
    })

    // Parse response
    let analysis: any = {}
    const responseText = response.content[0].type === 'text' ? response.content[0].text : ''

    try {
      // Try to extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
      }
    } catch {
      analysis = {
        topTopics: [],
        painPoints: [],
        featureRequests: [],
        confusionPoints: [],
        aiPerformance: { resolutionRate: 0, failedConversations: 0 },
        summary: responseText
      }
    }

    // Calculate avg messages
    const avgMessages = sessions.length > 0
      ? sessions.reduce((sum, s) => sum + s.message_count, 0) / sessions.length
      : 0

    // Store insights
    const stored = await prisma.admin_conversation_insights.create({
      data: {
        period_start: startDate,
        period_end: endDate,
        top_topics: analysis.topTopics || [],
        pain_points: analysis.painPoints || [],
        feature_requests: analysis.featureRequests || [],
        confusion_points: analysis.confusionPoints || [],
        total_conversations: sessions.length,
        avg_messages_per_conv: avgMessages,
        resolution_rate: analysis.aiPerformance?.resolutionRate || null,
        full_analysis_text: analysis.summary || responseText
      }
    })

    return NextResponse.json({
      period: { start: startDate, end: endDate },
      totalConversations: sessions.length,
      topTopics: analysis.topTopics,
      painPoints: analysis.painPoints,
      featureRequests: analysis.featureRequests,
      confusionPoints: analysis.confusionPoints,
      aiPerformance: {
        avgMessagesPerConversation: avgMessages,
        resolutionRate: analysis.aiPerformance?.resolutionRate,
        failedConversations: analysis.aiPerformance?.failedConversations
      },
      fullAnalysis: analysis.summary || responseText,
      generatedAt: stored.created_at
    })
  } catch (error) {
    console.error('Error generating AI insights:', error)
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    )
  }
}

// Generate mock insights when no API key is available
function generateMockInsights(totalConversations: number, startDate: Date, endDate: Date) {
  return {
    period: { start: startDate, end: endDate },
    totalConversations,
    topTopics: [
      { topic: 'Market share comparisons', count: Math.floor(totalConversations * 0.22), percentage: 22 },
      { topic: 'Churn analysis', count: Math.floor(totalConversations * 0.18), percentage: 18 },
      { topic: 'Campaign ROI optimization', count: Math.floor(totalConversations * 0.15), percentage: 15 },
      { topic: 'Customer demographics', count: Math.floor(totalConversations * 0.12), percentage: 12 },
      { topic: 'Competitor analysis', count: Math.floor(totalConversations * 0.10), percentage: 10 }
    ],
    painPoints: [
      { issue: 'Users asking for Excel export functionality', count: Math.floor(totalConversations * 0.08), severity: 'medium' },
      { issue: 'Confusion about Cashback vs Retail Insights tabs', count: Math.floor(totalConversations * 0.05), severity: 'high' },
      { issue: 'Users wanting hourly trend data', count: Math.floor(totalConversations * 0.03), severity: 'low' }
    ],
    featureRequests: [
      { request: 'Compare more than 5 competitors', count: Math.floor(totalConversations * 0.04) },
      { request: 'Email weekly reports automatically', count: Math.floor(totalConversations * 0.03) },
      { request: 'Show predictions/forecasts', count: Math.floor(totalConversations * 0.03) }
    ],
    confusionPoints: [
      { area: 'Difference between market share and reach', count: Math.floor(totalConversations * 0.04) },
      { area: 'How churn is calculated', count: Math.floor(totalConversations * 0.03) }
    ],
    aiPerformance: {
      avgMessagesPerConversation: 5.3,
      resolutionRate: 94.2,
      failedConversations: Math.floor(totalConversations * 0.06)
    },
    fullAnalysis: 'This is demo data. Add your ANTHROPIC_API_KEY to generate real AI-powered insights from conversation analysis.',
    generatedAt: new Date(),
    isDemo: true
  }
}
