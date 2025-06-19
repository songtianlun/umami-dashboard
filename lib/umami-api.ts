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
    pageviews: { value: number } | number
    uniques: { value: number } | number
    bounces: { value: number } | number
    totaltime: { value: number } | number
    visitors?: { value: number } | number
    sessions?: any // 支持不同格式的sessions数据
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
            console.log("Websites API response:", data) // 启用调试日志
            const websites = data.data || data || []
            console.log("Parsed websites:", websites) // 启用调试日志
            return websites
        } catch (error) {
            console.error("Error fetching websites:", error)
            return []
        }
    }

    // 修复getAllWebsites方法，先测试基础API是否工作
    async getAllWebsites(): Promise<UmamiWebsite[]> {
        try {
            console.log("开始获取所有网站数据...")
            
            // 首先尝试基础API调用，不带任何分页参数
            let websites = await this.getWebsites()
            console.log(`基础API返回 ${websites.length} 个网站`)
            
            // 如果网站数量看起来被截断了（通常API会返回整数倍的数量，如10, 20, 50, 100）
            // 并且数量正好是10、20、50或100，可能存在分页
            const possiblePageSizes = [10, 20, 50, 100]
            const needsPagination = possiblePageSizes.includes(websites.length) && websites.length > 0
            
            if (needsPagination) {
                console.log(`检测到可能的分页（当前返回${websites.length}个），尝试获取更多数据...`)
                
                // 尝试Umami API的正确分页格式
                const allWebsites: UmamiWebsite[] = [...websites]
                let currentPage = 1
                const pageSize = websites.length // 使用第一次返回的数量作为页面大小
                
                // 尝试获取更多页面
                while (currentPage < 10) { // 限制最多10页
                    currentPage++
                    
                    try {
                        // 根据Umami API文档尝试正确的分页参数
                        const pageData = await this.makeRequest(`/api/websites?page=${currentPage}`)
                        const pageWebsites = pageData.data || pageData || []
                        
                        console.log(`第 ${currentPage} 页返回 ${pageWebsites.length} 个网站`)
                        
                        if (pageWebsites.length === 0) {
                            console.log("没有更多数据，停止分页")
                            break
                        }
                        
                        allWebsites.push(...pageWebsites)
                        
                        // 如果返回的数据少于预期页面大小，说明是最后一页
                        if (pageWebsites.length < pageSize) {
                            console.log("最后一页，停止分页")
                            break
                        }
                        
                        // 添加延迟避免API限制
                        await new Promise(resolve => setTimeout(resolve, 200))
                        
                    } catch (pageError) {
                        console.log(`第 ${currentPage} 页获取失败:`, pageError)
                        break
                    }
                }
                
                websites = allWebsites
            }
            
            console.log(`总共获取到 ${websites.length} 个网站`)
            return websites
            
        } catch (error) {
            console.error("获取所有网站数据时出错:", error)
            // 如果分页获取失败，回退到原始方法
            console.log("回退到原始获取方法...")
            return await this.getWebsites()
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
                    // More flexible handling of stats data structure
                    let pageviews = 0
                    let visitors = 0
                    let bounces = 0
                    let totaltime = 0
                    let sessions = 0

                    // Handle different possible data structures
                    if (stats.pageviews) {
                        pageviews = typeof stats.pageviews === 'object' && stats.pageviews !== null
                            ? (stats.pageviews as any).value || (stats.pageviews as any).total || 0
                            : stats.pageviews as number
                    }

                    if (stats.uniques) {
                        visitors = typeof stats.uniques === 'object' && stats.uniques !== null
                            ? (stats.uniques as any).value || (stats.uniques as any).total || 0
                            : stats.uniques as number
                    } else if (stats.visitors) {
                        visitors = typeof stats.visitors === 'object' && stats.visitors !== null
                            ? (stats.visitors as any).value || (stats.visitors as any).total || 0
                            : stats.visitors as number
                    }

                    if (stats.bounces) {
                        bounces = typeof stats.bounces === 'object' && stats.bounces !== null
                            ? (stats.bounces as any).value || (stats.bounces as any).total || 0
                            : stats.bounces as number
                    }

                    if (stats.totaltime) {
                        totaltime = typeof stats.totaltime === 'object' && stats.totaltime !== null
                            ? (stats.totaltime as any).value || (stats.totaltime as any).total || 0
                            : stats.totaltime as number
                    }

                    // Handle sessions data
                    if (stats.sessions) {
                        if (Array.isArray(stats.sessions)) {
                            sessions = stats.sessions.length
                        } else if (typeof stats.sessions === 'object') {
                            sessions = stats.sessions.value || stats.sessions.total || stats.sessions.count || 0
                        } else {
                            sessions = stats.sessions
                        }
                    } else {
                        // Fallback: estimate sessions from pageviews (typically sessions < pageviews)
                        sessions = Math.max(1, Math.floor(pageviews * 0.7)) // Rough estimation
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
