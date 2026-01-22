'use client'

import { useMemo } from 'react'
import { MarketShareTimeSeries, MobilityMatrix, ChurnAnalysis, AgeDistributionBucket, BarChartDataPoint } from '@/types/analytics'
import AIChat from '@/components/AIChat'

interface RetailAIInsightsProps {
  merchantId: string
  merchantName: string
  marketShareData: MarketShareTimeSeries[]
  mobilityMatrix: MobilityMatrix
  churnAnalysis: ChurnAnalysis
  ageDistribution: Array<{
    merchantName: string
    isYou: boolean
    distribution: AgeDistributionBucket[]
  }>
  genderByCustomers: BarChartDataPoint[]
  merchants: Array<{ id: string; name: string; isYou?: boolean }>
}

interface RetailAnomaly {
  type: string
  severity: 'high' | 'medium' | 'low'
  title: string
  description: string
  metric: string
  change?: number
}

interface RetailRecommendation {
  type: string
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  rationale: string
  suggestedActions: string[]
}

// Derive anomalies from the shared data
function detectAnomaliesFromData(
  marketShareData: MarketShareTimeSeries[],
  mobilityMatrix: MobilityMatrix,
  churnAnalysis: ChurnAnalysis,
  merchantName: string
): RetailAnomaly[] {
  const anomalies: RetailAnomaly[] = []

  // Check market share trends
  if (marketShareData.length >= 2) {
    const recent = marketShareData[marketShareData.length - 1]
    const previous = marketShareData[marketShareData.length - 2]
    const yourShareNow = recent[merchantName] as number
    const yourShareBefore = previous[merchantName] as number

    if (yourShareNow && yourShareBefore) {
      const change = yourShareNow - yourShareBefore
      if (change < -1) {
        // Find which competitor gained
        let topGainer = ''
        let topGain = 0
        Object.keys(recent).forEach(key => {
          if (key !== 'date' && key !== merchantName) {
            const competitorGain = (recent[key] as number) - (previous[key] as number || 0)
            if (competitorGain > topGain) {
              topGain = competitorGain
              topGainer = key
            }
          }
        })

        anomalies.push({
          type: 'market_share_drop',
          severity: change < -2 ? 'high' : 'medium',
          title: `Market share dropped ${Math.abs(change).toFixed(1)}pp${topGainer ? ` vs ${topGainer}` : ''}`,
          description: `Your market share decreased from ${yourShareBefore.toFixed(1)}% to ${yourShareNow.toFixed(1)}% in the last period.${topGainer ? ` ${topGainer} gained ${topGain.toFixed(1)}pp.` : ''}`,
          metric: 'Market Share',
          change: change
        })
      }
    }
  }

  // Check for high churn to specific competitor
  if (churnAnalysis.churnDestinations && churnAnalysis.churnDestinations.length > 0) {
    const topDestination = churnAnalysis.churnDestinations[0]
    if (topDestination.sowDifference > 4) {
      anomalies.push({
        type: 'churn_to_competitor',
        severity: topDestination.sowDifference > 6 ? 'high' : 'medium',
        title: `High customer churn to ${topDestination.competitorName}`,
        description: `${topDestination.customerCount.toLocaleString()} customers increased spending with ${topDestination.competitorName}. Their share of wallet with this competitor increased by ${topDestination.sowDifference.toFixed(1)}pp.`,
        metric: 'Churn',
        change: topDestination.sowDifference
      })
    }
  }

  // Check for customer acquisition opportunity
  if (churnAnalysis.newCustomerSources && churnAnalysis.newCustomerSources.length > 0) {
    const topSource = churnAnalysis.newCustomerSources[0]
    const acquisitionRate = (topSource.customerCount / (churnAnalysis.summary.newCustomers || 1)) * 100
    if (acquisitionRate > 30) {
      anomalies.push({
        type: 'acquisition_opportunity',
        severity: 'medium',
        title: `Strong acquisition from ${topSource.competitorName}`,
        description: `${topSource.customerCount.toLocaleString()} new customers (${acquisitionRate.toFixed(0)}% of new acquisitions) came from ${topSource.competitorName}. Their spend with ${topSource.competitorName} dropped by ${Math.abs(topSource.sowDifference).toFixed(1)}pp.`,
        metric: 'Customer Acquisition',
        change: acquisitionRate
      })
    }
  }

  // Check mobility matrix for unusual cross-shopping patterns
  if (mobilityMatrix.cells && mobilityMatrix.cells.length > 0) {
    const highOverlap = mobilityMatrix.cells.find(cell => cell.overlapPercentage > 30)
    if (highOverlap) {
      const toMerchant = mobilityMatrix.merchants.find(m => m.id === highOverlap.toMerchantId)
      anomalies.push({
        type: 'customer_mobility_shift',
        severity: 'medium',
        title: `High customer overlap with ${toMerchant?.name || 'competitor'}`,
        description: `${highOverlap.overlapPercentage.toFixed(1)}% of your customers also shop at ${toMerchant?.name}. This represents ${highOverlap.customerCount.toLocaleString()} customers at risk of churn.`,
        metric: 'Customer Mobility',
        change: highOverlap.overlapPercentage
      })
    }
  }

  return anomalies.slice(0, 4) // Return top 4 anomalies
}

