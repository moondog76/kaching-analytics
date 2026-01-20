import { parse } from 'csv-parse/sync'
import { prisma } from './db'
import { Prisma } from '@prisma/client'

export interface ImportResult {
  success: boolean
  table: string
  totalRows: number
  importedRows: number
  skippedRows: number
  errors: string[]
  duration: number
}

export interface ImportProgress {
  phase: 'parsing' | 'validating' | 'clearing' | 'importing' | 'aggregating' | 'complete'
  progress: number
  message: string
}

type ProgressCallback = (progress: ImportProgress) => void

// Auto-detect CSV structure and determine target table
export function detectCSVStructure(csvContent: string): {
  columns: string[]
  sampleRows: Record<string, string>[]
  suggestedTable: 'transactions' | 'daily_metrics' | 'merchants' | 'unknown'
  mappings: Record<string, string>
} {
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  }) as Record<string, string>[]

  const columns = records.length > 0 ? Object.keys(records[0]) : []
  const sampleRows = records.slice(0, 5)

  // Detect table type based on columns
  const columnLower = columns.map(c => c.toLowerCase())

  let suggestedTable: 'transactions' | 'daily_metrics' | 'merchants' | 'unknown' = 'unknown'
  const mappings: Record<string, string> = {}

  // Check for transactions table
  const transactionIndicators = ['amount', 'amount_cents', 'transaction_date', 'customer_id', 'user_id', 'cashback']
  const metricsIndicators = ['transactions_count', 'revenue', 'unique_customers', 'cashback_paid']
  const merchantIndicators = ['merchant_name', 'industry', 'cashback_percent']

  const hasTransactionColumns = transactionIndicators.some(ind =>
    columnLower.some(col => col.includes(ind))
  )
  const hasMetricsColumns = metricsIndicators.some(ind =>
    columnLower.some(col => col.includes(ind))
  )
  const hasMerchantColumns = merchantIndicators.some(ind =>
    columnLower.some(col => col.includes(ind))
  )

  if (hasMetricsColumns) {
    suggestedTable = 'daily_metrics'
    // Auto-map columns
    for (const col of columns) {
      const lower = col.toLowerCase()
      if (lower.includes('merchant') && lower.includes('id')) mappings[col] = 'merchant_id'
      else if (lower.includes('merchant') && lower.includes('name')) mappings[col] = 'merchant_name'
      else if (lower === 'date' || lower.includes('metric_date')) mappings[col] = 'date'
      else if (lower.includes('transaction') && lower.includes('count')) mappings[col] = 'transactions_count'
      else if (lower === 'revenue' || lower.includes('total_revenue')) mappings[col] = 'revenue'
      else if (lower.includes('unique') && lower.includes('customer')) mappings[col] = 'unique_customers'
      else if (lower.includes('cashback') && lower.includes('paid')) mappings[col] = 'cashback_paid'
    }
  } else if (hasTransactionColumns) {
    suggestedTable = 'transactions'
    for (const col of columns) {
      const lower = col.toLowerCase()
      if (lower.includes('merchant') && lower.includes('id')) mappings[col] = 'merchant_id'
      else if (lower === 'merchant_name' || lower === 'merchant') mappings[col] = 'merchant_name'
      else if (lower.includes('transaction') && lower.includes('date')) mappings[col] = 'transaction_date'
      else if (lower === 'date') mappings[col] = 'transaction_date'
      else if (lower === 'amount' || lower.includes('transaction_amount')) mappings[col] = 'amount'
      else if (lower === 'amount_cents') mappings[col] = 'amount_cents'
      else if (lower.includes('customer') && lower.includes('id')) mappings[col] = 'customer_id'
      else if (lower === 'user_id') mappings[col] = 'customer_id'
      else if (lower.includes('cashback') && lower.includes('amount')) mappings[col] = 'cashback_amount'
      else if (lower === 'category') mappings[col] = 'category'
    }
  } else if (hasMerchantColumns) {
    suggestedTable = 'merchants'
    for (const col of columns) {
      const lower = col.toLowerCase()
      if (lower === 'name' || lower.includes('merchant_name')) mappings[col] = 'name'
      else if (lower === 'industry') mappings[col] = 'industry'
      else if (lower.includes('cashback') && lower.includes('percent')) mappings[col] = 'cashback_percent'
    }
  }

  return { columns, sampleRows, suggestedTable, mappings }
}

