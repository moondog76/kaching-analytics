'use client'

import { useState, useEffect } from 'react'
import {
  AVAILABLE_WIDGETS,
  DashboardLayout,
  getSavedLayout,
  saveLayout,
  resetLayout,
  DEFAULT_LAYOUT,
  WidgetConfig
} from '@/lib/dashboard-config'

interface DashboardCustomizerProps {
  isOpen: boolean
  onClose: () => void
  onLayoutChange: (layout: DashboardLayout) => void
}

export default function DashboardCustomizer({ isOpen, onClose, onLayoutChange }: DashboardCustomizerProps) {
  const [layout, setLayout] = useState<DashboardLayout>(DEFAULT_LAYOUT)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    setLayout(getSavedLayout())
  }, [isOpen])

  const toggleWidget = (widgetId: string) => {
    setLayout(prev => {
      const newEnabled = prev.enabledWidgets.includes(widgetId)
        ? prev.enabledWidgets.filter(id => id !== widgetId)
        : [...prev.enabledWidgets, widgetId]

      const newOrder = prev.enabledWidgets.includes(widgetId)
        ? prev.widgetOrder.filter(id => id !== widgetId)
        : [...prev.widgetOrder, widgetId]

      return {
        enabledWidgets: newEnabled,
        widgetOrder: newOrder
      }
    })
    setHasChanges(true)
  }

  const moveWidget = (widgetId: string, direction: 'up' | 'down') => {
    setLayout(prev => {
      const currentIndex = prev.widgetOrder.indexOf(widgetId)
      if (currentIndex === -1) return prev

      const newIndex = direction === 'up'
        ? Math.max(0, currentIndex - 1)
        : Math.min(prev.widgetOrder.length - 1, currentIndex + 1)

      if (newIndex === currentIndex) return prev

      const newOrder = [...prev.widgetOrder]
      newOrder.splice(currentIndex, 1)
      newOrder.splice(newIndex, 0, widgetId)

      return { ...prev, widgetOrder: newOrder }
    })
    setHasChanges(true)
  }

  const handleSave = () => {
    saveLayout(layout)
    onLayoutChange(layout)
    setHasChanges(false)
    onClose()
  }

  const handleReset = () => {
    const defaultLayout = resetLayout()
    setLayout(defaultLayout)
    onLayoutChange(defaultLayout)
    setHasChanges(false)
  }

  const getCategoryLabel = (category: WidgetConfig['category']) => {
    switch (category) {
      case 'metrics': return 'Metrics'
      case 'insights': return 'Insights'
      case 'competition': return 'Competition'
      case 'ai': return 'AI Features'
    }
  }

  const getCategoryColor = (category: WidgetConfig['category']) => {
    switch (category) {
      case 'metrics': return 'bg-blue-100 text-blue-700'
      case 'insights': return 'bg-emerald-100 text-emerald-700'
      case 'competition': return 'bg-amber-100 text-amber-700'
      case 'ai': return 'bg-purple-100 text-purple-700'
    }
  }

  if (!isOpen) return null

  const enabledWidgets = layout.widgetOrder.filter(id => layout.enabledWidgets.includes(id))
  const disabledWidgets = AVAILABLE_WIDGETS.filter(w => !layout.enabledWidgets.includes(w.id))

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">Customize Dashboard</h2>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Show, hide, and reorder your dashboard widgets
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[50vh]">
          {/* Enabled Widgets */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-slate-700 mb-3">Visible Widgets</h3>
            {enabledWidgets.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">No widgets visible</p>
            ) : (
              <div className="space-y-2">
                {enabledWidgets.map((widgetId, index) => {
                  const widget = AVAILABLE_WIDGETS.find(w => w.id === widgetId)
                  if (!widget) return null

                  return (
                    <div
                      key={widget.id}
                      className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg"
                    >
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => moveWidget(widget.id, 'up')}
                          disabled={index === 0}
                          className="p-0.5 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => moveWidget(widget.id, 'down')}
                          disabled={index === enabledWidgets.length - 1}
                          className="p-0.5 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-700">{widget.name}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${getCategoryColor(widget.category)}`}>
                            {getCategoryLabel(widget.category)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">{widget.description}</p>
                      </div>
                      <button
                        onClick={() => toggleWidget(widget.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hide widget"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Disabled Widgets */}
          {disabledWidgets.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-3">Hidden Widgets</h3>
              <div className="space-y-2">
                {disabledWidgets.map(widget => (
                  <div
                    key={widget.id}
                    className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg opacity-60"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-600">{widget.name}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${getCategoryColor(widget.category)}`}>
                          {getCategoryLabel(widget.category)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate">{widget.description}</p>
                    </div>
                    <button
                      onClick={() => toggleWidget(widget.id)}
                      className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Show widget"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Reset to default
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
