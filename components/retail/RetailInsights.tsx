'use client'

import { useEffect } from 'react'
import { AIContextMode } from '@/types/analytics'
import AIChat from '@/components/AIChat'

interface RetailInsightsProps {
  merchantId: string
  merchantName: string
  onContextChange?: (mode: AIContextMode) => void
}

export default function RetailInsights({
  merchantId,
  merchantName,
  onContextChange
}: RetailInsightsProps) {
  // Notify parent of context mode
  useEffect(() => {
    onContextChange?.('retail')
  }, [onContextChange])

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

      {/* Coming Soon Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Market Position */}
        <div className="pluxee-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-pluxee-boldly-blue-20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-pluxee-boldly-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-pluxee-deep-blue">Market Position</h3>
              <p className="text-sm text-slate-500">Market share and reach analysis</p>
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-8 text-center">
            <p className="text-slate-400">Coming in Phase 3</p>
          </div>
        </div>

        {/* Competitive Demographics */}
        <div className="pluxee-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-pluxee-ultra-green-20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-pluxee-ultra-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-pluxee-deep-blue">Competitive Demographics</h3>
              <p className="text-sm text-slate-500">Age and gender comparisons across market</p>
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-8 text-center">
            <p className="text-slate-400">Coming in Phase 3</p>
          </div>
        </div>

        {/* Customer Mobility */}
        <div className="pluxee-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-pluxee-very-yellow-20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-pluxee-deep-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-pluxee-deep-blue">Customer Mobility</h3>
              <p className="text-sm text-slate-500">Cross-shopping patterns and loyalty</p>
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-8 text-center">
            <p className="text-slate-400">Coming in Phase 3</p>
          </div>
        </div>

        {/* Churn Intelligence */}
        <div className="pluxee-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-pluxee-coral-20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-pluxee-coral" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-pluxee-deep-blue">Churn Intelligence</h3>
              <p className="text-sm text-slate-500">Customer flow and retention analysis</p>
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-8 text-center">
            <p className="text-slate-400">Coming in Phase 3</p>
          </div>
        </div>
      </div>

      {/* Feature Preview */}
      <div className="pluxee-card bg-gradient-to-br from-pluxee-deep-blue to-pluxee-deep-blue/90 text-white">
        <div className="flex items-start gap-6">
          <div className="w-16 h-16 bg-pluxee-ultra-green rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-8 h-8 text-pluxee-deep-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Full Market Intelligence Coming Soon</h3>
            <p className="text-pluxee-deep-blue-50 mb-4">
              Retail Insights will give you complete visibility into market dynamics, competitive positioning,
              customer mobility patterns, and strategic recommendations powered by AI.
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-pluxee-ultra-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Market share trends
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-pluxee-ultra-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Competitor benchmarking
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-pluxee-ultra-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Customer flow analysis
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-pluxee-ultra-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Churn prediction
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Chat - Retail Context */}
      <AIChat
        contextMode="retail"
        merchantName={merchantName}
        merchantId={merchantId}
      />
    </div>
  )
}
