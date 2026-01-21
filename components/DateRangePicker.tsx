'use client'

import { useState, useRef, useEffect } from 'react'
import { format, subDays, startOfDay, endOfDay, isAfter, isBefore, isEqual } from 'date-fns'

export interface DateRange {
  startDate: Date
  endDate: Date
  label: string
}

interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
  minDate?: Date
  maxDate?: Date
}

const presetRanges = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 14 days', days: 14 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 60 days', days: 60 },
  { label: 'Last 90 days', days: 90 },
]

export function getDefaultDateRange(): DateRange {
  const endDate = endOfDay(new Date())
  const startDate = startOfDay(subDays(endDate, 30))
  return { startDate, endDate, label: 'Last 30 days' }
}

export default function DateRangePicker({ value, onChange, minDate, maxDate }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Update custom inputs when value changes
  useEffect(() => {
    setCustomStart(format(value.startDate, 'yyyy-MM-dd'))
    setCustomEnd(format(value.endDate, 'yyyy-MM-dd'))
  }, [value])

  const handlePresetSelect = (preset: { label: string; days: number }) => {
    const endDate = endOfDay(new Date())
    const startDate = startOfDay(subDays(endDate, preset.days))
    onChange({ startDate, endDate, label: preset.label })
    setIsOpen(false)
  }

  const handleCustomApply = () => {
    const start = startOfDay(new Date(customStart))
    const end = endOfDay(new Date(customEnd))

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return
    }

    if (isAfter(start, end)) {
      return
    }

    if (minDate && isBefore(start, minDate)) {
      return
    }

    if (maxDate && isAfter(end, maxDate)) {
      return
    }

    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    onChange({
      startDate: start,
      endDate: end,
      label: `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`
    })
    setIsOpen(false)
  }

  const formatDisplayDate = () => {
    return value.label
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-card"
      >
        <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-sm font-medium text-slate-700">{formatDisplayDate()}</span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-elevated z-50 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('presets')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'presets'
                  ? 'text-blue-600 border-b-2 border-blue-500 bg-blue-50/50'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              Quick Select
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'custom'
                  ? 'text-blue-600 border-b-2 border-blue-500 bg-blue-50/50'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              Custom Range
            </button>
          </div>

          {/* Content */}
          <div className="p-3">
            {activeTab === 'presets' ? (
              <div className="space-y-1">
                {presetRanges.map((preset) => {
                  const isActive = value.label === preset.label
                  return (
                    <button
                      key={preset.days}
                      onClick={() => handlePresetSelect(preset)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{preset.label}</span>
                      {isActive && (
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    max={customEnd || format(new Date(), 'yyyy-MM-dd')}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    min={customStart}
                    max={format(new Date(), 'yyyy-MM-dd')}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={handleCustomApply}
                  className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Apply Range
                </button>
              </div>
            )}
          </div>

          {/* Footer with current selection */}
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Selected:</span>
              <span className="font-medium text-slate-700">
                {format(value.startDate, 'MMM d, yyyy')} - {format(value.endDate, 'MMM d, yyyy')}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
