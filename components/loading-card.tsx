"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCw } from "lucide-react"

interface LoadingCardProps {
    title: string
    icon: React.ReactNode
    description?: string
    className?: string
}

export function LoadingCard({ title, icon, description = "加载中...", className = "" }: LoadingCardProps) {
    return (
        <Card className={`relative ${className}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="flex items-center space-x-2">
                    <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                    <div className="text-xl md:text-2xl font-bold text-muted-foreground">--</div>
                </div>
                <p className="text-xs text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    )
} 