import { MerchantMetrics, CompetitorData, Insight, TimeSeriesPoint, Anomaly } from './types'
import { format, subDays, isWeekend } from 'date-fns'

export class InsightsEngine {
  
  /**
   * Main entry point: Analyze data and generate actionable insights
   */
  static async detectInsights(
    currentData: MerchantMetrics,
    historicalData: MerchantMetrics[],
    competitors: CompetitorData[]
  ): Promise<Insight[]> {
    const insights: Insight[] = []
    
    // 1. Trend Analysis
    insights.push(...this.analyzeTrends(currentData, historicalData))
    
    // 2. Competitive Positioning
    insights.push(...this.analyzeCompetitivePosition(currentData, competitors))
    
    // 3. Efficiency Metrics
    insights.push(...this.analyzeEfficiency(currentData, historicalData))
    
    // 4. Growth Opportunities
    insights.push(...this.identifyOpportunities(currentData, historicalData, competitors))
    
    // 5. Risk Factors
    insights.push(...this.identifyRisks(currentData, historicalData))
    
    // Sort by impact and confidence
    return insights
      .sort((a, b) => {
        const scoreA = this.calculateInsightScore(a)
        const scoreB = this.calculateInsightScore(b)
        return scoreB - scoreA
      })
      .slice(0, 10) // Top 10 insights
  }
  
  /**
   * Analyze trends over time
   */
  private static analyzeTrends(
    current: MerchantMetrics,
    historical: MerchantMetrics[]
  ): Insight[] {
    const insights: Insight[] = []
    
    if (historical.length < 7) return insights
    
    const lastWeek = historical.slice(-7)
    const avgLastWeek = this.average(lastWeek.map(d => d.transactions))
    const transactionChange = (current.transactions - avgLastWeek) / avgLastWeek
    
    // Significant transaction change
    if (Math.abs(transactionChange) > 0.15) {
      insights.push({
        id: `trend-transactions-${Date.now()}`,
        type: transactionChange > 0 ? 'opportunity' : 'warning',
        severity: Math.abs(transactionChange) > 0.25 ? 'high' : 'medium',
        title: `Transactions ${transactionChange > 0 ? 'surging' : 'declining'} ${Math.abs(transactionChange * 100).toFixed(0)}%`,
        description: `Your transaction count is ${Math.abs(transactionChange * 100).toFixed(0)}% ${transactionChange > 0 ? 'higher' : 'lower'} than last week's average. ${
          transactionChange > 0 
            ? 'This growth momentum presents an opportunity to scale.' 
            : 'This decline requires immediate attention to prevent further losses.'
        }`,
        metric: 'transactions',
        impact: {
          current_value: current.transactions,
          change_percent: transactionChange * 100,
          change_absolute: current.transactions - avgLastWeek
        },
        context: `Last week average: ${avgLastWeek.toFixed(0)} transactions/day`,
        actionable_recommendations: transactionChange > 0 
          ? [
              'Investigate what\'s driving this growth (seasonality, marketing, word-of-mouth)',
              'Consider increasing campaign budget to capitalize on momentum',
              'Monitor closely to ensure growth is sustainable'
            ]
          : [
              'Check for technical issues affecting checkout flow',
              'Review recent competitor campaigns that may be drawing customers',
              'Analyze which customer segments are churning',
              'Consider emergency promotion to re-engage customers'
            ],
        detected_at: new Date(),
        confidence: 0.9
      })
    }
    
    // Revenue per transaction trend
    const currentRPT = current.revenue / current.transactions
    const historicalRPT = historical.map(d => d.revenue / d.transactions)
    const avgHistoricalRPT = this.average(historicalRPT)
    const rptChange = (currentRPT - avgHistoricalRPT) / avgHistoricalRPT
    
    if (Math.abs(rptChange) > 0.10) {
      insights.push({
        id: `trend-rpt-${Date.now()}`,
        type: rptChange > 0 ? 'opportunity' : 'warning',
        severity: 'medium',
        title: `Average transaction value ${rptChange > 0 ? 'increasing' : 'decreasing'}`,
        description: `Customers are spending ${Math.abs(rptChange * 100).toFixed(0)}% ${rptChange > 0 ? 'more' : 'less'} per transaction. ${
          rptChange > 0
            ? 'This suggests customers are buying higher-value items or larger quantities.'
            : 'This may indicate customers are trading down or buying fewer items.'
        }`,
        metric: 'avg_transaction_value',
        impact: {
          current_value: currentRPT,
          change_percent: rptChange * 100,
          change_absolute: currentRPT - avgHistoricalRPT
        },
        context: `Historical average: ${(avgHistoricalRPT / 100).toFixed(2)} RON`,
        actionable_recommendations: rptChange > 0
          ? [
              'Promote higher-margin products to similar customer segments',
              'Introduce bundle deals to maintain high transaction values',
              'Analyze which products are driving the increase'
            ]
          : [
              'Review product pricing strategy',
              'Investigate if out-of-stock items are affecting basket size',
              'Consider promotions on complementary products to increase basket'
            ],
        detected_at: new Date(),
        confidence: 0.85
      })
    }
    
    return insights
  }
  
