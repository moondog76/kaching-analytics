'use client'

import { useState, useEffect } from 'react'
import { format, parse } from 'date-fns'

interface CohortData {
  cohorts: Array<{
    cohortMonth: string
    cohortSize: number
    retention: number[]
  }>
  summary: {
    totalCustomers: number
    avgFirstMonthRetention: number
    avgThirdMonthRetention: number
    period: { start: string; end: string }
  }
}

interface CohortAnalysisProps {
  merchantId?: string
}

export default function CohortAnalysis({ merchantId }: CohortAnalysisProps) {
  const [data, setData] = useState<CohortData | null>(null)
  const [loading, setLoading] = useState(true)
  const [months, setMonths] = useState(6)

  useEffect(() => {
    fetchCohortData()
  }, [merchantId, months])

  const fetchCohortData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ months: months.toString() })
      if (merchantId) params.set('merchantId', merchantId)

      const res = await fetch(`/api/cohort?${params}`)
      if (res.ok) {
        const data = await res.json()
        setData(data)
      }
    } catch (error) {
      console.error('Failed to fetch cohort data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRetentionColor = (value: number): string => {
    if (value >= 80) return 'bg-emerald-500 text-white'
    if (value >= 60) return 'bg-emerald-400 text-white'
    if (value >= 40) return 'bg-emerald-300 text-emerald-900'
    if (value >= 20) return 'bg-emerald-200 text-emerald-800'
    if (value >= 10) return 'bg-emerald-100 text-emerald-700'
    return 'bg-slate-100 text-slate-500'
  }

  const formatMonthLabel = (monthStr: string): string => {
    try {
      const date = parse(monthStr, 'yyyy-MM', new Date())
      return format(date, 'MMM yyyy')
    } catch {
      return monthStr
    }
  }

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-card p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/4 mb-4" />
          <div className="h-4 bg-slate-100 rounded w-1/2 mb-6" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-slate-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-card p-6">
        <p className="text-slate-500">Failed to load cohort data</p>
      </div>
    )
  }

  const maxMonths = Math.max(...data.cohorts.map(c => c.retention.length))

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Customer Cohort Analysis
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Track customer retention over time by acquisition cohort
          </p>
        </div>

        <select
          value={months}
          onChange={(e) => setMonths(parseInt(e.target.value))}
          className="bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:border-blue-500"
        >
          <option value={3}>3 months</option>
          <option value={6}>6 months</option>
          <option value={9}>9 months</option>
          <option value={12}>12 months</option>
        </select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Customers</div>
          <div className="text-2xl font-semibold text-slate-800 mt-1">{data.summary.totalCustomers.toLocaleString()}</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Avg. 1st Month Retention</div>
          <div className="text-2xl font-semibold text-emerald-600 mt-1">{data.summary.avgFirstMonthRetention}%</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Avg. 3rd Month Retention</div>
          <div className="text-2xl font-semibold text-blue-600 mt-1">{data.summary.avgThirdMonthRetention}%</div>
        </div>
      </div>

      {/* Cohort Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left px-3 py-2 text-xs font-medium text-slate-500 uppercase tracking-wide bg-slate-50 rounded-tl-lg">
                Cohort
              </th>
              <th className="text-center px-3 py-2 text-xs font-medium text-slate-500 uppercase tracking-wide bg-slate-50">
                Size
              </th>
              {[...Array(maxMonths)].map((_, i) => (
                <th
                  key={i}
                  className={`text-center px-3 py-2 text-xs font-medium text-slate-500 uppercase tracking-wide bg-slate-50 ${
                    i === maxMonths - 1 ? 'rounded-tr-lg' : ''
                  }`}
                >
                  {i === 0 ? 'Mo. 0' : `Mo. ${i}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.cohorts.map((cohort, rowIndex) => (
              <tr key={cohort.cohortMonth} className="border-b border-slate-100 last:border-0">
                <td className="px-3 py-2.5 text-sm font-medium text-slate-700">
                  {formatMonthLabel(cohort.cohortMonth)}
                </td>
                <td className="px-3 py-2.5 text-sm text-center text-slate-600">
                  {cohort.cohortSize}
                </td>
                {[...Array(maxMonths)].map((_, colIndex) => {
                  const retention = cohort.retention[colIndex]
                  if (retention === undefined) {
                    return (
                      <td key={colIndex} className="px-3 py-2.5">
                        <div className="w-full h-8" />
                      </td>
                    )
                  }
                  return (
                    <td key={colIndex} className="px-1 py-1">
                      <div
                        className={`w-full h-8 rounded flex items-center justify-center text-xs font-medium ${getRetentionColor(retention)}`}
                      >
                        {retention}%
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs">
            <span className="text-slate-500">Retention:</span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-emerald-500" />
                <span className="text-slate-600">80%+</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-emerald-300" />
                <span className="text-slate-600">40-60%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-emerald-100" />
                <span className="text-slate-600">10-20%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-slate-100" />
                <span className="text-slate-600">&lt;10%</span>
              </div>
            </div>
          </div>
          <span className="text-xs text-slate-400">
            {data.summary.period.start} - {data.summary.period.end}
          </span>
        </div>
      </div>
    </div>
  )
}
