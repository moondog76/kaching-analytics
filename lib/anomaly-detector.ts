import { Anomaly, MerchantMetrics, Alert } from './types'
import { format, isWeekend, getDay } from 'date-fns'

export class AnomalyDetector {
  
  /**
   * Detect anomalies in current data compared to historical patterns
   */
  static async detectAnomalies(
    currentData: MerchantMetrics,
    historicalData: MerchantMetrics[],
    currentDate: Date = new Date()
  ): Promise<Anomaly[]> {
    
    if (historicalData.length < 14) {
      return [] // Need sufficient history
    }
    
    const anomalies: Anomaly[] = []
    const metrics = ['transactions', 'revenue', 'customers', 'cashback_paid']
    
    for (const metric of metrics) {
      const anomaly = await this.detectMetricAnomaly(
        metric,
        currentData[metric as keyof MerchantMetrics] as number,
        historicalData,
        currentDate
      )
      
      if (anomaly) {
        anomalies.push(anomaly)
      }
    }
    
    return anomalies.sort((a, b) => 
      Math.abs(b.deviation_stddev) - Math.abs(a.deviation_stddev)
    )
  }
  
  /**
   * Detect anomaly for a specific metric
   */
  private static async detectMetricAnomaly(
    metric: string,
    currentValue: number,
    historicalData: MerchantMetrics[],
    currentDate: Date
  ): Promise<Anomaly | null> {
    
    // 1. Extract historical values for this metric
    const historicalValues = historicalData.map(
      d => d[metric as keyof MerchantMetrics] as number
    )
    
    // 2. Adjust for seasonality (day of week effects)
    const dayOfWeek = getDay(currentDate)
    const sameDayValues = historicalData
      .filter((_, i) => {
        // Approximate day of week (assuming daily data)
        const historicalDay = (dayOfWeek - (historicalData.length - i)) % 7
        return historicalDay === dayOfWeek
      })
      .map(d => d[metric as keyof MerchantMetrics] as number)
    
    // Use same-day average if we have enough data, otherwise use overall average
    const relevantValues = sameDayValues.length >= 3 ? sameDayValues : historicalValues
    const expectedValue = this.average(relevantValues)
    const stdDev = this.stdDev(relevantValues)
    
    // 3. Calculate deviation
    const deviation = (currentValue - expectedValue) / stdDev
    
    // 4. Determine if anomalous (threshold: 2 standard deviations)
    const isSignificant = Math.abs(deviation) > 2.0
    
    if (!isSignificant) {
      return null
    }
    
    // 5. Generate explanation
    const explanation = this.generateExplanation(
      metric,
      currentValue,
      expectedValue,
      deviation,
      currentDate,
      sameDayValues.length >= 3
    )
    
    const severity = this.determineSeverity(metric, deviation)
    
    return {
      metric,
      detected_at: currentDate,
      current_value: currentValue,
      expected_value: expectedValue,
      deviation_stddev: deviation,
      is_significant: isSignificant,
      seasonality_adjusted: sameDayValues.length >= 3,
      explanation,
      severity
    }
  }
  
  /**
   * Convert anomalies to actionable alerts
   */
  static async generateAlerts(
    anomalies: Anomaly[],
    merchantName: string
  ): Promise<Alert[]> {
    
    return anomalies.map(anomaly => ({
      id: `alert-${anomaly.metric}-${Date.now()}`,
      type: 'anomaly' as const,
      severity: anomaly.severity,
      title: this.generateAlertTitle(anomaly),
      message: this.generateAlertMessage(anomaly, merchantName),
      metric: anomaly.metric,
      current_value: anomaly.current_value,
      threshold_value: anomaly.expected_value,
      detected_at: anomaly.detected_at,
      acknowledged: false,
      channels_sent: this.determineChannels(anomaly.severity)
    }))
  }
  
