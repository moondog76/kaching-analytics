'use client'

import { useState, useEffect } from 'react'

interface NotificationPrefs {
  email_anomalies: boolean
  email_weekly_digest: boolean
  email_threshold: boolean
  slack_webhook_url: string | null
  slack_anomalies: boolean
  slack_threshold: boolean
  threshold_revenue: number | null
  threshold_txn: number | null
}

export default function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationPrefs>({
    email_anomalies: true,
    email_weekly_digest: true,
    email_threshold: true,
    slack_webhook_url: null,
    slack_anomalies: false,
    slack_threshold: false,
    threshold_revenue: null,
    threshold_txn: null
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState<'email' | 'slack' | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/notification-settings')
      if (res.ok) {
        const data = await res.json()
        if (data.settings) {
          setSettings({
            email_anomalies: data.settings.email_anomalies ?? true,
            email_weekly_digest: data.settings.email_weekly_digest ?? true,
            email_threshold: data.settings.email_threshold ?? true,
            slack_webhook_url: data.settings.slack_webhook_url || '',
            slack_anomalies: data.settings.slack_anomalies ?? false,
            slack_threshold: data.settings.slack_threshold ?? false,
            threshold_revenue: data.settings.threshold_revenue,
            threshold_txn: data.settings.threshold_txn
          })
        }
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 4000)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/notification-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (res.ok) {
        showMessage('success', 'Notification settings saved')
      } else {
        const error = await res.json()
        showMessage('error', error.error || 'Failed to save settings')
      }
    } catch (error) {
      showMessage('error', 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async (type: 'email' | 'slack') => {
    setTesting(type)
    try {
      const res = await fetch('/api/notification-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          webhookUrl: settings.slack_webhook_url
        })
      })

      const data = await res.json()
      if (res.ok) {
        showMessage('success', data.message || 'Test notification sent!')
      } else {
        showMessage('error', data.error || 'Failed to send test notification')
      }
    } catch (error) {
      showMessage('error', 'An error occurred')
    } finally {
      setTesting(null)
    }
  }

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-card p-6">
        <div className="animate-pulse">
          <div className="h-5 bg-slate-200 rounded w-1/3 mb-4" />
          <div className="h-4 bg-slate-100 rounded w-1/2 mb-6" />
          <div className="space-y-3">
            <div className="h-10 bg-slate-100 rounded" />
            <div className="h-10 bg-slate-100 rounded" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-card p-6">
      <div className="mb-6">
        <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          Notification Settings
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Configure how you want to be notified about anomalies and alerts
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Email Notifications */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-slate-800 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Email Notifications
        </h3>

        <div className="space-y-3">
          <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={settings.email_anomalies}
              onChange={(e) => setSettings({ ...settings, email_anomalies: e.target.checked })}
              className="rounded"
            />
            <div>
              <div className="text-sm font-medium text-slate-700">Anomaly Alerts</div>
              <div className="text-xs text-slate-500">Get notified when unusual patterns are detected</div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={settings.email_weekly_digest}
              onChange={(e) => setSettings({ ...settings, email_weekly_digest: e.target.checked })}
              className="rounded"
            />
            <div>
              <div className="text-sm font-medium text-slate-700">Weekly Digest</div>
              <div className="text-xs text-slate-500">Receive a weekly summary of your metrics</div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={settings.email_threshold}
              onChange={(e) => setSettings({ ...settings, email_threshold: e.target.checked })}
              className="rounded"
            />
            <div>
              <div className="text-sm font-medium text-slate-700">Threshold Alerts</div>
              <div className="text-xs text-slate-500">Alert when metrics fall below thresholds</div>
            </div>
          </label>

          <button
            onClick={() => handleTest('email')}
            disabled={testing !== null}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            {testing === 'email' ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Sending...
              </>
            ) : (
              'Send test email'
            )}
          </button>
        </div>
      </div>

      {/* Slack Notifications */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-slate-800 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
          </svg>
          Slack Notifications
        </h3>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
              Webhook URL
            </label>
            <input
              type="url"
              value={settings.slack_webhook_url || ''}
              onChange={(e) => setSettings({ ...settings, slack_webhook_url: e.target.value || null })}
              placeholder="https://hooks.slack.com/services/..."
              className="w-full bg-white border border-slate-200 text-slate-800 px-3 py-2 rounded-lg placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
            <p className="text-xs text-slate-400 mt-1">
              Create an <a href="https://api.slack.com/messaging/webhooks" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">incoming webhook</a> in your Slack workspace
            </p>
          </div>

          {settings.slack_webhook_url && (
            <>
              <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={settings.slack_anomalies}
                  onChange={(e) => setSettings({ ...settings, slack_anomalies: e.target.checked })}
                  className="rounded"
                />
                <div>
                  <div className="text-sm font-medium text-slate-700">Anomaly Alerts</div>
                  <div className="text-xs text-slate-500">Post to Slack when anomalies are detected</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={settings.slack_threshold}
                  onChange={(e) => setSettings({ ...settings, slack_threshold: e.target.checked })}
                  className="rounded"
                />
                <div>
                  <div className="text-sm font-medium text-slate-700">Threshold Alerts</div>
                  <div className="text-xs text-slate-500">Post to Slack when metrics fall below thresholds</div>
                </div>
              </label>

              <button
                onClick={() => handleTest('slack')}
                disabled={testing !== null || !settings.slack_webhook_url}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 disabled:opacity-50"
              >
                {testing === 'slack' ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending...
                  </>
                ) : (
                  'Send test Slack message'
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Alert Thresholds */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-slate-800 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Alert Thresholds
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          Get alerted when your metrics fall below these values
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
              Minimum Daily Revenue (RON)
            </label>
            <input
              type="number"
              value={settings.threshold_revenue || ''}
              onChange={(e) => setSettings({ ...settings, threshold_revenue: e.target.value ? parseFloat(e.target.value) : null })}
              placeholder="e.g., 1000"
              className="w-full bg-white border border-slate-200 text-slate-800 px-3 py-2 rounded-lg placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
              Minimum Daily Transactions
            </label>
            <input
              type="number"
              value={settings.threshold_txn || ''}
              onChange={(e) => setSettings({ ...settings, threshold_txn: e.target.value ? parseInt(e.target.value) : null })}
              placeholder="e.g., 50"
              className="w-full bg-white border border-slate-200 text-slate-800 px-3 py-2 rounded-lg placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Notification Settings'}
      </button>
    </div>
  )
}
