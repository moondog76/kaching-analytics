import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'

// GET /api/admin/ai-conversations/[sessionId] - Fetch full conversation detail
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
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

    const { sessionId } = params

    // Fetch session metadata
    const chatSession = await prisma.ai_chat_sessions.findUnique({
      where: { session_id: sessionId },
      include: {
        merchant: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } }
      }
    })

    if (!chatSession) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // For non-super_admin, verify merchant access
    if (userRole !== 'super_admin') {
      const userMerchantId = (session.user as any)?.merchantId
      if (chatSession.merchant_id !== userMerchantId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Fetch all messages for this session
    const messages = await prisma.ai_chat_messages.findMany({
      where: { session_id: sessionId },
      orderBy: { timestamp: 'asc' },
      select: {
        role: true,
        content: true,
        timestamp: true
      }
    })

    return NextResponse.json({
      sessionId: chatSession.session_id,
      merchantId: chatSession.merchant_id,
      merchantName: chatSession.merchant?.name || 'Unknown',
      contextMode: chatSession.context_mode,
      userId: chatSession.user_id,
      userName: chatSession.user?.name || null,
      userEmail: chatSession.user_email || chatSession.user?.email || null,
      messageCount: chatSession.message_count,
      startedAt: chatSession.started_at,
      lastMessageAt: chatSession.last_message_at,
      flagged: chatSession.flagged,
      starred: chatSession.starred,
      tags: chatSession.tags,
      summary: chatSession.summary,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp
      }))
    })
  } catch (error) {
    console.error('Error fetching conversation detail:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/ai-conversations/[sessionId] - Update conversation (flag, star, tags)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
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

    const { sessionId } = params
    const body = await request.json()
    const { flagged, starred, tags, summary } = body

    // Verify conversation exists and access
    const chatSession = await prisma.ai_chat_sessions.findUnique({
      where: { session_id: sessionId }
    })

    if (!chatSession) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // For non-super_admin, verify merchant access
    if (userRole !== 'super_admin') {
      const userMerchantId = (session.user as any)?.merchantId
      if (chatSession.merchant_id !== userMerchantId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Update session
    const updateData: any = {}
    if (typeof flagged === 'boolean') updateData.flagged = flagged
    if (typeof starred === 'boolean') updateData.starred = starred
    if (Array.isArray(tags)) updateData.tags = tags
    if (typeof summary === 'string') updateData.summary = summary

    const updated = await prisma.ai_chat_sessions.update({
      where: { session_id: sessionId },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      flagged: updated.flagged,
      starred: updated.starred,
      tags: updated.tags,
      summary: updated.summary
    })
  } catch (error) {
    console.error('Error updating conversation:', error)
    return NextResponse.json(
      { error: 'Failed to update conversation' },
      { status: 500 }
    )
  }
}
