'use client'

import { useEffect, useState } from 'react'
import { DataLoader } from '@/lib/data-loader'
import { MerchantMetrics, CompetitorData } from '@/lib/types'
import ChartBuilder from '@/components/ChartBuilder'
import ForecastChart from '@/components/ForecastChart'
import CompetitorComparison from '@/components/CompetitorComparison'
import Link from 'next/link'

export default function AnalyticsPage() {
  const [data, setData] = useState<{
    carrefour: MerchantMetrics
    competitors: CompetitorData[]
    historical: MerchantMetrics[]
  } | null>(null)
  
  const [activeTab, setActiveTab] = useState<'trends' | 'forecast' | 'competition'>('trends')
  
  useEffect(() => {
    // Load demo data
    const demoData = DataLoader.loadDemoData()
    const { historical } = DataLoader.processTransactions([])
    setData({
      ...demoData,
      historical
    })
  }, [])
  
  if (!data) {
    return (
      <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center">
        <div className="flex gap-3">
          <div className="w-4 h-4 bg-[#FF6B35] rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-4 h-4 bg-[#FF6B35] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="w-4 h-4 bg-[#FF6B35] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-[#0A0E27] relative">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/5 w-96 h-96 bg-[#FF6B35]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/5 w-96 h-96 bg-[#7B61FF]/5 rounded-full blur-3xl" />
      </div>
      
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-[#252B4A] backdrop-blur-lg bg-[#0A0E27]/80 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-8 py-5 flex justify-between items-center">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
                <div className="text-3xl font-bold font-mono text-[#FF6B35]">
                  KACHING
                </div>
                <div className="text-sm text-[#5A5F7D]">Pro Analytics</div>
              </Link>
              
              <nav className="flex gap-1">
                <Link
                  href="/"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-[#8B92B8] hover:text-white hover:bg-[#1C2342] transition-all"
                >
                  Dashboard
                </Link>
                <Link
                  href="/analytics"
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-[#FF6B35] text-white"
                >
                  Analytics
                </Link>
              </nav>
            </div>
            
            <div className="flex items-center gap-3 px-4 py-2 bg-[#141932] border border-[#252B4A] rounded-lg">
              <div className="w-2 h-2 rounded-full bg-[#00D9A3] animate-pulse" />
              <span className="font-mono text-sm text-white">{data.carrefour.merchant_name}</span>
            </div>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto px-8 py-8 space-y-8">
          {/* Hero Section */}
          <div className="animate-fade-in-up">
            <h1 className="text-4xl font-bold text-white mb-3">
              📊 Advanced Analytics
            </h1>
            <p className="text-[#8B92B8] text-lg">
              Interactive visualizations and forecasting powered by statistical analysis
            </p>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-2 border-b border-[#252B4A]">
            <button
              onClick={() => setActiveTab('trends')}
              className={`px-6 py-3 font-semibold transition-all relative ${
                activeTab === 'trends'
                  ? 'text-[#FF6B35]'
                  : 'text-[#8B92B8] hover:text-white'
              }`}
            >
              📈 Trend Analysis
              {activeTab === 'trends' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF6B35]" />
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('forecast')}
              className={`px-6 py-3 font-semibold transition-all relative ${
                activeTab === 'forecast'
                  ? 'text-[#FF6B35]'
                  : 'text-[#8B92B8] hover:text-white'
              }`}
            >
              🔮 Forecasting
              {activeTab === 'forecast' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF6B35]" />
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('competition')}
              className={`px-6 py-3 font-semibold transition-all relative ${
                activeTab === 'competition'
                  ? 'text-[#FF6B35]'
                  : 'text-[#8B92B8] hover:text-white'
              }`}
            >
              ⚖️ Competition
              {activeTab === 'competition' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF6B35]" />
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
          </div>
          
          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-[#141932] border border-[#252B4A] rounded-xl p-6">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="text-white font-semibold mb-2">Real-Time Interaction</h3>
              <p className="text-sm text-[#8B92B8]">
                Hover over any data point to see detailed breakdowns. Click metrics to switch views instantly.
              </p>
            </div>
            
            <div className="bg-[#141932] border border-[#252B4A] rounded-xl p-6">
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="text-white font-semibold mb-2">Statistical Accuracy</h3>
              <p className="text-sm text-[#8B92B8]">
                All forecasts use time-series decomposition with 95% confidence intervals and MAPE accuracy metrics.
              </p>
            </div>
            
            <div className="bg-[#141932] border border-[#252B4A] rounded-xl p-6">
              <div className="text-3xl mb-3">📱</div>
              <h3 className="text-white font-semibold mb-2">Mobile-First Design</h3>
              <p className="text-sm text-[#8B92B8]">
                Every chart is fully responsive and works beautifully on desktop, tablet, and mobile devices.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
