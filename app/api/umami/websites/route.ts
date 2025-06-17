import { NextRequest, NextResponse } from "next/server"
import { UmamiAPI } from "@/lib/umami-api"

export async function POST(request: NextRequest) {
    try {
        const { config } = await request.json()

        if (!config) {
            return NextResponse.json({ error: "Missing config" }, { status: 400 })
        }

        console.log("Fetching websites list for:", config.serverUrl)

        const umamiApi = new UmamiAPI(config)

        // Test authentication first
        const authenticated = await umamiApi.authenticate()
        if (!authenticated) {
            return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
        }

        // Get websites list
        const websites = await umamiApi.getWebsites()

        return NextResponse.json({
            websites: websites.map(site => ({
                id: site.id || site.websiteId,
                name: site.name,
                domain: site.domain,
                url: `https://${site.domain}`
            })),
            count: websites.length
        })
    } catch (error) {
        console.error("Get websites error:", error)
        return NextResponse.json({
            error: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 })
    }
} 