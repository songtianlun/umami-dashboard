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
            const data = await this.makeRequest(`/api/websites/${websiteId}/active`)
            console.log(`Active users response for ${websiteId}:`, data) // Debug log

            // Handle different response formats
            if (Array.isArray(data)) {
                return data[0]?.x || data[0]?.value || 0
            }

            return data.value || data.count || 0
        } catch (error) {
            console.error(`Error fetching active users for website ${websiteId}:`, error)
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

            const [stats, activeUsers] = await Promise.all([
                this.getWebsiteStats(websiteId),
                this.getActiveUsers(websiteId),
            ])

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
        }

        console.log("Final results:", results) // Debug log
        return results
    }
} 