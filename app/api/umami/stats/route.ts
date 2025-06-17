import { NextRequest, NextResponse } from "next/server"
import { UmamiAPI } from "@/lib/umami-api"

// Mock data generator (fallback)
function generateMockData() {
  const websites = [
    {
      id: "demo-1",
      name: "演示网站 1",
      domain: "demo1.example.com",
      url: "https://demo1.example.com",
      pageviews: Math.floor(Math.random() * 50000) + 10000,
      sessions: Math.floor(Math.random() * 15000) + 3000,
      visitors: Math.floor(Math.random() * 8000) + 2000,
      avgSessionTime: Math.floor(Math.random() * 300) + 120,
      currentOnline: Math.floor(Math.random() * 50) + 5,
      bounceRate: Math.random() * 30 + 20,
    },
    {
      id: "demo-2",
      name: "演示网站 2",
      domain: "demo2.example.com",
      url: "https://demo2.example.com",
      pageviews: Math.floor(Math.random() * 30000) + 5000,
      sessions: Math.floor(Math.random() * 10000) + 2000,
      visitors: Math.floor(Math.random() * 6000) + 1500,
      avgSessionTime: Math.floor(Math.random() * 400) + 180,
      currentOnline: Math.floor(Math.random() * 30) + 2,
      bounceRate: Math.random() * 25 + 15,
    },
  ]

  const summary = {
    totalPageviews: websites.reduce((sum, site) => sum + site.pageviews, 0),
    totalSessions: websites.reduce((sum, site) => sum + site.sessions, 0),
    totalVisitors: websites.reduce((sum, site) => sum + site.visitors, 0),
    avgSessionTime: Math.floor(websites.reduce((sum, site) => sum + site.avgSessionTime, 0) / websites.length),
    totalCurrentOnline: websites.reduce((sum, site) => sum + site.currentOnline, 0),
  }

  return { websites, summary }
}

export async function GET(request: NextRequest) {
  try {
    // Check if we have Umami configuration
    const configHeader = request.headers.get("x-umami-config")

    if (configHeader) {
      try {
        const config = JSON.parse(decodeURIComponent(configHeader))
        console.log("Received config:", { ...config, password: "***" }) // Debug log without password

        if (config.serverUrl && config.username && config.password) {
          console.log("Attempting to connect to Umami API...")
          const umamiApi = new UmamiAPI(config)

          try {
            const websiteData = await umamiApi.getAllWebsiteData()
            console.log("Retrieved website data:", websiteData)

            if (websiteData.length > 0) {
              // Calculate summary
              const summary = {
                totalPageviews: websiteData.reduce((sum, site) => sum + site.pageviews, 0),
                totalSessions: websiteData.reduce((sum, site) => sum + site.sessions, 0),
                totalVisitors: websiteData.reduce((sum, site) => sum + site.visitors, 0),
                avgSessionTime: websiteData.length > 0
                  ? Math.floor(websiteData.reduce((sum, site) => sum + site.avgSessionTime, 0) / websiteData.length)
                  : 0,
                totalCurrentOnline: websiteData.reduce((sum, site) => sum + site.currentOnline, 0),
              }

              return NextResponse.json({
                websites: websiteData,
                summary,
                source: "umami"
              })
            } else {
              console.log("No website data returned from Umami API")
              // Fallback to mock data with message
              const mockData = generateMockData()
              return NextResponse.json({
                ...mockData,
                source: "mock",
                message: "未能获取到网站数据，可能是权限问题或网站配置问题"
              })
            }
          } catch (apiError) {
            console.error("Umami API error:", apiError)
            const mockData = generateMockData()
            return NextResponse.json({
              ...mockData,
              source: "mock",
              error: `Umami API 错误: ${apiError instanceof Error ? apiError.message : '未知错误'}`
            })
          }
        }
      } catch (configError) {
        console.error("Error parsing Umami config:", configError)
        const mockData = generateMockData()
        return NextResponse.json({
          ...mockData,
          source: "mock",
          error: "配置解析错误"
        })
      }
    }

    // Fallback to mock data
    console.log("No valid config provided, using mock data")
    const mockData = generateMockData()
    return NextResponse.json({
      ...mockData,
      source: "mock",
      message: "使用演示数据 - 请配置 Umami 连接以获取真实数据"
    })

  } catch (error) {
    console.error("Error fetching Umami stats:", error)

    // Return mock data on error
    const mockData = generateMockData()
    return NextResponse.json({
      ...mockData,
      source: "mock",
      error: "获取数据时出现错误，显示演示数据"
    })
  }
}