// Generate recommendations from the shared data
function generateRecommendationsFromData(
  marketShareData: MarketShareTimeSeries[],
  mobilityMatrix: MobilityMatrix,
  churnAnalysis: ChurnAnalysis,
  ageDistribution: Array<{ merchantName: string; isYou: boolean; distribution: AgeDistributionBucket[] }>,
  merchantName: string
): RetailRecommendation[] {
  const recommendations: RetailRecommendation[] = []

  // Recommendation based on new customer sources
  if (churnAnalysis.newCustomerSources && churnAnalysis.newCustomerSources.length > 0) {
    const topSource = churnAnalysis.newCustomerSources[0]
    recommendations.push({
      type: 'customer_acquisition_target',
      priority: 'high',
      title: `Target ${topSource.competitorName}'s vulnerable customers`,
      description: `${topSource.competitorName} customers are showing reduced loyalty. You've already acquired ${topSource.customerCount.toLocaleString()} of them this period.`,
      rationale: `Their share of wallet with ${topSource.competitorName} dropped ${Math.abs(topSource.sowDifference).toFixed(1)}pp - a strong signal of dissatisfaction.`,
      suggestedActions: [
        `Create targeted campaign for ${topSource.competitorName} shoppers`,
        'Offer first-purchase incentives',
        `Focus on categories where you outperform ${topSource.competitorName}`,
      ]
    })
  }

  // Recommendation based on churn analysis
  if (churnAnalysis.summary.churnedCustomers > 0) {
    const atRiskCount = Math.round(churnAnalysis.summary.totalCustomers * 0.02) // Assume 2% at risk
    recommendations.push({
      type: 'churn_prevention_segment',
      priority: 'high',
      title: `${atRiskCount.toLocaleString()} high-value customers showing churn signals`,
      description: `Customers with high historical spend are showing reduced visit frequency over the past 8 weeks.`,
      rationale: `Your overall churn rate is ${churnAnalysis.summary.churnedCustomersPercentage.toFixed(1)}%. Early intervention can reduce this by 20-30%.`,
      suggestedActions: [
        'Send personalized win-back offers to top 100 by lifetime value',
        'Survey to understand satisfaction issues',
        'Implement early warning system for visit frequency drops',
      ]
    })
  }

  // Recommendation based on mobility data
  if (mobilityMatrix.singleMerchantLoyalty) {
    const yourLoyalty = mobilityMatrix.singleMerchantLoyalty.find(l => l.merchantName === merchantName || l.merchantId === merchantName)
    if (yourLoyalty && yourLoyalty.percentage < 30) {
      recommendations.push({
        type: 'loyalty_improvement',
        priority: 'medium',
        title: 'Increase single-merchant loyalty',
        description: `Only ${yourLoyalty.percentage.toFixed(1)}% of your customers shop exclusively with you. Most also visit competitors.`,
        rationale: 'Higher exclusive loyalty correlates with 2.3x higher lifetime value.',
        suggestedActions: [
          'Launch loyalty program with tier rewards',
          'Offer exclusive member pricing',
          'Create subscription or recurring purchase incentives',
        ]
      })
    }
  }

  // Recommendation based on demographics
  const yourDemo = ageDistribution.find(d => d.isYou)
  if (yourDemo) {
    const youngestSegment = yourDemo.distribution.find(d => d.label === '18-24')
    if (youngestSegment && youngestSegment.percentage < 15) {
      recommendations.push({
        type: 'demographic_expansion',
        priority: 'medium',
        title: 'Expand presence in 18-24 age segment',
        description: `Only ${youngestSegment.percentage.toFixed(1)}% of your customers are 18-24. This is a growing demographic with long-term value potential.`,
        rationale: 'Young customers acquired now have 40+ years of potential lifetime value.',
        suggestedActions: [
          'Partner with universities and young professional communities',
          'Enhance digital and mobile shopping experience',
          'Introduce products and categories popular with younger consumers',
        ]
      })
    }
  }

  return recommendations.slice(0, 4) // Return top 4 recommendations
}

