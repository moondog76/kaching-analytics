import { NextRequest, NextResponse } from 'next/server'
import { DataLoader } from '@/lib/data-loader'
import { getCurrentUser, logAuditEvent } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const { searchParams } = new URL(request.url)
    const requestedMerchantId = searchParams.get('merchantId')

    if (!user) {
      // Return demo data if not logged in
      const demoData = DataLoader.loadDemoData()
      return NextResponse.json(demoData)
    }

    // Determine which merchant to load
    const merchantId = requestedMerchantId || user.merchantId

    if (!merchantId) {
      // User not assigned to a merchant - return demo data
      const demoData = DataLoader.loadDemoData()
      return NextResponse.json(demoData)
    }

    // Check permission for cross-merchant access
    if (requestedMerchantId && requestedMerchantId !== user.merchantId) {
      if (user.role !== 'super_admin' && user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Forbidden', message: 'You do not have access to this merchant' },
          { status: 403 }
        )
      }
    }

    // Load from database using merchantId
    const dbData = await DataLoader.loadMerchantDataById(merchantId)

    if (dbData) {
      // Log the access
      logAuditEvent(
        user.id,
        merchantId,
        'view_dashboard',
        'dashboard',
        undefined,
        undefined,
        request
      ).catch(() => {})

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
