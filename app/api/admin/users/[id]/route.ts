import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { hashPassword, validatePassword, generatePassword } from '@/lib/password'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

// GET /api/admin/users/[id] - Get single user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { allowed } = checkRateLimit(request, RATE_LIMITS.standard)
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (currentUser.role !== 'super_admin' && currentUser.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const user = await prisma.users.findUnique({
      where: { id },
      include: {
        merchant: { select: { id: true, name: true } }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Admin can only see users in their merchant
    if (currentUser.role === 'admin' && user.merchant_id !== currentUser.merchantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.is_active,
        merchantId: user.merchant_id,
        merchantName: user.merchant?.name,
        hasPassword: !!user.password_hash,
        ssoProvider: user.sso_provider,
        lastLogin: user.last_login,
        createdAt: user.created_at
      }
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

// PATCH /api/admin/users/[id] - Update user
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { allowed } = checkRateLimit(request, RATE_LIMITS.auth)
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (currentUser.role !== 'super_admin' && currentUser.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const existingUser = await prisma.users.findUnique({ where: { id } })
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Admin can only modify users in their merchant
    if (currentUser.role === 'admin' && existingUser.merchant_id !== currentUser.merchantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, role, merchantId, isActive, password, generatePass } = body

    const updateData: any = {}

    if (name !== undefined) updateData.name = name
    if (isActive !== undefined) updateData.is_active = isActive

    // Role changes
    if (role !== undefined) {
      // Only super_admin can change roles to admin/super_admin
      if ((role === 'admin' || role === 'super_admin') && currentUser.role !== 'super_admin') {
        return NextResponse.json({ error: 'Only super admins can assign admin roles' }, { status: 403 })
      }
      updateData.role = role
    }

    // Merchant changes
    if (merchantId !== undefined) {
      if (currentUser.role !== 'super_admin') {
        return NextResponse.json({ error: 'Only super admins can change merchant assignment' }, { status: 403 })
      }
      updateData.merchant_id = merchantId || null
    }

    // Password changes
    let generatedPassword: string | null = null
    if (generatePass) {
      generatedPassword = generatePassword()
      updateData.password_hash = await hashPassword(generatedPassword)
    } else if (password) {
      const validation = validatePassword(password)
      if (!validation.valid) {
        return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 })
      }
      updateData.password_hash = await hashPassword(password)
    }

    const updatedUser = await prisma.users.update({
      where: { id },
      data: updateData,
      include: {
        merchant: { select: { id: true, name: true } }
      }
    })

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        isActive: updatedUser.is_active,
        merchantId: updatedUser.merchant_id,
        merchantName: updatedUser.merchant?.name
      },
      generatedPassword
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { allowed } = checkRateLimit(request, RATE_LIMITS.auth)
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (currentUser.role !== 'super_admin' && currentUser.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const existingUser = await prisma.users.findUnique({ where: { id } })
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent self-deletion
    if (id === currentUser.id) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })
    }

    // Admin can only delete users in their merchant
    if (currentUser.role === 'admin' && existingUser.merchant_id !== currentUser.merchantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Only super_admin can delete admin users
    if ((existingUser.role === 'admin' || existingUser.role === 'super_admin') && currentUser.role !== 'super_admin') {
      return NextResponse.json({ error: 'Only super admins can delete admin users' }, { status: 403 })
    }

    await prisma.users.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