  /**
   * Analyze competitive positioning
   */
  private static analyzeCompetitivePosition(
    current: MerchantMetrics,
    competitors: CompetitorData[]
  ): Insight[] {
    const insights: Insight[] = []
    
    const yourRank = competitors.find(c => c.isYou)?.rank || 999
    const totalCompetitors = competitors.length
    
    // Market position insight
    if (yourRank <= 3) {
      insights.push({
        id: `competitive-leader-${Date.now()}`,
        type: 'opportunity',
        severity: 'high',
        title: `You're #${yourRank} in the market`,
        description: `Strong market position in top ${Math.round(yourRank / totalCompetitors * 100)}%. Maintaining this position requires continued innovation and customer focus.`,
        metric: 'market_rank',
        impact: {
          current_value: yourRank,
          change_percent: 0,
          change_absolute: 0
        },
        context: `Out of ${totalCompetitors} active merchants with campaigns`,
        actionable_recommendations: [
          'Defend position by monitoring #' + (yourRank - 1) + ' and #' + (yourRank + 1) + ' competitors',
          'Consider exclusive partnerships or unique offerings',
          'Invest in customer retention programs'
        ],
        detected_at: new Date(),
        confidence: 1.0
      })
    } else if (yourRank > totalCompetitors * 0.7) {
      insights.push({
        id: `competitive-underdog-${Date.now()}`,
        type: 'warning',
        severity: 'high',
        title: `Market position needs improvement (#${yourRank} of ${totalCompetitors})`,
        description: `Currently in bottom ${Math.round((1 - yourRank / totalCompetitors) * 100)}% of market. Significant opportunity to climb rankings with targeted improvements.`,
        metric: 'market_rank',
        impact: {
          current_value: yourRank,
          change_percent: 0,
          change_absolute: 0
        },
        context: `Gap to #${Math.floor(totalCompetitors * 0.5)}: ${competitors[Math.floor(totalCompetitors * 0.5)].transactions - current.transactions} transactions`,
        actionable_recommendations: [
          'Analyze what top 3 competitors are doing differently',
          'Consider increasing cashback rate or promotional frequency',
          'Focus on customer acquisition in underserved segments'
        ],
        detected_at: new Date(),
        confidence: 1.0
      })
    }
    
    // Cashback rate positioning
    const avgCompetitorCashback = this.average(
      competitors.filter(c => !c.isYou).map(c => c.cashback_percent)
    )
    const cashbackDiff = current.cashback_percent - avgCompetitorCashback
    
    if (cashbackDiff > 1) {
      insights.push({
        id: `competitive-cashback-high-${Date.now()}`,
        type: 'trend',
        severity: 'medium',
        title: `Your cashback rate is ${cashbackDiff.toFixed(1)}% above market average`,
        description: `At ${current.cashback_percent}% vs ${avgCompetitorCashback.toFixed(1)}% average, you're using aggressive pricing. This can drive acquisition but impacts profitability.`,
        metric: 'cashback_rate',
        impact: {
          current_value: current.cashback_percent,
          change_percent: (cashbackDiff / avgCompetitorCashback) * 100,
          change_absolute: cashbackDiff
        },
        context: `Top competitor offers: ${Math.max(...competitors.filter(c => !c.isYou).map(c => c.cashback_percent))}%`,
        actionable_recommendations: [
          'Test if reducing by 0.5-1% significantly impacts conversion',
          'Consider tiered cashback (higher for loyal customers)',
          'Monitor if high rate is delivering proportional customer value'
        ],
        detected_at: new Date(),
        confidence: 0.9
      })
    } else if (cashbackDiff < -1) {
      insights.push({
        id: `competitive-cashback-low-${Date.now()}`,
        type: 'opportunity',
        severity: 'medium',
        title: `Room to increase cashback rate`,
        description: `Your ${current.cashback_percent}% is below market average of ${avgCompetitorCashback.toFixed(1)}%. Strategic increase could boost customer acquisition.`,
        metric: 'cashback_rate',
        impact: {
          current_value: current.cashback_percent,
          change_percent: (cashbackDiff / avgCompetitorCashback) * 100,
          change_absolute: cashbackDiff
        },
        context: `Increasing to market average could improve competitiveness`,
        actionable_recommendations: [
          'Test 0.5% increase and measure impact on transactions',
          'Consider limited-time bonus cashback promotion',
          'Calculate break-even point for cashback increase'
        ],
        detected_at: new Date(),
        confidence: 0.85
      })
    }
    
    return insights
  }
  