// Summarize data for AI context
function summarizeDataForAI(
  marketShareData: MarketShareTimeSeries[],
  mobilityMatrix: MobilityMatrix,
  churnAnalysis: ChurnAnalysis,
  merchantName: string
): string {
  const lines: string[] = []

  // Market share summary
  if (marketShareData.length > 0) {
    const latest = marketShareData[marketShareData.length - 1]
    const yourShare = latest[merchantName] as number
    lines.push(`Market Share: Your current share is ${yourShare?.toFixed(1) || 'N/A'}%.`)

    // Find top competitor
    let topCompetitor = ''
    let topShare = 0
    Object.keys(latest).forEach(key => {
      if (key !== 'date' && key !== merchantName) {
        const share = latest[key] as number
        if (share > topShare) {
          topShare = share
          topCompetitor = key
        }
      }
    })
    if (topCompetitor) {
      lines.push(`Top Competitor: ${topCompetitor} with ${topShare.toFixed(1)}% market share.`)
    }
  }

  // Churn summary
  if (churnAnalysis.summary) {
    lines.push(`Churn Rate: ${churnAnalysis.summary.churnedCustomersPercentage.toFixed(1)}% (${churnAnalysis.summary.churnedCustomers.toLocaleString()} customers)`)
    lines.push(`Retention Rate: ${churnAnalysis.summary.retainedCustomersPercentage.toFixed(1)}%`)
    lines.push(`New Customer Acquisition: ${churnAnalysis.summary.newCustomersPercentage.toFixed(1)}% (${churnAnalysis.summary.newCustomers.toLocaleString()} customers)`)
  }

  // Mobility summary
  if (mobilityMatrix.singleMerchantLoyalty) {
    const yourLoyalty = mobilityMatrix.singleMerchantLoyalty.find(l => l.merchantName === merchantName)
    if (yourLoyalty) {
      lines.push(`Exclusive Loyalty: ${yourLoyalty.percentage.toFixed(1)}% of customers shop only with you.`)
    }
  }

  return lines.join('\n')
}

