'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Locale, translations, TranslationKeys } from './translations'

interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: TranslationKeys
}

// Helper to get translations with proper typing
function getTranslations(locale: Locale): TranslationKeys {
  return translations[locale] as TranslationKeys
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined)

const STORAGE_KEY = 'kaching-locale'

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')

  useEffect(() => {
    // Load saved locale
    const saved = localStorage.getItem(STORAGE_KEY) as Locale
    if (saved && (saved === 'en' || saved === 'ro')) {
      setLocaleState(saved)
    } else {
      // Detect browser language
      const browserLang = navigator.language.toLowerCase()
      if (browserLang.startsWith('ro')) {
        setLocaleState('ro')
      }
    }
  }, [])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem(STORAGE_KEY, newLocale)
  }

  const t = getTranslations(locale)

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}

export function useTranslations() {
  const { t } = useI18n()
  return t
}
