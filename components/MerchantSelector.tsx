'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronDown, Building2, Check } from 'lucide-react'

interface Merchant {
  id: string
  name: string
  industry?: string
  cashbackPercent?: number
  isCurrent: boolean
}

interface MerchantSelectorProps {
  onMerchantChange?: (merchantId: string) => void
}

export default function MerchantSelector({ onMerchantChange }: MerchantSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [currentMerchant, setCurrentMerchant] = useState<Merchant | null>(null)
  const [userRole, setUserRole] = useState<string>('merchant')
  const [isLoading, setIsLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch merchants
  useEffect(() => {
    async function fetchMerchants() {
      try {
        const response = await fetch('/api/merchants')
        const data = await response.json()

        if (data.merchants) {
          setMerchants(data.merchants)
          setUserRole(data.userRole)

          // Set current merchant from URL param or default
          const merchantIdFromUrl = searchParams.get('merchantId')
          const current = data.merchants.find((m: Merchant) =>
            merchantIdFromUrl ? m.id === merchantIdFromUrl : m.isCurrent
          )
          setCurrentMerchant(current || data.merchants[0] || null)
        }
      } catch (error) {
        console.error('Error fetching merchants:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchMerchants()
  }, [searchParams])

  const handleSelect = (merchant: Merchant) => {
    setCurrentMerchant(merchant)
    setIsOpen(false)

    // Update URL with new merchantId
    const params = new URLSearchParams(searchParams.toString())
    params.set('merchantId', merchant.id)
    router.push(`?${params.toString()}`)

    // Callback
    onMerchantChange?.(merchant.id)
  }

  // Don't show selector if user only has one merchant
  if (!isLoading && merchants.length <= 1) {
    return currentMerchant ? (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500">
        <Building2 className="w-4 h-4" />
        <span className="font-medium text-slate-800">{currentMerchant.name}</span>
      </div>
    ) : null
  }

  if (isLoading) {
    return (
      <div className="px-3 py-2 text-sm text-slate-400">
        Loading...
      </div>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white hover:bg-slate-50 transition-colors border border-slate-200"
      >
        <Building2 className="w-4 h-4 text-blue-500" />
        <span className="font-medium text-slate-800 max-w-[150px] truncate">
          {currentMerchant?.name || 'Select Merchant'}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-elevated z-50 overflow-hidden">
          <div className="p-2 border-b border-slate-200">
            <p className="text-xs text-slate-400 uppercase tracking-wider px-2">
              {userRole === 'super_admin' || userRole === 'admin' ? 'All Merchants' : 'Your Merchant'}
            </p>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {merchants.map(merchant => (
              <button
                key={merchant.id}
                onClick={() => handleSelect(merchant)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors ${
                  merchant.id === currentMerchant?.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 truncate">{merchant.name}</p>
                  {merchant.industry && (
                    <p className="text-xs text-slate-400 truncate">{merchant.industry}</p>
                  )}
                </div>
                {merchant.id === currentMerchant?.id && (
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
