import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

// GET /api/admin/merchants/[id] - Get single merchant with stats
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { allowed } = checkRateLimit(request, RATE_LIMITS.standard)
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (user.role !== 'super_admin' && user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const merchant = await prisma.merchants.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            transactions: true,
            daily_metrics: true
          }
        },
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            is_active: true,
            last_login: true
          },
          orderBy: { created_at: 'desc' }
        }
      }
    })

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 })
    }

    // Get recent metrics summary
    const recentMetrics = await prisma.daily_metrics.aggregate({
      where: {
        merchant_id: id,
        date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      },
      _sum: {
        transactions_count: true,
        revenue: true,
        unique_customers: true
      }
    })

    return NextResponse.json({
      merchant: {
        id: merchant.id,
        name: merchant.name,
        industry: merchant.industry,
        cashbackPercent: merchant.cashback_percent ? Number(merchant.cashback_percent) : null,
        createdAt: merchant.created_at,
        stats: {
          userCount: merchant._count.users,
          transactionCount: merchant._count.transactions,
          metricsCount: merchant._count.daily_metrics,
          last30Days: {
            transactions: recentMetrics._sum.transactions_count || 0,
            revenue: recentMetrics._sum.revenue ? Number(recentMetrics._sum.revenue) : 0,
            customers: recentMetrics._sum.unique_customers || 0
          }
        },
        users: merchant.users.map(u => ({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          isActive: u.is_active,
          lastLogin: u.last_login
        }))
      }
    })
  } catch (error) {
    console.error('Error fetching merchant:', error)
    return NextResponse.json({ error: 'Failed to fetch merchant' }, { status: 500 })
  }
}

// PATCH /api/admin/merchants/[id] - Update merchant
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { allowed } = checkRateLimit(request, RATE_LIMITS.auth)
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden - Super admin access required' }, { status: 403 })
  }

  try {
    const existing = await prisma.merchants.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, industry, cashbackPercent } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (industry !== undefined) updateData.industry = industry
    if (cashbackPercent !== undefined) updateData.cashback_percent = cashbackPercent

    const updated = await prisma.merchants.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      merchant: {
        id: updated.id,
        name: updated.name,
        industry: updated.industry,
        cashbackPercent: updated.cashback_percent ? Number(updated.cashback_percent) : null
      }
    })
  } catch (error) {
    console.error('Error updating merchant:', error)
    return NextResponse.json({ error: 'Failed to update merchant' }, { status: 500 })
  }
}

// DELETE /api/admin/merchants/[id] - Delete merchant (dangerous!)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { allowed } = checkRateLimit(request, RATE_LIMITS.auth)
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden - Super admin access required' }, { status: 403 })
  }

  try {
    const existing = await prisma.merchants.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true, transactions: true }
        }
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 })
    }

    // Require confirmation for merchants with data
    const { searchParams } = new URL(request.url)
    const confirm = searchParams.get('confirm') === 'true'

    if ((existing._count.users > 0 || existing._count.transactions > 0) && !confirm) {
      return NextResponse.json({
        error: 'Merchant has associated data',
        details: {
          users: existing._count.users,
          transactions: existing._count.transactions
        },
        message: 'Add ?confirm=true to delete merchant and all associated data'
      }, { status: 400 })
    }

    // Delete in order: audit_logs, daily_metrics, transactions, users, merchant
    await prisma.audit_logs.deleteMany({ where: { merchant_id: id } })
    await prisma.daily_metrics.deleteMany({ where: { merchant_id: id } })
    await prisma.transactions.deleteMany({ where: { merchant_id: id } })
    await prisma.users.deleteMany({ where: { merchant_id: id } })
    await prisma.merchants.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting merchant:', error)
    return NextResponse.json({ error: 'Failed to delete merchant' }, { status: 500 })
  }
}
