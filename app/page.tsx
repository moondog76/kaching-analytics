'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Redirect root to /analytics (Cashback Insights is the default)
export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/analytics')
  }, [router])

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex gap-3">
        <div className="w-4 h-4 bg-pluxee-ultra-green rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
        <div className="w-4 h-4 bg-pluxee-ultra-green rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
        <div className="w-4 h-4 bg-pluxee-ultra-green rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
      </div>
    </div>
  )
}
