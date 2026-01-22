import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'

// GET /api/admin/ai-conversations - Fetch paginated conversation list
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
    const merchantId = searchParams.get('merchantId')
    const contextMode = searchParams.get('contextMode')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const search = searchParams.get('search')
    const flagged = searchParams.get('flagged')
    const starred = searchParams.get('starred')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    // For non-super_admin, restrict to their merchant
    if (userRole !== 'super_admin') {
      const userMerchantId = (session.user as any)?.merchantId
      if (userMerchantId) {
        where.merchant_id = userMerchantId
      }
    } else if (merchantId) {
      where.merchant_id = merchantId
    }

    if (contextMode) {
      where.context_mode = contextMode
    }

    if (startDate) {
      where.started_at = { ...where.started_at, gte: new Date(startDate) }
    }

    if (endDate) {
      where.started_at = { ...where.started_at, lte: new Date(endDate) }
    }

    if (flagged === 'true') {
      where.flagged = true
    }

    if (starred === 'true') {
      where.starred = true
    }

    if (search) {
      where.first_message = { contains: search, mode: 'insensitive' }
    }

    // Fetch sessions with merchant info
    const [sessions, total] = await Promise.all([
      prisma.ai_chat_sessions.findMany({
        where,
        include: {
          merchant: { select: { id: true, name: true } },
          user: { select: { id: true, name: true, email: true } }
        },
        orderBy: { last_message_at: 'desc' },
        skip,
        take: limit
      }),
      prisma.ai_chat_sessions.count({ where })
    ])

    // Transform response
    const conversations = sessions.map(s => ({
      sessionId: s.session_id,
      merchantId: s.merchant_id,
      merchantName: s.merchant?.name || 'Unknown',
      contextMode: s.context_mode,
      messageCount: s.message_count,
      firstMessage: s.first_message,
      startedAt: s.started_at,
      lastMessageAt: s.last_message_at,
      userId: s.user_id,
      userName: s.user?.name || null,
      userEmail: s.user_email || s.user?.email || null,
      flagged: s.flagged,
      starred: s.starred,
      tags: s.tags,
      summary: s.summary
    }))

    return NextResponse.json({
      conversations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('Error fetching AI conversations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}
