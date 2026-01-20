import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { hashPassword, validatePassword, generatePassword } from '@/lib/password'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

// GET /api/admin/users - List all users (admin only)
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
    return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    const search = searchParams.get('search')

    const where: any = {}

    // Admin can only see users in their merchant
    if (user.role === 'admin' && user.merchantId) {
      where.merchant_id = user.merchantId
    } else if (merchantId) {
      where.merchant_id = merchantId
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } }
      ]
    }

    const users = await prisma.users.findMany({
      where,
      include: {
        merchant: {
          select: { id: true, name: true }
        }
      },
      orderBy: { created_at: 'desc' }
    })

    return NextResponse.json({
      users: users.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        isActive: u.is_active,
        merchantId: u.merchant_id,
        merchantName: u.merchant?.name,
        hasPassword: !!u.password_hash,
        ssoProvider: u.sso_provider,
        lastLogin: u.last_login,
        createdAt: u.created_at
      }))
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

// POST /api/admin/users - Create new user
export async function POST(request: NextRequest) {
  const { allowed } = checkRateLimit(request, RATE_LIMITS.auth)
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
    const body = await request.json()
    const { email, name, role, merchantId, password, generatePass } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Check if email already exists
    const existing = await prisma.users.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    }

    // Validate role permissions
    if (user.role === 'admin') {
      // Admin can only create merchant/analyst/viewer roles in their merchant
      if (role === 'super_admin' || role === 'admin') {
        return NextResponse.json({ error: 'Cannot create admin users' }, { status: 403 })
      }
      if (merchantId && merchantId !== user.merchantId) {
        return NextResponse.json({ error: 'Cannot create users for other merchants' }, { status: 403 })
      }
    }

    // Handle password
    let passwordHash: string | null = null
    let generatedPassword: string | null = null

    if (generatePass) {
      generatedPassword = generatePassword()
      passwordHash = await hashPassword(generatedPassword)
    } else if (password) {
      const validation = validatePassword(password)
      if (!validation.valid) {
        return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 })
      }
      passwordHash = await hashPassword(password)
    }

    const newUser = await prisma.users.create({
      data: {
        email,
        name: name || email,
        role: role || 'merchant',
        merchant_id: merchantId || (user.role === 'admin' ? user.merchantId : null),
        password_hash: passwordHash,
        is_active: true
      },
      include: {
        merchant: { select: { id: true, name: true } }
      }
    })

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        merchantId: newUser.merchant_id,
        merchantName: newUser.merchant?.name
      },
      generatedPassword // Only included if generated
    })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