  /**
   * Analyze campaign efficiency
   */
  private static analyzeEfficiency(
    current: MerchantMetrics,
    historical: MerchantMetrics[]
  ): Insight[] {
    const insights: Insight[] = []
    
    // ROI Analysis
    const roi = (current.revenue - current.cashback_paid) / current.cashback_paid
    
    if (roi < 2) {
      insights.push({
        id: `efficiency-low-roi-${Date.now()}`,
        type: 'warning',
        severity: 'high',
        title: `Campaign ROI below healthy threshold`,
        description: `Current ROI of ${roi.toFixed(2)}x means you're earning ${roi.toFixed(2)} RON for every 1 RON in cashback. Industry leaders achieve 3-4x ROI.`,
        metric: 'roi',
        impact: {
          current_value: roi,
          change_percent: ((roi - 3) / 3) * 100,
          change_absolute: roi - 3
        },
        context: `At current rate, need ${(current.cashback_paid * 3).toFixed(0)} RON revenue for healthy ROI`,
        actionable_recommendations: [
          'Reduce cashback rate by 1% and monitor impact',
          'Target promotions to high-value customer segments',
          'Improve conversion rate to increase revenue per customer'
        ],
        detected_at: new Date(),
        confidence: 0.95
      })
    } else if (roi > 4) {
      insights.push({
        id: `efficiency-high-roi-${Date.now()}`,
        type: 'opportunity',
        severity: 'medium',
        title: `Excellent ROI - room to invest in growth`,
        description: `Your ${roi.toFixed(2)}x ROI is industry-leading. You can afford to increase marketing spend or cashback rate to accelerate growth.`,
        metric: 'roi',
        impact: {
          current_value: roi,
          change_percent: ((roi - 3) / 3) * 100,
          change_absolute: roi - 3
        },
        context: `Strong profitability allows for aggressive growth strategies`,
        actionable_recommendations: [
          'Test 1% cashback increase to drive more transactions',
          'Invest surplus in customer acquisition campaigns',
          'Expand to new customer segments or geographies'
        ],
        detected_at: new Date(),
        confidence: 0.9
      })
    }
    
    // Customer acquisition cost
    const cac = current.cashback_paid / current.customers
    if (historical.length > 0) {
      const avgHistoricalCAC = this.average(
        historical.map(d => d.cashback_paid / d.customers)
      )
      const cacChange = (cac - avgHistoricalCAC) / avgHistoricalCAC
      
      if (cacChange > 0.20) {
        insights.push({
          id: `efficiency-cac-rising-${Date.now()}`,
          type: 'warning',
          severity: 'medium',
          title: `Customer acquisition cost increasing`,
          description: `You're spending ${(cac / 100).toFixed(2)} RON to acquire each customer, up ${(cacChange * 100).toFixed(0)}% from historical average. Rising CAC reduces profitability.`,
          metric: 'customer_acquisition_cost',
          impact: {
            current_value: cac,
            change_percent: cacChange * 100,
            change_absolute: cac - avgHistoricalCAC
          },
          context: `Historical CAC: ${(avgHistoricalCAC / 100).toFixed(2)} RON`,
          actionable_recommendations: [
            'Optimize targeting to reach more cost-effective customers',
            'Review if cashback rate can be reduced without hurting conversion',
            'Focus on customer retention to maximize lifetime value'
          ],
          detected_at: new Date(),
          confidence: 0.8
        })
      }
    }
    
    return insights
  }
  
