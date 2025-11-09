interface LoginConfig {
    serverUrl: string
    username: string
    password: string
}

interface UmamiWebsite {
    id: string
    websiteId?: string
    name: string
    domain: string
    shareId?: string
}

interface UmamiStats {
    // 兼容多个版本的 Umami API 数据类型:
    // - 旧版本 (2.x): 返回 number 类型
    // - 新版本 (3.0+): 返回 string 类型
    // - 某些版本: 返回对象 {value: number} 或 {total: number}
    pageviews: number | string | { value: number | string } | { total: number | string }
    uniques?: number | string | { value: number | string } | { total: number | string }
    visitors?: number | string | { value: number | string } | { total: number | string }
    bounces: number | string | { value: number | string } | { total: number | string }
    totaltime: number | string | { value: number | string } | { total: number | string }
    visits?: number | string | { value: number | string } | { total: number | string } // Umami 3.0+
    sessions?: any // 支持不同格式的sessions数据（可能是数组或数字）
    comparison?: any // 比较数据（某些版本包含）
    [key: string]: any // 支持其他可能的属性
}

interface UmamiActiveUsers {
    [key: string]: number
}

export class UmamiAPI {
    private config: LoginConfig
    private token: string | null = null

    constructor(config: LoginConfig) {
        this.config = config
    }

    private get baseUrl() {
        return this.config.serverUrl.replace(/\/$/, "")
    }

    /**
     * 安全地将 Umami API 返回的值转换为数字
     * 兼容多个版本的 Umami API：
     * - 旧版本 (2.x): 返回数字类型 (例如: 123)
     * - 新版本 (3.0+): 返回字符串类型 (例如: "123")
     * - 某些版本: 返回对象类型 (例如: {value: 123} 或 {total: 123})
     *
     * @example
     * safeParseNumber(123)              // => 123 (旧版本)
     * safeParseNumber("456")            // => 456 (Umami 3.0+)
     * safeParseNumber({value: 789})     // => 789 (对象格式)
     * safeParseNumber(null)             // => 0
     * safeParseNumber(undefined)        // => 0
     */
    private safeParseNumber(value: any): number {
        // 处理 null/undefined
        if (value === null || value === undefined) {
            return 0
        }

        // 如果是对象，尝试提取 value 或 total 字段
        if (typeof value === 'object' && value !== null) {
            const extracted = value.value ?? value.total ?? value.count
            if (extracted !== undefined) {
                return this.safeParseNumber(extracted)
            }
            return 0
        }

        // 如果是字符串，转换为数字
        if (typeof value === 'string') {
            const parsed = parseInt(value, 10)
            return isNaN(parsed) ? 0 : parsed
        }

        // 如果已经是数字，直接返回
        if (typeof value === 'number') {
            return isNaN(value) ? 0 : value
        }

        // 其他情况返回 0
        return 0
    }

