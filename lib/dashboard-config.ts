/**
 * Dashboard widget configuration
 */

export interface WidgetConfig {
  id: string
  name: string
  description: string
  defaultEnabled: boolean
  category: 'metrics' | 'insights' | 'competition' | 'ai'
}

export const AVAILABLE_WIDGETS: WidgetConfig[] = [
  {
    id: 'drillable-metrics',
    name: 'Key Metrics',
    description: 'Interactive metrics cards with drill-down',
    defaultEnabled: true,
    category: 'metrics'
  },
  {
    id: 'executive-briefing',
    name: 'Executive Briefing',
    description: 'AI-generated summary of performance',
    defaultEnabled: true,
    category: 'ai'
  },
  {
    id: 'insights-panel',
    name: 'Insights Panel',
    description: 'Key business insights and trends',
    defaultEnabled: true,
    category: 'insights'
  },
  {
    id: 'anomaly-alerts',
    name: 'Anomaly Detection',
    description: 'Alerts for unusual patterns',
    defaultEnabled: true,
    category: 'ai'
  },
  {
    id: 'recommendations',
    name: 'AI Recommendations',
    description: 'Actionable suggestions',
    defaultEnabled: true,
    category: 'ai'
  },
  {
    id: 'campaign-status',
    name: 'Campaign Status',
    description: 'Current campaign performance',
    defaultEnabled: true,
    category: 'metrics'
  },
  {
    id: 'competitor-table',
    name: 'Competitor Comparison',
    description: 'Market position table',
    defaultEnabled: true,
    category: 'competition'
  }
]

export interface DashboardLayout {
  enabledWidgets: string[]
  widgetOrder: string[]
}

export const DEFAULT_LAYOUT: DashboardLayout = {
  enabledWidgets: AVAILABLE_WIDGETS.filter(w => w.defaultEnabled).map(w => w.id),
  widgetOrder: AVAILABLE_WIDGETS.filter(w => w.defaultEnabled).map(w => w.id)
}

/**
 * Get saved layout from localStorage
 */
export function getSavedLayout(): DashboardLayout {
  if (typeof window === 'undefined') return DEFAULT_LAYOUT

  const saved = localStorage.getItem('dashboard-layout')
  if (!saved) return DEFAULT_LAYOUT

  try {
    const parsed = JSON.parse(saved)
    return {
      enabledWidgets: parsed.enabledWidgets || DEFAULT_LAYOUT.enabledWidgets,
      widgetOrder: parsed.widgetOrder || DEFAULT_LAYOUT.widgetOrder
    }
  } catch {
    return DEFAULT_LAYOUT
  }
}

/**
 * Save layout to localStorage
 */
export function saveLayout(layout: DashboardLayout): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('dashboard-layout', JSON.stringify(layout))
}

/**
 * Reset to default layout
 */
export function resetLayout(): DashboardLayout {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('dashboard-layout')
  }
  return DEFAULT_LAYOUT
}
