import { TimeSeriesPoint, Forecast, TimeSeriesDecomposition } from './types'
import { format, addDays, parseISO, differenceInDays } from 'date-fns'

export class ForecastingEngine {
  
  /**
   * Forecast a metric using time series decomposition
   */
  static async forecastMetric(
    historicalData: TimeSeriesPoint[],
    daysAhead: number = 7
  ): Promise<Forecast> {
    
    if (historicalData.length < 14) {
      throw new Error('Need at least 14 days of historical data for forecasting')
    }
    
    const values = historicalData.map(d => d.value)
    const dates = historicalData.map(d => d.date)
    
    // 1. Decompose time series
    const decomposition = this.decomposeTimeSeries(values)
    
    // 2. Forecast trend component
    const trendForecast = this.forecastTrend(decomposition.trend, daysAhead)
    
    // 3. Apply seasonal component
    const seasonalForecast = this.applySeasonality(
      trendForecast,
      decomposition.seasonal,
      decomposition.seasonality_period
    )
    
    // 4. Calculate confidence intervals
    const residualStdDev = this.stdDev(decomposition.residual)
    const confidenceInterval = this.calculateConfidenceInterval(
      seasonalForecast,
      residualStdDev,
      daysAhead
    )
    
    // 5. Generate forecast dates
    const lastDate = parseISO(dates[dates.length - 1])
    const forecastPoints: TimeSeriesPoint[] = seasonalForecast.map((value, i) => ({
      date: format(addDays(lastDate, i + 1), 'yyyy-MM-dd'),
      value: Math.max(0, Math.round(value)), // Ensure non-negative
      metric: historicalData[0].metric
    }))
    
    // 6. Calculate accuracy metrics
    const accuracy = this.calculateAccuracyMetrics(values, decomposition)
    
    return {
      metric: historicalData[0].metric,
      historical: historicalData,
      forecast: forecastPoints,
      confidence_interval: confidenceInterval,
      accuracy_metrics: accuracy,
      methodology: 'Time series decomposition with seasonal adjustment and trend extrapolation'
    }
  }
  
  /**
   * Decompose time series into trend, seasonal, and residual components
   */
  private static decomposeTimeSeries(values: number[]): TimeSeriesDecomposition {
    const n = values.length
    
    // 1. Extract trend using moving average
    const windowSize = 7 // Weekly moving average
    const trend: number[] = []
    
    for (let i = 0; i < n; i++) {
      const start = Math.max(0, i - Math.floor(windowSize / 2))
      const end = Math.min(n, i + Math.ceil(windowSize / 2))
      const window = values.slice(start, end)
      trend.push(this.average(window))
    }
    
    // 2. Detrend to isolate seasonal + residual
    const detrended = values.map((v, i) => v - trend[i])
    
    // 3. Extract seasonal component (weekly pattern)
    const seasonalityPeriod = 7
    const seasonal: number[] = new Array(n).fill(0)
    
    for (let dayOfWeek = 0; dayOfWeek < seasonalityPeriod; dayOfWeek++) {
      const sameDayValues: number[] = []
      for (let i = dayOfWeek; i < n; i += seasonalityPeriod) {
        sameDayValues.push(detrended[i])
      }
      const avgForDay = this.average(sameDayValues)
      
      for (let i = dayOfWeek; i < n; i += seasonalityPeriod) {
        seasonal[i] = avgForDay
      }
    }
    
    // 4. Calculate residuals
    const residual = values.map((v, i) => v - trend[i] - seasonal[i])
    
    return {
      trend,
      seasonal,
      residual,
      seasonality_period: seasonalityPeriod
    }
  }
  
  /**
   * Forecast trend component using linear regression
   */
  private static forecastTrend(trend: number[], steps: number): number[] {
    const n = trend.length
    
    // Fit linear regression to trend
    const x = Array.from({ length: n }, (_, i) => i)
    const y = trend
    
    const { slope, intercept } = this.linearRegression(x, y)
    
    // Project forward
    const forecast: number[] = []
    for (let i = 0; i < steps; i++) {
      forecast.push(slope * (n + i) + intercept)
    }
    
    return forecast
  }
  
