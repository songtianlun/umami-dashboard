"use client"

import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useI18n } from "./i18n-provider"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const { t } = useI18n()
  const [mounted, setMounted] = React.useState(false)

  // 避免服务端渲染和客户端不一致的问题
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-full sm:w-auto sm:min-w-[120px] h-9" />
    )
  }

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />
      case 'dark':
        return <Moon className="h-4 w-4" />
      case 'system':
      default:
        return <Monitor className="h-4 w-4" />
    }
  }

  const getThemeLabel = (themeValue: string) => {
    switch (themeValue) {
      case 'light':
        return t('lightMode')
      case 'dark':
        return t('darkMode')
      case 'system':
        return t('systemMode')
      default:
        return themeValue
    }
  }

  return (
    <Select value={theme} onValueChange={setTheme}>
      <SelectTrigger className="w-full sm:w-auto sm:min-w-[120px] h-9">
        <div className="flex items-center gap-2">
          {getThemeIcon()}
          <span>{getThemeLabel(theme || 'system')}</span>
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="light">
          {getThemeLabel('light')}
        </SelectItem>
        <SelectItem value="dark">
          {getThemeLabel('dark')}
        </SelectItem>
        <SelectItem value="system">
          {getThemeLabel('system')}
        </SelectItem>
      </SelectContent>
    </Select>
  )
}
