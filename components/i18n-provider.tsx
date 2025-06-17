"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Locale, getSavedLocale, saveLocale } from '@/lib/i18n'
import { TranslationKey, getTranslation } from '@/lib/translations'

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

interface I18nProviderProps {
  children: ReactNode
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>('en')
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Initialize locale from localStorage or browser detection
    const savedLocale = getSavedLocale()
    setLocaleState(savedLocale)
    setIsInitialized(true)
  }, [])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    saveLocale(newLocale)
    
    // Update document language
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLocale === 'zh' ? 'zh-CN' : 'en'
    }
  }

  const t = (key: TranslationKey, params?: Record<string, string | number>) => {
    return getTranslation(locale, key, params)
  }

  // Don't render until initialized to prevent hydration mismatch
  if (!isInitialized) {
    return null
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
} 