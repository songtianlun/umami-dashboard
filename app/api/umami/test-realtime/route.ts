import { NextRequest, NextResponse } from "next/server"
import { UmamiAPI } from "@/lib/umami-api"

export async function POST(request: NextRequest) {
    try {
        const { config, websiteId } = await request.json()

        if (!config || !websiteId) {
            return NextResponse.json({ error: "Missing config or websiteId" }, { status: 400 })
        }

        console.log("Testing realtime data for:", { websiteId, server: config.serverUrl })

        const umamiApi = new UmamiAPI(config)

        // Test authentication first
        const authenticated = await umamiApi.authenticate()
        if (!authenticated) {
            return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
        }

        // Test all endpoints individually
        const results = {
            websiteId,
            endpoints: {},
            activeUsers: 0,
            error: null,
            debugInfo: []
        }

        // Test each endpoint individually
        const endpoints = [
            `/api/websites/${websiteId}/active`,
            `/api/websites/${websiteId}/realtime`,
            `/api/realtime/${websiteId}`,
            `/api/websites/${websiteId}/sessions?startAt=${Date.now() - 5 * 60 * 1000}&endAt=${Date.now()}`,
        ]

        for (const endpoint of endpoints) {
            try {
                console.log(`Testing endpoint: ${endpoint}`)
                const response = await fetch(`${config.serverUrl.replace(/\/$/, "")}${endpoint}`, {
                    headers: {
                        "Authorization": `Bearer ${(umamiApi as any).token}`,
                        "Content-Type": "application/json",
                    },
                })

                if (response.ok) {
                    const data = await response.json()
                    results.endpoints[endpoint] = {
                        status: response.status,
                        data: data,
                        type: Array.isArray(data) ? 'array' : typeof data,
                        length: Array.isArray(data) ? data.length : null
                    }
                    console.log(`Endpoint ${endpoint} success:`, data)
                } else {
                    results.endpoints[endpoint] = {
                        status: response.status,
                        error: `HTTP ${response.status}`,
                        data: null
                    }
                }
            } catch (endpointError) {
                results.endpoints[endpoint] = {
                    status: 'error',
                    error: endpointError instanceof Error ? endpointError.message : "Unknown error",
                    data: null
                }
            }
        }

        // Get the final active users count
        try {
            results.activeUsers = await umamiApi.getActiveUsers(websiteId)
            results.debugInfo.push(`Final active users count: ${results.activeUsers}`)
        } catch (error) {
            results.error = error instanceof Error ? error.message : "Unknown error"
            results.debugInfo.push(`Error getting active users: ${results.error}`)
        }

        return NextResponse.json(results)
    } catch (error) {
        console.error("Test realtime error:", error)
        return NextResponse.json({
            error: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 })
    }
} 