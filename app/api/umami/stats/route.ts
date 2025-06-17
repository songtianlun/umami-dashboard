import { NextResponse } from "next/server"

// Mock data generator
function generateMockData() {
  const websites = [
    {
      id: "1",
      name: "主站官网",
      domain: "example.com",
      url: "https://example.com",
      pageviews: Math.floor(Math.random() * 50000) + 10000,
      sessions: Math.floor(Math.random() * 15000) + 3000,
      visitors: Math.floor(Math.random() * 8000) + 2000,
      avgSessionTime: Math.floor(Math.random() * 300) + 120,
      currentOnline: Math.floor(Math.random() * 50) + 5,
      bounceRate: Math.random() * 30 + 20,
    },
    {
      id: "2",
      name: "博客系统",
      domain: "blog.example.com",
      url: "https://blog.example.com",
      pageviews: Math.floor(Math.random() * 30000) + 5000,
      sessions: Math.floor(Math.random() * 10000) + 2000,
      visitors: Math.floor(Math.random() * 6000) + 1500,
      avgSessionTime: Math.floor(Math.random() * 400) + 180,
      currentOnline: Math.floor(Math.random() * 30) + 2,
      bounceRate: Math.random() * 25 + 15,
    },
    {
      id: "3",
      name: "在线商城",
      domain: "shop.example.com",
      url: "https://shop.example.com",
      pageviews: Math.floor(Math.random() * 80000) + 20000,
      sessions: Math.floor(Math.random() * 20000) + 5000,
      visitors: Math.floor(Math.random() * 12000) + 3000,
      avgSessionTime: Math.floor(Math.random() * 500) + 200,
      currentOnline: Math.floor(Math.random() * 80) + 10,
      bounceRate: Math.random() * 35 + 25,
    },
    {
      id: "4",
      name: "文档中心",
      domain: "docs.example.com",
      url: "https://docs.example.com",
      pageviews: Math.floor(Math.random() * 25000) + 8000,
      sessions: Math.floor(Math.random() * 8000) + 2500,
      visitors: Math.floor(Math.random() * 5000) + 1800,
      avgSessionTime: Math.floor(Math.random() * 600) + 300,
      currentOnline: Math.floor(Math.random() * 25) + 3,
      bounceRate: Math.random() * 20 + 10,
    },
    {
      id: "5",
      name: "API 服务",
      domain: "api.example.com",
      url: "https://api.example.com",
      pageviews: Math.floor(Math.random() * 15000) + 3000,
      sessions: Math.floor(Math.random() * 5000) + 1000,
      visitors: Math.floor(Math.random() * 3000) + 800,
      avgSessionTime: Math.floor(Math.random() * 200) + 60,
      currentOnline: Math.floor(Math.random() * 15) + 1,
      bounceRate: Math.random() * 40 + 30,
    },
    {
      id: "6",
      name: "移动应用",
      domain: "app.example.com",
      url: "https://app.example.com",
      pageviews: Math.floor(Math.random() * 40000) + 12000,
      sessions: Math.floor(Math.random() * 12000) + 4000,
      visitors: Math.floor(Math.random() * 7000) + 2500,
      avgSessionTime: Math.floor(Math.random() * 350) + 150,
      currentOnline: Math.floor(Math.random() * 40) + 8,
      bounceRate: Math.random() * 28 + 18,
    },
  ]

  // Calculate summary
  const summary = {
    totalPageviews: websites.reduce((sum, site) => sum + site.pageviews, 0),
    totalSessions: websites.reduce((sum, site) => sum + site.sessions, 0),
    totalVisitors: websites.reduce((sum, site) => sum + site.visitors, 0),
    avgSessionTime: Math.floor(websites.reduce((sum, site) => sum + site.avgSessionTime, 0) / websites.length),
    totalCurrentOnline: websites.reduce((sum, site) => sum + site.currentOnline, 0),
  }

  return { websites, summary }
}

export async function GET() {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    const data = generateMockData()

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching Umami stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
