'use client'

import { useState, useRef, useEffect } from 'react'
import { format } from 'date-fns'
import { DateRange } from './DateRangePicker'

interface ExportButtonProps {
  dateRange: DateRange
  merchantId?: string
}

const exportFormats = [
  { id: 'csv', label: 'CSV', description: 'Comma-separated values', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { id: 'excel', label: 'Excel', description: 'Microsoft Excel format', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { id: 'json', label: 'JSON', description: 'For developers & integrations', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
]

export default function ExportButton({ dateRange, merchantId }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleExport = async (formatId: string) => {
    setIsExporting(formatId)

    try {
      const params = new URLSearchParams()
      params.set('format', formatId)
      params.set('startDate', format(dateRange.startDate, 'yyyy-MM-dd'))
      params.set('endDate', format(dateRange.endDate, 'yyyy-MM-dd'))
      if (merchantId) params.set('merchantId', merchantId)

      const response = await fetch(`/api/export?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Export failed')
      }

      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition')
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/)
      const filename = filenameMatch ? filenameMatch[1] : `export.${formatId}`

      // Download the file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setIsOpen(false)
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export data. Please try again.')
    } finally {
      setIsExporting(null)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-card"
      >
        <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <span className="text-sm font-medium text-slate-700">Export</span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-elevated z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Export Data</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {dateRange.label}
            </p>
          </div>

          <div className="p-2">
            {exportFormats.map((formatOption) => (
              <button
                key={formatOption.id}
                onClick={() => handleExport(formatOption.id)}
                disabled={isExporting !== null}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  {isExporting === formatOption.id ? (
                    <svg className="w-4 h-4 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={formatOption.icon} />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-700">{formatOption.label}</div>
                  <div className="text-xs text-slate-400">{formatOption.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
