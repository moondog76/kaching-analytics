'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface MerchantSettings {
  id: string
  name: string
  logo_url: string | null
  primary_color: string | null
  secondary_color: string | null
  custom_domain: string | null
  api_key: string | null
  api_key_created: string | null
  api_rate_limit: number | null
  webhook_url: string | null
  webhook_events: string[]
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [settings, setSettings] = useState<MerchantSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Form state
  const [branding, setBranding] = useState({
    logo_url: '',
    primary_color: '#FF6B35',
    secondary_color: '#7B61FF',
    custom_domain: ''
  })
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookEvents, setWebhookEvents] = useState<string[]>([])
  const [showApiKey, setShowApiKey] = useState(false)

  const availableWebhookEvents = [
    { id: 'anomaly.detected', label: 'Anomaly Detected', description: 'When unusual patterns are found' },
    { id: 'daily_report.ready', label: 'Daily Report Ready', description: 'Daily summary is available' },
    { id: 'threshold.exceeded', label: 'Threshold Exceeded', description: 'Revenue/transaction limits hit' },
    { id: 'weekly_report.ready', label: 'Weekly Report Ready', description: 'Weekly summary is available' }
  ]

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user?.merchantId) {
      fetchSettings()
    } else if (status === 'authenticated' && !session?.user?.merchantId) {
      setLoading(false)
    }
  }, [session, status])

  const fetchSettings = async () => {
    try {
      const res = await fetch(`/api/admin/merchants/${session?.user?.merchantId}/settings`)
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
        setBranding({
          logo_url: data.logo_url || '',
          primary_color: data.primary_color || '#FF6B35',
          secondary_color: data.secondary_color || '#7B61FF',
          custom_domain: data.custom_domain || ''
        })
        setWebhookUrl(data.webhook_url || '')
        setWebhookEvents(data.webhook_events || [])
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleAction = async (action: string, data?: any) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/merchants/${session?.user?.merchantId}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data })
      })

      if (res.ok) {
        const result = await res.json()
        showMessage('success', result.message || 'Settings updated successfully')
        fetchSettings()
      } else {
        const error = await res.json()
        showMessage('error', error.message || 'Failed to update settings')
      }
    } catch (error) {
      showMessage('error', 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateApiKey = () => handleAction('generate_api_key')
  const handleRevokeApiKey = () => {
    if (confirm('Are you sure you want to revoke your API key? This cannot be undone.')) {
      handleAction('revoke_api_key')
    }
  }

  const handleSaveBranding = () => {
    handleAction('update_branding', { branding })
  }

  const handleSaveWebhook = () => {
    if (webhookUrl) {
      handleAction('configure_webhook', {
        webhook_url: webhookUrl,
        webhook_events: webhookEvents
      })
    } else {
      handleAction('remove_webhook')
    }
  }

  const toggleWebhookEvent = (eventId: string) => {
    setWebhookEvents(prev =>
      prev.includes(eventId)
        ? prev.filter(e => e !== eventId)
        : [...prev, eventId]
    )
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!session?.user?.merchantId) {
    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-white mb-2">No Merchant Assigned</h2>
            <p className="text-gray-400">You need to be assigned to a merchant to access settings.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-gray-400 mt-1">Manage your merchant configuration</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
          }`}>
            {message.text}
          </div>
        )}

        {/* API Access Section */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            API Access
          </h2>
          <p className="text-gray-400 text-sm mb-4">
            Use your API key to access metrics, anomalies, and forecasts programmatically.
          </p>

          {settings?.api_key ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm text-gray-400 mb-1">Your API Key</label>
                  <div className="flex items-center gap-2">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={settings.api_key}
                      readOnly
                      className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg font-mono text-sm"
                    />
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500"
                    >
                      {showApiKey ? 'Hide' : 'Show'}
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(settings.api_key || '')
                        showMessage('success', 'API key copied to clipboard')
                      }}
                      className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">
                  Created: {settings.api_key_created ? new Date(settings.api_key_created).toLocaleDateString() : 'Unknown'}
                </span>
                <span className="text-gray-400">
                  Rate limit: {settings.api_rate_limit || 1000} requests/hour
                </span>
              </div>
              <button
                onClick={handleRevokeApiKey}
                disabled={saving}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Revoke API Key
              </button>
            </div>
          ) : (
            <button
              onClick={handleGenerateApiKey}
              disabled={saving}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
            >
              Generate API Key
            </button>
          )}

          {/* API Documentation */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <h3 className="text-sm font-medium text-white mb-3">API Endpoints</h3>
            <div className="space-y-2 text-sm font-mono">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-green-900 text-green-300 rounded text-xs">GET</span>
                <span className="text-gray-300">/api/v1/metrics</span>
                <span className="text-gray-500">- Daily metrics</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-green-900 text-green-300 rounded text-xs">GET</span>
                <span className="text-gray-300">/api/v1/anomalies</span>
                <span className="text-gray-500">- Detected anomalies</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-green-900 text-green-300 rounded text-xs">GET</span>
                <span className="text-gray-300">/api/v1/forecast</span>
                <span className="text-gray-500">- Revenue forecast</span>
              </div>
            </div>
            <p className="text-gray-500 text-xs mt-3">
              Include your API key in the <code className="text-gray-400">X-API-Key</code> header.
            </p>
          </div>
        </div>

        {/* Webhooks Section */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Webhooks
          </h2>
          <p className="text-gray-400 text-sm mb-4">
            Receive real-time notifications when important events occur.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Webhook URL</label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://your-server.com/webhook"
                className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Events to Subscribe</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableWebhookEvents.map(event => (
                  <label
                    key={event.id}
                    className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      webhookEvents.includes(event.id)
                        ? 'bg-orange-500/20 border border-orange-500/50'
                        : 'bg-gray-700 border border-transparent hover:border-gray-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={webhookEvents.includes(event.id)}
                      onChange={() => toggleWebhookEvent(event.id)}
                      className="mt-1"
                    />
                    <div>
                      <div className="text-white text-sm font-medium">{event.label}</div>
                      <div className="text-gray-400 text-xs">{event.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleSaveWebhook}
              disabled={saving}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
            >
              {webhookUrl ? 'Save Webhook Configuration' : 'Remove Webhook'}
            </button>

            {settings?.webhook_url && (
              <p className="text-green-400 text-sm">
                ✓ Webhook configured: {settings.webhook_url}
              </p>
            )}
          </div>
        </div>

        {/* Branding Section */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            Branding
          </h2>
          <p className="text-gray-400 text-sm mb-4">
            Customize the look and feel of your analytics dashboard.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Logo URL</label>
              <input
                type="url"
                value={branding.logo_url}
                onChange={(e) => setBranding({ ...branding, logo_url: e.target.value })}
                placeholder="https://example.com/logo.png"
                className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Custom Domain</label>
              <input
                type="text"
                value={branding.custom_domain}
                onChange={(e) => setBranding({ ...branding, custom_domain: e.target.value })}
                placeholder="analytics.yourcompany.com"
                className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Primary Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={branding.primary_color}
                  onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={branding.primary_color}
                  onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
                  className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Secondary Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={branding.secondary_color}
                  onChange={(e) => setBranding({ ...branding, secondary_color: e.target.value })}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={branding.secondary_color}
                  onChange={(e) => setBranding({ ...branding, secondary_color: e.target.value })}
                  className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg font-mono"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="mt-4 p-4 bg-gray-700 rounded-lg">
            <p className="text-gray-400 text-xs mb-2">Preview</p>
            <div className="flex items-center gap-4">
              <div
                className="w-8 h-8 rounded"
                style={{ backgroundColor: branding.primary_color }}
              />
              <div
                className="w-8 h-8 rounded"
                style={{ backgroundColor: branding.secondary_color }}
              />
              <span className="text-white">Your brand colors</span>
            </div>
          </div>

          <button
            onClick={handleSaveBranding}
            disabled={saving}
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
          >
            Save Branding
          </button>
        </div>

        {/* PWA Install Section */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Mobile App
          </h2>
          <p className="text-gray-400 text-sm mb-4">
            Install KaChing Analytics as an app on your device for quick access.
          </p>

          <div className="bg-gray-700 rounded-lg p-4">
            <p className="text-white text-sm mb-2">To install:</p>
            <ul className="text-gray-400 text-sm space-y-1 list-disc list-inside">
              <li>On iOS: Tap Share → Add to Home Screen</li>
              <li>On Android: Tap Menu → Install App</li>
              <li>On Desktop: Click the install icon in the address bar</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
