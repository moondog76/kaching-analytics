import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getAuditLogs } from '@/lib/security/audit'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '500')
    const action = searchParams.get('action') || undefined
    const userId = searchParams.get('userId') || undefined
    const merchantId = searchParams.get('merchantId') || undefined
    
    // Get audit logs with filters
    const result = await getAuditLogs({ 
      limit,
      action: action as 'login' | 'logout' | 'failed_login' | 'password_change' | 'role_change' | 'dashboard_view' | 'analytics_view' | 'transactions_view' | 'data_export' | 'api_access' | undefined,
      userId,
      merchantId 
    })
    
    // Handle both array and object returns from getAuditLogs
    const logs = Array.isArray(result) ? result : result.logs
    
    // Calculate stats
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const todayLogs = logs.filter((log: { created_at: string | Date }) => 
      new Date(log.created_at) >= today
    )
    const uniqueUsers = new Set(logs.map((log: { user_id: string }) => log.user_id)).size
    
    // Transform snake_case to camelCase for frontend
    const transformedLogs = logs.map((log: {
      id: string
      action: string
      resource: string
      resource_id: string | null
      metadata: Record<string, unknown> | null
      ip_address: string | null
      user_agent: string | null
      created_at: string | Date
      user: { id: string; name: string | null; email: string } | null
      merchant: { id: string; name: string } | null
    }) => ({
      id: log.id,
      action: log.action,
      resource: log.resource,
      resourceId: log.resource_id,
      metadata: log.metadata,
      ipAddress: log.ip_address,
      userAgent: log.user_agent,
      createdAt: log.created_at,
      user: log.user,
      merchant: log.merchant
    }))
    
    return NextResponse.json({
      logs: transformedLogs,
      stats: {
        total: logs.length,
        today: todayLogs.length,
        uniqueUsers
      }
    })
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
  }
}
