'use client'

import { useState } from 'react'
import { AIContextMode } from '@/types/analytics'
import AIChat from '@/components/AIChat'

interface PluxeeAnalystSidebarProps {
  contextMode: AIContextMode
  merchantId: string
  merchantName: string
}

export default function PluxeeAnalystSidebar({
  contextMode,
  merchantId,
  merchantName
}: PluxeeAnalystSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <>
      {/* Collapsed tab - always visible on right edge */}
      <div
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-40 transition-all duration-300 ${
          isExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 bg-pluxee-ultra-green hover:bg-pluxee-ultra-green/90 text-pluxee-deep-blue px-3 py-4 rounded-l-xl shadow-elevated transition-all hover:pr-4"
        >
          {/* Pluxee P symbol */}
          <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#221C46"/>
            <path d="M8 8h8c4.418 0 8 3.582 8 8s-3.582 8-8 8h-2v-6h2c1.105 0 2-.895 2-2s-.895-2-2-2h-2v10H8V8z" fill="#00EB5E"/>
            <circle cx="22" cy="10" r="3" fill="#17CCF9"/>
          </svg>
          <span className="font-semibold text-sm whitespace-nowrap [writing-mode:vertical-lr] rotate-180">
            Pluxee Analyst
          </span>
        </button>
      </div>

      {/* Expanded sidebar panel */}
      <div
        className={`fixed right-0 top-0 h-full bg-white border-l border-slate-200 shadow-elevated z-50 transition-all duration-300 ${
          isExpanded ? 'w-[420px]' : 'w-0'
        } overflow-hidden`}
      >
        <div className="h-full flex flex-col w-[420px]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-pluxee-ultra-green/10 to-transparent">
            <div className="flex items-center gap-3">
              <svg className="w-10 h-10" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="8" fill="#221C46"/>
                <path d="M8 8h8c4.418 0 8 3.582 8 8s-3.582 8-8 8h-2v-6h2c1.105 0 2-.895 2-2s-.895-2-2-2h-2v10H8V8z" fill="#00EB5E"/>
                <circle cx="22" cy="10" r="3" fill="#17CCF9"/>
              </svg>
              <div>
                <h3 className="font-semibold text-pluxee-deep-blue">Pluxee Analyst</h3>
                <p className="text-xs text-slate-500">
                  {contextMode === 'retail' ? 'Market Intelligence Mode' : 'Campaign Analytics Mode'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Context Badge */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${contextMode === 'retail' ? 'bg-pluxee-boldly-blue' : 'bg-pluxee-ultra-green'}`} />
              <span className="text-xs font-medium text-slate-600">
                Analyzing: <span className="text-pluxee-deep-blue">{merchantName}</span>
              </span>
              {contextMode === 'retail' && (
                <span className="ml-auto px-2 py-0.5 bg-pluxee-boldly-blue/10 text-pluxee-deep-blue text-xs font-medium rounded-full">
                  Pro
                </span>
              )}
            </div>
          </div>

          {/* Chat Content */}
          <div className="flex-1 overflow-hidden">
            <AIChat
              contextMode={contextMode}
              merchantName={merchantName}
              merchantId={merchantId}
              embedded={true}
            />
          </div>
        </div>
      </div>

      {/* Backdrop when expanded */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </>
  )
}
