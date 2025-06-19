"use client"

import { useState, useEffect } from "react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Clock } from "lucide-react"
import { useI18n } from "@/components/i18n-provider"
import { useToast } from "@/hooks/use-toast"
import { TranslationKey } from "@/lib/translations"

export type TimeRangeValue = '24h' | 'today' | 'week' | '7d' | 'month' | '30d'

export interface TimeRangeOption {
    value: TimeRangeValue
    labelKey: TranslationKey
    hours?: number
    isCurrentPeriod?: boolean
}

interface TimeRangeConfigProps {
    currentRange: TimeRangeValue
    onRangeChange: (range: TimeRangeValue) => void
    trigger?: React.ReactNode
}

export function TimeRangeConfig({ currentRange, onRangeChange, trigger }: TimeRangeConfigProps) {
    const { t } = useI18n()
    const { toast } = useToast()

    const getTimeRangeOptions = (): TimeRangeOption[] => [
        { value: '24h', labelKey: 'last24Hours', hours: 24 },
        { value: 'today', labelKey: 'today', isCurrentPeriod: true },
        { value: 'week', labelKey: 'thisWeek', isCurrentPeriod: true },
        { value: '7d', labelKey: 'last7Days', hours: 24 * 7 },
        { value: 'month', labelKey: 'thisMonth', isCurrentPeriod: true },
        { value: '30d', labelKey: 'last30Days', hours: 24 * 30 },
    ]

    const handleRangeChange = (value: TimeRangeValue) => {
        const option = getTimeRangeOptions().find(opt => opt.value === value)
        if (option) {
            onRangeChange(value)

            // 保存到 localStorage
            localStorage.setItem("umami-time-range", value)

            toast({
                title: t('timeRangeUpdated'),
                description: t('timeRangeSetTo', { range: t(option.labelKey) }),
            })
        }
    }

    return (
        <Select value={currentRange} onValueChange={handleRangeChange}>
            <SelectTrigger className="w-full sm:w-auto sm:min-w-[140px] h-9">
                {trigger || (
                    <>
                        <Clock className="h-4 w-4 mr-2" />
                        <SelectValue placeholder={t('selectTimeRange')} />
                    </>
                )}
            </SelectTrigger>
            <SelectContent>
                {getTimeRangeOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {t(option.labelKey)}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}

// 获取保存的时间范围，默认为 24h
export function getSavedTimeRange(): TimeRangeValue {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('umami-time-range') as TimeRangeValue
        if (saved) {
            return saved
        }
    }
    return '24h'
}

// 计算时间范围的开始和结束时间戳
export function getTimeRangeTimestamps(range: TimeRangeValue): { startAt: number, endAt: number } {
    const now = new Date()
    const endAt = now.getTime()
    let startAt: number

    switch (range) {
        case '24h':
            startAt = endAt - 24 * 60 * 60 * 1000
            break
        case 'today':
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            startAt = today.getTime()
            break
        case 'week':
            const startOfWeek = new Date()
            const day = startOfWeek.getDay()
            const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1) // 周一开始
            startOfWeek.setDate(diff)
            startOfWeek.setHours(0, 0, 0, 0)
            startAt = startOfWeek.getTime()
            break
        case '7d':
            startAt = endAt - 7 * 24 * 60 * 60 * 1000
            break
        case 'month':
            const startOfMonth = new Date()
            startOfMonth.setDate(1)
            startOfMonth.setHours(0, 0, 0, 0)
            startAt = startOfMonth.getTime()
            break
        case '30d':
            startAt = endAt - 30 * 24 * 60 * 60 * 1000
            break
        default:
            startAt = endAt - 24 * 60 * 60 * 1000
    }

    return { startAt, endAt }
} 