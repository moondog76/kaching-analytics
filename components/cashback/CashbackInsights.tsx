'use client'

import { useState, useEffect } from 'react'
import { CashbackInsightsData, AIContextMode } from '@/types/analytics'
import CashbackHeroKPIs from './CashbackHeroKPIs'
import CampaignPerformance from './CampaignPerformance'
import CustomerProfile from './CustomerProfile'
import AIChat from '@/components/AIChat'
import ChartBuilder from '@/components/ChartBuilder'
import ForecastChart from '@/components/ForecastChart'
import CohortAnalysis from '@/components/CohortAnalysis'
import { ExecutiveBriefing } from '@/components/ai/ExecutiveBriefing'
import { AnomalyAlerts } from '@/components/ai/AnomalyAlerts'
import { RecommendationCards } from '@/components/ai/RecommendationCards'
import { MerchantMetrics, CompetitorData } from '@/lib/types'

interface CashbackInsightsProps {
  merchantId: string
  merchantName: string
  onContextChange?: (mode: AIContextMode) => void
  merchantData?: MerchantMetrics | null
  historicalData?: MerchantMetrics[]
}

type CashbackSection = 'performance' | 'trends' | 'forecast' | 'cohorts' | 'ai'

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
  onContextChange,
  merchantData,
  historicalData
}: CashbackInsightsProps) {
  const [activeSection, setActiveSection] = useState<CashbackSection>('performance')
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

      {/* Section Navigation - matching Retail Insights design */}
      <div className="pluxee-tabs">
        <button
          onClick={() => setActiveSection('performance')}
          className={`pluxee-tab ${activeSection === 'performance' ? 'pluxee-tab--active' : ''}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Campaign Performance
        </button>
        <button
          onClick={() => setActiveSection('trends')}
          className={`pluxee-tab ${activeSection === 'trends' ? 'pluxee-tab--active' : ''}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
          Trend Analysis
        </button>
        <button
          onClick={() => setActiveSection('forecast')}
          className={`pluxee-tab ${activeSection === 'forecast' ? 'pluxee-tab--active' : ''}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          Forecasting
        </button>
        <button
          onClick={() => setActiveSection('cohorts')}
          className={`pluxee-tab ${activeSection === 'cohorts' ? 'pluxee-tab--active' : ''}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Cohorts
        </button>
        <button
          onClick={() => setActiveSection('ai')}
          className={`pluxee-tab ${activeSection === 'ai' ? 'pluxee-tab--active' : ''}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          AI Insights
        </button>
      </div>

      {/* Section Content */}
      <div className="animate-fade-in-up">
        {activeSection === 'performance' && (
          <div className="space-y-8">
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
              embedded={true}
            />
          </div>
        )}

        {activeSection === 'trends' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-pluxee-deep-blue mb-2">Trend Analysis</h2>
              <p className="text-slate-500">Interactive visualizations of your performance metrics over time</p>
            </div>
            {merchantData ? (
              <ChartBuilder
                merchantData={merchantData}
                competitorData={[]}
                historicalData={historicalData || []}
              />
            ) : (
              <div className="pluxee-card text-center py-12">
                <p className="text-slate-500">Loading trend data...</p>
              </div>
            )}
          </div>
        )}

        {activeSection === 'forecast' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-pluxee-deep-blue mb-2">Forecasting</h2>
              <p className="text-slate-500">AI-powered predictions with confidence intervals</p>
            </div>
            <ForecastChart metric="transactions" />
          </div>
        )}

        {activeSection === 'cohorts' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-pluxee-deep-blue mb-2">Cohort Analysis</h2>
              <p className="text-slate-500">Customer retention and behavior patterns by acquisition date</p>
            </div>
            <CohortAnalysis merchantId={merchantId} />
          </div>
        )}

        {activeSection === 'ai' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-pluxee-deep-blue mb-2">AI Insights</h2>
              <p className="text-slate-500">Automated anomaly detection and actionable recommendations</p>
            </div>
            <ExecutiveBriefing merchantId={merchantId} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AnomalyAlerts merchantId={merchantId} />
              <RecommendationCards merchantId={merchantId} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
