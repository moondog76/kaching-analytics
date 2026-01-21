import { NextRequest, NextResponse } from 'next/server'
import { DataLoader } from '@/lib/data-loader'
import { generateCSV, generateExcel, generateJSON, ExportData } from '@/lib/export'
import { getCurrentUser, logAuditEvent } from '@/lib/auth'
import { startOfDay, endOfDay, subDays, format } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const { searchParams } = new URL(request.url)

    const formatType = searchParams.get('format') || 'csv'
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')
    const requestedMerchantId = searchParams.get('merchantId')

    // Parse date range
    let startDate: Date
    let endDate: Date

    if (startDateParam && endDateParam) {
      startDate = startOfDay(new Date(startDateParam))
      endDate = endOfDay(new Date(endDateParam))

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        endDate = endOfDay(new Date())
        startDate = startOfDay(subDays(endDate, 30))
      }
    } else {
      endDate = endOfDay(new Date())
      startDate = startOfDay(subDays(endDate, 30))
    }

    // Determine merchant ID
    const merchantId = requestedMerchantId || user?.merchantId

    // Check permissions for cross-merchant access
    if (user && requestedMerchantId && requestedMerchantId !== user.merchantId) {
      if (user.role !== 'super_admin' && user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Forbidden', message: 'You do not have access to export this merchant\'s data' },
          { status: 403 }
        )
      }
    }

    // Load data
    let data: ExportData

    if (merchantId) {
      const dbData = await DataLoader.loadMerchantDataById(merchantId, {
        startDate,
        endDate
      })

      if (dbData) {
        data = {
          merchantData: dbData.carrefour,
          competitors: dbData.competitors,
          historical: dbData.historical,
          dateRange: dbData.dateRange
        }
      } else {
        // Fallback to demo
        const demoData = DataLoader.loadDemoData()
        data = {
          merchantData: demoData.carrefour,
          competitors: demoData.competitors,
          historical: demoData.historical,
          dateRange: {
            startDate: format(startDate, 'yyyy-MM-dd'),
            endDate: format(endDate, 'yyyy-MM-dd')
          }
        }
      }
    } else {
      // No merchant - return demo data
      const demoData = DataLoader.loadDemoData()
      data = {
        merchantData: demoData.carrefour,
        competitors: demoData.competitors,
        historical: demoData.historical,
        dateRange: {
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd')
        }
      }
    }

    // Log the export
    if (user && merchantId) {
      logAuditEvent(
        user.id,
        merchantId,
        'export_data',
        'export',
        undefined,
        { format: formatType, dateRange: data.dateRange },
        request
      ).catch(() => {})
    }

    // Generate export based on format
    const timestamp = format(new Date(), 'yyyy-MM-dd')
    const merchantName = data.merchantData.merchant_name.toLowerCase().replace(/\s+/g, '-')

    switch (formatType) {
      case 'csv': {
        const csv = generateCSV(data)
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="kaching-${merchantName}-${timestamp}.csv"`
          }
        })
      }

      case 'excel': {
        const excel = generateExcel(data)
        return new NextResponse(excel, {
          headers: {
            'Content-Type': 'application/vnd.ms-excel',
            'Content-Disposition': `attachment; filename="kaching-${merchantName}-${timestamp}.xls"`
          }
        })
      }

      case 'json': {
        const json = generateJSON(data)
        return new NextResponse(json, {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="kaching-${merchantName}-${timestamp}.json"`
          }
        })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid format', message: 'Supported formats: csv, excel, json' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in export API:', error)
    return NextResponse.json(
      { error: 'Export failed', message: 'An error occurred while generating the export' },
      { status: 500 }
    )
  }
}
