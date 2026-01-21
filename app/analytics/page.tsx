'use client'

import { useEffect, useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { MerchantMetrics, CompetitorData } from '@/lib/types'
import ChartBuilder from '@/components/ChartBuilder'
import ForecastChart from '@/components/ForecastChart'
import CompetitorComparison from '@/components/CompetitorComparison'
import { ExecutiveBriefing } from '@/components/ai/ExecutiveBriefing'
import { AnomalyAlerts } from '@/components/ai/AnomalyAlerts'
import { RecommendationCards } from '@/components/ai/RecommendationCards'
import AIChat from '@/components/AIChat'
import Link from 'next/link'

export default function AnalyticsPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<{
    carrefour: MerchantMetrics
    competitors: CompetitorData[]
    historical: MerchantMetrics[]
  } | null>(null)

  const [activeTab, setActiveTab] = useState<'trends' | 'forecast' | 'competition' | 'ai'>('trends')

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch('/api/merchant-data')
        const data = await response.json()
        setData(data)
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }
    loadData()
  }, [session])

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex gap-3">
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
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
                <div className="text-xl font-semibold text-slate-800">
                  {data?.carrefour?.merchant_name || "Analytics"}
                </div>
                <div className="text-sm text-slate-400">Analytics</div>
              </Link>

              <nav className="flex gap-1">
                <Link
                  href="/"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
                >
                  Dashboard
                </Link>
                <Link
                  href="/analytics"
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-50 text-blue-600"
                >
                  Analytics
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              {/* User info */}
              <div className="flex items-center gap-3 px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-card">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-medium text-slate-700">
                  {session?.user?.name || data.carrefour.merchant_name}
                </span>
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

        <main className="max-w-7xl mx-auto px-8 py-8 space-y-8">
          {/* Hero Section */}
          <div className="animate-fade-in-up">
            <h1 className="text-2xl font-semibold text-slate-800 mb-2">
              Advanced Analytics
            </h1>
            <p className="text-slate-500 text-base">
              Interactive visualizations and forecasting powered by statistical analysis
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-slate-200">
            <button
              onClick={() => setActiveTab('trends')}
              className={`px-6 py-3 font-medium transition-all relative ${
                activeTab === 'trends'
                  ? 'text-blue-600'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Trend Analysis
              {activeTab === 'trends' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('forecast')}
              className={`px-6 py-3 font-medium transition-all relative ${
                activeTab === 'forecast'
                  ? 'text-blue-600'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Forecasting
              {activeTab === 'forecast' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('competition')}
              className={`px-6 py-3 font-medium transition-all relative ${
                activeTab === 'competition'
                  ? 'text-blue-600'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Competition
              {activeTab === 'competition' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('ai')}
              className={`px-6 py-3 font-medium transition-all relative ${
                activeTab === 'ai'
                  ? 'text-blue-600'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              AI Insights
              {activeTab === 'ai' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
              )}
            </button>
          </div>

          {/* Tab Content */}
          <div className="animate-fade-in-up">
            {activeTab === 'trends' && (
              <ChartBuilder
                merchantData={data.carrefour}
                competitorData={data.competitors}
                historicalData={data.historical}
              />
            )}

            {activeTab === 'forecast' && (
              <ForecastChart metric="transactions" />
            )}

            {activeTab === 'competition' && (
              <CompetitorComparison
                yourData={data.carrefour}
                competitors={data.competitors}
              />
            )}

            {activeTab === 'ai' && (
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
            <div className="bg-white border border-slate-200 rounded-xl shadow-card p-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-slate-800 font-semibold mb-2">Real-Time Interaction</h3>
              <p className="text-sm text-slate-500">
                Hover over any data point to see detailed breakdowns. Click metrics to switch views instantly.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-card p-6">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-slate-800 font-semibold mb-2">Statistical Accuracy</h3>
              <p className="text-sm text-slate-500">
                All forecasts use time-series decomposition with 95% confidence intervals and MAPE accuracy metrics.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-card p-6">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-slate-800 font-semibold mb-2">Mobile-First Design</h3>
              <p className="text-sm text-slate-500">
                Every chart is fully responsive and works beautifully on desktop, tablet, and mobile devices.
              </p>
            </div>
          </div>
        </main>
      </div>

      {/* AI Chat Assistant */}
      <AIChat />
    </div>
  )
}
