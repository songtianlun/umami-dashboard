"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Languages } from "lucide-react"
import { useI18n } from "./i18n-provider"
import { Locale, locales } from "@/lib/i18n"

interface LanguageConfigProps {
  trigger?: React.ReactNode
}

export function LanguageConfig({ trigger }: LanguageConfigProps) {
  const { locale, setLocale, t } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedLocale, setSelectedLocale] = useState<Locale>(locale)

  const handleSave = () => {
    setLocale(selectedLocale)
    setIsOpen(false)
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Languages className="h-4 w-4 mr-2" />
            {t('languageSettings')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('languageSettings')}</DialogTitle>
          <DialogDescription>
            {t('selectLanguage')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="language" className="text-right">
              {t('language')}
            </Label>
            <Select value={selectedLocale} onValueChange={(value: Locale) => setSelectedLocale(value)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder={t('selectLanguage')} />
              </SelectTrigger>
              <SelectContent>
                {locales.map((locale) => (
                  <SelectItem key={locale} value={locale}>
                    {getLanguageLabel(locale)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSave}>
            {t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 