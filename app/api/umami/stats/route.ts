import { NextRequest, NextResponse } from "next/server"
import { UmamiAPI } from "@/lib/umami-api"

export async function GET(request: NextRequest) {
  try {
    // Check if we have Umami configuration
    const configHeader = request.headers.get("x-umami-config")
    const timeRangeHeader = request.headers.get("x-time-range")

    if (!configHeader) {
      return NextResponse.json({
        error: "未提供 Umami 配置信息",
        message: "请先配置 Umami 服务器连接信息"
      }, { status: 400 })
    }

    try {
      const config = JSON.parse(decodeURIComponent(configHeader))
      let timeRange = undefined

      // 解析时间范围参数
      if (timeRangeHeader) {
        try {
          timeRange = JSON.parse(decodeURIComponent(timeRangeHeader))
        } catch (e) {
          console.warn("Invalid time range header:", e)
        }
      }

      if (!config.serverUrl || !config.username || !config.password) {
        return NextResponse.json({
          error: "配置信息不完整",
          message: "请确保提供完整的服务器地址、用户名和密码"
        }, { status: 400 })
      }

      console.log("Attempting to connect to Umami API...")
      const umamiApi = new UmamiAPI(config)

      try {
        const websiteData = await umamiApi.getAllWebsiteData(timeRange)

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
          return NextResponse.json({
            error: "未能获取到网站数据",
            message: "可能是权限问题或网站配置问题，请检查配置信息"
          }, { status: 404 })
        }
      } catch (apiError) {
        console.error("Umami API error:", apiError)
        return NextResponse.json({
          error: `Umami API 错误: ${apiError instanceof Error ? apiError.message : '未知错误'}`,
          message: "请检查服务器地址和认证信息是否正确"
        }, { status: 500 })
      }
    } catch (configError) {
      console.error("Error parsing Umami config:", configError)
      return NextResponse.json({
        error: "配置解析错误",
        message: "配置信息格式错误"
      }, { status: 400 })
    }

  } catch (error) {
    console.error("Error fetching Umami stats:", error)
    return NextResponse.json({
      error: "服务器内部错误",
      message: "获取数据时发生未知错误"
    }, { status: 500 })
  }
}
