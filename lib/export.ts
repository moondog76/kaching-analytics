import { MerchantMetrics, CompetitorData } from './types'
import { format } from 'date-fns'

export interface ExportData {
  merchantData: MerchantMetrics
  competitors: CompetitorData[]
  historical: MerchantMetrics[]
  dateRange: {
    startDate: string
    endDate: string
  }
}

/**
 * Convert data to CSV format
 */
export function generateCSV(data: ExportData): string {
  const lines: string[] = []

  // Header info
  lines.push(`# KaChing Analytics Export`)
  lines.push(`# Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`)
  lines.push(`# Date Range: ${data.dateRange.startDate} to ${data.dateRange.endDate}`)
  lines.push('')

  // Merchant Summary
  lines.push('## Merchant Summary')
  lines.push('Metric,Value')
  lines.push(`Merchant Name,${data.merchantData.merchant_name}`)
  lines.push(`Total Transactions,${data.merchantData.transactions}`)
  lines.push(`Total Revenue (RON),${(data.merchantData.revenue / 100).toFixed(2)}`)
  lines.push(`Total Customers,${data.merchantData.customers}`)
  lines.push(`Cashback Paid (RON),${(data.merchantData.cashback_paid / 100).toFixed(2)}`)
  lines.push(`Cashback Rate,${data.merchantData.cashback_percent}%`)
  lines.push(`Average Transaction (RON),${data.merchantData.avg_transaction.toFixed(2)}`)
  lines.push('')

  // Historical Data
  if (data.historical && data.historical.length > 0) {
    lines.push('## Historical Data')
    lines.push('Date,Transactions,Revenue (RON),Customers,Cashback Paid (RON),Avg Transaction (RON)')
    data.historical.forEach(day => {
      lines.push(
        `${day.period},${day.transactions},${(day.revenue / 100).toFixed(2)},${day.customers},${(day.cashback_paid / 100).toFixed(2)},${day.avg_transaction.toFixed(2)}`
      )
    })
    lines.push('')
  }

  // Competitor Data
  if (data.competitors && data.competitors.length > 0) {
    lines.push('## Competitor Comparison')
    lines.push('Rank,Merchant,Transactions,Revenue (RON),Customers,Cashback Rate,Status')
    data.competitors.forEach(comp => {
      lines.push(
        `${comp.rank},${comp.merchant_name},${comp.transactions},${(comp.revenue / 100).toFixed(2)},${comp.customers},${comp.cashback_percent}%,${comp.campaign_active ? 'Active' : 'Inactive'}`
      )
    })
  }

  return lines.join('\n')
}

/**
 * Generate Excel-compatible XML (SpreadsheetML)
 * This format is supported by Excel, LibreOffice, and Google Sheets
 */
