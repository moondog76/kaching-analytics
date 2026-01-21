import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser, logAuditEvent } from '@/lib/auth'
import { calculateNextScheduledTime, ReportFrequency } from '@/lib/reports'

// GET /api/scheduled-reports/[id] - Get a specific scheduled report
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const report = await prisma.scheduled_reports.findFirst({
      where: {
        id,
        merchant_id: user.merchantId || ''
      }
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    return NextResponse.json({ report })
  } catch (error) {
    console.error('Error fetching scheduled report:', error)
    return NextResponse.json(
      { error: 'Failed to fetch scheduled report' },
      { status: 500 }
    )
  }
}

// PATCH /api/scheduled-reports/[id] - Update a scheduled report
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check role
    if (user.role !== 'super_admin' && user.role !== 'admin' && user.role !== 'analyst') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const existing = await prisma.scheduled_reports.findFirst({
      where: {
        id,
        merchant_id: user.merchantId || ''
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      name,
      frequency,
      recipients,
      includeCompetitors,
      includeHistorical,
      isActive
    } = body

    // Validate email addresses if provided
    if (recipients && Array.isArray(recipients)) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const invalidEmails = recipients.filter((email: string) => !emailRegex.test(email))
      if (invalidEmails.length > 0) {
        return NextResponse.json(
          { error: `Invalid email addresses: ${invalidEmails.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Recalculate next scheduled time if frequency changed
    let nextScheduledAt = existing.next_scheduled_at
    if (frequency && frequency !== existing.frequency) {
      if (!['daily', 'weekly', 'monthly'].includes(frequency)) {
        return NextResponse.json(
          { error: 'Frequency must be daily, weekly, or monthly' },
          { status: 400 }
        )
      }
      nextScheduledAt = calculateNextScheduledTime(frequency as ReportFrequency)
    }

    const report = await prisma.scheduled_reports.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(frequency !== undefined && { frequency, next_scheduled_at: nextScheduledAt }),
        ...(recipients !== undefined && { recipients }),
        ...(includeCompetitors !== undefined && { include_competitors: includeCompetitors }),
        ...(includeHistorical !== undefined && { include_historical: includeHistorical }),
        ...(isActive !== undefined && { is_active: isActive })
      }
    })

    // Log the action
    await logAuditEvent(
      user.id,
      user.merchantId || '',
      'update_scheduled_report',
      'scheduled_report',
      id,
      body,
      request
    )

    return NextResponse.json({ report })
  } catch (error) {
    console.error('Error updating scheduled report:', error)
    return NextResponse.json(
      { error: 'Failed to update scheduled report' },
      { status: 500 }
    )
  }
}

// DELETE /api/scheduled-reports/[id] - Delete a scheduled report
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check role
    if (user.role !== 'super_admin' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const existing = await prisma.scheduled_reports.findFirst({
      where: {
        id,
        merchant_id: user.merchantId || ''
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    await prisma.scheduled_reports.delete({ where: { id } })

    // Log the action
    await logAuditEvent(
      user.id,
      user.merchantId || '',
      'delete_scheduled_report',
      'scheduled_report',
      id,
      { name: existing.name },
      request
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting scheduled report:', error)
    return NextResponse.json(
      { error: 'Failed to delete scheduled report' },
      { status: 500 }
    )
  }
}
