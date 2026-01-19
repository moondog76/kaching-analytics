import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { detectAnomalies } from '@/lib/ai/anomaly-detector'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    
    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId required' }, { status: 400 })
    }
    
    // Verify merchant exists
    const merchant = await prisma.merchants.findUnique({
      where: { id: merchantId }
    })
    
    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 })
    }
    
    const anomalies = await detectAnomalies(merchantId)
    
    return NextResponse.json({
      merchantId,
      merchantName: merchant.name,
      anomalies,
      count: anomalies.length,
      detectedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error detecting anomalies:', error)
    return NextResponse.json({ error: 'Failed to detect anomalies' }, { status: 500 })
  }
}
