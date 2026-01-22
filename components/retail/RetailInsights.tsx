'use client'

import { useState, useEffect } from 'react'
import { AIContextMode, RetailInsightsData, MarketShareTimeSeries, MobilityMatrix as MobilityMatrixType, ChurnAnalysis, AgeDistributionBucket, TimeSeriesDataPoint, BarChartDataPoint } from '@/types/analytics'
import MarketPosition from './MarketPosition'
import CompetitiveDemographics from './CompetitiveDemographics'
import MobilityMatrix from './MobilityMatrix'
import ChurnIntelligence from './ChurnIntelligence'
import RetailAIInsights from './RetailAIInsights'

interface RetailInsightsProps {
  merchantId: string
  merchantName: string
  onContextChange?: (mode: AIContextMode) => void
}

// Demo data generator
function generateDemoRetailData(merchantId: string, merchantName: string) {
  const merchants = [
    { id: merchantId, name: merchantName, isYou: true },
    { id: 'lidl', name: 'Lidl', isYou: false },
    { id: 'kaufland', name: 'Kaufland', isYou: false },
    { id: 'penny', name: 'Penny', isYou: false },
    { id: 'profi', name: 'Profi', isYou: false },
  ]

  // Generate 12 months of market share data
  const marketShareData: MarketShareTimeSeries[] = []
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  months.forEach((month, i) => {
    const dataPoint: MarketShareTimeSeries = { date: month }
    dataPoint[merchantName] = 12 + Math.random() * 3 + (i * 0.2)
    dataPoint['Lidl'] = 28 - Math.random() * 2 - (i * 0.1)
    dataPoint['Kaufland'] = 18 + Math.random() * 2
    dataPoint['Penny'] = 15 + Math.random() * 2
    dataPoint['Profi'] = 10 + Math.random() * 2
    marketShareData.push(dataPoint)
  })

  // Market reach data
  const marketReachData = [
    { merchantName: 'Lidl', reach3m: 45.2, reach6m: 62.1 },
    { merchantName: merchantName, reach3m: 28.5, reach6m: 41.3 },
    { merchantName: 'Kaufland', reach3m: 35.8, reach6m: 52.4 },
    { merchantName: 'Penny', reach3m: 22.1, reach6m: 34.7 },
    { merchantName: 'Profi', reach3m: 18.9, reach6m: 28.3 },
  ]

  // Age distribution
  const ageDistribution = merchants.slice(0, 4).map((m) => ({
    merchantName: m.name,
    isYou: m.isYou,
    distribution: [
      { ageMin: 18, ageMax: 24, label: '18-24', count: 4500 + Math.random() * 1000, percentage: 12 + Math.random() * 5 },
      { ageMin: 25, ageMax: 34, label: '25-34', count: 8500 + Math.random() * 2000, percentage: 28 + Math.random() * 8 },
      { ageMin: 35, ageMax: 44, label: '35-44', count: 7200 + Math.random() * 1500, percentage: 24 + Math.random() * 6 },
      { ageMin: 45, ageMax: 54, label: '45-54', count: 5100 + Math.random() * 1000, percentage: 18 + Math.random() * 5 },
      { ageMin: 55, ageMax: 64, label: '55-64', count: 3200 + Math.random() * 800, percentage: 12 + Math.random() * 4 },
      { ageMin: 65, ageMax: 100, label: '65+', count: 1800 + Math.random() * 500, percentage: 6 + Math.random() * 3 },
    ] as AgeDistributionBucket[]
  }))

  // Gender by customers
  const genderByCustomers: BarChartDataPoint[] = merchants.slice(0, 4).map((m) => ({
    name: m.name,
    male: 42 + Math.random() * 10,
    female: 48 + Math.random() * 10,
    value: 0
  }))

  // Avg age history
  const avgAgeHistory: TimeSeriesDataPoint[] = months.map((month) => {
    const point: TimeSeriesDataPoint = { date: month }
    merchants.slice(0, 4).forEach((m) => {
      point[m.name] = 35 + Math.random() * 8
    })
    return point
  })

  // Mobility matrix
  const mobilityMatrix: MobilityMatrixType = {
    merchants: merchants.slice(0, 5).map((m) => ({ id: m.id, name: m.name })),
    cells: [],
    singleMerchantLoyalty: merchants.slice(0, 5).map((m) => ({
      merchantId: m.id,
      merchantName: m.name,
      percentage: 15 + Math.random() * 25
    }))
  }

  // Generate mobility cells
  merchants.slice(0, 5).forEach((from) => {
    merchants.slice(0, 5).forEach((to) => {
      if (from.id !== to.id) {
        mobilityMatrix.cells.push({
          fromMerchantId: from.id,
          toMerchantId: to.id,
          overlapPercentage: 10 + Math.random() * 35,
          customerCount: Math.floor(1000 + Math.random() * 5000)
        })
      }
    })
  })

  // Churn analysis
  const churnAnalysis: ChurnAnalysis = {
    summary: {
      merchantId: merchantId,
      periodStart: '2024-01-01',
      periodEnd: '2024-06-30',
      totalCustomers: 45678,
      newCustomers: 8234,
      newCustomersPercentage: 18.0,
      retainedCustomers: 32156,
      retainedCustomersPercentage: 70.4,
      churnedCustomers: 5288,
      churnedCustomersPercentage: 11.6
    },
    churnDestinations: [
      { competitorId: 'lidl', competitorName: 'Lidl', customerCount: 2156, sowPreviousPeriod: 12.5, sowCurrentPeriod: 18.2, sowDifference: 5.7 },
      { competitorId: 'kaufland', competitorName: 'Kaufland', customerCount: 1542, sowPreviousPeriod: 8.3, sowCurrentPeriod: 14.1, sowDifference: 5.8 },
      { competitorId: 'penny', competitorName: 'Penny', customerCount: 987, sowPreviousPeriod: 5.2, sowCurrentPeriod: 9.8, sowDifference: 4.6 },
      { competitorId: 'profi', competitorName: 'Profi', customerCount: 603, sowPreviousPeriod: 3.1, sowCurrentPeriod: 6.4, sowDifference: 3.3 },
    ],
    newCustomerSources: [
      { competitorId: 'lidl', competitorName: 'Lidl', customerCount: 3421, sowPreviousPeriod: 22.1, sowCurrentPeriod: 15.3, sowDifference: -6.8 },
      { competitorId: 'kaufland', competitorName: 'Kaufland', customerCount: 2156, sowPreviousPeriod: 16.5, sowCurrentPeriod: 11.2, sowDifference: -5.3 },
      { competitorId: 'penny', competitorName: 'Penny', customerCount: 1523, sowPreviousPeriod: 12.3, sowCurrentPeriod: 8.1, sowDifference: -4.2 },
      { competitorId: 'profi', competitorName: 'Profi', customerCount: 1134, sowPreviousPeriod: 8.7, sowCurrentPeriod: 5.9, sowDifference: -2.8 },
    ]
  }

  return {
    merchants,
    marketShareData,
    marketReachData,
    ageDistribution,
    genderByCustomers,
    avgAgeHistory,
    mobilityMatrix,
    churnAnalysis
  }
}

