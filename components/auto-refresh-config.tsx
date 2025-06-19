"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Timer, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useI18n } from "./i18n-provider"

interface AutoRefreshConfigProps {
    currentInterval: number
    onIntervalChange: (interval: number) => void
    trigger?: React.ReactNode
}

export function AutoRefreshConfig({ currentInterval, onIntervalChange, trigger }: AutoRefreshConfigProps) {
    const { t } = useI18n()
    const [isOpen, setIsOpen] = useState(false)
    const [selectedInterval, setSelectedInterval] = useState(currentInterval)
    const { toast } = useToast()

    const getRefreshOptions = () => [
        { value: 10000, label: `10 ${t('seconds')}` },
        { value: 30000, label: `30 ${t('seconds')}` },
        { value: 60000, label: `1 ${t('minute')}` },
        { value: 300000, label: `5 ${t('minutes')}` },
        { value: 600000, label: `10 ${t('minutes')}` },
        { value: 0, label: t('disableAutoRefresh') },
    ]

    const handleSave = () => {
        onIntervalChange(selectedInterval)
        localStorage.setItem("umami-refresh-interval", selectedInterval.toString())

        const option = getRefreshOptions().find(opt => opt.value === selectedInterval)
        toast({
            title: t('refreshIntervalUpdated'),
            description: t('autoRefreshSetTo', { interval: option?.label || t('disable') }),
        })

        setIsOpen(false)
    }

    const getCurrentIntervalLabel = () => {
        const option = getRefreshOptions().find(opt => opt.value === currentInterval)
        return option?.label || t('disable')
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" className="w-full sm:w-auto sm:min-w-[140px] justify-start">
                        <Timer className="h-4 w-4 mr-2" />
                        <span className="truncate">{t('autoRefreshSettings')}: {getCurrentIntervalLabel()}</span>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>{t('autoRefreshSettings')}</DialogTitle>
                    <DialogDescription>
                        {t('refreshIntervalDescription')}
                    </DialogDescription>
                </DialogHeader>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">{t('refreshInterval')}</CardTitle>
                        <CardDescription>
                            {t('refreshIntervalNote')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Select
                            value={selectedInterval.toString()}
                            onValueChange={(value) => setSelectedInterval(parseInt(value))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={t('selectRefreshInterval')} />
                            </SelectTrigger>
                            <SelectContent>
                                {getRefreshOptions().map((option) => (
                                    <SelectItem key={option.value} value={option.value.toString()}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button onClick={handleSave} className="w-full">
                            <Save className="h-4 w-4 mr-2" />
                            {t('saveSettings')}
                        </Button>
                    </CardContent>
                </Card>
            </DialogContent>
        </Dialog>
    )
} 