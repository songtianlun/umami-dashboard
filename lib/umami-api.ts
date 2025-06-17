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
    pageviews: { value: number }
    uniques: { value: number }
    bounces: { value: number }
    totaltime: { value: number }
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

    private async makeRequest(endpoint: string, options?: RequestInit) {
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
            // console.log("Websites API response:", data) // Debug log
            const websites = data.data || data || []
            // console.log("Parsed websites:", websites) // Debug log
            return websites
        } catch (error) {
            console.error("Error fetching websites:", error)
            return []
        }
    }

    async getWebsiteStats(websiteId: string): Promise<UmamiStats | null> {
        try {
            const endAt = Date.now()
            const startAt = endAt - 24 * 60 * 60 * 1000 // 24 hours ago

            const params = new URLSearchParams({
                startAt: startAt.toString(),
                endAt: endAt.toString(),
                unit: 'day'
            })

            // Try to get both general stats and sessions data
            const [generalStats, sessionsData] = await Promise.all([
                this.makeRequest(`/api/websites/${websiteId}/stats?${params}`).catch(e => {
                    console.log(`Stats API failed for ${websiteId}`)
                    return null
                }),
                this.makeRequest(`/api/websites/${websiteId}/sessions?${params}`).catch(e => {
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

    async getAllWebsiteData() {
        const websites = await this.getWebsites()
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
                    this.getWebsiteStats(websiteId),
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
                        pageviews = typeof stats.pageviews === 'object'
                            ? stats.pageviews.value || stats.pageviews.total || 0
                            : stats.pageviews
                    }

                    if (stats.uniques) {
                        visitors = typeof stats.uniques === 'object'
                            ? stats.uniques.value || stats.uniques.total || 0
                            : stats.uniques
                    } else if (stats.visitors) {
                        visitors = typeof stats.visitors === 'object'
                            ? stats.visitors.value || stats.visitors.total || 0
                            : stats.visitors
                    }

                    if (stats.bounces) {
                        bounces = typeof stats.bounces === 'object'
                            ? stats.bounces.value || stats.bounces.total || 0
                            : stats.bounces
                    }

                    if (stats.totaltime) {
                        totaltime = typeof stats.totaltime === 'object'
                            ? stats.totaltime.value || stats.totaltime.total || 0
                            : stats.totaltime
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
                // Continue with next website
            }
        }

        return results
    }
} 