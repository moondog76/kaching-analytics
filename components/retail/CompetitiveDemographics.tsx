'use client'

import { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts'
import { AgeDistributionBucket, TimeSeriesDataPoint, BarChartDataPoint } from '@/types/analytics'

// Pluxee chart colors
const CHART_COLORS = [
  '#00EB5E', // Ultra Green (you)
  '#17CCF9', // Boldly Blue
  '#FFDC37', // Very Yellow
  '#FF7375', // Coral
  '#221C46', // Deep Blue
]

interface CompetitiveDemographicsProps {
  ageDistribution: { merchantName: string; distribution: AgeDistributionBucket[]; isYou?: boolean }[]
  genderByCustomers: BarChartDataPoint[]
  avgAgeHistory: TimeSeriesDataPoint[]
  merchants: { id: string; name: string; isYou?: boolean }[]
}

export default function CompetitiveDemographics({
  ageDistribution,
  genderByCustomers,
  avgAgeHistory,
  merchants
}: CompetitiveDemographicsProps) {
  const [selectedMerchant, setSelectedMerchant] = useState<string | 'all'>('all')

  // Transform age distribution for grouped bar chart
  const ageChartData = ageDistribution[0]?.distribution.map((bucket, index) => {
    const dataPoint: any = { ageGroup: bucket.label }
    ageDistribution.forEach((merchant) => {
      dataPoint[merchant.merchantName] = merchant.distribution[index]?.percentage || 0
    })
    return dataPoint
  }) || []

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-pluxee-deep-blue mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-slate-600">{entry.name}:</span>
              <span className="font-medium text-pluxee-deep-blue">
                {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
                {entry.unit || '%'}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="pluxee-section-header">Competitive Demographics</h2>
        <p className="pluxee-section-subheader">Age and gender distribution across the market</p>
      </div>

      {/* Age Distribution Comparison */}
      <div className="pluxee-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-pluxee-deep-blue">Age Distribution Comparison</h3>
          <select
            value={selectedMerchant}
            onChange={(e) => setSelectedMerchant(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-pluxee-deep-blue focus:border-pluxee-ultra-green focus:ring-2 focus:ring-pluxee-ultra-green/20"
          >
            <option value="all">All Merchants</option>
            {merchants.map((m) => (
              <option key={m.id} value={m.name}>
                {m.name} {m.isYou ? '(You)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ageChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="0" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="ageGroup"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#64748B' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#64748B' }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                formatter={(value) => <span className="text-sm text-slate-600">{value}</span>}
              />
              {ageDistribution
                .filter((m) => selectedMerchant === 'all' || m.merchantName === selectedMerchant)
                .map((merchant, index) => (
                  <Bar
                    key={merchant.merchantName}
                    dataKey={merchant.merchantName}
                    name={merchant.merchantName}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gender Distribution */}
        <div className="pluxee-card">
          <h3 className="font-semibold text-pluxee-deep-blue mb-4">Gender by Customer Count</h3>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={genderByCustomers}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="0" stroke="#F1F5F9" horizontal={true} vertical={false} />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748B' }}
                  tickFormatter={(value) => `${value}%`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748B' }}
                  width={70}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={36}
                  formatter={(value) => <span className="text-sm text-slate-600">{value}</span>}
                />
                <Bar dataKey="male" name="Male" fill="#17CCF9" stackId="gender" />
                <Bar dataKey="female" name="Female" fill="#FF7375" stackId="gender" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Average Age Over Time */}
        <div className="pluxee-card">
          <h3 className="font-semibold text-pluxee-deep-blue mb-4">Average Age Over Time</h3>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={avgAgeHistory} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="0" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748B' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748B' }}
                  domain={['auto', 'auto']}
                  tickFormatter={(value) => `${value}y`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  formatter={(value) => <span className="text-sm text-slate-600">{value}</span>}
                />
                {merchants.map((merchant, index) => (
                  <Line
                    key={merchant.id}
                    type="monotone"
                    dataKey={merchant.name}
                    name={merchant.name}
                    stroke={CHART_COLORS[index % CHART_COLORS.length]}
                    strokeWidth={merchant.isYou ? 3 : 2}
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 2 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Demographics Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {ageDistribution.slice(0, 4).map((merchant, index) => {
          const peakAge = merchant.distribution.reduce((max, bucket) =>
            bucket.percentage > max.percentage ? bucket : max
          )
          const avgAge = merchant.distribution.reduce((sum, bucket, idx) => {
            const midAge = (bucket.ageMin + bucket.ageMax) / 2
            return sum + midAge * (bucket.percentage / 100)
          }, 0)

          return (
            <div
              key={merchant.merchantName}
              className={`pluxee-card ${merchant.isYou ? 'ring-2 ring-pluxee-ultra-green' : ''}`}
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                />
                <span className="text-sm font-medium text-slate-600 truncate">
                  {merchant.merchantName}
                </span>
                {merchant.isYou && (
                  <span className="pluxee-badge pluxee-badge--premium text-xs">You</span>
                )}
              </div>
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-slate-500">Peak Age Group</div>
                  <div className="text-lg font-bold text-pluxee-deep-blue">{peakAge.label}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Avg Customer Age</div>
                  <div className="text-lg font-bold text-pluxee-deep-blue">{avgAge.toFixed(0)} years</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
