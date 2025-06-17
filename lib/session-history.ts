// 会话存储历史数据管理工具
interface HistoryDataPoint {
    timestamp: number
    totalPageviews: number
    totalSessions: number
    totalVisitors: number
    avgSessionTime: number
    totalCurrentOnline: number
}

const HISTORY_KEY = 'umami-stats-history'
const MAX_HISTORY_POINTS = 20 // 保留最近20个数据点

export class SessionHistory {
    // 添加新的数据点到历史记录
    static addDataPoint(summary: {
        totalPageviews: number
        totalSessions: number
        totalVisitors: number
        avgSessionTime: number
        totalCurrentOnline: number
    }) {
        try {
            const history = this.getHistory()
            const newPoint: HistoryDataPoint = {
                timestamp: Date.now(),
                ...summary
            }

            // 添加新数据点并保持数组长度在限制范围内
            history.push(newPoint)

            // 如果超过最大长度，移除最旧的数据点
            if (history.length > MAX_HISTORY_POINTS) {
                history.shift()
            }

            sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history))
        } catch (error) {
            console.warn('Failed to save history data:', error)
        }
    }

    // 获取历史数据
    static getHistory(): HistoryDataPoint[] {
        try {
            const stored = sessionStorage.getItem(HISTORY_KEY)
            if (!stored) return []

            const history: HistoryDataPoint[] = JSON.parse(stored)

            // 过滤掉超过24小时的数据点
            const now = Date.now()
            const dayAgo = now - 24 * 60 * 60 * 1000

            return history.filter(point => point.timestamp > dayAgo)
        } catch (error) {
            console.warn('Failed to load history data:', error)
            return []
        }
    }

    // 获取特定指标的历史数据
    static getMetricHistory(metric: keyof Omit<HistoryDataPoint, 'timestamp'>): number[] {
        const history = this.getHistory()
        return history.map(point => point[metric])
    }

    // 清除历史数据
    static clearHistory() {
        try {
            sessionStorage.removeItem(HISTORY_KEY)
        } catch (error) {
            console.warn('Failed to clear history data:', error)
        }
    }

    // 获取简化的历史数据点，用于绘制曲线
    static getChartData(metric: keyof Omit<HistoryDataPoint, 'timestamp'>): Array<{ x: number, y: number }> {
        const history = this.getHistory()
        return history.map((point, index) => ({
            x: index,
            y: point[metric]
        }))
    }
} 