// Import transactions from CSV
export async function importTransactions(
  csvContent: string,
  columnMappings: Record<string, string>,
  options: {
    clearExisting?: boolean
    merchantId?: string // If all transactions belong to one merchant
    batchSize?: number
    onProgress?: ProgressCallback
  } = {}
): Promise<ImportResult> {
  const startTime = Date.now()
  const errors: string[] = []
  const batchSize = options.batchSize || 1000

  const progress = options.onProgress || (() => {})

  progress({ phase: 'parsing', progress: 0, message: 'Parsing CSV...' })

  let records: Record<string, string>[]
  try {
    records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    })
  } catch (e) {
    return {
      success: false,
      table: 'transactions',
      totalRows: 0,
      importedRows: 0,
      skippedRows: 0,
      errors: [`CSV parsing error: ${e}`],
      duration: Date.now() - startTime,
    }
  }

  progress({ phase: 'validating', progress: 10, message: `Validating ${records.length} rows...` })

  // Get or create merchant mapping
  const merchantMap = new Map<string, string>()

  if (options.merchantId) {
    // All transactions go to one merchant
    merchantMap.set('default', options.merchantId)
  } else {
    // Extract unique merchant names/IDs from data
    const merchantCol = Object.keys(columnMappings).find(k =>
      columnMappings[k] === 'merchant_id' || columnMappings[k] === 'merchant_name'
    )

    if (merchantCol) {
      const uniqueMerchants = [...new Set(records.map(r => r[merchantCol]).filter(Boolean))]

      // Check if these are UUIDs or names
      const isUUID = uniqueMerchants[0]?.match(/^[0-9a-f-]{36}$/i)

      if (isUUID) {
        // Verify merchants exist
        const existing = await prisma.merchants.findMany({
          where: { id: { in: uniqueMerchants } },
          select: { id: true }
        })
        existing.forEach(m => merchantMap.set(m.id, m.id))
      } else {
        // Look up or create merchants by name
        for (const name of uniqueMerchants) {
          let merchant = await prisma.merchants.findFirst({ where: { name } })
          if (!merchant) {
            merchant = await prisma.merchants.create({
              data: { name, industry: 'Retail' }
            })
          }
          merchantMap.set(name, merchant.id)
        }
      }
    }
  }

  progress({ phase: 'clearing', progress: 20, message: 'Preparing database...' })

  if (options.clearExisting) {
    // Clear existing transactions (and related metrics)
    await prisma.daily_metrics.deleteMany({})
    await prisma.transactions.deleteMany({})
  }

  progress({ phase: 'importing', progress: 30, message: 'Importing transactions...' })

  // Transform and batch insert
  let importedRows = 0
  let skippedRows = 0

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize)
    const transactionsToInsert: Prisma.transactionsCreateManyInput[] = []

    for (const record of batch) {
      try {
        // Map columns
        const merchantKey = Object.keys(columnMappings).find(k =>
          columnMappings[k] === 'merchant_id' || columnMappings[k] === 'merchant_name'
        )
        const dateKey = Object.keys(columnMappings).find(k => columnMappings[k] === 'transaction_date')
        const amountKey = Object.keys(columnMappings).find(k => columnMappings[k] === 'amount')
        const amountCentsKey = Object.keys(columnMappings).find(k => columnMappings[k] === 'amount_cents')
        const customerKey = Object.keys(columnMappings).find(k => columnMappings[k] === 'customer_id')
        const cashbackKey = Object.keys(columnMappings).find(k => columnMappings[k] === 'cashback_amount')
        const categoryKey = Object.keys(columnMappings).find(k => columnMappings[k] === 'category')

        const merchantValue = merchantKey ? record[merchantKey] : 'default'
        const merchantId = merchantMap.get(merchantValue) || options.merchantId

        if (!merchantId) {
          skippedRows++
          continue
        }

        const dateValue = dateKey ? record[dateKey] : null

        // Handle amount in euros or cents
        let amountValue: number | null = null
        if (amountKey && record[amountKey]) {
          amountValue = parseFloat(record[amountKey]) || 0
        } else if (amountCentsKey && record[amountCentsKey]) {
          // Convert cents to euros
          amountValue = (parseFloat(record[amountCentsKey]) || 0) / 100
        }

        if (!dateValue || amountValue === null) {
          skippedRows++
          continue
        }

        transactionsToInsert.push({
          merchant_id: merchantId,
          transaction_date: new Date(dateValue),
          amount: new Prisma.Decimal(amountValue),
          customer_id: customerKey ? record[customerKey] : null,
          cashback_amount: cashbackKey ? new Prisma.Decimal(parseFloat(record[cashbackKey]) || 0) : null,
          category: categoryKey ? record[categoryKey] : null,
        })
      } catch (e) {
        skippedRows++
        if (errors.length < 10) {
          errors.push(`Row ${i + batch.indexOf(record)}: ${e}`)
        }
      }
    }

    if (transactionsToInsert.length > 0) {
      await prisma.transactions.createMany({
        data: transactionsToInsert,
        skipDuplicates: true,
      })
      importedRows += transactionsToInsert.length
    }

    const progressPercent = 30 + Math.floor((i / records.length) * 50)
    progress({
      phase: 'importing',
      progress: progressPercent,
      message: `Imported ${importedRows} of ${records.length} transactions...`
    })
  }

  progress({ phase: 'complete', progress: 100, message: 'Import complete!' })

  return {
    success: errors.length === 0,
    table: 'transactions',
    totalRows: records.length,
    importedRows,
    skippedRows,
    errors,
    duration: Date.now() - startTime,
  }
}