  /**
   * Generate human-readable explanation
   */
  private static generateExplanation(
    metric: string,
    currentValue: number,
    expectedValue: number,
    deviation: number,
    date: Date,
    seasonalityAdjusted: boolean
  ): string {
    
    const direction = deviation > 0 ? 'higher' : 'lower'
    const percentage = Math.abs((currentValue - expectedValue) / expectedValue * 100)
    const dayName = format(date, 'EEEE')
    
    let explanation = `Your ${metric} today (${this.formatValue(metric, currentValue)}) `
    explanation += `is ${percentage.toFixed(0)}% ${direction} than expected `
    explanation += `(${this.formatValue(metric, expectedValue)}). `
    
    if (seasonalityAdjusted) {
      explanation += `This comparison accounts for typical ${dayName} patterns. `
    }
    
    // Add context about severity
    if (Math.abs(deviation) > 3) {
      explanation += 'This is a highly unusual variation that requires immediate attention.'
    } else if (Math.abs(deviation) > 2.5) {
      explanation += 'This is a significant deviation from normal patterns.'
    } else {
      explanation += 'This exceeds normal variation ranges.'
    }
    
    // Add potential causes
    if (isWeekend(date) && metric === 'transactions') {
      explanation += ' Note: Weekend patterns can differ from weekdays.'
    }
    
    return explanation
  }
  
  /**
   * Determine alert severity
   */
  private static determineSeverity(
    metric: string,
    deviation: number
  ): 'critical' | 'warning' | 'info' {
    
    // Critical metrics need more aggressive thresholds
    const criticalMetrics = ['transactions', 'revenue']
    const isCriticalMetric = criticalMetrics.includes(metric)
    
    if (Math.abs(deviation) > 3.0) {
      return 'critical'
    }
    
    if (Math.abs(deviation) > 2.5 || (isCriticalMetric && Math.abs(deviation) > 2.0)) {
      return 'warning'
    }
    
    return 'info'
  }
  
  /**
   * Generate alert title
   */
  private static generateAlertTitle(anomaly: Anomaly): string {
    const direction = anomaly.deviation_stddev > 0 ? 'spike' : 'drop'
    const magnitude = Math.abs(anomaly.deviation_stddev) > 3 ? 'Significant' : 'Unusual'
    
    return `${magnitude} ${direction} in ${anomaly.metric}`
  }
  
  /**
   * Generate alert message
   */
  private static generateAlertMessage(anomaly: Anomaly, merchantName: string): string {
    const percentage = Math.abs((anomaly.current_value - anomaly.expected_value) / anomaly.expected_value * 100)
    const direction = anomaly.deviation_stddev > 0 ? 'increase' : 'decrease'
    
    let message = `${merchantName}: Your ${anomaly.metric} show a ${percentage.toFixed(0)}% ${direction}. `
    message += `Current: ${this.formatValue(anomaly.metric, anomaly.current_value)}, `
    message += `Expected: ${this.formatValue(anomaly.metric, anomaly.expected_value)}. `
    
    // Add recommended action
    if (anomaly.deviation_stddev < -2.5) {
      message += '\n\n📊 Recommended actions:\n'
      if (anomaly.metric === 'transactions') {
        message += '• Check for technical issues\n'
        message += '• Review recent competitor activity\n'
        message += '• Consider emergency promotion'
      } else if (anomaly.metric === 'revenue') {
        message += '• Investigate high-value customer behavior\n'
        message += '• Check for pricing issues\n'
        message += '• Review product availability'
      }
    } else if (anomaly.deviation_stddev > 2.5) {
      message += '\n\n🎯 Opportunity:\n'
      if (anomaly.metric === 'transactions') {
        message += '• Investigate what\'s driving growth\n'
        message += '• Scale successful tactics\n'
        message += '• Ensure inventory can support demand'
      }
    }
    
    return message
  }
  
