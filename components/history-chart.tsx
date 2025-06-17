"use client"

import React from "react"

interface HistoryChartProps {
    data: Array<{ x: number, y: number }>
    width?: number
    height?: number
    color?: string
}

export function HistoryChart({
    data,
    width = 120,
    height = 30,
    color = "#9ca3af" // gray-400
}: HistoryChartProps) {
    if (!data || data.length < 2) {
        return null
    }

    // 计算数据的最大值和最小值
    const minY = Math.min(...data.map(d => d.y))
    const maxY = Math.max(...data.map(d => d.y))
    const range = maxY - minY

    // 如果数据没有变化，不显示图表
    if (range === 0) {
        return null
    }

    // 将数据点转换为SVG坐标
    const padding = 2
    const chartWidth = width - padding * 2
    const chartHeight = height - padding * 2

    const points = data.map((point, index) => {
        const x = (index / (data.length - 1)) * chartWidth + padding
        const y = chartHeight - ((point.y - minY) / range) * chartHeight + padding
        return `${x},${y}`
    })

    const pathData = `M ${points.join(' L ')}`

    return (
        <svg
            width={width}
            height={height}
            className="w-full h-full"
            preserveAspectRatio="none"
        >
            <path
                d={pathData}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                opacity="0.8"
            />
        </svg>
    )
}

// 专门用于统计卡片右下角的小型历史图表组件
export function StatCardHistoryChart({
    data,
    className = ""
}: {
    data: Array<{ x: number, y: number }>
    className?: string
}) {
    if (!data || data.length < 2) {
        return null
    }

    return (
        <div className={`absolute bottom-2 right-2 w-16 h-8 ${className}`}>
            <HistoryChart
                data={data}
                width={64}
                height={32}
                color="#6b7280" // gray-500, 更深的颜色便于观看
            />
        </div>
    )
} 