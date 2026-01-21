'use client'

import { useState, useRef, useEffect } from 'react'
import { useI18n, Locale } from '@/lib/i18n'

const languages: { id: Locale; label: string; flag: string }[] = [
  { id: 'en', label: 'English', flag: '🇬🇧' },
  { id: 'ro', label: 'Română', flag: '🇷🇴' }
]

export default function LanguageSelector() {
  const { locale, setLocale } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
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

  const currentLang = languages.find(l => l.id === locale) || languages[0]

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-sm"
      >
        <span>{currentLang.flag}</span>
        <span className="text-slate-700 font-medium">{currentLang.label}</span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 min-w-[140px] overflow-hidden">
          {languages.map(lang => (
            <button
              key={lang.id}
              onClick={() => {
                setLocale(lang.id)
                setIsOpen(false)
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                lang.id === locale
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>{lang.flag}</span>
              <span className="font-medium">{lang.label}</span>
              {lang.id === locale && (
                <svg className="w-4 h-4 ml-auto text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
