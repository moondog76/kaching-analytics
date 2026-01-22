'use client'

import { useState, useEffect } from 'react'
import { CashbackInsightsData, AIContextMode } from '@/types/analytics'
import CashbackHeroKPIs from './CashbackHeroKPIs'
import CampaignPerformance from './CampaignPerformance'
import CustomerProfile from './CustomerProfile'
import AIChat from '@/components/AIChat'

interface CashbackInsightsProps {
  merchantId: string
  merchantName: string
  onContextChange?: (mode: AIContextMode) => void
}

// Demo data generator for development
function generateDemoData(): CashbackInsightsData {
  return {
    heroKPIs: {
      campaignBudget: 125000,
      campaignRevenue: 487500,
      roi: 3.9,
      cac: 4.32,
      totalCampaignCustomers: 28934,
      repeatCustomers: 12456,
      newCustomers: 16478,
      repeatRate: 43.1,
      roiTrend: 8.2,
      revenueTrend: 12.5,
      customersTrend: 15.3
    },
    receiptComparison: {
      domesticAvgReceipt: 78.50,
      campaignAvgReceipt: 94.20,
      upliftPercentage: 20.0
    },
    visitComparison: {
      domesticAvgVisits: 2.3,
      campaignAvgVisits: 3.1,
      changePercentage: 34.8
    },
    distribution: {
      sectorGrowth: 28,
      newCustomers: 35,
      loyalty: 22,
      maximumReach: 15
    },
    customerProfile: {
      totalCustomers: 28934,
      genderDistribution: { male: 11574, female: 15913, unknown: 1447 },
      ageDistribution: [
        { ageMin: 18, ageMax: 24, label: '18-24', count: 4340, percentage: 15.0 },
        { ageMin: 25, ageMax: 34, label: '25-34', count: 9835, percentage: 34.0 },
        { ageMin: 35, ageMax: 44, label: '35-44', count: 7523, percentage: 26.0 },
        { ageMin: 45, ageMax: 54, label: '45-54', count: 4051, percentage: 14.0 },
        { ageMin: 55, ageMax: 64, label: '55-64', count: 2315, percentage: 8.0 },
        { ageMin: 65, ageMax: 100, label: '65+', count: 870, percentage: 3.0 }
      ],
      avgAge: 36.2,
      topSpendersCount: 2893,
      avgSpendPerTopSpender: 342.50
    },
    receiptHistory: [],
    transactionHistory: []
  }
}

export default function CashbackInsights({
  merchantId,
  merchantName,
  onContextChange
}: CashbackInsightsProps) {
  const [data, setData] = useState<CashbackInsightsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      setError(null)

      try {
        // TODO: Replace with actual API call when endpoint is ready
        // const response = await fetch(`/api/cashback-insights?merchantId=${merchantId}`)
        // const result = await response.json()
        // setData(result)

        // For now, use demo data
        await new Promise(resolve => setTimeout(resolve, 500)) // Simulate loading
        setData(generateDemoData())
      } catch (err) {
        console.error('Error loading cashback insights:', err)
        setError('Failed to load cashback insights data')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [merchantId])

  // Notify parent of context mode
  useEffect(() => {
    onContextChange?.('cashback')
  }, [onContextChange])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-2">
            <div className="w-3 h-3 bg-pluxee-ultra-green rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
            <div className="w-3 h-3 bg-pluxee-ultra-green rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="w-3 h-3 bg-pluxee-ultra-green rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
          </div>
          <p className="text-sm text-slate-500">Loading cashback insights...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="pluxee-card bg-pluxee-coral-20 border-pluxee-coral">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-pluxee-coral" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-semibold text-pluxee-deep-blue">Error Loading Data</h3>
            <p className="text-sm text-slate-600">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-pluxee-deep-blue mb-2">Cashback Insights</h1>
        <p className="text-slate-500">
          Campaign performance and customer analytics for {merchantName}
        </p>
      </div>

      {/* Hero KPIs */}
      <CashbackHeroKPIs data={data.heroKPIs} />

      {/* Campaign Performance */}
      <CampaignPerformance
        receiptComparison={data.receiptComparison}
        visitComparison={data.visitComparison}
        distribution={data.distribution}
      />

      {/* Customer Profile */}
      <CustomerProfile data={data.customerProfile} />

      {/* AI Chat - Cashback Context */}
      <AIChat
        contextMode="cashback"
        merchantName={merchantName}
        merchantId={merchantId}
      />
    </div>
  )
}
