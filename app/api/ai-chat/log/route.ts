import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'

// POST /api/ai-chat/log - Log AI chat messages and update session
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      sessionId,
      merchantId,
      contextMode,
      messages // Array of {role, content, timestamp}
    } = body

    if (!sessionId || !merchantId || !messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, merchantId, messages' },
        { status: 400 }
      )
    }

    const user = session.user as { id: string; email?: string; role?: string; merchantId?: string }
    const userId = user.id
    const userEmail = session.user.email

    // Verify user has access to this merchant (prevent cross-tenant logging)
    const isAdmin = user.role === 'super_admin' || user.role === 'admin'
    if (!isAdmin && user.merchantId && user.merchantId !== merchantId) {
      return NextResponse.json({ error: 'Forbidden - invalid merchant' }, { status: 403 })
    }

    // Log each message
    const messageRecords = messages.map((msg: { role: string; content: string; timestamp?: string }) => ({
      merchant_id: merchantId,
      user_id: userId || null,
      user_email: userEmail || null,
      session_id: sessionId,
      role: msg.role,
      content: msg.content,
      context_mode: contextMode || 'cashback',
      timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
    }))

    // Insert messages
    await prisma.ai_chat_messages.createMany({
      data: messageRecords,
      skipDuplicates: true
    })

    // Update or create session record
    const firstUserMessage = messages.find((m: { role: string }) => m.role === 'user')
    const existingSession = await prisma.ai_chat_sessions.findUnique({
      where: { session_id: sessionId }
    })

    if (existingSession) {
      // Update existing session
      await prisma.ai_chat_sessions.update({
        where: { session_id: sessionId },
        data: {
          message_count: { increment: messages.length },
          last_message_at: new Date()
        }
      })
    } else {
      // Create new session
      await prisma.ai_chat_sessions.create({
        data: {
          session_id: sessionId,
          merchant_id: merchantId,
          user_id: userId || null,
          user_email: userEmail || null,
          context_mode: contextMode || 'cashback',
          message_count: messages.length,
          first_message: firstUserMessage?.content?.substring(0, 500) || null,
          started_at: new Date(),
          last_message_at: new Date()
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error logging AI chat:', error)
    // Handle case where table doesn't exist yet - silently succeed
    // so the user experience is not affected
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
      return NextResponse.json({ success: true, warning: 'Logging not available - tables not migrated' })
    }
    return NextResponse.json(
      { error: 'Failed to log chat messages' },
      { status: 500 }
    )
  }
}
