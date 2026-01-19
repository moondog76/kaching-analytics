import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { DataLoader } from '@/lib/data-loader'
import { logAuditEvent } from '@/lib/security/audit'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      // Return demo data if not logged in
      const demoData = DataLoader.loadDemoData()
      return NextResponse.json(demoData)
    }

    // Load from database
    const dbData = await DataLoader.loadMerchantDataByEmail(session.user.email)
    
    if (dbData) {
    logAuditEvent({ userId: session.user.email || "unknown", merchantId: undefined, action: "view_dashboard", resource: "merchant_data" }).catch(() => {})
      return NextResponse.json(dbData)
    }
    
    // Fallback to demo
    const demoData = DataLoader.loadDemoData()
    return NextResponse.json(demoData)
  } catch (error) {
    console.error('Error in merchant-data API:', error)
    // Return demo data on error
    const demoData = DataLoader.loadDemoData()
    return NextResponse.json(demoData)
  }
}
