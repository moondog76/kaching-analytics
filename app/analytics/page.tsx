'use client'

import { useEffect, useState, useCallback } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { format } from 'date-fns'
import { MerchantMetrics, CompetitorData } from '@/lib/types'
import { AIContextMode } from '@/types/analytics'
import { MerchantAccess } from '@/lib/access-tier'
import InsightsTabs, { InsightTab } from '@/components/InsightsTabs'
import { CashbackInsights } from '@/components/cashback'
import { RetailInsights } from '@/components/retail'
import ChartBuilder from '@/components/ChartBuilder'
import ForecastChart from '@/components/ForecastChart'
import CompetitorComparison from '@/components/CompetitorComparison'
import { ExecutiveBriefing } from '@/components/ai/ExecutiveBriefing'
import { AnomalyAlerts } from '@/components/ai/AnomalyAlerts'
import { RecommendationCards } from '@/components/ai/RecommendationCards'
import DateRangePicker, { DateRange, getDefaultDateRange } from '@/components/DateRangePicker'
import ExportButton from '@/components/ExportButton'
import CohortAnalysis from '@/components/CohortAnalysis'
import Link from 'next/link'

export default function AnalyticsPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<{
    carrefour: MerchantMetrics
    competitors: CompetitorData[]
    historical: MerchantMetrics[]
  } | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange)

  // Insights tabs state
  const [insightTab, setInsightTab] = useState<InsightTab>('cashback')
  const [aiContextMode, setAiContextMode] = useState<AIContextMode>('cashback')

  // Legacy analytics tabs
  const [legacyTab, setLegacyTab] = useState<'trends' | 'forecast' | 'competition' | 'cohort' | 'ai'>('trends')

  // View mode: 'insights' for new two-tier view, 'legacy' for old analytics
  const [viewMode, setViewMode] = useState<'insights' | 'legacy'>('insights')

  // Mock merchant access - in production this would come from the session/API
  const [merchantAccess] = useState<MerchantAccess>({
    tier: 'premium', // Change to 'standard' to test Standard tier
    hasCashbackAccess: true,
    hasRetailInsightsAccess: true, // Change to false to test upgrade modal
    availableTabs: ['cashback', 'retail'],
    defaultTab: 'cashback'
  })

  useEffect(() => {
    async function loadData() {
      try {
        const params = new URLSearchParams()
        params.set('startDate', format(dateRange.startDate, 'yyyy-MM-dd'))
        params.set('endDate', format(dateRange.endDate, 'yyyy-MM-dd'))

        const response = await fetch(`/api/merchant-data?${params.toString()}`)
        const data = await response.json()
        setData(data)
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }
    loadData()
  }, [session, dateRange])

  const handleContextChange = useCallback((mode: AIContextMode) => {
    setAiContextMode(mode)
  }, [])

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex gap-3">
          <div className="w-4 h-4 bg-pluxee-ultra-green rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-4 h-4 bg-pluxee-ultra-green rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="w-4 h-4 bg-pluxee-ultra-green rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-8 py-5 flex justify-between items-center">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
                <div className="text-xl font-semibold text-pluxee-deep-blue">
                  {data?.carrefour?.merchant_name || "Analytics"}
                </div>
              </Link>
              <DateRangePicker value={dateRange} onChange={setDateRange} />
              <ExportButton dateRange={dateRange} merchantId={data?.carrefour?.merchant_id} />

              <nav className="flex gap-1">
                <Link
                  href="/"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
                >
                  Dashboard
                </Link>
                <Link
                  href="/analytics"
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-pluxee-ultra-green-20 text-pluxee-deep-blue"
                >
                  Analytics
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('insights')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    viewMode === 'insights'
                      ? 'bg-white text-pluxee-deep-blue shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Insights
                </button>
                <button
                  onClick={() => setViewMode('legacy')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    viewMode === 'legacy'
                      ? 'bg-white text-pluxee-deep-blue shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Charts
                </button>
              </div>

              {/* User info */}
              <div className="flex items-center gap-3 px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-card">
                <div className="w-2 h-2 rounded-full bg-pluxee-ultra-green animate-pulse" />
                <span className="text-sm font-medium text-slate-700">
                  {session?.user?.name || data.carrefour.merchant_name}
                </span>
                {merchantAccess.tier === 'premium' && (
                  <span className="pluxee-badge pluxee-badge--premium text-xs">Pro</span>
                )}
              </div>

              {/* Logout button */}
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-8 py-8">
          {viewMode === 'insights' ? (
            /* New Insights View */
            <div className="space-y-8">
              {/* Insights Tab Navigation */}
              <InsightsTabs
                activeTab={insightTab}
                onTabChange={setInsightTab}
                merchantAccess={merchantAccess}
              />

              {/* Tab Content */}
              <div className="animate-fade-in-up">
                {insightTab === 'cashback' && (
                  <CashbackInsights
                    merchantId={data.carrefour.merchant_id}
                    merchantName={data.carrefour.merchant_name}
                    onContextChange={handleContextChange}
                  />
                )}

                {insightTab === 'retail' && merchantAccess.hasRetailInsightsAccess && (
                  <RetailInsights
                    merchantId={data.carrefour.merchant_id}
                    merchantName={data.carrefour.merchant_name}
                    onContextChange={handleContextChange}
                  />
                )}
              </div>
            </div>
          ) : (
            /* Legacy Charts View */
            <div className="space-y-8">
              {/* Hero Section */}
              <div className="animate-fade-in-up">
                <h1 className="text-2xl font-semibold text-pluxee-deep-blue mb-2">
                  Advanced Analytics
                </h1>
                <p className="text-slate-500 text-base">
                  Interactive visualizations and forecasting powered by statistical analysis
                </p>
              </div>

              {/* Legacy Tabs */}
              <div className="flex gap-2 border-b border-slate-200">
                <button
                  onClick={() => setLegacyTab('trends')}
                  className={`px-6 py-3 font-medium transition-all relative ${
                    legacyTab === 'trends'
                      ? 'text-pluxee-deep-blue'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Trend Analysis
                  {legacyTab === 'trends' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pluxee-ultra-green" />
                  )}
                </button>

                <button
                  onClick={() => setLegacyTab('forecast')}
                  className={`px-6 py-3 font-medium transition-all relative ${
                    legacyTab === 'forecast'
                      ? 'text-pluxee-deep-blue'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Forecasting
                  {legacyTab === 'forecast' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pluxee-ultra-green" />
                  )}
                </button>

                <button
                  onClick={() => setLegacyTab('competition')}
                  className={`px-6 py-3 font-medium transition-all relative ${
                    legacyTab === 'competition'
                      ? 'text-pluxee-deep-blue'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Competition
                  {legacyTab === 'competition' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pluxee-ultra-green" />
                  )}
                </button>

                <button
                  onClick={() => setLegacyTab('cohort')}
                  className={`px-6 py-3 font-medium transition-all relative ${
                    legacyTab === 'cohort'
                      ? 'text-pluxee-deep-blue'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Cohorts
                  {legacyTab === 'cohort' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pluxee-ultra-green" />
                  )}
                </button>

                <button
                  onClick={() => setLegacyTab('ai')}
                  className={`px-6 py-3 font-medium transition-all relative ${
                    legacyTab === 'ai'
                      ? 'text-pluxee-deep-blue'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  AI Insights
                  {legacyTab === 'ai' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pluxee-ultra-green" />
                  )}
                </button>
              </div>

              {/* Tab Content */}
              <div className="animate-fade-in-up">
                {legacyTab === 'trends' && (
                  <ChartBuilder
                    merchantData={data.carrefour}
                    competitorData={data.competitors}
                    historicalData={data.historical}
                  />
                )}

                {legacyTab === 'forecast' && (
                  <ForecastChart metric="transactions" />
                )}

                {legacyTab === 'competition' && (
                  <CompetitorComparison
                    yourData={data.carrefour}
                    competitors={data.competitors}
                  />
                )}

                {legacyTab === 'cohort' && (
                  <CohortAnalysis merchantId={data.carrefour.merchant_id} />
                )}

                {legacyTab === 'ai' && (
                  <div className="space-y-6">
                    <ExecutiveBriefing merchantId={data.carrefour.merchant_id} />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <AnomalyAlerts merchantId={data.carrefour.merchant_id} />
                      <RecommendationCards merchantId={data.carrefour.merchant_id} />
                    </div>
                  </div>
                )}
              </div>

              {/* Feature Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                <div className="pluxee-card">
                  <div className="w-10 h-10 bg-pluxee-boldly-blue-20 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-pluxee-boldly-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-pluxee-deep-blue font-semibold mb-2">Real-Time Interaction</h3>
                  <p className="text-sm text-slate-500">
                    Hover over any data point to see detailed breakdowns. Click metrics to switch views instantly.
                  </p>
                </div>

                <div className="pluxee-card">
                  <div className="w-10 h-10 bg-pluxee-ultra-green-20 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-pluxee-ultra-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-pluxee-deep-blue font-semibold mb-2">Statistical Accuracy</h3>
                  <p className="text-sm text-slate-500">
                    All forecasts use time-series decomposition with 95% confidence intervals and MAPE accuracy metrics.
                  </p>
                </div>

                <div className="pluxee-card">
                  <div className="w-10 h-10 bg-pluxee-very-yellow-20 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-pluxee-deep-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-pluxee-deep-blue font-semibold mb-2">Mobile-First Design</h3>
                  <p className="text-sm text-slate-500">
                    Every chart is fully responsive and works beautifully on desktop, tablet, and mobile devices.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
