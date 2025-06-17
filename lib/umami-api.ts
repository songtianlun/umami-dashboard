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
            console.log("Websites API response:", data) // Debug log
            const websites = data.data || data || []
            console.log("Parsed websites:", websites) // Debug log
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

            console.log(`Fetching stats for website ${websiteId} with params:`, params.toString()) // Debug log
            const data = await this.makeRequest(`/api/websites/${websiteId}/stats?${params}`)
            console.log(`Stats response for ${websiteId}:`, data) // Debug log
            return data
        } catch (error) {
            console.error(`Error fetching stats for website ${websiteId}:`, error)
            return null
        }
    }

    async getActiveUsers(websiteId: string): Promise<number> {
        try {
            console.log(`Fetching active users for website ${websiteId}`) // Debug log

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
                    console.log(`Trying endpoint: ${endpoint}`)
                    const data = await this.makeRequest(endpoint)
                    console.log(`Response from ${endpoint}:`, data)

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
                                console.log(`Found ${activeCount} active users from array data`)
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
                            console.log(`Found ${count} active users from object data`)
                            return count
                        }
                    } else if (typeof data === 'number') {
                        // Direct number response
                        if (data > 0) {
                            console.log(`Found ${data} active users from number response`)
                            return data
                        }
                    }
                } catch (endpointError) {
                    console.log(`Endpoint ${endpoint} failed:`, endpointError)
                    continue
                }
            }

            // Enhanced fallback: Try to get recent unique visitors
            console.log(`Trying enhanced fallback methods for ${websiteId}`)
            try {
                const recentActiveUsers = await this.getRecentActiveUsers(websiteId)
                if (recentActiveUsers > 0) {
                    console.log(`Fallback method found ${recentActiveUsers} active users`)
                    return recentActiveUsers
                }
            } catch (fallbackError) {
                console.log(`Fallback method also failed:`, fallbackError)
            }

            // If all methods fail, return 0
            console.log(`All realtime methods failed for website ${websiteId}`)
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

                    console.log(`Method 1: Fetching recent unique visitors for ${websiteId}`)
                    const data = await this.makeRequest(`/api/websites/${websiteId}/stats?${params}`)
                    console.log(`Recent stats response:`, data)

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

                    console.log(`Method 2: Fetching recent pageviews for ${websiteId}`)
                    const data = await this.makeRequest(`/api/websites/${websiteId}/pageviews?${params}`)
                    console.log(`Recent pageviews response:`, data)

                    if (Array.isArray(data) && data.length > 0) {
                        const recentPageviews = data.reduce((sum, item) => sum + (item.y || item.value || 0), 0)
                        // Conservative estimation: 1 active user per 2-3 pageviews in 5 minutes
                        return Math.min(Math.ceil(recentPageviews / 2), 50)
                    }
                    return 0
                },

                // Method 3: Try sessions endpoint
                async () => {
                    console.log(`Method 3: Trying sessions endpoint for ${websiteId}`)
                    const data = await this.makeRequest(`/api/websites/${websiteId}/sessions/active`)
                    console.log(`Active sessions response:`, data)

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
                        console.log(`Method ${i + 1} succeeded with result: ${result}`)
                        return result
                    }
                } catch (methodError) {
                    console.log(`Method ${i + 1} failed:`, methodError)
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
        console.log("Fetched websites for processing:", websites) // Debug log
        const results = []

        for (const website of websites) {
            // Use the correct ID field
            const websiteId = website.id || website.websiteId
            console.log(`Processing website: ${website.name} (ID: ${websiteId})`) // Debug log

            if (!websiteId) {
                console.error("Website missing ID:", website)
                continue
            }

            try {
                const [stats, activeUsers] = await Promise.all([
                    this.getWebsiteStats(websiteId),
                    this.getActiveUsers(websiteId),
                ])

                console.log(`Stats for ${website.name}:`, { stats, activeUsers })

                if (stats) {
                    const avgSessionTime = stats.uniques && stats.totaltime && stats.uniques.value > 0
                        ? Math.floor(stats.totaltime.value / stats.uniques.value / 1000)
                        : 0

                    const bounceRate = stats.pageviews && stats.bounces && stats.pageviews.value > 0
                        ? (stats.bounces.value / stats.pageviews.value) * 100
                        : 0

                    results.push({
                        id: websiteId,
                        name: website.name,
                        domain: website.domain,
                        url: `https://${website.domain}`,
                        pageviews: stats.pageviews ? stats.pageviews.value : 0,
                        sessions: stats.pageviews ? stats.pageviews.value : 0, // Umami doesn't have sessions, use pageviews
                        visitors: stats.uniques ? stats.uniques.value : 0,
                        avgSessionTime,
                        currentOnline: activeUsers,
                        bounceRate,
                    })
                }
            } catch (websiteError) {
                console.error(`Error processing website ${website.name}:`, websiteError)
                // Continue with next website
            }
        }

        console.log("Final results:", results) // Debug log
        return results
    }
} 