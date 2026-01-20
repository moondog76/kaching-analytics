'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Users, Building2, Plus, Search, MoreVertical,
  Check, X, Key, Trash2, Edit, ChevronRight, Shield
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
    <div className="min-h-screen bg-[#0A0E27]">
      {/* Header */}
      <header className="border-b border-[#252B4A] bg-[#0A0E27]">
        <div className="max-w-7xl mx-auto px-8 py-5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-[#5A5F7D] hover:text-white transition">
              ← Dashboard
            </Link>
            <div className="text-2xl font-bold text-white flex items-center gap-2">
              <Shield className="w-6 h-6 text-[#FF6B35]" />
              Admin Panel
            </div>
          </div>
          <div className="text-sm text-[#5A5F7D]">
            Logged in as <span className="text-[#FF6B35]">{userRole}</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-6">
        {/* Alerts */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 flex justify-between">
            {error}
            <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 flex justify-between">
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
                ? 'bg-[#FF6B35] text-white'
                : 'bg-[#1C2342] text-[#8B92B8] hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('merchants')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'merchants'
                ? 'bg-[#FF6B35] text-white'
                : 'bg-[#1C2342] text-[#8B92B8] hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Merchants
          </button>
        </div>

        {/* Search & Actions */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A5F7D]" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#1C2342] border border-[#252B4A] rounded-lg text-white placeholder-[#5A5F7D] focus:outline-none focus:border-[#FF6B35]"
            />
          </div>
          {activeTab === 'users' && (
            <button
              onClick={() => setShowCreateUser(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#FF6B35] text-white rounded-lg hover:bg-[#FF6B35]/90 transition"
            >
              <Plus className="w-4 h-4" />
              Add User
            </button>
          )}
          {activeTab === 'merchants' && userRole === 'super_admin' && (
            <button
              onClick={() => setShowCreateMerchant(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#FF6B35] text-white rounded-lg hover:bg-[#FF6B35]/90 transition"
            >
              <Plus className="w-4 h-4" />
              Add Merchant
            </button>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-12 text-[#5A5F7D]">Loading...</div>
        ) : activeTab === 'users' ? (
          <div className="bg-[#1C2342] rounded-xl border border-[#252B4A] overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#252B4A]/50">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-[#8B92B8]">User</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-[#8B92B8]">Role</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-[#8B92B8]">Merchant</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-[#8B92B8]">Status</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-[#8B92B8]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-t border-[#252B4A] hover:bg-[#252B4A]/30">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{user.name || user.email}</div>
                      <div className="text-sm text-[#5A5F7D]">{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        user.role === 'super_admin' ? 'bg-purple-500/20 text-purple-400' :
                        user.role === 'admin' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#8B92B8]">
                      {user.merchantName || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-1 text-sm ${
                        user.isActive ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {user.isActive ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => toggleUserActive(user.id, user.isActive)}
                          className="p-2 text-[#5A5F7D] hover:text-white hover:bg-[#252B4A] rounded transition"
                          title={user.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {user.isActive ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => resetPassword(user.id)}
                          className="p-2 text-[#5A5F7D] hover:text-white hover:bg-[#252B4A] rounded transition"
                          title="Reset Password"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteUser(user.id, user.email)}
                          className="p-2 text-[#5A5F7D] hover:text-red-400 hover:bg-[#252B4A] rounded transition"
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
              <div className="text-center py-12 text-[#5A5F7D]">No users found</div>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {merchants.map(merchant => (
              <div
                key={merchant.id}
                className="bg-[#1C2342] rounded-xl border border-[#252B4A] p-6 hover:border-[#FF6B35]/50 transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold text-white">{merchant.name}</h3>
                    <p className="text-[#5A5F7D]">{merchant.industry || 'Retail'}</p>
                  </div>
                  <Link
                    href={`/?merchantId=${merchant.id}`}
                    className="flex items-center gap-1 text-[#FF6B35] hover:underline"
                  >
                    View Dashboard <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div className="bg-[#252B4A]/50 rounded-lg p-3">
                    <p className="text-sm text-[#5A5F7D]">Users</p>
                    <p className="text-2xl font-bold text-white">{merchant.userCount}</p>
                  </div>
                  <div className="bg-[#252B4A]/50 rounded-lg p-3">
                    <p className="text-sm text-[#5A5F7D]">Transactions</p>
                    <p className="text-2xl font-bold text-white">
                      {merchant.transactionCount?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="bg-[#252B4A]/50 rounded-lg p-3">
                    <p className="text-sm text-[#5A5F7D]">Cashback %</p>
                    <p className="text-2xl font-bold text-white">
                      {merchant.cashbackPercent || '-'}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {merchants.length === 0 && (
              <div className="text-center py-12 text-[#5A5F7D]">No merchants found</div>
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
        <div className="bg-[#1C2342] rounded-xl p-6 w-full max-w-md border border-[#252B4A]">
          <h2 className="text-xl font-bold text-white mb-4">User Created!</h2>
          <p className="text-[#8B92B8] mb-4">Share these credentials securely with the user:</p>
          <div className="bg-[#252B4A] rounded-lg p-4 mb-4">
            <p className="text-sm text-[#5A5F7D]">Email</p>
            <p className="text-white font-mono">{email}</p>
            <p className="text-sm text-[#5A5F7D] mt-2">Password</p>
            <p className="text-white font-mono text-lg">{generatedPassword}</p>
          </div>
          <button
            onClick={onSuccess}
            className="w-full py-2 bg-[#FF6B35] text-white rounded-lg hover:bg-[#FF6B35]/90"
          >
            Done
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1C2342] rounded-xl p-6 w-full max-w-md border border-[#252B4A]">
        <h2 className="text-xl font-bold text-white mb-4">Create User</h2>
        {error && <p className="text-red-400 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[#8B92B8] mb-1">Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 bg-[#252B4A] border border-[#252B4A] rounded-lg text-white focus:outline-none focus:border-[#FF6B35]"
            />
          </div>
          <div>
            <label className="block text-sm text-[#8B92B8] mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-[#252B4A] border border-[#252B4A] rounded-lg text-white focus:outline-none focus:border-[#FF6B35]"
            />
          </div>
          <div>
            <label className="block text-sm text-[#8B92B8] mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 bg-[#252B4A] border border-[#252B4A] rounded-lg text-white focus:outline-none focus:border-[#FF6B35]"
            >
              <option value="merchant">Merchant</option>
              <option value="analyst">Analyst</option>
              <option value="viewer">Viewer</option>
              {userRole === 'super_admin' && <option value="admin">Admin</option>}
            </select>
          </div>
          {userRole === 'super_admin' && (
            <div>
              <label className="block text-sm text-[#8B92B8] mb-1">Merchant</label>
              <select
                value={merchantId}
                onChange={(e) => setMerchantId(e.target.value)}
                className="w-full px-3 py-2 bg-[#252B4A] border border-[#252B4A] rounded-lg text-white focus:outline-none focus:border-[#FF6B35]"
              >
                <option value="">No merchant (platform user)</option>
                {merchants.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="flex items-center gap-2 text-sm text-[#8B92B8]">
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
              <label className="block text-sm text-[#8B92B8] mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!generatePass}
                className="w-full px-3 py-2 bg-[#252B4A] border border-[#252B4A] rounded-lg text-white focus:outline-none focus:border-[#FF6B35]"
              />
              <p className="text-xs text-[#5A5F7D] mt-1">Min 8 chars, 1 uppercase, 1 lowercase, 1 number</p>
            </div>
          )}
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-[#252B4A] text-white rounded-lg hover:bg-[#252B4A]/80"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2 bg-[#FF6B35] text-white rounded-lg hover:bg-[#FF6B35]/90 disabled:opacity-50"
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
        <div className="bg-[#1C2342] rounded-xl p-6 w-full max-w-md border border-[#252B4A]">
          <h2 className="text-xl font-bold text-white mb-4">Merchant Created!</h2>
          <div className="bg-[#252B4A] rounded-lg p-4 mb-4">
            <p className="text-sm text-[#5A5F7D]">Merchant</p>
            <p className="text-white font-medium">{result.merchant.name}</p>
          </div>
          {result.adminUser && (
            <div className="bg-[#252B4A] rounded-lg p-4 mb-4">
              <p className="text-sm text-[#5A5F7D]">Admin User</p>
              <p className="text-white font-mono">{result.adminUser.email}</p>
              <p className="text-sm text-[#5A5F7D] mt-2">Password</p>
              <p className="text-white font-mono text-lg">{result.adminUser.generatedPassword}</p>
            </div>
          )}
          <button
            onClick={onSuccess}
            className="w-full py-2 bg-[#FF6B35] text-white rounded-lg hover:bg-[#FF6B35]/90"
          >
            Done
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1C2342] rounded-xl p-6 w-full max-w-md border border-[#252B4A]">
        <h2 className="text-xl font-bold text-white mb-4">Create Merchant</h2>
        {error && <p className="text-red-400 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[#8B92B8] mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 bg-[#252B4A] border border-[#252B4A] rounded-lg text-white focus:outline-none focus:border-[#FF6B35]"
            />
          </div>
          <div>
            <label className="block text-sm text-[#8B92B8] mb-1">Industry</label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full px-3 py-2 bg-[#252B4A] border border-[#252B4A] rounded-lg text-white focus:outline-none focus:border-[#FF6B35]"
            />
          </div>
          <div>
            <label className="block text-sm text-[#8B92B8] mb-1">Cashback %</label>
            <input
              type="number"
              step="0.01"
              value={cashbackPercent}
              onChange={(e) => setCashbackPercent(e.target.value)}
              placeholder="e.g., 5.00"
              className="w-full px-3 py-2 bg-[#252B4A] border border-[#252B4A] rounded-lg text-white focus:outline-none focus:border-[#FF6B35]"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm text-[#8B92B8]">
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
              <label className="block text-sm text-[#8B92B8] mb-1">Admin Email (optional)</label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="Auto-generated if empty"
                className="w-full px-3 py-2 bg-[#252B4A] border border-[#252B4A] rounded-lg text-white focus:outline-none focus:border-[#FF6B35]"
              />
            </div>
          )}
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-[#252B4A] text-white rounded-lg hover:bg-[#252B4A]/80"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2 bg-[#FF6B35] text-white rounded-lg hover:bg-[#FF6B35]/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Merchant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
