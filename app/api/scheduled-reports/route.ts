import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser, logAuditEvent } from '@/lib/auth'
import { calculateNextScheduledTime, ReportFrequency } from '@/lib/reports'

// GET /api/scheduled-reports - List scheduled reports for merchant
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reports = await prisma.scheduled_reports.findMany({
      where: {
        merchant_id: user.merchantId || ''
      },
      orderBy: { created_at: 'desc' }
    })

    return NextResponse.json({ reports })
  } catch (error) {
    console.error('Error fetching scheduled reports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch scheduled reports' },
      { status: 500 }
    )
  }
}

// POST /api/scheduled-reports - Create a new scheduled report
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.merchantId) {
      return NextResponse.json(
        { error: 'No merchant associated with user' },
        { status: 400 }
      )
    }

    // Check role - only admin+ can create scheduled reports
    if (user.role !== 'super_admin' && user.role !== 'admin' && user.role !== 'analyst') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      frequency,
      recipients,
      includeCompetitors = true,
      includeHistorical = true
    } = body

    // Validate required fields
    if (!name || !frequency || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: 'Name, frequency, and at least one recipient are required' },
        { status: 400 }
      )
    }

    // Validate frequency
    if (!['daily', 'weekly', 'monthly'].includes(frequency)) {
      return NextResponse.json(
        { error: 'Frequency must be daily, weekly, or monthly' },
        { status: 400 }
      )
    }

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const invalidEmails = recipients.filter((email: string) => !emailRegex.test(email))
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { error: `Invalid email addresses: ${invalidEmails.join(', ')}` },
        { status: 400 }
      )
    }

    const nextScheduledAt = calculateNextScheduledTime(frequency as ReportFrequency)

    const report = await prisma.scheduled_reports.create({
      data: {
        merchant_id: user.merchantId,
        created_by: user.id,
        name,
        frequency,
        recipients,
        include_competitors: includeCompetitors,
        include_historical: includeHistorical,
        next_scheduled_at: nextScheduledAt,
        is_active: true
      }
    })

    // Log the action
    await logAuditEvent(
      user.id,
      user.merchantId,
      'create_scheduled_report',
      'scheduled_report',
      report.id,
      { name, frequency, recipients },
      request
    )

    return NextResponse.json({ report }, { status: 201 })
  } catch (error) {
    console.error('Error creating scheduled report:', error)
    return NextResponse.json(
      { error: 'Failed to create scheduled report' },
      { status: 500 }
    )
  }
}
