'use client'

import { useState } from 'react'
import { MerchantAccess, canAccessTab, getUpgradePrompt } from '@/lib/access-tier'

export type InsightTab = 'cashback' | 'retail'

interface InsightsTabsProps {
  activeTab: InsightTab
  onTabChange: (tab: InsightTab) => void
  merchantAccess: MerchantAccess
  className?: string
}

export default function InsightsTabs({
  activeTab,
  onTabChange,
  merchantAccess,
  className = ''
}: InsightsTabsProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  const handleTabClick = (tab: InsightTab) => {
    if (canAccessTab(merchantAccess, tab)) {
      onTabChange(tab)
    } else {
      setShowUpgradeModal(true)
    }
  }

  const tabs = [
    {
      id: 'cashback' as InsightTab,
      label: 'Cashback Insights',
      description: 'Campaign performance & own customer analytics',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      available: merchantAccess.hasCashbackAccess
    },
    {
      id: 'retail' as InsightTab,
      label: 'Retail Insights',
      description: 'Market intelligence & competitive analysis',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      available: merchantAccess.hasRetailInsightsAccess,
      premium: true
    }
  ]

  return (
    <>
      <div className={`pluxee-tabs ${className}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`pluxee-tab flex items-center gap-2 ${
              activeTab === tab.id ? 'pluxee-tab--active' : ''
            } ${!tab.available ? 'opacity-60' : ''}`}
            title={!tab.available ? getUpgradePrompt(tab.label) : tab.description}
          >
            {tab.icon}
            <span className="font-medium">{tab.label}</span>
            {tab.premium && !tab.available && (
              <span className="pluxee-badge pluxee-badge--premium text-xs ml-1">
                Premium
              </span>
            )}
            {tab.premium && tab.available && (
              <span className="pluxee-badge pluxee-badge--premium text-xs ml-1">
                Pro
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-pluxee-ultra-green/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-pluxee-ultra-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-pluxee-deep-blue">Unlock Retail Insights</h3>
                <p className="text-sm text-slate-500">Premium feature</p>
              </div>
            </div>

            <p className="text-slate-600 mb-6">
              Get access to comprehensive market intelligence, competitive analysis, customer mobility tracking,
              and churn analytics. See where your customers shop, identify growth opportunities, and make
              data-driven strategic decisions.
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <svg className="w-4 h-4 text-pluxee-ultra-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Market share & competitive positioning
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <svg className="w-4 h-4 text-pluxee-ultra-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Customer mobility matrix
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <svg className="w-4 h-4 text-pluxee-ultra-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Churn analysis & customer flow
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <svg className="w-4 h-4 text-pluxee-ultra-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                AI-powered market intelligence
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50"
              >
                Maybe later
              </button>
              <button
                onClick={() => {
                  // TODO: Implement contact/upgrade flow
                  window.open('mailto:sales@pluxee.com?subject=Retail%20Insights%20Upgrade', '_blank')
                  setShowUpgradeModal(false)
                }}
                className="flex-1 px-4 py-2 bg-pluxee-ultra-green text-pluxee-deep-blue font-medium rounded-lg hover:bg-pluxee-ultra-green/90"
              >
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
