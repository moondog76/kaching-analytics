import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { DataLoader } from '@/lib/data-loader'
import { generateHTMLReport, getReportDateRange, calculateNextScheduledTime, ReportFrequency } from '@/lib/reports'
import { sendEmail } from '@/lib/email'
import { format } from 'date-fns'

// POST /api/scheduled-reports/send - Process and send due scheduled reports
// This endpoint can be called by a cron job or manual trigger
export async function POST(request: NextRequest) {
  try {
    // Optional: Check for API key authentication for cron jobs
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // If cron secret is set, require it
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()

    // Find all active reports that are due
    const dueReports = await prisma.scheduled_reports.findMany({
      where: {
        is_active: true,
        next_scheduled_at: {
          lte: now
        }
      }
    })

    if (dueReports.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No reports due',
        processed: 0
      })
    }

    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      details: [] as Array<{ id: string; name: string; status: string; error?: string }>
    }

    for (const report of dueReports) {
      try {
        // Get date range based on frequency
        const { startDate, endDate } = getReportDateRange(report.frequency as ReportFrequency)

        // Load merchant data
        const data = await DataLoader.loadMerchantDataById(report.merchant_id, {
          startDate,
          endDate
        })

        if (!data) {
          results.failed++
          results.details.push({
            id: report.id,
            name: report.name,
            status: 'failed',
            error: 'Failed to load merchant data'
          })
          continue
        }

        // Generate report HTML
        const reportData = {
          merchantData: data.merchant,
          competitors: report.include_competitors ? data.competitors : [],
          historical: report.include_historical ? data.historical : [],
          dateRange: data.dateRange,
          generatedAt: new Date().toISOString()
        }

        const html = generateHTMLReport(reportData, report.name)

        // Send email to all recipients
        const emailResult = await sendEmail({
          to: report.recipients,
          subject: `${report.name} - ${format(new Date(), 'MMM d, yyyy')}`,
          html
        })

        if (emailResult.success) {
          // Update report with last sent time and next scheduled time
          const nextScheduledAt = calculateNextScheduledTime(
            report.frequency as ReportFrequency,
            now
          )

          await prisma.scheduled_reports.update({
            where: { id: report.id },
            data: {
              last_sent_at: now,
              next_scheduled_at: nextScheduledAt
            }
          })

          results.sent++
          results.details.push({
            id: report.id,
            name: report.name,
            status: 'sent'
          })
        } else {
          results.failed++
          results.details.push({
            id: report.id,
            name: report.name,
            status: 'failed',
            error: emailResult.error
          })
        }

        results.processed++
      } catch (error) {
        results.failed++
        results.details.push({
          id: report.id,
          name: report.name,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      ...results
    })
  } catch (error) {
    console.error('Error processing scheduled reports:', error)
    return NextResponse.json(
      { error: 'Failed to process scheduled reports' },
      { status: 500 }
    )
  }
}

// GET /api/scheduled-reports/send - Manual trigger with report ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reportId = searchParams.get('id')

    if (!reportId) {
      return NextResponse.json(
        { error: 'Report ID required' },
        { status: 400 }
      )
    }

    const report = await prisma.scheduled_reports.findUnique({
      where: { id: reportId }
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // Get date range based on frequency
    const { startDate, endDate } = getReportDateRange(report.frequency as ReportFrequency)

    // Load merchant data
    const data = await DataLoader.loadMerchantDataById(report.merchant_id, {
      startDate,
      endDate
    })

    if (!data) {
      return NextResponse.json(
        { error: 'Failed to load merchant data' },
        { status: 500 }
      )
    }

    // Generate report HTML
    const reportData = {
      merchantData: data.merchant,
      competitors: report.include_competitors ? data.competitors : [],
      historical: report.include_historical ? data.historical : [],
      dateRange: data.dateRange,
      generatedAt: new Date().toISOString()
    }

    const html = generateHTMLReport(reportData, report.name)

    // Send email to all recipients
    const emailResult = await sendEmail({
      to: report.recipients,
      subject: `${report.name} - ${format(new Date(), 'MMM d, yyyy')}`,
      html
    })

    if (emailResult.success) {
      // Update last sent time (but don't change next scheduled time for manual sends)
      await prisma.scheduled_reports.update({
        where: { id: report.id },
        data: { last_sent_at: new Date() }
      })

      return NextResponse.json({
        success: true,
        message: 'Report sent successfully',
        messageId: emailResult.messageId
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to send email', details: emailResult.error },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error sending report:', error)
    return NextResponse.json(
      { error: 'Failed to send report' },
      { status: 500 }
    )
  }
}
