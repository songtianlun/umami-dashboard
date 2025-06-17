"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Timer, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AutoRefreshConfigProps {
    currentInterval: number
    onIntervalChange: (interval: number) => void
    trigger?: React.ReactNode
}

const REFRESH_OPTIONS = [
    { value: 10000, label: "10 秒" },
    { value: 30000, label: "30 秒" },
    { value: 60000, label: "1 分钟" },
    { value: 300000, label: "5 分钟" },
    { value: 600000, label: "10 分钟" },
    { value: 0, label: "禁用自动刷新" },
]

export function AutoRefreshConfig({ currentInterval, onIntervalChange, trigger }: AutoRefreshConfigProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [selectedInterval, setSelectedInterval] = useState(currentInterval)
    const { toast } = useToast()

    const handleSave = () => {
        onIntervalChange(selectedInterval)
        localStorage.setItem("umami-refresh-interval", selectedInterval.toString())

        const option = REFRESH_OPTIONS.find(opt => opt.value === selectedInterval)
        toast({
            title: "刷新间隔已更新",
            description: `自动刷新已设置为 ${option?.label}`,
        })

        setIsOpen(false)
    }

    const getCurrentIntervalLabel = () => {
        const option = REFRESH_OPTIONS.find(opt => opt.value === currentInterval)
        return option?.label || "未知"
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm">
                        <Timer className="h-4 w-4 mr-2" />
                        自动刷新: {getCurrentIntervalLabel()}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>自动刷新设置</DialogTitle>
                    <DialogDescription>
                        设置面板数据的自动刷新间隔时间
                    </DialogDescription>
                </DialogHeader>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">刷新间隔</CardTitle>
                        <CardDescription>
                            选择数据自动刷新的时间间隔，设置为"禁用"将关闭自动刷新
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Select
                            value={selectedInterval.toString()}
                            onValueChange={(value) => setSelectedInterval(parseInt(value))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="选择刷新间隔" />
                            </SelectTrigger>
                            <SelectContent>
                                {REFRESH_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value.toString()}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button onClick={handleSave} className="w-full">
                            <Save className="h-4 w-4 mr-2" />
                            保存设置
                        </Button>
                    </CardContent>
                </Card>
            </DialogContent>
        </Dialog>
    )
} 