// Import daily metrics directly
export async function importDailyMetrics(
  csvContent: string,
  columnMappings: Record<string, string>,
  options: {
    clearExisting?: boolean
    batchSize?: number
    onProgress?: ProgressCallback
  } = {}
): Promise<ImportResult> {
  const startTime = Date.now()
  const errors: string[] = []
  const batchSize = options.batchSize || 1000
  const progress = options.onProgress || (() => {})

  progress({ phase: 'parsing', progress: 0, message: 'Parsing CSV...' })

  let records: Record<string, string>[]
  try {
    records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    })
  } catch (e) {
    return {
      success: false,
      table: 'daily_metrics',
      totalRows: 0,
      importedRows: 0,
      skippedRows: 0,
      errors: [`CSV parsing error: ${e}`],
      duration: Date.now() - startTime,
    }
  }

  progress({ phase: 'validating', progress: 10, message: `Validating ${records.length} rows...` })

  // Build merchant map
  const merchantMap = new Map<string, string>()
  const merchantNameCol = Object.keys(columnMappings).find(k =>
    columnMappings[k] === 'merchant_name'
  )
  const merchantIdCol = Object.keys(columnMappings).find(k =>
    columnMappings[k] === 'merchant_id'
  )

  if (merchantNameCol) {
    const uniqueNames = [...new Set(records.map(r => r[merchantNameCol]).filter(Boolean))]
    for (const name of uniqueNames) {
      let merchant = await prisma.merchants.findFirst({ where: { name } })
      if (!merchant) {
        merchant = await prisma.merchants.create({ data: { name, industry: 'Retail' } })
      }
      merchantMap.set(name, merchant.id)
    }
  }

  if (options.clearExisting) {
    progress({ phase: 'clearing', progress: 20, message: 'Clearing existing metrics...' })
    await prisma.daily_metrics.deleteMany({})
  }

  progress({ phase: 'importing', progress: 30, message: 'Importing metrics...' })

  let importedRows = 0
  let skippedRows = 0

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize)
    const metricsToInsert: Prisma.daily_metricsCreateManyInput[] = []

    for (const record of batch) {
      try {
        const dateCol = Object.keys(columnMappings).find(k => columnMappings[k] === 'date')
        const txCountCol = Object.keys(columnMappings).find(k => columnMappings[k] === 'transactions_count')
        const revenueCol = Object.keys(columnMappings).find(k => columnMappings[k] === 'revenue')
        const customersCol = Object.keys(columnMappings).find(k => columnMappings[k] === 'unique_customers')
        const cashbackCol = Object.keys(columnMappings).find(k => columnMappings[k] === 'cashback_paid')

        let merchantId: string | undefined
        if (merchantIdCol && record[merchantIdCol]) {
          merchantId = record[merchantIdCol]
        } else if (merchantNameCol && record[merchantNameCol]) {
          merchantId = merchantMap.get(record[merchantNameCol])
        }

        if (!merchantId || !dateCol || !record[dateCol]) {
          skippedRows++
          continue
        }

        metricsToInsert.push({
          merchant_id: merchantId,
          date: new Date(record[dateCol]),
          transactions_count: txCountCol ? parseInt(record[txCountCol]) || 0 : 0,
          revenue: revenueCol ? new Prisma.Decimal(parseFloat(record[revenueCol]) || 0) : new Prisma.Decimal(0),
          unique_customers: customersCol ? parseInt(record[customersCol]) || 0 : 0,
          cashback_paid: cashbackCol ? new Prisma.Decimal(parseFloat(record[cashbackCol]) || 0) : new Prisma.Decimal(0),
        })
      } catch (e) {
        skippedRows++
        if (errors.length < 10) errors.push(`Row ${i}: ${e}`)
      }
    }

    if (metricsToInsert.length > 0) {
      await prisma.daily_metrics.createMany({
        data: metricsToInsert,
        skipDuplicates: true,
      })
      importedRows += metricsToInsert.length
    }

    const progressPercent = 30 + Math.floor((i / records.length) * 60)
    progress({ phase: 'importing', progress: progressPercent, message: `Imported ${importedRows} metrics...` })
  }

  progress({ phase: 'complete', progress: 100, message: 'Import complete!' })

  return {
    success: errors.length === 0,
    table: 'daily_metrics',
    totalRows: records.length,
    importedRows,
    skippedRows,
    errors,
    duration: Date.now() - startTime,
  }
}

