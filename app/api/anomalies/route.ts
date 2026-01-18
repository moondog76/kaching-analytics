import { logAuditEvent } from '@/lib/security/audit';
import { NextRequest, NextResponse } from 'next/server'
import { AnomalyDetector } from '@/lib/anomaly-detector'
import { DataLoader } from '@/lib/data-loader'


export async function GET(request: NextRequest) {
  try {
    // Load data
    const data = DataLoader.loadDemoData()
    const { historical } = DataLoader.processTransactions([])
    
    // Detect anomalies
    const anomalies = await AnomalyDetector.detectAnomalies(
      data.carrefour,
      historical,
      new Date()
    )
    
    // Generate alerts
    const alerts = await AnomalyDetector.generateAlerts(
      anomalies,
      data.carrefour.merchant_name
    )
    
    return NextResponse.json({
      success: true,
      anomalies,
      alerts,
      detected_at: new Date().toISOString(),
      summary: {
        total_anomalies: anomalies.length,
        critical_alerts: alerts.filter(a => a.severity === 'critical').length,
        warning_alerts: alerts.filter(a => a.severity === 'warning').length
      }
    })
    
  } catch (error) {
    console.error('Anomaly detection error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to detect anomalies',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
