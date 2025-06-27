import { NextResponse } from "next/server"

export async function GET() {
    try {
        const config = {
            serverUrl: process.env.UMAMI_SERVER_URL || "",
            username: process.env.UMAMI_USERNAME || "",
            password: process.env.UMAMI_PASSWORD || "",
            serverAlias: process.env.UMAMI_SERVER_ALIAS || "",
        }

        return NextResponse.json(config)
    } catch (error) {
        console.error("Failed to get config from environment:", error)
        return NextResponse.json(
            { error: "Failed to get config from environment" },
            { status: 500 }
        )
    }
} 