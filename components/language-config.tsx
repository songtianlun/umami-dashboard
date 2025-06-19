"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Languages } from "lucide-react"
import { useI18n } from "./i18n-provider"
import { Locale, locales } from "@/lib/i18n"

export function LanguageConfig() {
  const { locale, setLocale, t } = useI18n()

  const handleLanguageChange = (value: Locale) => {
    setLocale(value)
  }

  const getLanguageLabel = (locale: Locale) => {
    switch (locale) {
      case 'en':
        return t('english')
      case 'zh':
        return t('chinese')
      default:
        return locale
    }
  }

  return (
    <Select value={locale} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-full sm:w-auto sm:min-w-[120px]">
        <div className="flex items-center gap-2">
          <Languages className="h-4 w-4" />
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        {locales.map((localeOption) => (
          <SelectItem key={localeOption} value={localeOption}>
            {getLanguageLabel(localeOption)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
} 