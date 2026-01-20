import { NextRequest, NextResponse } from 'next/server'
import {
  detectCSVStructure,
  importTransactions,
  importDailyMetrics,
  aggregateTransactionsToMetrics,
} from '@/lib/csv-importer'

export const maxDuration = 300 // 5 minutes for large imports

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const action = formData.get('action') as string
    const clearExisting = formData.get('clearExisting') === 'true'
    const targetTable = formData.get('targetTable') as string | null
    const columnMappings = formData.get('columnMappings')
      ? JSON.parse(formData.get('columnMappings') as string)
      : null

    // Action: detect - analyze CSV structure
    if (action === 'detect' && file) {
      const csvContent = await file.text()
      const structure = detectCSVStructure(csvContent)
      return NextResponse.json({
        success: true,
        ...structure,
        rowCount: csvContent.split('\n').length - 1,
      })
    }

    // Action: import - perform the import
    if (action === 'import' && file && targetTable && columnMappings) {
      const csvContent = await file.text()

      let result
      if (targetTable === 'transactions') {
        result = await importTransactions(csvContent, columnMappings, {
          clearExisting,
          batchSize: 1000,
        })
      } else if (targetTable === 'daily_metrics') {
        result = await importDailyMetrics(csvContent, columnMappings, {
          clearExisting,
          batchSize: 1000,
        })
      } else {
        return NextResponse.json(
          { success: false, error: 'Unsupported target table' },
          { status: 400 }
        )
      }

      return NextResponse.json({ success: true, result })
    }

    // Action: aggregate - compute daily_metrics from transactions
    if (action === 'aggregate') {
      const result = await aggregateTransactionsToMetrics({
        clearExisting,
      })
      return NextResponse.json({ success: true, result })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action or missing parameters' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