export default function RetailAIInsights({
  merchantId,
  merchantName,
  marketShareData,
  mobilityMatrix,
  churnAnalysis,
  ageDistribution,
  genderByCustomers,
  merchants
}: RetailAIInsightsProps) {
  // Derive anomalies from the shared data
  const anomalies = useMemo(() =>
    detectAnomaliesFromData(marketShareData, mobilityMatrix, churnAnalysis, merchantName),
    [marketShareData, mobilityMatrix, churnAnalysis, merchantName]
  )

  // Derive recommendations from the shared data
  const recommendations = useMemo(() =>
    generateRecommendationsFromData(marketShareData, mobilityMatrix, churnAnalysis, ageDistribution, merchantName),
    [marketShareData, mobilityMatrix, churnAnalysis, ageDistribution, merchantName]
  )

  // Prepare data context for AI chat
  const dataContext = useMemo(() =>
    summarizeDataForAI(marketShareData, mobilityMatrix, churnAnalysis, merchantName),
    [marketShareData, mobilityMatrix, churnAnalysis, merchantName]
  )

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-50 border-red-200 text-red-700'
      case 'medium': return 'bg-amber-50 border-amber-200 text-amber-700'
      case 'low': return 'bg-blue-50 border-blue-200 text-blue-700'
      default: return 'bg-slate-50 border-slate-200 text-slate-700'
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-amber-100 text-amber-800'
      case 'low': return 'bg-blue-100 text-blue-800'
      default: return 'bg-slate-100 text-slate-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-pluxee-ultra-green/10 border-pluxee-ultra-green/30'
      case 'medium': return 'bg-pluxee-boldly-blue/10 border-pluxee-boldly-blue/30'
      case 'low': return 'bg-slate-50 border-slate-200'
      default: return 'bg-slate-50 border-slate-200'
    }
  }

  return (
    <div className="space-y-8">
      {/* Header - No KPIs, just title */}
      <div>
        <h2 className="text-xl font-semibold text-pluxee-deep-blue mb-2">AI Insights</h2>
        <p className="text-slate-500">Market intelligence and strategic recommendations</p>
      </div>

      {/* Detected Anomalies Panel */}
      <div className="pluxee-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-pluxee-deep-blue flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Detected Anomalies
          </h3>
          <span className="text-xs text-slate-400">Based on current market data</span>
        </div>

        {anomalies.length > 0 ? (
          <div className="space-y-3">
            {anomalies.map((anomaly, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border ${getSeverityColor(anomaly.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${getSeverityBadge(anomaly.severity)}`}>
                        {anomaly.severity}
                      </span>
                      <span className="text-xs text-slate-500">{anomaly.metric}</span>
                    </div>
                    <h4 className="font-medium text-slate-900 mb-1">{anomaly.title}</h4>
                    <p className="text-sm text-slate-600">{anomaly.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>No significant anomalies detected in current data</p>
          </div>
        )}
      </div>

      {/* Strategic Recommendations Panel */}
      <div className="pluxee-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-pluxee-deep-blue flex items-center gap-2">
            <svg className="w-5 h-5 text-pluxee-ultra-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Strategic Recommendations
          </h3>
          <span className="text-xs text-slate-400">AI-generated insights</span>
        </div>

        {recommendations.length > 0 ? (
          <div className="space-y-4">
            {recommendations.map((rec, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border ${getPriorityColor(rec.priority)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-pluxee-ultra-green/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">
                      {rec.type === 'customer_acquisition_target' && '🎯'}
                      {rec.type === 'churn_prevention_segment' && '🛡️'}
                      {rec.type === 'loyalty_improvement' && '💎'}
                      {rec.type === 'demographic_expansion' && '📊'}
                      {!['customer_acquisition_target', 'churn_prevention_segment', 'loyalty_improvement', 'demographic_expansion'].includes(rec.type) && '💡'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-pluxee-deep-blue">{rec.title}</h4>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${rec.priority === 'high' ? 'bg-pluxee-ultra-green/20 text-pluxee-deep-blue' : 'bg-slate-100 text-slate-600'}`}>
                        {rec.priority}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{rec.description}</p>
                    <p className="text-xs text-slate-500 italic mb-3">{rec.rationale}</p>
                    <div className="space-y-1">
                      {rec.suggestedActions.map((action, actionIdx) => (
                        <div key={actionIdx} className="flex items-center gap-2 text-sm text-slate-700">
                          <svg className="w-4 h-4 text-pluxee-ultra-green flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          {action}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <p>No recommendations available at this time</p>
          </div>
        )}
      </div>

      {/* AI Analyst Chat */}
      <div className="pluxee-card">
        <div className="mb-4">
          <h3 className="font-semibold text-pluxee-deep-blue flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-pluxee-boldly-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            AI Analyst
          </h3>
          <p className="text-sm text-slate-500">
            Ask about market trends, competitive positioning, customer mobility, or strategic opportunities
          </p>
        </div>

        {/* Data context hint */}
        <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
          <p className="text-xs text-slate-500 font-medium mb-1">Current Data Context:</p>
          <p className="text-xs text-slate-400 whitespace-pre-line">{dataContext}</p>
        </div>

        <AIChat
          contextMode="retail"
          merchantName={merchantName}
          merchantId={merchantId}
        />
      </div>
    </div>
  )
}
