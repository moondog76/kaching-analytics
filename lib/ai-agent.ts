import Anthropic from '@anthropic-ai/sdk'
import { AIAgentResponse, MerchantMetrics, CompetitorData, AnalysisContext, Insight } from './types'
import { InsightsEngine } from './insights-engine'
import { ForecastingEngine } from './forecasting-engine'

export class AIAgent {
  private client: Anthropic
  
  constructor(apiKey: string) {
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY
    })
  }
  
  /**
   * Main entry point: Process user query with autonomous analysis
   */
  async processQuery(
    query: string,
    context: AnalysisContext,
    merchantData: MerchantMetrics,
    competitorData: CompetitorData[],
    historicalData: MerchantMetrics[]
  ): Promise<AIAgentResponse> {
    
    const systemPrompt = this.buildSystemPrompt(merchantData, competitorData)
    
    // Build conversation messages
    const messages: Anthropic.MessageParam[] = [
      ...context.messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      })),
      {
        role: 'user',
        content: query
      }
    ]
    
    // Define available tools for the agent
    const tools: Anthropic.Tool[] = [
      {
        name: 'analyze_transactions',
        description: 'Analyze transaction data for patterns, trends, or specific insights',
        input_schema: {
          type: 'object',
          properties: {
            analysis_type: {
              type: 'string',
              enum: ['trend', 'comparison', 'breakdown', 'efficiency'],
              description: 'Type of analysis to perform'
            },
            time_period: {
              type: 'string',
              description: 'Time period to analyze (e.g., "last_7_days", "this_month")'
            },
            metrics: {
              type: 'array',
              items: { type: 'string' },
              description: 'Metrics to analyze'
            }
          },
          required: ['analysis_type']
        }
      },
      {
        name: 'forecast_metric',
        description: 'Predict future values for a metric using statistical forecasting',
        input_schema: {
          type: 'object',
          properties: {
            metric: {
              type: 'string',
              enum: ['transactions', 'revenue', 'customers', 'cashback_paid'],
              description: 'Metric to forecast'
            },
            days_ahead: {
              type: 'number',
              description: 'Number of days to forecast ahead (1-30)',
              default: 7
            }
          },
          required: ['metric']
        }
      },
      {
        name: 'compare_competitors',
        description: 'Compare merchant performance against competitors',
        input_schema: {
          type: 'object',
          properties: {
            metrics: {
              type: 'array',
              items: { type: 'string' },
              description: 'Metrics to compare'
            },
            top_n: {
              type: 'number',
              description: 'Number of top competitors to include',
              default: 5
            }
          },
          required: ['metrics']
        }
      },
      {
        name: 'detect_insights',
        description: 'Run automated insight detection across all data',
        input_schema: {
          type: 'object',
          properties: {
            focus_area: {
              type: 'string',
              enum: ['all', 'trends', 'competitive', 'efficiency', 'opportunities', 'risks'],
              description: 'Area to focus insight detection on'
            }
          }
        }
      },
      {
        name: 'calculate_metric',
        description: 'Calculate custom metric or KPI',
        input_schema: {
          type: 'object',
          properties: {
            formula: {
              type: 'string',
              description: 'Metric to calculate (e.g., "roi", "customer_acquisition_cost")'
            }
          },
          required: ['formula']
        }
      }
    ]
    
    // Call Claude with tools
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      temperature: 0.7,
      system: systemPrompt,
      messages,
      tools
    })
    
    // Process tool calls autonomously
    const toolResults = await this.executeTools(
      response.content,
      merchantData,
      competitorData,
      historicalData
    )
    
    // If Claude used tools, get final response with tool results
    let finalResponse = response
    if (toolResults.length > 0) {
      const messagesWithTools: Anthropic.MessageParam[] = [
        ...messages,
        {
          role: 'assistant',
          content: response.content
        },
        {
          role: 'user',
          content: toolResults
        }
      ]
      
      finalResponse = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        temperature: 0.7,
        system: systemPrompt,
        messages: messagesWithTools
      })
    }
    
    // Extract text response
    const textContent = finalResponse.content.find(c => c.type === 'text')
    const responseText = textContent && 'text' in textContent ? textContent.text : ''
    
    // Generate suggested follow-ups
    const followups = this.generateFollowups(query, responseText, merchantData)
    
    return {
      message: responseText,
      insights: [], // Insights are detected separately
      suggested_followups: followups,
      data_sources_used: this.extractDataSources(response.content),
      confidence: 0.9
    }
  }
  
  /**
   * Execute tools that Claude requested
   */
  private async executeTools(
    content: Anthropic.ContentBlock[],
    merchantData: MerchantMetrics,
    competitorData: CompetitorData[],
    historicalData: MerchantMetrics[]
  ): Promise<Anthropic.ToolResultBlockParam[]> {
    const toolResults: Anthropic.ToolResultBlockParam[] = []
    
    for (const block of content) {
      if (block.type === 'tool_use') {
        const result = await this.executeTool(
          block.name,
          block.input as any,
          merchantData,
          competitorData,
          historicalData
        )
        
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify(result)
        })
      }
    }
    
    return toolResults
  }
  
  /**
   * Execute individual tool
   */
  private async executeTool(
    toolName: string,
    input: any,
    merchantData: MerchantMetrics,
    competitorData: CompetitorData[],
    historicalData: MerchantMetrics[]
  ): Promise<any> {
    
    switch (toolName) {
      case 'analyze_transactions':
        return this.analyzeTransactions(input, merchantData, historicalData)
      
      case 'forecast_metric':
        return this.forecastMetric(input, historicalData)
      
      case 'compare_competitors':
        return this.compareCompetitors(input, merchantData, competitorData)
      
      case 'detect_insights':
        return this.detectInsights(input, merchantData, competitorData, historicalData)
      
      case 'calculate_metric':
        return this.calculateMetric(input, merchantData)
      
      default:
        return { error: 'Unknown tool' }
    }
  }
  
  /**
   * Tool implementations
   */
  private async analyzeTransactions(
    input: any,
    merchantData: MerchantMetrics,
    historicalData: MerchantMetrics[]
  ): Promise<any> {
    const { analysis_type, metrics = ['transactions', 'revenue'] } = input
    
    switch (analysis_type) {
      case 'trend':
        if (historicalData.length < 7) {
          return { error: 'Need at least 7 days of data for trend analysis' }
        }
        
        const lastWeek = historicalData.slice(-7)
        const avgLastWeek = lastWeek.reduce((sum, d) => sum + d.transactions, 0) / 7
        const change = ((merchantData.transactions - avgLastWeek) / avgLastWeek) * 100
        
        return {
          analysis: 'trend',
          current_transactions: merchantData.transactions,
          last_week_avg: Math.round(avgLastWeek),
          change_percent: change.toFixed(1),
          trend_direction: change > 0 ? 'increasing' : 'decreasing',
          significance: Math.abs(change) > 15 ? 'significant' : 'moderate'
        }
      
      case 'efficiency':
        const roi = (merchantData.revenue - merchantData.cashback_paid) / merchantData.cashback_paid
        const cac = merchantData.cashback_paid / merchantData.customers
        const rpt = merchantData.revenue / merchantData.transactions
        
        return {
          analysis: 'efficiency',
          roi: roi.toFixed(2),
          customer_acquisition_cost: (cac / 100).toFixed(2) + ' RON',
          revenue_per_transaction: (rpt / 100).toFixed(2) + ' RON',
          cashback_to_revenue_ratio: ((merchantData.cashback_paid / merchantData.revenue) * 100).toFixed(1) + '%'
        }
      
      default:
        return { analysis: analysis_type, data: merchantData }
    }
  }
  
  private async forecastMetric(
    input: any,
    historicalData: MerchantMetrics[]
  ): Promise<any> {
    const { metric, days_ahead = 7 } = input
    
    if (historicalData.length < 14) {
      return { error: 'Need at least 14 days of historical data for forecasting' }
    }
    
    // Convert to time series format
    const timeSeriesData = historicalData.map(d => ({
      date: d.period || new Date().toISOString().split('T')[0],
      value: d[metric as keyof MerchantMetrics] as number,
      metric
    }))
    
    try {
      const forecast = await ForecastingEngine.forecastMetric(timeSeriesData, days_ahead)
      
      return {
        metric,
        forecast_period: `${days_ahead} days`,
        predicted_values: forecast.forecast.slice(0, 3), // Show first 3 days
        confidence_interval: {
          lower: forecast.confidence_interval.lower[0],
          upper: forecast.confidence_interval.upper[0]
        },
        trend: this.interpretForecast(forecast),
        accuracy: `MAPE: ${forecast.accuracy_metrics.mape.toFixed(1)}%`
      }
    } catch (error) {
      return { error: 'Forecasting failed', details: String(error) }
    }
  }
  
  private async compareCompetitors(
    input: any,
    merchantData: MerchantMetrics,
    competitorData: CompetitorData[]
  ): Promise<any> {
    const { metrics = ['transactions', 'revenue', 'cashback_percent'], top_n = 5 } = input
    
    const topCompetitors = competitorData
      .sort((a, b) => b.transactions - a.transactions)
      .slice(0, top_n)
    
    const comparison: any = {
      your_position: competitorData.find(c => c.isYou)?.rank || 'Unknown',
      total_competitors: competitorData.length
    }
    
    metrics.forEach((metric: string) => {
      const values = topCompetitors.map(c => c[metric as keyof CompetitorData])
      const yourValue = merchantData[metric as keyof MerchantMetrics]
      const avgCompetitor = values.reduce((a: any, b: any) => a + b, 0) / values.length
      
      comparison[metric] = {
        your_value: yourValue,
        competitor_avg: avgCompetitor,
        vs_average: ((Number(yourValue) - Number(avgCompetitor)) / Number(avgCompetitor) * 100).toFixed(1) + '%',
        market_leader: Math.max(...values as number[])
      }
    })
    
    return comparison
  }
  
  private async detectInsights(
    input: any,
    merchantData: MerchantMetrics,
    competitorData: CompetitorData[],
    historicalData: MerchantMetrics[]
  ): Promise<any> {
    const insights = await InsightsEngine.detectInsights(
      merchantData,
      historicalData,
      competitorData
    )
    
    const { focus_area = 'all' } = input
    
    if (focus_area !== 'all') {
      return insights
        .filter(i => i.type === focus_area || i.id.includes(focus_area))
        .slice(0, 3)
    }
    
    return insights.slice(0, 5) // Top 5 insights
  }
  
  private async calculateMetric(
    input: any,
    merchantData: MerchantMetrics
  ): Promise<any> {
    const { formula } = input
    
    const calculations: Record<string, number> = {
      'roi': (merchantData.revenue - merchantData.cashback_paid) / merchantData.cashback_paid,
      'customer_acquisition_cost': merchantData.cashback_paid / merchantData.customers,
      'revenue_per_transaction': merchantData.revenue / merchantData.transactions,
      'revenue_per_customer': merchantData.revenue / merchantData.customers,
      'cashback_ratio': merchantData.cashback_paid / merchantData.revenue
    }
    
    const result = calculations[formula]
    
    if (result === undefined) {
      return { error: 'Unknown formula', available: Object.keys(calculations) }
    }
    
    return {
      formula,
      value: result,
      formatted: this.formatMetric(formula, result),
      interpretation: this.interpretMetric(formula, result)
    }
  }
  
  /**
   * Helper methods
   */
  private buildSystemPrompt(
    merchantData: MerchantMetrics,
    competitorData: CompetitorData[]
  ): string {
    return `You are an expert retail campaign analyst for Kaching Analytics. You help merchants understand their cashback campaign performance.

Current Context:
- Merchant: ${merchantData.merchant_name}
- Campaign: ${merchantData.cashback_percent}% cashback, ${merchantData.campaign_active ? 'ACTIVE' : 'INACTIVE'}
- Performance: ${merchantData.transactions} transactions, ${(merchantData.revenue / 100).toFixed(2)} RON revenue, ${merchantData.customers} customers
- Market Position: #${competitorData.find(c => c.isYou)?.rank || '?'} out of ${competitorData.length} competitors

Your capabilities:
1. Analyze transaction patterns and trends
2. Compare against competitors
3. Forecast future performance
4. Detect insights and opportunities
5. Calculate custom metrics

Guidelines:
- Be conversational and helpful, not robotic
- Provide specific, actionable recommendations
- Use data to support your points
- Explain "why" behind patterns, not just "what"
- Proactively suggest follow-up questions
- When appropriate, use tools to get accurate data

Always cite specific numbers from the data and explain their business significance.`
  }
  
  private generateFollowups(
    query: string,
    response: string,
    merchantData: MerchantMetrics
  ): string[] {
    const followups = [
      'How does this compare to my competitors?',
      'What should I do to improve this metric?',
      'Show me a forecast for next week',
      'What insights do you see in my data?',
      'How is my ROI trending?'
    ]
    
    // Context-aware followups
    if (query.toLowerCase().includes('forecast')) {
      return [
        'What factors might affect this forecast?',
        'Show me historical accuracy of predictions',
        'How confident are you in this forecast?'
      ]
    }
    
    if (query.toLowerCase().includes('competitor')) {
      return [
        'Which competitor is gaining market share?',
        'How can I close the gap with the market leader?',
        'What are they doing differently?'
      ]
    }
    
    return followups.slice(0, 3)
  }
  
  private extractDataSources(content: Anthropic.ContentBlock[]): string[] {
    const sources = new Set<string>()
    
    for (const block of content) {
      if (block.type === 'tool_use') {
        sources.add(block.name)
      }
    }
    
    return Array.from(sources)
  }
  
  private interpretForecast(forecast: any): string {
    const firstValue = forecast.forecast[0].value
    const lastValue = forecast.forecast[forecast.forecast.length - 1].value
    const change = ((lastValue - firstValue) / firstValue) * 100
    
    if (change > 5) return 'increasing'
    if (change < -5) return 'decreasing'
    return 'stable'
  }
  
  private formatMetric(formula: string, value: number): string {
    switch (formula) {
      case 'roi':
        return `${value.toFixed(2)}x`
      case 'customer_acquisition_cost':
      case 'revenue_per_transaction':
      case 'revenue_per_customer':
        return `${(value / 100).toFixed(2)} RON`
      case 'cashback_ratio':
        return `${(value * 100).toFixed(1)}%`
      default:
        return value.toFixed(2)
    }
  }
  
  private interpretMetric(formula: string, value: number): string {
    switch (formula) {
      case 'roi':
        if (value < 2) return 'Below healthy threshold - consider optimizing campaign'
        if (value > 4) return 'Excellent - room to invest in growth'
        return 'Healthy range'
      case 'cashback_ratio':
        if (value > 0.15) return 'High - may impact profitability'
        if (value < 0.08) return 'Low - room to increase incentives'
        return 'Sustainable range'
      default:
        return ''
    }
  }
}