export default function RetailInsights({
  merchantId,
  merchantName,
  onContextChange
}: RetailInsightsProps) {
  const [activeSection, setActiveSection] = useState<'position' | 'demographics' | 'mobility' | 'churn' | 'ai'>('position')
  const [data, setData] = useState<ReturnType<typeof generateDemoRetailData> | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Notify parent of context mode
  useEffect(() => {
    onContextChange?.('retail')
  }, [onContextChange])

  // Load demo data
  useEffect(() => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setData(generateDemoRetailData(merchantId, merchantName))
      setIsLoading(false)
    }, 500)
  }, [merchantId, merchantName])

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-2">
            <div className="w-3 h-3 bg-pluxee-boldly-blue rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
            <div className="w-3 h-3 bg-pluxee-boldly-blue rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="w-3 h-3 bg-pluxee-boldly-blue rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
          </div>
          <p className="text-sm text-slate-500">Loading market intelligence...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-semibold text-pluxee-deep-blue">Retail Insights</h1>
          <span className="pluxee-badge pluxee-badge--premium">Premium</span>
        </div>
        <p className="text-slate-500">
          Market intelligence and competitive analysis for {merchantName}
        </p>
      </div>

      {/* Section Navigation */}
      <div className="pluxee-tabs">
        <button
          onClick={() => setActiveSection('position')}
          className={`pluxee-tab ${activeSection === 'position' ? 'pluxee-tab--active' : ''}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Market Position
        </button>
        <button
          onClick={() => setActiveSection('demographics')}
          className={`pluxee-tab ${activeSection === 'demographics' ? 'pluxee-tab--active' : ''}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Demographics
        </button>
        <button
          onClick={() => setActiveSection('mobility')}
          className={`pluxee-tab ${activeSection === 'mobility' ? 'pluxee-tab--active' : ''}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          Mobility
        </button>
        <button
          onClick={() => setActiveSection('churn')}
          className={`pluxee-tab ${activeSection === 'churn' ? 'pluxee-tab--active' : ''}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          Churn
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
        {activeSection === 'position' && (
          <MarketPosition
            marketShareData={data.marketShareData}
            merchants={data.merchants}
            marketReachData={data.marketReachData}
          />
        )}

        {activeSection === 'demographics' && (
          <CompetitiveDemographics
            ageDistribution={data.ageDistribution}
            genderByCustomers={data.genderByCustomers}
            avgAgeHistory={data.avgAgeHistory}
            merchants={data.merchants}
          />
        )}

        {activeSection === 'mobility' && (
          <MobilityMatrix
            data={data.mobilityMatrix}
            yourMerchantId={merchantId}
          />
        )}

        {activeSection === 'churn' && (
          <ChurnIntelligence
            data={data.churnAnalysis}
            merchantName={merchantName}
          />
        )}

        {activeSection === 'ai' && (
          <RetailAIInsights
            merchantId={merchantId}
            merchantName={merchantName}
            marketShareData={data.marketShareData}
            mobilityMatrix={data.mobilityMatrix}
            churnAnalysis={data.churnAnalysis}
            ageDistribution={data.ageDistribution}
            genderByCustomers={data.genderByCustomers}
            merchants={data.merchants}
          />
        )}
      </div>
    </div>
  )
}
