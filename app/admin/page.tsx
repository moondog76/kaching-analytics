'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Users, Building2, Plus, Search, MoreVertical,
  Check, X, Key, Trash2, Edit, ChevronRight, Shield, MessageSquare, FileText, Upload
} from 'lucide-react'

interface User {
  id: string
  email: string
  name: string
  role: string
  isActive: boolean
  merchantId?: string
  merchantName?: string
  hasPassword: boolean
  lastLogin?: string
}

interface Merchant {
  id: string
  name: string
  industry?: string
  cashbackPercent?: number
  userCount: number
  transactionCount?: number
}

export default function AdminPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'users' | 'merchants'>('users')
  const [users, setUsers] = useState<User[]>([])
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [showCreateMerchant, setShowCreateMerchant] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const userRole = (session?.user as any)?.role

  // Check admin access
  useEffect(() => {
    if (session && userRole !== 'super_admin' && userRole !== 'admin') {
      router.push('/')
    }
  }, [session, userRole, router])

  // Load data
  useEffect(() => {
    loadData()
  }, [activeTab, search])

  async function loadData() {
    setIsLoading(true)
    try {
      if (activeTab === 'users') {
        const res = await fetch(`/api/admin/users${search ? `?search=${encodeURIComponent(search)}` : ''}`)
        const data = await res.json()
        if (data.users) setUsers(data.users)
      } else {
        const res = await fetch(`/api/admin/merchants?stats=true${search ? `&search=${encodeURIComponent(search)}` : ''}`)
        const data = await res.json()
        if (data.merchants) setMerchants(data.merchants)
      }
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  async function toggleUserActive(userId: string, isActive: boolean) {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      })
      if (res.ok) {
        setSuccess(`User ${isActive ? 'deactivated' : 'activated'}`)
        loadData()
      }
    } catch (err) {
      setError('Failed to update user')
    }
  }

  async function resetPassword(userId: string) {
    if (!confirm('Generate a new password for this user?')) return
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generatePass: true })
      })
      const data = await res.json()
      if (data.generatedPassword) {
        alert(`New password: ${data.generatedPassword}\n\nMake sure to share this with the user securely.`)
        loadData()
      }
    } catch (err) {
      setError('Failed to reset password')
    }
  }

  async function deleteUser(userId: string, email: string) {
    if (!confirm(`Delete user ${email}? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
      if (res.ok) {
        setSuccess('User deleted')
        loadData()
      }
    } catch (err) {
      setError('Failed to delete user')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-8 py-5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-500 hover:text-slate-900 transition">
              ← Dashboard
            </Link>
            <div className="text-xl font-semibold text-slate-800 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              Admin Panel
            </div>
          </div>
          <div className="text-sm text-slate-500">
            Logged in as <span className="text-blue-600 font-medium">{userRole}</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-6">
        {/* Alerts */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex justify-between">
            {error}
            <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 flex justify-between">
            {success}
            <button onClick={() => setSuccess(null)}><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'users'
                ? 'bg-blue-50 text-blue-600'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('merchants')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'merchants'
                ? 'bg-blue-50 text-blue-600'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Merchants
          </button>

          <div className="flex-1" />

          {/* Quick Links */}
          <Link
            href="/admin/ai-conversations"
            className="flex items-center gap-2 px-4 py-2 bg-pluxee-ultra-green/10 border border-pluxee-ultra-green/20 text-pluxee-deep-blue rounded-lg font-medium hover:bg-pluxee-ultra-green/20 transition"
          >
            <MessageSquare className="w-4 h-4" />
            AI Conversations
          </Link>
          <Link
            href="/admin/audit-logs"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg font-medium hover:text-slate-900 hover:bg-slate-50 transition"
          >
            <FileText className="w-4 h-4" />
            Audit Logs
          </Link>
          <Link
            href="/admin/import"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg font-medium hover:text-slate-900 hover:bg-slate-50 transition"
          >
            <Upload className="w-4 h-4" />
            Import Data
          </Link>
        </div>

        {/* Search & Actions */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          {activeTab === 'users' && (
            <button
              onClick={() => setShowCreateUser(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
              Add User
            </button>
          )}
          {activeTab === 'merchants' && userRole === 'super_admin' && (
            <button
              onClick={() => setShowCreateMerchant(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
              Add Merchant
            </button>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-12 text-slate-500">Loading...</div>
        ) : activeTab === 'users' ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">User</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Role</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Merchant</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{user.name || user.email}</div>
                      <div className="text-sm text-slate-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'super_admin' ? 'bg-purple-100 text-purple-700' :
                        user.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {user.merchantName || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-1 text-sm font-medium ${
                        user.isActive ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {user.isActive ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => toggleUserActive(user.id, user.isActive)}
                          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition"
                          title={user.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {user.isActive ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => resetPassword(user.id)}
                          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition"
                          title="Reset Password"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteUser(user.id, user.email)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="text-center py-12 text-slate-500">No users found</div>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {merchants.map(merchant => (
              <div
                key={merchant.id}
                className="bg-white rounded-xl border border-slate-200 shadow-card p-6 hover:border-blue-300 transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">{merchant.name}</h3>
                    <p className="text-slate-500">{merchant.industry || 'Retail'}</p>
                  </div>
                  <Link
                    href={`/?merchantId=${merchant.id}`}
                    className="flex items-center gap-1 text-blue-600 hover:underline font-medium"
                  >
                    View Dashboard <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Users</p>
                    <p className="text-2xl font-semibold text-slate-800">{merchant.userCount}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Transactions</p>
                    <p className="text-2xl font-semibold text-slate-800">
                      {merchant.transactionCount?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Cashback %</p>
                    <p className="text-2xl font-semibold text-slate-800">
                      {merchant.cashbackPercent || '-'}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {merchants.length === 0 && (
              <div className="text-center py-12 text-slate-500">No merchants found</div>
            )}
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateUser && (
        <CreateUserModal
          merchants={merchants}
          userRole={userRole}
          onClose={() => setShowCreateUser(false)}
          onSuccess={() => { setShowCreateUser(false); loadData(); setSuccess('User created'); }}
        />
      )}

      {/* Create Merchant Modal */}
      {showCreateMerchant && (
        <CreateMerchantModal
          onClose={() => setShowCreateMerchant(false)}
          onSuccess={() => { setShowCreateMerchant(false); loadData(); setSuccess('Merchant created'); }}
        />
      )}
    </div>
  )
}

function CreateUserModal({ merchants, userRole, onClose, onSuccess }: {
  merchants: Merchant[]
  userRole: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('merchant')
  const [merchantId, setMerchantId] = useState('')
  const [generatePass, setGeneratePass] = useState(true)
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [generatedPassword, setGeneratedPassword] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          role,
          merchantId: merchantId || undefined,
          generatePass,
          password: generatePass ? undefined : password
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create user')
        return
      }

      if (data.generatedPassword) {
        setGeneratedPassword(data.generatedPassword)
      } else {
        onSuccess()
      }
    } catch (err) {
      setError('Failed to create user')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (generatedPassword) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-md border border-slate-200 shadow-elevated">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">User Created!</h2>
          <p className="text-slate-500 mb-4">Share these credentials securely with the user:</p>
          <div className="bg-slate-50 rounded-lg p-4 mb-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Email</p>
            <p className="text-slate-800 font-mono">{email}</p>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mt-2">Password</p>
            <p className="text-slate-800 font-mono text-lg">{generatedPassword}</p>
          </div>
          <button
            onClick={onSuccess}
            className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium"
          >
            Done
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md border border-slate-200 shadow-elevated">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Create User</h2>
        {error && <p className="text-red-600 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="merchant">Merchant</option>
              <option value="analyst">Analyst</option>
              <option value="viewer">Viewer</option>
              {userRole === 'super_admin' && <option value="admin">Admin</option>}
            </select>
          </div>
          {userRole === 'super_admin' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Merchant</label>
              <select
                value={merchantId}
                onChange={(e) => setMerchantId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">No merchant (platform user)</option>
                {merchants.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={generatePass}
                onChange={(e) => setGeneratePass(e.target.checked)}
                className="rounded"
              />
              Generate secure password
            </label>
          </div>
          {!generatePass && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!generatePass}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              <p className="text-xs text-slate-500 mt-1">Min 8 chars, 1 uppercase, 1 lowercase, 1 number</p>
            </div>
          )}
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CreateMerchantModal({ onClose, onSuccess }: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [name, setName] = useState('')
  const [industry, setIndustry] = useState('Retail')
  const [cashbackPercent, setCashbackPercent] = useState('')
  const [createAdmin, setCreateAdmin] = useState(true)
  const [adminEmail, setAdminEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<any>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/admin/merchants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          industry,
          cashbackPercent: cashbackPercent ? parseFloat(cashbackPercent) : null,
          createAdminUser: createAdmin,
          adminEmail: adminEmail || undefined
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create merchant')
        return
      }

      if (data.adminUser?.generatedPassword) {
        setResult(data)
      } else {
        onSuccess()
      }
    } catch (err) {
      setError('Failed to create merchant')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (result) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-md border border-slate-200 shadow-elevated">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Merchant Created!</h2>
          <div className="bg-slate-50 rounded-lg p-4 mb-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Merchant</p>
            <p className="text-slate-800 font-medium">{result.merchant.name}</p>
          </div>
          {result.adminUser && (
            <div className="bg-slate-50 rounded-lg p-4 mb-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Admin User</p>
              <p className="text-slate-800 font-mono">{result.adminUser.email}</p>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mt-2">Password</p>
              <p className="text-slate-800 font-mono text-lg">{result.adminUser.generatedPassword}</p>
            </div>
          )}
          <button
            onClick={onSuccess}
            className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium"
          >
            Done
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md border border-slate-200 shadow-elevated">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Create Merchant</h2>
        {error && <p className="text-red-600 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Industry</label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cashback %</label>
            <input
              type="number"
              step="0.01"
              value={cashbackPercent}
              onChange={(e) => setCashbackPercent(e.target.value)}
              placeholder="e.g., 5.00"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={createAdmin}
                onChange={(e) => setCreateAdmin(e.target.checked)}
                className="rounded"
              />
              Create admin user for this merchant
            </label>
          </div>
          {createAdmin && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Admin Email (optional)</label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="Auto-generated if empty"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          )}
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Merchant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