  /**
   * Identify growth opportunities
   */
  private static identifyOpportunities(
    current: MerchantMetrics,
    historical: MerchantMetrics[],
    competitors: CompetitorData[]
  ): Insight[] {
    const insights: Insight[] = []
    
    // Customer retention rate
    if (historical.length >= 2) {
      const repeatCustomerRate = 0.45 // This would be calculated from actual data
      
      if (repeatCustomerRate < 0.3) {
        insights.push({
          id: `opportunity-retention-${Date.now()}`,
          type: 'opportunity',
          severity: 'high',
          title: `Low customer retention - major opportunity`,
          description: `Only ${(repeatCustomerRate * 100).toFixed(0)}% of customers return. Increasing retention to 40% could double revenue without acquisition costs.`,
          metric: 'customer_retention',
          impact: {
            current_value: repeatCustomerRate,
            change_percent: 0,
            change_absolute: 0
          },
          context: `Industry benchmark: 35-45% repeat customer rate`,
          actionable_recommendations: [
            'Launch loyalty program with bonus cashback for repeat purchases',
            'Send personalized offers to customers 7 days after first purchase',
            'Survey churned customers to understand pain points'
          ],
          detected_at: new Date(),
          confidence: 0.85
        })
      }
    }
    
    // Untapped customer segments
    const topCompetitorCustomers = Math.max(...competitors.filter(c => !c.isYou).map(c => c.customers))
    const customerGap = topCompetitorCustomers - current.customers
    
    if (customerGap > current.customers * 0.5) {
      insights.push({
        id: `opportunity-customer-gap-${Date.now()}`,
        type: 'opportunity',
        severity: 'high',
        title: `Significant untapped customer base`,
        description: `Top competitor has ${customerGap} more customers than you. This represents ${(customerGap / current.customers * 100).toFixed(0)}% growth potential.`,
        metric: 'customer_gap',
        impact: {
          current_value: current.customers,
          change_percent: (customerGap / current.customers) * 100,
          change_absolute: customerGap
        },
        context: `At current conversion rate, need ${Math.ceil(customerGap * 1.3)} more transactions`,
        actionable_recommendations: [
          'Analyze demographic/geographic differences with top competitor',
          'Test marketing in channels where you\'re underrepresented',
          'Consider partnership or co-marketing opportunities'
        ],
        detected_at: new Date(),
        confidence: 0.75
      })
    }
    
    return insights
  }
  
  /**
   * Identify potential risks
   */
  private static identifyRisks(
    current: MerchantMetrics,
    historical: MerchantMetrics[]
  ): Insight[] {
    const insights: Insight[] = []
    
    // Cashback sustainability
    const cashbackRatio = current.cashback_paid / current.revenue
    
    if (cashbackRatio > 0.15) {
      insights.push({
        id: `risk-cashback-sustainability-${Date.now()}`,
        type: 'warning',
        severity: 'high',
        title: `Cashback costs consuming ${(cashbackRatio * 100).toFixed(0)}% of revenue`,
        description: `High cashback-to-revenue ratio suggests campaign may not be sustainable long-term. Need to improve unit economics.`,
        metric: 'cashback_ratio',
        impact: {
          current_value: cashbackRatio,
          change_percent: 0,
          change_absolute: 0
        },
        context: `Sustainable range: 8-12% of revenue`,
        actionable_recommendations: [
          'Gradually reduce cashback rate while monitoring churn',
          'Focus on increasing average transaction value',
          'Implement tiered cashback (lower % on higher amounts)'
        ],
        detected_at: new Date(),
        confidence: 0.9
      })
    }
    
    return insights
  }
  
  /**
   * Utility functions
   */
  private static average(numbers: number[]): number {
    return numbers.reduce((a, b) => a + b, 0) / numbers.length
  }
  
  private static stdDev(numbers: number[]): number {
    const avg = this.average(numbers)
    const squareDiffs = numbers.map(value => Math.pow(value - avg, 2))
    return Math.sqrt(this.average(squareDiffs))
  }
  
  private static calculateInsightScore(insight: Insight): number {
    const severityWeight = {
      high: 3,
      medium: 2,
      low: 1
    }
    return severityWeight[insight.severity] * insight.confidence * Math.abs(insight.impact.change_percent)
  }
}