  /**
   * Determine which channels to send alert to
   */
  private static determineChannels(severity: 'critical' | 'warning' | 'info'): string[] {
    switch (severity) {
      case 'critical':
        return ['email', 'slack', 'mobile']
      case 'warning':
        return ['email', 'slack']
      case 'info':
        return ['email']
    }
  }
  
  /**
   * Format value based on metric type
   */
  private static formatValue(metric: string, value: number): string {
    if (metric.includes('revenue') || metric.includes('cashback')) {
      return `${(value / 100).toFixed(2)} RON`
    }
    return Math.round(value).toString()
  }
  
  /**
   * Statistical utilities
   */
  private static average(numbers: number[]): number {
    if (numbers.length === 0) return 0
    return numbers.reduce((a, b) => a + b, 0) / numbers.length
  }
  
  private static stdDev(numbers: number[]): number {
    if (numbers.length === 0) return 0
    const avg = this.average(numbers)
    const squareDiffs = numbers.map(value => Math.pow(value - avg, 2))
    return Math.sqrt(this.average(squareDiffs))
  }
  
  /**
   * Generate daily digest email content
   */
  static async generateDailyDigest(
    merchantName: string,
    currentData: MerchantMetrics,
    insights: any[],
    anomalies: Anomaly[],
    date: Date = new Date()
  ): Promise<string> {
    
    const alerts = await this.generateAlerts(anomalies, merchantName)
    
    let content = `# Good morning! 🌅\n\n`
    content += `Here's your ${merchantName} campaign update for ${format(date, 'EEEE, MMMM d, yyyy')}:\n\n`
    
    // Summary
    content += `## 📊 Yesterday's Performance\n\n`
    content += `- **${currentData.transactions}** transactions (${this.formatChange(currentData.transactions, insights)})\n`
    content += `- **${(currentData.revenue / 100).toFixed(2)} RON** revenue\n`
    content += `- **${currentData.customers}** customers engaged\n`
    content += `- **${(currentData.cashback_paid / 100).toFixed(2)} RON** in cashback rewards\n\n`
    
    // Top Insights
    if (insights.length > 0) {
      content += `## 💡 Top Insights\n\n`
      insights.slice(0, 3).forEach((insight, i) => {
        const emoji = insight.type === 'opportunity' ? '🎯' : insight.type === 'warning' ? '⚠️' : '📈'
        content += `${i + 1}. ${emoji} **${insight.title}**\n`
        content += `   ${insight.description}\n\n`
        
        if (insight.actionable_recommendations.length > 0) {
          content += `   *Recommended actions:*\n`
          insight.actionable_recommendations.slice(0, 2).forEach((rec: string) => {
            content += `   • ${rec}\n`
          })
          content += `\n`
        }
      })
    }
    
    // Alerts
    if (alerts.length > 0) {
      content += `## 🚨 Alerts (${alerts.length})\n\n`
      alerts.forEach(alert => {
        const icon = alert.severity === 'critical' ? '🔴' : alert.severity === 'warning' ? '🟡' : '🔵'
        content += `${icon} **${alert.title}**\n`
        content += `${alert.message}\n\n`
      })
    } else {
      content += `## ✅ No Alerts\n\nEverything looks normal today!\n\n`
    }
    
    // Footer
    content += `---\n\n`
    content += `[View Full Dashboard](https://kaching.app/${merchantName.toLowerCase()}) | `
    content += `[Update Preferences](https://kaching.app/settings)\n\n`
    content += `*This is an automated daily digest from Kaching Analytics*`
    
    return content
  }
  
  private static formatChange(current: number, insights: any[]): string {
    const relevantInsight = insights.find(i => i.metric === 'transactions')
    if (!relevantInsight) return ''
    
    const change = relevantInsight.impact.change_percent
    if (Math.abs(change) < 5) return ''
    
    const arrow = change > 0 ? '↑' : '↓'
    const color = change > 0 ? '🟢' : '🔴'
    return `${color} ${arrow} ${Math.abs(change).toFixed(0)}%`
  }
}
