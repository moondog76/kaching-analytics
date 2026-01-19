'use client'

import { useEffect, useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import AIChat from '@/components/AIChat'
import InsightsPanel from '@/components/InsightsPanel'
import { AnomalyAlerts } from '@/components/ai/AnomalyAlerts'
import DrillableMetrics from '@/components/DrillableMetrics'
import { MerchantMetrics, CompetitorData } from '@/lib/types'

export default function Dashboard() {
  const { data: session } = useSession()
  const [data, setData] = useState<{
    carrefour: MerchantMetrics
    competitors: CompetitorData[]
  } | null>(null)
  
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
      <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center">
        <div className="flex gap-3">
          <div className="w-4 h-4 bg-[#FF6B35] rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-4 h-4 bg-[#FF6B35] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="w-4 h-4 bg-[#FF6B35] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    )
  }
  
  const formatCurrency = (amount: number) => `${(amount / 100).toFixed(2)} RON`
  const formatNumber = (num: number) => num.toLocaleString()
  
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
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold text-[#0057A6]">
                  {data.carrefour.merchant_name}
                </div>
                <div className="text-sm text-[#5A5F7D]">Analytics</div>
              </div>
              
              <nav className="flex gap-1">
                <a
                  href="/"
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-[#FF6B35] text-white"
                >
                  Dashboard
                </a>
                <a
                  href="/analytics"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-[#8B92B8] hover:text-white hover:bg-[#1C2342] transition-all"
                >
                  Analytics 📊
                </a>
              </nav>
            </div>
            
            <div className="flex items-center gap-3">
              {/* User info */}
              <div className="flex items-center gap-3 px-4 py-2 bg-[#141932] border border-[#252B4A] rounded-lg">
                <div className="w-2 h-2 rounded-full bg-[#00D9A3] animate-pulse" />
                <span className="font-mono text-sm text-white">
                  {session?.user?.name || 'Carrefour Dashboard'}
                </span>
              </div>
              
              {/* Logout button */}
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="px-4 py-2 bg-[#1C2342] hover:bg-[#252B4A] border border-[#252B4A] rounded-lg text-sm text-white transition-colors flex items-center gap-2"
              >
                <span>🚪</span>
                Logout
              </button>
            </div>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto px-8 py-8 space-y-8">
          {/* Hero Section */}
          <div className="animate-fade-in-up">
            <h1 className="text-4xl font-bold text-white mb-3">
              Good morning! 👋
            </h1>
            <p className="text-[#8B92B8] text-lg">
              Your AI analyst has been monitoring your campaign. Here's what's important today.
            </p>
          </div>
          
          {/* Drillable Metrics */}
          <DrillableMetrics data={data.carrefour} />
          
          {/* AI Insights */}
          <InsightsPanel />
          
          {/* Anomaly Detection */}
          <AnomalyAlerts merchantId="carrefour-ro" />
          
          {/* Campaign Overview */}
          <div 
            className="bg-[#141932] border border-[#252B4A] rounded-xl p-8"
            style={{ animation: 'fadeInUp 0.6s ease-out 0.6s both' }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Campaign Status</h2>
              <div className="px-4 py-2 bg-[#00D9A3]/10 text-[#00D9A3] rounded-lg font-semibold text-sm border border-[#00D9A3]/30">
                ✅ ACTIVE
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-[#0A0E27] rounded-lg p-6">
                <div className="text-sm text-[#8B92B8] mb-2">Cashback Rate</div>
                <div className="text-4xl font-bold text-[#FF6B35]">{data.carrefour.cashback_percent}%</div>
                <div className="text-xs text-[#5A5F7D] mt-2">Highest in market</div>
              </div>
              
              <div className="bg-[#0A0E27] rounded-lg p-6">
                <div className="text-sm text-[#8B92B8] mb-2">Campaign ROI</div>
                <div className="text-4xl font-bold text-white">
                  {((data.carrefour.revenue - data.carrefour.cashback_paid) / data.carrefour.cashback_paid).toFixed(2)}x
                </div>
                <div className="text-xs text-[#00D9A3] mt-2">↑ Healthy range</div>
              </div>
              
              <div className="bg-[#0A0E27] rounded-lg p-6">
                <div className="text-sm text-[#8B92B8] mb-2">Participation Rate</div>
                <div className="text-4xl font-bold text-white">
                  {((data.carrefour.customers / 5000) * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-[#8B92B8] mt-2">of total customers</div>
              </div>
            </div>
            
            <p className="text-[#8B92B8] text-sm">
              Your {data.carrefour.cashback_percent}% cashback campaign is driving strong customer acquisition 
              across Romania. Continue monitoring ROI and customer retention metrics.
            </p>
          </div>
          
          {/* Competitor Comparison */}
          <div 
            className="bg-[#141932] border border-[#252B4A] rounded-xl p-8"
            style={{ animation: 'fadeInUp 0.6s ease-out 0.7s both' }}
          >
            <h2 className="text-2xl font-bold text-white mb-6">Competitor Comparison</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#252B4A]">
                    <th className="text-left p-4 text-sm font-semibold text-[#8B92B8] uppercase tracking-wider">Rank</th>
                    <th className="text-left p-4 text-sm font-semibold text-[#8B92B8] uppercase tracking-wider">Merchant</th>
                    <th className="text-left p-4 text-sm font-semibold text-[#8B92B8] uppercase tracking-wider">Transactions</th>
                    <th className="text-left p-4 text-sm font-semibold text-[#8B92B8] uppercase tracking-wider">Revenue</th>
                    <th className="text-left p-4 text-sm font-semibold text-[#8B92B8] uppercase tracking-wider">Customers</th>
                    <th className="text-left p-4 text-sm font-semibold text-[#8B92B8] uppercase tracking-wider">Cashback</th>
                    <th className="text-left p-4 text-sm font-semibold text-[#8B92B8] uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.competitors.map((comp) => (
                    <tr 
                      key={comp.merchant_name}
                      className={`border-b border-[#252B4A] hover:bg-[#0A0E27] transition-colors ${
                        comp.isYou ? 'bg-[#FF6B35]/5' : ''
                      }`}
                    >
                      <td className="p-4">
                        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-sm font-bold ${
                          comp.isYou 
                            ? 'bg-gradient-to-br from-[#FF6B35] to-[#7B61FF] text-white' 
                            : 'bg-[#1C2342] text-white'
                        }`}>
                          {comp.rank}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold font-mono text-white">{comp.merchant_name}</div>
                        {comp.isYou && (
                          <div className="text-xs text-[#FF6B35]">That's you!</div>
                        )}
                      </td>
                      <td className="p-4 font-mono text-white">{formatNumber(comp.transactions)}</td>
                      <td className="p-4 font-mono text-white">{formatCurrency(comp.revenue)}</td>
                      <td className="p-4 font-mono text-white">{formatNumber(comp.customers)}</td>
                      <td className="p-4 font-mono text-white">{comp.cashback_percent}%</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wide ${
                          comp.campaign_active 
                            ? 'bg-[#00D9A3]/10 text-[#00D9A3] border border-[#00D9A3]/30' 
                            : 'bg-[#5A5F7D]/10 text-[#5A5F7D]'
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
      </div>
    </div>
  )
}
// Rebuild trigger Lör 17 Jan 2026 13:38:44 CET