  /**
   * Apply seasonal pattern to forecast
   */
  private static applySeasonality(
    trendForecast: number[],
    seasonalPattern: number[],
    period: number
  ): number[] {
    return trendForecast.map((trend, i) => {
      const seasonalIndex = (seasonalPattern.length + i) % period
      // Get average seasonal component for this day of week
      const seasonalComponents: number[] = []
      for (let j = seasonalIndex; j < seasonalPattern.length; j += period) {
        seasonalComponents.push(seasonalPattern[j])
      }
      const avgSeasonal = this.average(seasonalComponents)
      return trend + avgSeasonal
    })
  }
  
  /**
   * Calculate confidence intervals
   */
  private static calculateConfidenceInterval(
    forecast: number[],
    residualStdDev: number,
    steps: number
  ): { lower: number[]; upper: number[] } {
    // Confidence interval widens with forecast horizon
    const z = 1.96 // 95% confidence
    
    const lower = forecast.map((value, i) => {
      const uncertainty = residualStdDev * z * Math.sqrt(1 + i / steps)
      return Math.max(0, Math.round(value - uncertainty))
    })
    
    const upper = forecast.map((value, i) => {
      const uncertainty = residualStdDev * z * Math.sqrt(1 + i / steps)
      return Math.round(value + uncertainty)
    })
    
    return { lower, upper }
  }
  
  /**
   * Calculate forecast accuracy metrics
   */
  private static calculateAccuracyMetrics(
    actual: number[],
    decomposition: TimeSeriesDecomposition
  ): { mape: number; rmse: number } {
    const fitted = actual.map((v, i) => 
      decomposition.trend[i] + decomposition.seasonal[i]
    )
    
    // Mean Absolute Percentage Error
    const mape = this.average(
      actual.map((a, i) => Math.abs((a - fitted[i]) / a) * 100)
    )
    
    // Root Mean Square Error
    const squaredErrors = actual.map((a, i) => Math.pow(a - fitted[i], 2))
    const rmse = Math.sqrt(this.average(squaredErrors))
    
    return { mape, rmse }
  }
  
  /**
   * Linear regression helper
   */
  private static linearRegression(
    x: number[],
    y: number[]
  ): { slope: number; intercept: number } {
    const n = x.length
    const sumX = x.reduce((a, b) => a + b, 0)
    const sumY = y.reduce((a, b) => a + b, 0)
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n
    
    return { slope, intercept }
  }
  
  /**
   * Statistical utilities
   */
  private static average(numbers: number[]): number {
    return numbers.reduce((a, b) => a + b, 0) / numbers.length
  }
  
  private static stdDev(numbers: number[]): number {
    const avg = this.average(numbers)
    const squareDiffs = numbers.map(value => Math.pow(value - avg, 2))
    return Math.sqrt(this.average(squareDiffs))
  }
  
  /**
   * Detect seasonality period automatically
   */
  static detectSeasonality(values: number[]): number {
    // Test for weekly (7), monthly (30), or no seasonality
    const periods = [7, 30]
    let bestPeriod = 7
    let bestScore = 0
    
    for (const period of periods) {
      if (values.length < period * 2) continue
      
      const score = this.seasonalityScore(values, period)
      if (score > bestScore) {
        bestScore = score
        bestPeriod = period
      }
    }
    
    return bestPeriod
  }
  
  private static seasonalityScore(values: number[], period: number): number {
    // Calculate autocorrelation at given lag
    const n = values.length
    const mean = this.average(values)
    
    let numerator = 0
    let denominator = 0
    
    for (let i = 0; i < n - period; i++) {
      numerator += (values[i] - mean) * (values[i + period] - mean)
    }
    
    for (let i = 0; i < n; i++) {
      denominator += Math.pow(values[i] - mean, 2)
    }
    
    return numerator / denominator
  }
}
