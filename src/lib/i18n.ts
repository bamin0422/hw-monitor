import { useCallback } from 'react'
import { create } from 'zustand'
import { ko } from './locales/ko'
import { en } from './locales/en'

export type Locale = 'ko' | 'en'

const translations: Record<Locale, Record<string, string>> = { ko, en }

interface I18nStore {
  locale: Locale
  setLocale: (locale: Locale) => void
}

export const useI18nStore = create<I18nStore>((set) => ({
  locale: 'ko',
  setLocale: (locale) => {
    set({ locale })
    window.electronAPI?.settings.set('locale', locale)
  }
}))

export function useTranslation() {
  const locale = useI18nStore((s) => s.locale)
  const setLocale = useI18nStore((s) => s.setLocale)

  const t = useCallback(
    (key: string): string => {
      return translations[locale]?.[key] ?? key
    },
    [locale]
  )

  return { t, locale, setLocale }
}