    async authenticate(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/api/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: this.config.username,
                    password: this.config.password,
                }),
            })

            if (!response.ok) {
                throw new Error(`Authentication failed: ${response.status}`)
            }

            const data = await response.json()
            this.token = data.token
            return !!this.token
        } catch (error) {
            console.error("Authentication error:", error)
            return false
        }
    }

    private async makeRequest(endpoint: string, options?: RequestInit): Promise<any> {
        if (!this.token) {
            const authenticated = await this.authenticate()
            if (!authenticated) {
                throw new Error("Failed to authenticate")
            }
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers: {
                ...options?.headers,
                "Authorization": `Bearer ${this.token}`,
                "Content-Type": "application/json",
            },
        })

        if (!response.ok) {
            if (response.status === 401) {
                // Token expired, try to re-authenticate
                this.token = null
                const authenticated = await this.authenticate()
                if (authenticated) {
                    return this.makeRequest(endpoint, options)
                }
            }
            throw new Error(`API request failed: ${response.status}`)
        }

        return response.json()
    }

    async getWebsites(): Promise<UmamiWebsite[]> {
        try {
            const data = await this.makeRequest("/api/websites")
            // console.log("Websites API response:", data) // 关闭调试日志
            const websites = data.data || data || []
            // console.log("Parsed websites:", websites) // 关闭调试日志
            return websites
        } catch (error) {
            console.error("Error fetching websites:", error)
            return []
        }
    }

    // 获取所有网站数据 - 根据Umami API文档优化
    async getAllWebsites(): Promise<UmamiWebsite[]> {
        try {
            console.log("Start getting all websites...")
            
            // 根据Umami官方API文档，先尝试基础调用
            const data = await this.makeRequest("/api/websites")
            // console.log("Raw API response:", JSON.stringify(data, null, 2))
            
            // 处理不同的响应格式
            let websites: UmamiWebsite[] = []
            
            if (data.data && Array.isArray(data.data)) {
                websites = data.data
                console.log("Using data.data format, website count:", websites.length)
            } else if (Array.isArray(data)) {
                websites = data
                console.log("Using direct array format, website count:", websites.length)
            } else {
                console.log("Unknown response format:", typeof data, data)
                websites = []
            }

            const possiblePageSizes = [10, 20, 50, 100]
            const needsPagination = possiblePageSizes.includes(websites.length) && websites.length > 0
            if (needsPagination) {
                console.log(`Detected pagination (current return ${websites.length} websites), try to get more data...`)

                const allWebsites: UmamiWebsite[] = [...websites]
                let currentPage = 1
                const pageSize = websites.length

                while (currentPage < 10) {
                    currentPage++
                    try {
                        const pageData = await this.makeRequest(`/api/websites?page=${currentPage}&size=${pageSize}`)
                        const pageWebsites = pageData.data || pageData || []
                        console.log(`Get Page ${currentPage}, Return ${pageWebsites.length} websites`)
                        if (pageWebsites.length === 0) {
                            console.log("No more data")
                            break
                        }

                        allWebsites.push(...pageWebsites)

                        if (pageWebsites.length < pageSize) {
                            console.log("no more data")
                            break
                        }

                        // 等待200ms，避免请求过于频繁
                        await new Promise(resolve => setTimeout(resolve, 200))

                    } catch (error) {
                        console.error("Error getting pagination data:", error)
                        break
                    }
                }

                websites = allWebsites
            }
            
            console.log(`✅ Total ${websites.length} websites`)
            return websites
            
        } catch (error) {
            console.error("❌ Error getting all websites:", error)
            if (error instanceof Error) {
                console.error("Error details:", error.message)
                console.error("Error stack:", error.stack)
            }
            return []
        }
    }

    async getWebsiteStats(websiteId: string, timeRange?: { startAt: number, endAt: number }): Promise<UmamiStats | null> {
        try {
            const endAt = timeRange?.endAt || Date.now()
            const startAt = timeRange?.startAt || (endAt - 24 * 60 * 60 * 1000) // 24 hours ago

            const params = new URLSearchParams({
                startAt: startAt.toString(),
                endAt: endAt.toString(),
                unit: 'day'
            })

            // Try to get both general stats and sessions data
            const [generalStats, sessionsData] = await Promise.all([
                this.makeRequest(`/api/websites/${websiteId}/stats?${params}`).catch((e: any) => {
                    console.log(`Stats API failed for ${websiteId}`)
                    return null
                }),
                this.makeRequest(`/api/websites/${websiteId}/sessions?${params}`).catch((e: any) => {
                    // Sessions endpoint might not exist in all Umami versions
                    return null
                })
            ])

            // Combine the data if we have sessions data
            if (generalStats && sessionsData) {
                return {
                    ...generalStats,
                    sessions: sessionsData
                }
            }

            return generalStats
        } catch (error) {
            console.error(`Error fetching stats for website ${websiteId}:`, error)
            return null
        }
    }

    async getActiveUsers(websiteId: string): Promise<number> {
        try {
            // Try different endpoints for realtime data - updated for newer Umami versions
            const endpoints = [
                // Umami v2+ format
                `/api/websites/${websiteId}/active`,
                `/api/websites/${websiteId}/realtime`,
                // Legacy format
                `/api/realtime/${websiteId}`,
                // Alternative formats
                `/api/websites/${websiteId}/sessions?startAt=${Date.now() - 5 * 60 * 1000}&endAt=${Date.now()}`,
            ]

            for (const endpoint of endpoints) {
                try {
                    const data = await this.makeRequest(endpoint)

                    // Handle different response formats
                    if (Array.isArray(data)) {
                        // For array responses - this is the most common format
                        let activeCount = 0

                        // Count active sessions/visitors
                        if (data.length > 0) {
                            // Check if it's an array of session objects
                            const now = Date.now()
                            const fiveMinutesAgo = now - 5 * 60 * 1000

                            activeCount = data.filter(item => {
                                // Check for recent activity
                                const lastActivity = item.updatedAt || item.createdAt || item.timestamp
                                if (lastActivity) {
                                    const lastActivityTime = new Date(lastActivity).getTime()
                                    return lastActivityTime > fiveMinutesAgo
                                }
                                return true // If no timestamp, assume active
                            }).length

                            if (activeCount > 0) {
                                return activeCount
                            }
                        }

                        // Try alternative counting methods
                        activeCount = data.length
                        if (activeCount > 0) return activeCount

                        // Check for specific fields in first item
                        const firstItem = data[0]
                        if (firstItem) {
                            const count = firstItem.x || firstItem.y || firstItem.value || firstItem.count || firstItem.visitors || 0
                            if (count > 0) return count
                        }
                    } else if (typeof data === 'object' && data !== null) {
                        // For object responses
                        const count = data.value || data.count || data.active || data.visitors || data.total || 0
                        if (count > 0) {
                            return count
                        }
                    } else if (typeof data === 'number') {
                        // Direct number response
                        if (data > 0) {
                            return data
                        }
                    }
                } catch (endpointError) {
                    // Continue to next endpoint
                    continue
                }
            }

            // Enhanced fallback: Try to get recent unique visitors
            try {
                const recentActiveUsers = await this.getRecentActiveUsers(websiteId)
                if (recentActiveUsers > 0) {
                    return recentActiveUsers
                }
            } catch (fallbackError) {
                // Fallback failed, return 0
            }

            // If all methods fail, return 0
            return 0
        } catch (error) {
            console.error(`Error fetching active users for website ${websiteId}:`, error)
            return 0
        }
    }

    async getRecentActiveUsers(websiteId: string): Promise<number> {
        try {
            // Try different methods to get active users
            const methods = [
                // Method 1: Get unique visitors from last 5 minutes
                async () => {
                    const endAt = Date.now()
                    const startAt = endAt - 5 * 60 * 1000 // 5 minutes ago

                    const params = new URLSearchParams({
                        startAt: startAt.toString(),
                        endAt: endAt.toString(),
                        unit: 'minute'
                    })

                    const data = await this.makeRequest(`/api/websites/${websiteId}/stats?${params}`)

                    if (data && data.uniques && data.uniques.value) {
                        return Math.min(data.uniques.value, 100) // Cap at 100
                    }
                    return 0
                },

                // Method 2: Get pageviews from the last 5 minutes
                async () => {
                    const endAt = Date.now()
                    const startAt = endAt - 5 * 60 * 1000 // 5 minutes ago

                    const params = new URLSearchParams({
                        startAt: startAt.toString(),
                        endAt: endAt.toString(),
                        unit: 'minute'
                    })

                    const data = await this.makeRequest(`/api/websites/${websiteId}/pageviews?${params}`)

                    if (Array.isArray(data) && data.length > 0) {
                        const recentPageviews = data.reduce((sum, item) => sum + (item.y || item.value || 0), 0)
                        // Conservative estimation: 1 active user per 2-3 pageviews in 5 minutes
                        return Math.min(Math.ceil(recentPageviews / 2), 50)
                    }
                    return 0
                },

                // Method 3: Try sessions endpoint
                async () => {
                    const data = await this.makeRequest(`/api/websites/${websiteId}/sessions/active`)

                    if (Array.isArray(data)) {
                        return Math.min(data.length, 100)
                    } else if (data && typeof data.count === 'number') {
                        return Math.min(data.count, 100)
                    }
                    return 0
                }
            ]

            // Try each method until one works
            for (let i = 0; i < methods.length; i++) {
                try {
                    const result = await methods[i]()
                    if (result > 0) {
                        return result
                    }
                } catch (methodError) {
                    // Continue to next method
                }
            }

            return 0
        } catch (error) {
            console.error(`Error in getRecentActiveUsers:`, error)
            return 0
        }
    }

    async getAllWebsiteData(timeRange?: { startAt: number, endAt: number }) {
        const websites = await this.getAllWebsites() // 使用新的分页获取方法
        const results = []

        for (const website of websites) {
            // Use the correct ID field
            const websiteId = website.id || website.websiteId

            if (!websiteId) {
                console.error("Website missing ID:", website)
                continue
            }

            try {
                const [stats, activeUsers] = await Promise.all([
                    this.getWebsiteStats(websiteId, timeRange),
                    this.getActiveUsers(websiteId),
                ])

                if (stats) {
                    // 使用统一的方法处理不同版本的数据结构
                    // 兼容 Umami 2.x (数字), 3.0+ (字符串), 和其他版本 (对象)
                    let pageviews = 0
                    let visitors = 0
                    let bounces = 0
                    let totaltime = 0
                    let sessions = 0

                    // 解析页面浏览量
                    pageviews = this.safeParseNumber(stats.pageviews)

                    // 解析访客数 - 尝试多个字段名
                    visitors = this.safeParseNumber(stats.uniques || stats.visitors)

                    // 解析跳出次数
                    bounces = this.safeParseNumber(stats.bounces)

                    // 解析总时长
                    totaltime = this.safeParseNumber(stats.totaltime)

                    // 解析会话数 - Umami 3.0 使用 'visits'，旧版本使用 'sessions'
                    if (stats.visits) {
                        sessions = this.safeParseNumber(stats.visits)
                    } else if (stats.sessions) {
                        // 处理数组类型的 sessions（某些版本）
                        if (Array.isArray(stats.sessions)) {
                            sessions = stats.sessions.length
                        } else {
                            sessions = this.safeParseNumber(stats.sessions)
                        }
                    } else {
                        // 后备方案: 从页面浏览量估算会话数
                        sessions = Math.max(1, Math.floor(pageviews * 0.7))
                    }

                    // Calculate average session time (in seconds)
                    // Umami's totaltime might be in milliseconds or seconds
                    let avgSessionTime = 0
                    if (sessions > 0 && totaltime > 0) {
                        // If totaltime is very large, it's likely in milliseconds
                        const timeInSeconds = totaltime > 1000000 ? totaltime / 1000 : totaltime
                        avgSessionTime = Math.floor(timeInSeconds / sessions)
                    }

                    // Alternative calculation: use visitors if sessions data is unreliable
                    if (avgSessionTime === 0 && visitors > 0 && totaltime > 0) {
                        const timeInSeconds = totaltime > 1000000 ? totaltime / 1000 : totaltime
                        avgSessionTime = Math.floor(timeInSeconds / visitors)
                    }

                    // Calculate bounce rate
                    const bounceRate = pageviews > 0 && bounces >= 0
                        ? (bounces / pageviews) * 100
                        : 0

                    // Only log if there are calculation issues
                    if (avgSessionTime === 0 && totaltime > 0) {
                        console.log(`${website.name}: Unable to calculate avg time - totaltime: ${totaltime}, sessions: ${sessions}, visitors: ${visitors}`)
                    }

                    results.push({
                        id: websiteId,
                        name: website.name,
                        domain: website.domain,
                        url: `https://${website.domain}`,
                        pageviews,
                        sessions,
                        visitors,
                        avgSessionTime,
                        currentOnline: activeUsers,
                        bounceRate,
                    })
                } else {
                    console.warn(`No stats data for website ${website.name}`)
                }
            } catch (websiteError) {
                console.error(`Error processing website ${website.name}:`, websiteError)
            }
        }

        return results
    }
}
