'use client'

import { useState } from 'react'
import { MobilityMatrix as MobilityMatrixData } from '@/types/analytics'

interface MobilityMatrixProps {
  data: MobilityMatrixData
  yourMerchantId?: string
}

export default function MobilityMatrix({ data, yourMerchantId }: MobilityMatrixProps) {
  const [highlightedMerchant, setHighlightedMerchant] = useState<string | null>(null)

  // Get cell value for overlap percentage
  const getCellValue = (fromId: string, toId: string): number => {
    if (fromId === toId) return 100 // Diagonal is always 100%
    const cell = data.cells.find(
      (c) => c.fromMerchantId === fromId && c.toMerchantId === toId
    )
    return cell?.overlapPercentage || 0
  }

  // Get color intensity based on percentage
  const getCellColor = (value: number, isYourRow: boolean, isYourCol: boolean): string => {
    if (value === 100) return 'bg-slate-200' // Diagonal

    const intensity = Math.min(value / 50, 1) // Cap at 50% for full intensity

    if (isYourRow || isYourCol) {
      // Highlight your merchant's row/column with green
      return `bg-pluxee-ultra-green/${Math.round(intensity * 40 + 10)}`
    }

    // Other cells use blue
    return `bg-pluxee-boldly-blue/${Math.round(intensity * 40 + 10)}`
  }

  // Get text color based on value
  const getTextColor = (value: number): string => {
    return value > 30 ? 'text-pluxee-deep-blue font-semibold' : 'text-slate-600'
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="pluxee-section-header">Customer Mobility</h2>
        <p className="pluxee-section-subheader">
          Cross-shopping patterns showing what percentage of each merchant's customers also shop elsewhere
        </p>
      </div>

      {/* Mobility Matrix Heatmap */}
      <div className="pluxee-card overflow-x-auto">
        <h3 className="font-semibold text-pluxee-deep-blue mb-4">Customer Overlap Matrix</h3>
        <p className="text-sm text-slate-500 mb-4">
          Read row-by-row: "X% of [Row Merchant]'s customers also shop at [Column Merchant]"
        </p>

        <div className="min-w-[600px]">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-2 text-left text-xs text-slate-500 font-medium">From / To</th>
                {data.merchants.map((merchant) => (
                  <th
                    key={merchant.id}
                    className={`p-2 text-center text-xs font-medium min-w-[80px] ${
                      merchant.id === yourMerchantId
                        ? 'text-pluxee-ultra-green'
                        : highlightedMerchant === merchant.id
                        ? 'text-pluxee-boldly-blue'
                        : 'text-slate-500'
                    }`}
                    onMouseEnter={() => setHighlightedMerchant(merchant.id)}
                    onMouseLeave={() => setHighlightedMerchant(null)}
                  >
                    {merchant.name}
                    {merchant.id === yourMerchantId && (
                      <span className="block text-[10px] text-pluxee-ultra-green">(You)</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.merchants.map((fromMerchant) => (
                <tr
                  key={fromMerchant.id}
                  className={
                    highlightedMerchant === fromMerchant.id ? 'bg-slate-50' : ''
                  }
                  onMouseEnter={() => setHighlightedMerchant(fromMerchant.id)}
                  onMouseLeave={() => setHighlightedMerchant(null)}
                >
                  <td
                    className={`p-2 text-xs font-medium ${
                      fromMerchant.id === yourMerchantId
                        ? 'text-pluxee-ultra-green'
                        : 'text-slate-600'
                    }`}
                  >
                    {fromMerchant.name}
                    {fromMerchant.id === yourMerchantId && ' (You)'}
                  </td>
                  {data.merchants.map((toMerchant) => {
                    const value = getCellValue(fromMerchant.id, toMerchant.id)
                    const isYourRow = fromMerchant.id === yourMerchantId
                    const isYourCol = toMerchant.id === yourMerchantId
                    const isDiagonal = fromMerchant.id === toMerchant.id

                    return (
                      <td
                        key={toMerchant.id}
                        className={`p-2 text-center text-sm transition-colors ${getCellColor(
                          value,
                          isYourRow,
                          isYourCol
                        )} ${getTextColor(value)} ${
                          isDiagonal ? 'bg-slate-100' : ''
                        } ${
                          (highlightedMerchant === fromMerchant.id ||
                            highlightedMerchant === toMerchant.id) &&
                          !isDiagonal
                            ? 'ring-1 ring-inset ring-slate-300'
                            : ''
                        }`}
                      >
                        {isDiagonal ? '-' : `${value.toFixed(0)}%`}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-6 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-pluxee-ultra-green/30 rounded" />
              <span>Your merchant's overlap</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-pluxee-boldly-blue/30 rounded" />
              <span>Competitor overlap</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-slate-100 rounded" />
              <span>Same merchant (diagonal)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Single-Merchant Loyalty */}
      <div className="pluxee-card">
        <h3 className="font-semibold text-pluxee-deep-blue mb-4">Single-Merchant Loyalty</h3>
        <p className="text-sm text-slate-500 mb-4">
          Percentage of customers who shop exclusively at one merchant
        </p>

        <div className="space-y-3">
          {data.singleMerchantLoyalty
            .sort((a, b) => b.percentage - a.percentage)
            .map((item) => {
              const isYou = item.merchantId === yourMerchantId
              const merchant = data.merchants.find((m) => m.id === item.merchantId)

              return (
                <div key={item.merchantId} className="flex items-center gap-4">
                  <div className="w-32 text-sm text-slate-600 truncate">
                    {merchant?.name || item.merchantId}
                    {isYou && (
                      <span className="ml-1 text-pluxee-ultra-green font-medium">(You)</span>
                    )}
                  </div>
                  <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2 ${
                        isYou ? 'bg-pluxee-ultra-green' : 'bg-pluxee-boldly-blue'
                      }`}
                      style={{ width: `${Math.max(item.percentage, 5)}%` }}
                    >
                      {item.percentage > 10 && (
                        <span className="text-xs font-medium text-pluxee-deep-blue">
                          {item.percentage.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                  {item.percentage <= 10 && (
                    <span className="text-xs text-slate-500 w-12">
                      {item.percentage.toFixed(1)}%
                    </span>
                  )}
                </div>
              )
            })}
        </div>

        <p className="text-xs text-slate-400 mt-4">
          Higher loyalty percentage indicates less cross-shopping with competitors
        </p>
      </div>

      {/* Key Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Highest Overlap */}
        {(() => {
          const yourCells = data.cells.filter(
            (c) => c.fromMerchantId === yourMerchantId && c.toMerchantId !== yourMerchantId
          )
          const highestOverlap = yourCells.sort((a, b) => b.overlapPercentage - a.overlapPercentage)[0]
          const competitor = data.merchants.find((m) => m.id === highestOverlap?.toMerchantId)

          return (
            <div className="pluxee-card bg-pluxee-coral-20">
              <div className="text-sm text-slate-600 mb-1">Highest Customer Overlap</div>
              <div className="text-xl font-bold text-pluxee-deep-blue">
                {highestOverlap?.overlapPercentage.toFixed(1)}%
              </div>
              <div className="text-sm text-pluxee-coral">
                with {competitor?.name || 'Unknown'}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                This competitor shares the most customers with you
              </p>
            </div>
          )
        })()}

        {/* Lowest Overlap */}
        {(() => {
          const yourCells = data.cells.filter(
            (c) => c.fromMerchantId === yourMerchantId && c.toMerchantId !== yourMerchantId
          )
          const lowestOverlap = yourCells.sort((a, b) => a.overlapPercentage - b.overlapPercentage)[0]
          const competitor = data.merchants.find((m) => m.id === lowestOverlap?.toMerchantId)

          return (
            <div className="pluxee-card bg-pluxee-ultra-green-05">
              <div className="text-sm text-slate-600 mb-1">Lowest Customer Overlap</div>
              <div className="text-xl font-bold text-pluxee-deep-blue">
                {lowestOverlap?.overlapPercentage.toFixed(1)}%
              </div>
              <div className="text-sm text-pluxee-ultra-green">
                with {competitor?.name || 'Unknown'}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Growth opportunity - their customers don't shop with you yet
              </p>
            </div>
          )
        })()}

        {/* Your Loyalty */}
        {(() => {
          const yourLoyalty = data.singleMerchantLoyalty.find(
            (l) => l.merchantId === yourMerchantId
          )

          return (
            <div className="pluxee-card bg-pluxee-boldly-blue-05">
              <div className="text-sm text-slate-600 mb-1">Your Customer Loyalty</div>
              <div className="text-xl font-bold text-pluxee-deep-blue">
                {yourLoyalty?.percentage.toFixed(1) || '0'}%
              </div>
              <div className="text-sm text-pluxee-boldly-blue">shop exclusively with you</div>
              <p className="text-xs text-slate-500 mt-2">
                These customers don't cross-shop with competitors
              </p>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
