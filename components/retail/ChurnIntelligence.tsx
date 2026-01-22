'use client'

import { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Sankey,
  Layer,
  Rectangle
} from 'recharts'
import { ChurnAnalysis, ChurnDestination } from '@/types/analytics'

// Pluxee chart colors
const CHART_COLORS = {
  new: '#00EB5E',      // Ultra Green
  retained: '#17CCF9', // Boldly Blue
  churned: '#FF7375',  // Coral
}

const COMPETITOR_COLORS = ['#221C46', '#17CCF9', '#FFDC37', '#FF7375', '#8B5CF6', '#14B8A6']

interface ChurnIntelligenceProps {
  data: ChurnAnalysis
  merchantName: string
}

export default function ChurnIntelligence({ data, merchantName }: ChurnIntelligenceProps) {
  const [activeView, setActiveView] = useState<'overview' | 'destinations' | 'sources'>('overview')

  const { summary, churnDestinations, newCustomerSources } = data

  // Pie chart data for customer breakdown
  const customerBreakdown = [
    { name: 'New', value: summary.newCustomers, percentage: summary.newCustomersPercentage, color: CHART_COLORS.new },
    { name: 'Retained', value: summary.retainedCustomers, percentage: summary.retainedCustomersPercentage, color: CHART_COLORS.retained },
    { name: 'Churned', value: summary.churnedCustomers, percentage: summary.churnedCustomersPercentage, color: CHART_COLORS.churned },
  ]

  // Format numbers
  const formatNumber = (value: number) => new Intl.NumberFormat('ro-RO').format(value)

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload
      return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-pluxee-deep-blue">{item.name || item.competitorName}</p>
          <div className="text-sm text-slate-600">
            {item.customerCount && <div>Customers: {formatNumber(item.customerCount)}</div>}
            {item.sowDifference !== undefined && (
              <div className={item.sowDifference >= 0 ? 'text-pluxee-ultra-green' : 'text-pluxee-coral'}>
                SoW Change: {item.sowDifference >= 0 ? '+' : ''}{item.sowDifference.toFixed(1)}pp
              </div>
            )}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="pluxee-section-header">Churn Intelligence</h2>
          <p className="pluxee-section-subheader">
            Understand customer flow and retention patterns
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setActiveView('overview')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeView === 'overview'
                ? 'bg-white text-pluxee-deep-blue shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveView('destinations')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeView === 'destinations'
                ? 'bg-white text-pluxee-deep-blue shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Where They Went
          </button>
          <button
            onClick={() => setActiveView('sources')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeView === 'sources'
                ? 'bg-white text-pluxee-deep-blue shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Where They Came From
          </button>
        </div>
      </div>

      {activeView === 'overview' && (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="pluxee-card">
              <div className="text-sm text-slate-500 mb-1">Total Customers</div>
              <div className="text-2xl font-bold text-pluxee-deep-blue">
                {formatNumber(summary.totalCustomers)}
              </div>
              <div className="text-xs text-slate-400 mt-1">In analysis period</div>
            </div>

            <div className="pluxee-card ring-2 ring-pluxee-ultra-green">
              <div className="text-sm text-slate-500 mb-1">New Customers</div>
              <div className="text-2xl font-bold text-pluxee-ultra-green">
                +{formatNumber(summary.newCustomers)}
              </div>
              <div className="text-xs text-pluxee-ultra-green mt-1">
                {summary.newCustomersPercentage.toFixed(1)}% of total
              </div>
            </div>

            <div className="pluxee-card">
              <div className="text-sm text-slate-500 mb-1">Retained</div>
              <div className="text-2xl font-bold text-pluxee-boldly-blue">
                {formatNumber(summary.retainedCustomers)}
              </div>
              <div className="text-xs text-pluxee-boldly-blue mt-1">
                {summary.retainedCustomersPercentage.toFixed(1)}% retention
              </div>
            </div>

            <div className="pluxee-card ring-2 ring-pluxee-coral">
              <div className="text-sm text-slate-500 mb-1">Churned</div>
              <div className="text-2xl font-bold text-pluxee-coral">
                -{formatNumber(summary.churnedCustomers)}
              </div>
              <div className="text-xs text-pluxee-coral mt-1">
                {summary.churnedCustomersPercentage.toFixed(1)}% churn rate
              </div>
            </div>
          </div>

          {/* Customer Flow Visualization */}
          <div className="pluxee-card">
            <h3 className="font-semibold text-pluxee-deep-blue mb-4">Customer Breakdown</h3>

            <div className="flex items-center gap-8">
              {/* Pie Chart */}
              <div className="w-64 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={customerBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {customerBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="flex-1 space-y-4">
                {customerBreakdown.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm font-medium text-slate-600">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-pluxee-deep-blue">
                        {formatNumber(item.value)}
                      </span>
                      <span className="text-sm text-slate-400 ml-2">
                        ({item.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Net Change */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-center gap-8">
                <div className="text-center">
                  <div className="text-sm text-slate-500">Net Customer Change</div>
                  <div
                    className={`text-2xl font-bold ${
                      summary.newCustomers - summary.churnedCustomers >= 0
                        ? 'text-pluxee-ultra-green'
                        : 'text-pluxee-coral'
                    }`}
                  >
                    {summary.newCustomers - summary.churnedCustomers >= 0 ? '+' : ''}
                    {formatNumber(summary.newCustomers - summary.churnedCustomers)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeView === 'destinations' && (
        <div className="pluxee-card">
          <h3 className="font-semibold text-pluxee-deep-blue mb-2">Where Churned Customers Went</h3>
          <p className="text-sm text-slate-500 mb-6">
            Competitors that gained your former customers, ranked by share of wallet shift
          </p>

          <div className="space-y-4">
            {churnDestinations
              .sort((a, b) => b.customerCount - a.customerCount)
              .map((dest, index) => (
                <div key={dest.competitorId} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-600">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-pluxee-deep-blue">
                        {dest.competitorName}
                      </span>
                      <span className="text-sm text-slate-600">
                        {formatNumber(dest.customerCount)} customers
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-pluxee-coral rounded-full transition-all duration-500"
                        style={{
                          width: `${(dest.customerCount / summary.churnedCustomers) * 100}%`
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1 text-xs">
                      <span className="text-slate-400">
                        SoW: {dest.sowPreviousPeriod.toFixed(1)}% → {dest.sowCurrentPeriod.toFixed(1)}%
                      </span>
                      <span
                        className={
                          dest.sowDifference >= 0 ? 'text-pluxee-coral' : 'text-pluxee-ultra-green'
                        }
                      >
                        {dest.sowDifference >= 0 ? '+' : ''}{dest.sowDifference.toFixed(1)}pp
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {churnDestinations.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              No churn destination data available
            </div>
          )}
        </div>
      )}

      {activeView === 'sources' && (
        <div className="pluxee-card">
          <h3 className="font-semibold text-pluxee-deep-blue mb-2">Where New Customers Came From</h3>
          <p className="text-sm text-slate-500 mb-6">
            Competitors that lost customers to you, ranked by volume
          </p>

          <div className="space-y-4">
            {newCustomerSources
              .sort((a, b) => b.customerCount - a.customerCount)
              .map((source, index) => (
                <div key={source.competitorId} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-pluxee-ultra-green-20 flex items-center justify-center text-sm font-medium text-pluxee-deep-blue">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-pluxee-deep-blue">
                        {source.competitorName}
                      </span>
                      <span className="text-sm text-slate-600">
                        {formatNumber(source.customerCount)} customers
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-pluxee-ultra-green rounded-full transition-all duration-500"
                        style={{
                          width: `${(source.customerCount / summary.newCustomers) * 100}%`
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1 text-xs">
                      <span className="text-slate-400">
                        Their SoW: {source.sowPreviousPeriod.toFixed(1)}% → {source.sowCurrentPeriod.toFixed(1)}%
                      </span>
                      <span
                        className={
                          source.sowDifference <= 0 ? 'text-pluxee-ultra-green' : 'text-pluxee-coral'
                        }
                      >
                        {source.sowDifference >= 0 ? '+' : ''}{source.sowDifference.toFixed(1)}pp
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {newCustomerSources.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              No customer source data available
            </div>
          )}
        </div>
      )}

      {/* Key Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="pluxee-card bg-pluxee-coral-20">
          <div className="text-sm text-slate-600 mb-1">Biggest Threat</div>
          <div className="text-lg font-bold text-pluxee-deep-blue">
            {churnDestinations[0]?.competitorName || 'N/A'}
          </div>
          <div className="text-sm text-pluxee-coral">
            Gained {formatNumber(churnDestinations[0]?.customerCount || 0)} of your customers
          </div>
        </div>

        <div className="pluxee-card bg-pluxee-ultra-green-05">
          <div className="text-sm text-slate-600 mb-1">Best Acquisition Source</div>
          <div className="text-lg font-bold text-pluxee-deep-blue">
            {newCustomerSources[0]?.competitorName || 'N/A'}
          </div>
          <div className="text-sm text-pluxee-ultra-green">
            You gained {formatNumber(newCustomerSources[0]?.customerCount || 0)} of their customers
          </div>
        </div>

        <div className="pluxee-card bg-pluxee-boldly-blue-05">
          <div className="text-sm text-slate-600 mb-1">Retention Health</div>
          <div className="text-lg font-bold text-pluxee-deep-blue">
            {summary.retainedCustomersPercentage.toFixed(1)}%
          </div>
          <div className="text-sm text-pluxee-boldly-blue">
            of customers stayed with you
          </div>
        </div>
      </div>
    </div>
  )
}