export function generateExcel(data: ExportData): string {
  const escapeXml = (str: string | number) => {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Header">
      <Font ss:Bold="1" ss:Size="12"/>
      <Interior ss:Color="#E2E8F0" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="Title">
      <Font ss:Bold="1" ss:Size="14"/>
    </Style>
    <Style ss:ID="Currency">
      <NumberFormat ss:Format="#,##0.00"/>
    </Style>
    <Style ss:ID="Percent">
      <NumberFormat ss:Format="0.0%"/>
    </Style>
  </Styles>
`

  // Summary Sheet
  xml += `  <Worksheet ss:Name="Summary">
    <Table>
      <Column ss:Width="150"/>
      <Column ss:Width="150"/>
      <Row>
        <Cell ss:StyleID="Title"><Data ss:Type="String">KaChing Analytics Report</Data></Cell>
      </Row>
      <Row>
        <Cell><Data ss:Type="String">Generated:</Data></Cell>
        <Cell><Data ss:Type="String">${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}</Data></Cell>
      </Row>
      <Row>
        <Cell><Data ss:Type="String">Date Range:</Data></Cell>
        <Cell><Data ss:Type="String">${data.dateRange.startDate} to ${data.dateRange.endDate}</Data></Cell>
      </Row>
      <Row/>
      <Row>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Metric</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Value</Data></Cell>
      </Row>
      <Row>
        <Cell><Data ss:Type="String">Merchant Name</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(data.merchantData.merchant_name)}</Data></Cell>
      </Row>
      <Row>
        <Cell><Data ss:Type="String">Total Transactions</Data></Cell>
        <Cell><Data ss:Type="Number">${data.merchantData.transactions}</Data></Cell>
      </Row>
      <Row>
        <Cell><Data ss:Type="String">Total Revenue (RON)</Data></Cell>
        <Cell ss:StyleID="Currency"><Data ss:Type="Number">${(data.merchantData.revenue / 100).toFixed(2)}</Data></Cell>
      </Row>
      <Row>
        <Cell><Data ss:Type="String">Total Customers</Data></Cell>
        <Cell><Data ss:Type="Number">${data.merchantData.customers}</Data></Cell>
      </Row>
      <Row>
        <Cell><Data ss:Type="String">Cashback Paid (RON)</Data></Cell>
        <Cell ss:StyleID="Currency"><Data ss:Type="Number">${(data.merchantData.cashback_paid / 100).toFixed(2)}</Data></Cell>
      </Row>
      <Row>
        <Cell><Data ss:Type="String">Cashback Rate</Data></Cell>
        <Cell><Data ss:Type="String">${data.merchantData.cashback_percent}%</Data></Cell>
      </Row>
      <Row>
        <Cell><Data ss:Type="String">Average Transaction (RON)</Data></Cell>
        <Cell ss:StyleID="Currency"><Data ss:Type="Number">${data.merchantData.avg_transaction.toFixed(2)}</Data></Cell>
      </Row>
    </Table>
  </Worksheet>
`

  // Historical Data Sheet
  if (data.historical && data.historical.length > 0) {
    xml += `  <Worksheet ss:Name="Historical Data">
    <Table>
      <Column ss:Width="100"/>
      <Column ss:Width="100"/>
      <Column ss:Width="120"/>
      <Column ss:Width="100"/>
      <Column ss:Width="120"/>
      <Column ss:Width="120"/>
      <Row>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Date</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Transactions</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Revenue (RON)</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Customers</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Cashback (RON)</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Avg Transaction</Data></Cell>
      </Row>
`
    data.historical.forEach(day => {
      xml += `      <Row>
        <Cell><Data ss:Type="String">${day.period}</Data></Cell>
        <Cell><Data ss:Type="Number">${day.transactions}</Data></Cell>
        <Cell ss:StyleID="Currency"><Data ss:Type="Number">${(day.revenue / 100).toFixed(2)}</Data></Cell>
        <Cell><Data ss:Type="Number">${day.customers}</Data></Cell>
        <Cell ss:StyleID="Currency"><Data ss:Type="Number">${(day.cashback_paid / 100).toFixed(2)}</Data></Cell>
        <Cell ss:StyleID="Currency"><Data ss:Type="Number">${day.avg_transaction.toFixed(2)}</Data></Cell>
      </Row>
`
    })
    xml += `    </Table>
  </Worksheet>
`
  }

  // Competitors Sheet
  if (data.competitors && data.competitors.length > 0) {
    xml += `  <Worksheet ss:Name="Competitors">
    <Table>
      <Column ss:Width="50"/>
      <Column ss:Width="120"/>
      <Column ss:Width="100"/>
      <Column ss:Width="120"/>
      <Column ss:Width="100"/>
      <Column ss:Width="100"/>
      <Column ss:Width="80"/>
      <Row>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Rank</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Merchant</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Transactions</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Revenue (RON)</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Customers</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Cashback %</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Status</Data></Cell>
      </Row>
`
    data.competitors.forEach(comp => {
      xml += `      <Row>
        <Cell><Data ss:Type="Number">${comp.rank}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(comp.merchant_name)}</Data></Cell>
        <Cell><Data ss:Type="Number">${comp.transactions}</Data></Cell>
        <Cell ss:StyleID="Currency"><Data ss:Type="Number">${(comp.revenue / 100).toFixed(2)}</Data></Cell>
        <Cell><Data ss:Type="Number">${comp.customers}</Data></Cell>
        <Cell><Data ss:Type="String">${comp.cashback_percent}%</Data></Cell>
        <Cell><Data ss:Type="String">${comp.campaign_active ? 'Active' : 'Inactive'}</Data></Cell>
      </Row>
`
    })
    xml += `    </Table>
  </Worksheet>
`
  }

  xml += `</Workbook>`

  return xml
}

/**
 * Generate JSON export
 */
export function generateJSON(data: ExportData): string {
  return JSON.stringify({
    exportInfo: {
      generatedAt: new Date().toISOString(),
      dateRange: data.dateRange
    },
    summary: {
      merchantName: data.merchantData.merchant_name,
      transactions: data.merchantData.transactions,
      revenue: data.merchantData.revenue / 100,
      customers: data.merchantData.customers,
      cashbackPaid: data.merchantData.cashback_paid / 100,
      cashbackPercent: data.merchantData.cashback_percent,
      avgTransaction: data.merchantData.avg_transaction
    },
    historical: data.historical.map(day => ({
      date: day.period,
      transactions: day.transactions,
      revenue: day.revenue / 100,
      customers: day.customers,
      cashbackPaid: day.cashback_paid / 100,
      avgTransaction: day.avg_transaction
    })),
    competitors: data.competitors.map(comp => ({
      rank: comp.rank,
      merchantName: comp.merchant_name,
      transactions: comp.transactions,
      revenue: comp.revenue / 100,
      customers: comp.customers,
      cashbackPercent: comp.cashback_percent,
      isActive: comp.campaign_active,
      isYou: comp.isYou
    }))
  }, null, 2)
}
