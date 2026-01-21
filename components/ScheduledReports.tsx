'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'

interface ScheduledReport {
  id: string
  name: string
  frequency: string
  recipients: string[]
  include_competitors: boolean
  include_historical: boolean
  is_active: boolean
  last_sent_at: string | null
  next_scheduled_at: string
  created_at: string
}

export default function ScheduledReports() {
  const [reports, setReports] = useState<ScheduledReport[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [sendingId, setSendingId] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    frequency: 'weekly',
    recipients: '',
    includeCompetitors: true,
    includeHistorical: true
  })

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/scheduled-reports')
      if (res.ok) {
        const data = await res.json()
        setReports(data.reports || [])
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 4000)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const recipients = formData.recipients
        .split(',')
        .map(email => email.trim())
        .filter(email => email)

      const res = await fetch('/api/scheduled-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          frequency: formData.frequency,
          recipients,
          includeCompetitors: formData.includeCompetitors,
          includeHistorical: formData.includeHistorical
        })
      })

      if (res.ok) {
        showMessage('success', 'Scheduled report created successfully')
        setFormData({
          name: '',
          frequency: 'weekly',
          recipients: '',
          includeCompetitors: true,
          includeHistorical: true
        })
        setShowForm(false)
        fetchReports()
      } else {
        const error = await res.json()
        showMessage('error', error.error || 'Failed to create report')
      }
    } catch (error) {
      showMessage('error', 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (report: ScheduledReport) => {
    try {
      const res = await fetch(`/api/scheduled-reports/${report.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !report.is_active })
      })

      if (res.ok) {
        showMessage('success', report.is_active ? 'Report paused' : 'Report activated')
        fetchReports()
      } else {
        showMessage('error', 'Failed to update report')
      }
    } catch (error) {
      showMessage('error', 'An error occurred')
    }
  }

  const handleDelete = async (report: ScheduledReport) => {
    if (!confirm(`Delete "${report.name}"? This cannot be undone.`)) return

    try {
      const res = await fetch(`/api/scheduled-reports/${report.id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        showMessage('success', 'Report deleted')
        fetchReports()
      } else {
        showMessage('error', 'Failed to delete report')
      }
    } catch (error) {
      showMessage('error', 'An error occurred')
    }
  }

  const handleSendNow = async (report: ScheduledReport) => {
    setSendingId(report.id)
    try {
      const res = await fetch(`/api/scheduled-reports/send?id=${report.id}`)
      if (res.ok) {
        showMessage('success', 'Report sent successfully!')
        fetchReports()
      } else {
        const error = await res.json()
        showMessage('error', error.error || 'Failed to send report')
      }
    } catch (error) {
      showMessage('error', 'An error occurred')
    } finally {
      setSendingId(null)
    }
  }

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case 'daily': return 'Daily'
      case 'weekly': return 'Weekly'
      case 'monthly': return 'Monthly'
      default: return freq
    }
  }

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-card p-6">
        <div className="animate-pulse">
          <div className="h-5 bg-slate-200 rounded w-1/3 mb-4" />
          <div className="h-4 bg-slate-100 rounded w-1/2 mb-6" />
          <div className="space-y-3">
            <div className="h-16 bg-slate-100 rounded" />
            <div className="h-16 bg-slate-100 rounded" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Scheduled Reports
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Automatically receive analytics reports via email
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Add Report
          </button>
        )}
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <h3 className="text-sm font-medium text-slate-800 mb-4">Create New Report</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Report Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Weekly Performance Summary"
                required
                className="w-full bg-white border border-slate-200 text-slate-800 px-3 py-2 rounded-lg placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Frequency</label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                className="w-full bg-white border border-slate-200 text-slate-800 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="daily">Daily (8 AM)</option>
                <option value="weekly">Weekly (Monday 8 AM)</option>
                <option value="monthly">Monthly (1st day 8 AM)</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
              Recipients (comma-separated emails)
            </label>
            <input
              type="text"
              value={formData.recipients}
              onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
              placeholder="manager@company.com, team@company.com"
              required
              className="w-full bg-white border border-slate-200 text-slate-800 px-3 py-2 rounded-lg placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex flex-wrap gap-4 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.includeCompetitors}
                onChange={(e) => setFormData({ ...formData, includeCompetitors: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-slate-700">Include competitor comparison</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.includeHistorical}
                onChange={(e) => setFormData({ ...formData, includeHistorical: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-slate-700">Include historical trends</span>
            </label>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Report'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Reports List */}
      {reports.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-slate-500 text-sm">No scheduled reports yet</p>
          <p className="text-slate-400 text-xs mt-1">Create one to receive automatic email updates</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div
              key={report.id}
              className={`p-4 rounded-lg border transition-colors ${
                report.is_active
                  ? 'bg-white border-slate-200'
                  : 'bg-slate-50 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium text-slate-800 truncate">{report.name}</h4>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      report.is_active
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {report.is_active ? 'Active' : 'Paused'}
                    </span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      {getFrequencyLabel(report.frequency)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mb-2 truncate">
                    To: {report.recipients.join(', ')}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    {report.last_sent_at && (
                      <span>
                        Last sent: {format(new Date(report.last_sent_at), 'MMM d, h:mm a')}
                      </span>
                    )}
                    <span>
                      Next: {format(new Date(report.next_scheduled_at), 'MMM d, h:mm a')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleSendNow(report)}
                    disabled={sendingId === report.id}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Send now"
                  >
                    {sendingId === report.id ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => handleToggle(report)}
                    className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                    title={report.is_active ? 'Pause' : 'Activate'}
                  >
                    {report.is_active ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(report)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      <div className="mt-6 pt-4 border-t border-slate-100">
        <p className="text-xs text-slate-400">
          Reports are sent at 8 AM in your timezone. Configure email settings in environment variables (SMTP or Resend).
        </p>
      </div>
    </div>
  )
}
