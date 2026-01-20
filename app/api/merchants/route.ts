import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getAccessibleMerchants } from '@/lib/auth'

// GET /api/merchants - List merchants user can access
export async function GET(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const merchants = await getAccessibleMerchants(user)

    return NextResponse.json({
      merchants: merchants.map(m => ({
        id: m.id,
        name: m.name,
        industry: m.industry,
        cashbackPercent: m.cashback_percent ? Number(m.cashback_percent) : null,
        isCurrent: m.id === user.merchantId
      })),
      currentMerchantId: user.merchantId,
      userRole: user.role
    })
  } catch (error) {
    console.error('Error fetching merchants:', error)
    return NextResponse.json({
      error: 'Failed to fetch merchants',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
