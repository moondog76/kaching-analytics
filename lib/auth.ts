import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "./db"
import { authOptions } from "./auth-options"

// Session user type
export interface SessionUser {
  id: string
  email: string
  name?: string
  merchantId?: string
  merchantName?: string
  role: string
}

// Get current session user (for API routes)
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return null

  return {
    id: (session.user as any).id || '',
    email: session.user.email,
    name: session.user.name || undefined,
    merchantId: (session.user as any).merchantId,
    merchantName: (session.user as any).merchantName,
    role: (session.user as any).role || 'merchant'
  }
}

// Check if user has access to a specific merchant
export async function canAccessMerchant(
  user: SessionUser,
  merchantId: string
): Promise<boolean> {
  // Super admins can access everything
  if (user.role === 'super_admin') return true

  // Platform admins can access everything
  if (user.role === 'admin') return true

  // Regular users can only access their own merchant
  return user.merchantId === merchantId
}

// Middleware helper for API routes - validates merchant access
export async function withMerchantAuth(
  request: NextRequest,
  handler: (user: SessionUser, merchantId: string) => Promise<NextResponse>
): Promise<NextResponse> {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Please sign in' },
      { status: 401 }
    )
  }

  // Get merchantId from query params or use user's default
  const { searchParams } = new URL(request.url)
  const requestedMerchantId = searchParams.get('merchantId')
  const merchantId = requestedMerchantId || user.merchantId

  if (!merchantId) {
    return NextResponse.json(
      { error: 'No merchant', message: 'User is not assigned to a merchant' },
      { status: 403 }
    )
  }

  // Validate access
  const hasAccess = await canAccessMerchant(user, merchantId)
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Forbidden', message: 'You do not have access to this merchant' },
      { status: 403 }
    )
  }

  return handler(user, merchantId)
}

// Get all merchants a user can access
export async function getAccessibleMerchants(user: SessionUser) {
  if (user.role === 'super_admin' || user.role === 'admin') {
    // Admins can access all merchants
    return prisma.merchants.findMany({
      orderBy: { name: 'asc' }
    })
  }

  // Regular users can only see their own merchant
  if (!user.merchantId) return []

  const merchant = await prisma.merchants.findUnique({
    where: { id: user.merchantId }
  })

  return merchant ? [merchant] : []
}

// Create audit log entry
export async function logAuditEvent(
  userId: string | null,
  merchantId: string | null,
  action: string,
  resource?: string,
  resourceId?: string,
  metadata?: Record<string, any>,
  request?: NextRequest
) {
  try {
    await prisma.audit_logs.create({
      data: {
        user_id: userId,
        merchant_id: merchantId,
        action,
        resource,
        resource_id: resourceId,
        ip_address: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || null,
        user_agent: request?.headers.get('user-agent') || null,
        metadata: metadata || undefined
      }
    })
  } catch (error) {
    console.error('Failed to log audit event:', error)
  }
}
