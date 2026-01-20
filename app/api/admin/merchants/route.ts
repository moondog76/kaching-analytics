import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { hashPassword, generatePassword } from '@/lib/password'

// GET /api/admin/merchants - List all merchants (admin only)
export async function GET(request: NextRequest) {
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
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const includeStats = searchParams.get('stats') === 'true'

    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { industry: { contains: search, mode: 'insensitive' } }
      ]
    }

    const merchants = await prisma.merchants.findMany({
      where,
      include: {
        _count: {
          select: {
            users: true,
            transactions: includeStats,
            daily_metrics: includeStats
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({
      merchants: merchants.map(m => ({
        id: m.id,
        name: m.name,
        industry: m.industry,
        cashbackPercent: m.cashback_percent ? Number(m.cashback_percent) : null,
        createdAt: m.created_at,
        userCount: m._count.users,
        transactionCount: includeStats ? m._count.transactions : undefined,
        metricsCount: includeStats ? m._count.daily_metrics : undefined
      }))
    })
  } catch (error) {
    console.error('Error fetching merchants:', error)
    return NextResponse.json({ error: 'Failed to fetch merchants' }, { status: 500 })
  }
}

// POST /api/admin/merchants - Create new merchant (super_admin only)
export async function POST(request: NextRequest) {
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
    const body = await request.json()
    const { name, industry, cashbackPercent, createAdminUser, adminEmail } = body

    if (!name) {
      return NextResponse.json({ error: 'Merchant name is required' }, { status: 400 })
    }

    // Check if merchant already exists
    const existing = await prisma.merchants.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } }
    })
    if (existing) {
      return NextResponse.json({ error: 'Merchant with this name already exists' }, { status: 400 })
    }

    // Create merchant
    const merchant = await prisma.merchants.create({
      data: {
        name,
        industry: industry || 'Retail',
        cashback_percent: cashbackPercent || null
      }
    })

    let adminUser = null
    let generatedPassword = null

    // Optionally create admin user for the merchant
    if (createAdminUser) {
      const email = adminEmail || `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@admin.com`

      // Check if email exists
      const existingUser = await prisma.users.findUnique({ where: { email } })
      if (existingUser) {
        return NextResponse.json({
          error: `User with email ${email} already exists`,
          merchant: { id: merchant.id, name: merchant.name }
        }, { status: 400 })
      }

      generatedPassword = generatePassword()
      const passwordHash = await hashPassword(generatedPassword)

      adminUser = await prisma.users.create({
        data: {
          email,
          name: `${name} Admin`,
          role: 'admin',
          merchant_id: merchant.id,
          password_hash: passwordHash,
          is_active: true
        }
      })
    }

    return NextResponse.json({
      success: true,
      merchant: {
        id: merchant.id,
        name: merchant.name,
        industry: merchant.industry,
        cashbackPercent: merchant.cashback_percent ? Number(merchant.cashback_percent) : null
      },
      adminUser: adminUser ? {
        id: adminUser.id,
        email: adminUser.email,
        generatedPassword
      } : null
    })
  } catch (error) {
    console.error('Error creating merchant:', error)
    return NextResponse.json({ error: 'Failed to create merchant' }, { status: 500 })
  }
}
