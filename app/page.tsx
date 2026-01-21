'use client'

import { Suspense, useEffect, useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import AIChat from '@/components/AIChat'
import InsightsPanel from '@/components/InsightsPanel'
import { AnomalyAlerts } from '@/components/ai/AnomalyAlerts'
import { RecommendationCards } from '@/components/ai/RecommendationCards'
import { ExecutiveBriefing } from '@/components/ai/ExecutiveBriefing'
import DrillableMetrics from '@/components/DrillableMetrics'
import MerchantSelector from '@/components/MerchantSelector'
import DateRangePicker, { DateRange, getDefaultDateRange } from '@/components/DateRangePicker'
import ExportButton from '@/components/ExportButton'
import DashboardCustomizer from '@/components/DashboardCustomizer'
import { DashboardLayout, getSavedLayout, DEFAULT_LAYOUT } from '@/lib/dashboard-config'
import { MerchantMetrics, CompetitorData } from '@/lib/types'

// Wrap page in Suspense for useSearchParams
export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <Dashboard />
    </Suspense>
  )
}

function DashboardLoading() {
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

function Dashboard() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const [data, setData] = useState<{
    carrefour: MerchantMetrics
    competitors: CompetitorData[]
  } | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange)
  const [showCustomizer, setShowCustomizer] = useState(false)
  const [layout, setLayout] = useState<DashboardLayout>(DEFAULT_LAYOUT)

  // Get merchantId from URL params
  const merchantId = searchParams.get('merchantId')

  // Load saved layout on mount
  useEffect(() => {
    setLayout(getSavedLayout())
  }, [])

  useEffect(() => {
    async function loadData() {
      try {
        const params = new URLSearchParams()
        if (merchantId) params.set('merchantId', merchantId)
        params.set('startDate', format(dateRange.startDate, 'yyyy-MM-dd'))
        params.set('endDate', format(dateRange.endDate, 'yyyy-MM-dd'))

        const url = `/api/merchant-data?${params.toString()}`
        const response = await fetch(url)
        const data = await response.json()
        setData(data)
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }
    loadData()
  }, [session, merchantId, dateRange])

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

  const formatCurrency = (amount: number) => `${(amount / 100).toFixed(2)} RON`
  const formatNumber = (num: number) => num.toLocaleString()

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-8 py-5 flex justify-between items-center">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <MerchantSelector />
                <DateRangePicker value={dateRange} onChange={setDateRange} />
                <ExportButton dateRange={dateRange} merchantId={merchantId || undefined} />
              </div>

              <nav className="flex gap-1">
                <a
                  href="/"
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-50 text-blue-600"
                >
                  Dashboard
                </a>
                <a
                  href="/analytics"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
                >
                  Analytics
                </a>
                <a
                  href="/settings"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
                >
                  Settings
                </a>
                {(session?.user as any)?.role === 'super_admin' || (session?.user as any)?.role === 'admin' ? (
                  <a
                    href="/admin"
                    className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
                  >
                    Admin
                  </a>
                ) : null}
              </nav>
            </div>

            <div className="flex items-center gap-3">
              {/* Customize button */}
              <button
                onClick={() => setShowCustomizer(true)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="Customize dashboard"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </button>

              {/* User info */}
              <div className="flex items-center gap-3 px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-card">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-medium text-slate-700">
                  {session?.user?.name || 'Dashboard'}
                </span>
              </div>

              {/* Logout button */}
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors flex items-center gap-2"
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
              Good morning!
            </h1>
            <p className="text-slate-500 text-base">
              Your AI analyst has been monitoring your campaign. Here's what's important today.
            </p>
          </div>

          {/* Widgets - rendered based on layout order */}
          {layout.widgetOrder.map(widgetId => {
            if (!layout.enabledWidgets.includes(widgetId)) return null

            switch (widgetId) {
              case 'drillable-metrics':
                return <DrillableMetrics key={widgetId} data={data.carrefour} />
              case 'executive-briefing':
                return <ExecutiveBriefing key={widgetId} merchantId={data.carrefour.merchant_id} />
              case 'insights-panel':
                return <InsightsPanel key={widgetId} />
              case 'anomaly-alerts':
                return <AnomalyAlerts key={widgetId} merchantId={data.carrefour.merchant_id} />
              case 'recommendations':
                return <RecommendationCards key={widgetId} merchantId={data.carrefour.merchant_id} />
              default:
                return null
            }
          })}

          {/* Campaign Overview */}
          <div
            className="bg-white border border-slate-200 rounded-xl shadow-card p-8"
            style={{ animation: 'fadeInUp 0.6s ease-out 0.6s both' }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-slate-800">Campaign Status</h2>
              <div className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full font-medium text-xs">
                ACTIVE
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-slate-50 rounded-lg p-6">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Cashback Rate</div>
                <div className="text-3xl font-semibold text-blue-600">{data.carrefour.cashback_percent}%</div>
                <div className="text-xs text-slate-400 mt-2">Highest in market</div>
              </div>

              <div className="bg-slate-50 rounded-lg p-6">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Campaign ROI</div>
                <div className="text-3xl font-semibold text-slate-800">
                  {((data.carrefour.revenue - data.carrefour.cashback_paid) / data.carrefour.cashback_paid).toFixed(2)}x
                </div>
                <div className="text-xs text-emerald-600 font-medium mt-2">↑ Healthy range</div>
              </div>

              <div className="bg-slate-50 rounded-lg p-6">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Participation Rate</div>
                <div className="text-3xl font-semibold text-slate-800">
                  {((data.carrefour.customers / 5000) * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-slate-400 mt-2">of total customers</div>
              </div>
            </div>

            <p className="text-slate-500 text-sm">
              Your {data.carrefour.cashback_percent}% cashback campaign is driving strong customer acquisition
              across Romania. Continue monitoring ROI and customer retention metrics.
            </p>
          </div>

          {/* Competitor Comparison */}
          <div
            className="bg-white border border-slate-200 rounded-xl shadow-card p-8"
            style={{ animation: 'fadeInUp 0.6s ease-out 0.7s both' }}
          >
            <h2 className="text-lg font-semibold text-slate-800 mb-6">Competitor Comparison</h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Rank</th>
                    <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Merchant</th>
                    <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Transactions</th>
                    <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Revenue</th>
                    <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Customers</th>
                    <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Cashback</th>
                    <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.competitors.map((comp) => (
                    <tr
                      key={comp.merchant_name}
                      className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                        comp.isYou ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <td className="p-4">
                        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-sm font-semibold ${
                          comp.isYou
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {comp.rank}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-slate-800">{comp.merchant_name}</div>
                        {comp.isYou && (
                          <div className="text-xs text-blue-600 font-medium">That's you!</div>
                        )}
                      </td>
                      <td className="p-4 text-slate-700">{formatNumber(comp.transactions)}</td>
                      <td className="p-4 text-slate-700">{formatCurrency(comp.revenue)}</td>
                      <td className="p-4 text-slate-700">{formatNumber(comp.customers)}</td>
                      <td className="p-4 text-slate-700">{comp.cashback_percent}%</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          comp.campaign_active
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {comp.campaign_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Spacer for Chat */}
          <div className="h-32" />
        </main>

        {/* AI Chat */}
        <AIChat />

        {/* Dashboard Customizer Modal */}
        <DashboardCustomizer
          isOpen={showCustomizer}
          onClose={() => setShowCustomizer(false)}
          onLayoutChange={setLayout}
        />
      </div>
    </div>
  )
}
