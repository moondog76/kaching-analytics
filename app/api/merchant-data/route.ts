import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { DataLoader } from '@/lib/data-loader'

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