// Aggregate transactions into daily_metrics
export async function aggregateTransactionsToMetrics(
  options: {
    clearExisting?: boolean
    onProgress?: ProgressCallback
  } = {}
): Promise<ImportResult> {
  const startTime = Date.now()
  const progress = options.onProgress || (() => {})

  progress({ phase: 'aggregating', progress: 0, message: 'Starting aggregation...' })

  if (options.clearExisting) {
    await prisma.daily_metrics.deleteMany({})
  }

  // Get all merchants
  const merchants = await prisma.merchants.findMany({ select: { id: true } })

  let totalImported = 0

  for (let i = 0; i < merchants.length; i++) {
    const merchant = merchants[i]

    // Aggregate transactions by date for this merchant
    const aggregated = await prisma.transactions.groupBy({
      by: ['transaction_date'],
      where: { merchant_id: merchant.id },
      _count: { id: true },
      _sum: { amount: true, cashback_amount: true },
    })

    // Get unique customers per day
    for (const day of aggregated) {
      const uniqueCustomers = await prisma.transactions.groupBy({
        by: ['customer_id'],
        where: {
          merchant_id: merchant.id,
          transaction_date: day.transaction_date,
          customer_id: { not: null }
        },
      })

      await prisma.daily_metrics.upsert({
        where: {
          merchant_id_date: {
            merchant_id: merchant.id,
            date: day.transaction_date,
          }
        },
        create: {
          merchant_id: merchant.id,
          date: day.transaction_date,
          transactions_count: day._count.id,
          revenue: day._sum.amount || new Prisma.Decimal(0),
          unique_customers: uniqueCustomers.length,
          cashback_paid: day._sum.cashback_amount || new Prisma.Decimal(0),
        },
        update: {
          transactions_count: day._count.id,
          revenue: day._sum.amount || new Prisma.Decimal(0),
          unique_customers: uniqueCustomers.length,
          cashback_paid: day._sum.cashback_amount || new Prisma.Decimal(0),
        },
      })
      totalImported++
    }

    const progressPercent = Math.floor((i / merchants.length) * 100)
    progress({
      phase: 'aggregating',
      progress: progressPercent,
      message: `Processed ${i + 1} of ${merchants.length} merchants...`
    })
  }

  progress({ phase: 'complete', progress: 100, message: 'Aggregation complete!' })

  return {
    success: true,
    table: 'daily_metrics',
    totalRows: totalImported,
    importedRows: totalImported,
    skippedRows: 0,
    errors: [],
    duration: Date.now() - startTime,
  }
}
