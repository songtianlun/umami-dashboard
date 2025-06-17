export type Locale = 'en' | 'zh'

export const locales: Locale[] = ['en', 'zh']

export const defaultLocale: Locale = 'en'

// 检测浏览器默认语言
export function detectBrowserLanguage(): Locale {
  if (typeof navigator !== 'undefined') {
    const browserLang = navigator.language.toLowerCase()
    if (browserLang.startsWith('zh')) {
      return 'zh'
    }
  }
  return 'en'
}

// 获取保存的语言设置，如果没有则使用浏览器语言检测
export function getSavedLocale(): Locale {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('umami-locale') as Locale
    if (saved && locales.includes(saved)) {
      return saved
    }
    return detectBrowserLanguage()
  }
  return defaultLocale
}

// 保存语言设置
export function saveLocale(locale: Locale) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('umami-locale', locale)
  }
} 