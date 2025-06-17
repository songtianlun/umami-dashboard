"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RefreshCw, Globe, Users, Eye, Clock, MousePointer, TrendingUp, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { LoginConfigDialog } from "@/components/login-config"
import { AutoRefreshConfig } from "@/components/auto-refresh-config"
import { RealtimeTest } from "@/components/realtime-test"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface WebsiteStats {
  id: string
  name: string
  domain: string
  url: string
  pageviews: number
  sessions: number
  visitors: number
  avgSessionTime: number // in seconds
  currentOnline: number
  bounceRate: number
}

interface SummaryStats {
  totalPageviews: number
  totalSessions: number
  totalVisitors: number
  avgSessionTime: number
  totalCurrentOnline: number
}

interface LoginConfig {
  serverUrl: string
  username: string
  password: string
}

export default function UmamiDashboard() {
  const [websites, setWebsites] = useState<WebsiteStats[]>([])
  const [summary, setSummary] = useState<SummaryStats>({
    totalPageviews: 0,
    totalSessions: 0,
    totalVisitors: 0,
    avgSessionTime: 0,
    totalCurrentOnline: 0,
  })
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [config, setConfig] = useState<LoginConfig | null>(null)
  const [refreshInterval, setRefreshInterval] = useState(30000) // 30 seconds default
  const [dataSource, setDataSource] = useState<"mock" | "umami">("mock")
  const [statusMessage, setStatusMessage] = useState<string>("")
  const [currentTime, setCurrentTime] = useState(new Date())
  const { toast } = useToast()

  const fetchData = async (showToast: boolean = true) => {
    // Only show toast notification, don't set loading state immediately
    if (showToast) {
      toast({
        title: "正在获取最新数据",
        description: "正在从服务器获取最新统计数据...",
      })
    }

    // Set loading state only after a short delay
    const loadingTimeout = setTimeout(() => {
      setLoading(true)
    }, 500)

    try {
      const headers: HeadersInit = {}

      // Add config to headers if available
      if (config) {
        headers["x-umami-config"] = encodeURIComponent(JSON.stringify(config))
      }

      const response = await fetch("/api/umami/stats", { headers })
      const data = await response.json()

      // Clear the loading timeout since we got a response
      clearTimeout(loadingTimeout)

      // Sort by current online visitors (descending)
      const sortedWebsites = data.websites.sort((a: WebsiteStats, b: WebsiteStats) => b.currentOnline - a.currentOnline)

      setWebsites(sortedWebsites)
      setSummary(data.summary)
      setDataSource(data.source)
      setStatusMessage(data.message || data.error || "")
      setLastUpdated(new Date())
      setLoading(false)

      if (showToast) {
        if (data.source === "umami") {
          toast({
            title: "数据更新成功",
            description: `成功获取 ${data.websites.length} 个网站的实时数据`,
          })
        } else {
          toast({
            title: "使用演示数据",
            description: data.message || "请配置 Umami 连接以获取真实数据",
            variant: "secondary",
          })
        }
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
      clearTimeout(loadingTimeout)
      setLoading(false)

      if (showToast) {
        toast({
          title: "数据获取失败",
          description: "无法获取统计数据，请检查网络连接",
          variant: "destructive",
        })
      }
    }
  }

  useEffect(() => {
    // Load config from localStorage
    const savedConfig = localStorage.getItem("umami-config")
    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig))
      } catch (error) {
        console.error("Failed to parse saved config:", error)
      }
    }

    // Load refresh interval from localStorage
    const savedInterval = localStorage.getItem("umami-refresh-interval")
    if (savedInterval) {
      setRefreshInterval(parseInt(savedInterval))
    }
  }, [])

  useEffect(() => {
    fetchData(false) // Don't show toast on initial load
  }, [config])

  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(() => fetchData(false), refreshInterval) // Don't show toast on auto-refresh
      return () => clearInterval(interval)
    }
  }, [refreshInterval, config])

  // Update current time every second for relative time display
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M"
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K"
    }
    return num.toString()
  }

  const getRelativeTime = (timestamp: Date) => {
    const diff = Math.floor((currentTime.getTime() - timestamp.getTime()) / 1000)

    if (diff < 60) return `${diff}秒前`
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
    return `${Math.floor(diff / 86400)}天前`
  }

  const handleConfigSave = (newConfig: LoginConfig) => {
    setConfig(newConfig)
    toast({
      title: "配置已保存",
      description: "正在获取最新数据...",
    })
  }

  const handleRefreshIntervalChange = (interval: number) => {
    setRefreshInterval(interval)
    const intervalLabel = interval === 0 ? "禁用" : `${interval / 1000}秒`
    toast({
      title: "刷新间隔已更新",
      description: `自动刷新已设置为: ${intervalLabel}`,
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">Umami 统计面板</h1>
              <Badge variant={dataSource === "umami" ? "default" : "secondary"}>
                {dataSource === "umami" ? "实时数据" : "演示数据"}
              </Badge>
              {loading && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  更新中
                </div>
              )}
            </div>
            <div className="flex items-center gap-4 text-muted-foreground">
              <span>过去 24 小时数据汇总</span>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span className="text-xs">
                  最后更新: {getRelativeTime(lastUpdated)}
                  <span className="text-muted-foreground/70 ml-1">
                    ({lastUpdated.toLocaleString('zh-CN', {
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })})
                  </span>
                </span>
              </div>
              {config && (
                <span className="text-xs">• 服务器: {new URL(config.serverUrl).hostname}</span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <AutoRefreshConfig
              currentInterval={refreshInterval}
              onIntervalChange={handleRefreshIntervalChange}
            />
            <LoginConfigDialog onConfigSave={handleConfigSave} />
            <Button onClick={() => fetchData(true)} disabled={loading} variant="outline" size="sm">
              <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
              {loading ? "刷新中..." : "刷新数据"}
            </Button>
          </div>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{statusMessage}</AlertDescription>
          </Alert>
        )}

        {/* Summary Cards */}
        <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-5 transition-opacity duration-200 ${loading ? "opacity-70" : ""}`}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">当前在线</CardTitle>
              <div className="flex items-center">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse mr-2" />
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{summary.totalCurrentOnline}</div>
              <p className="text-xs text-muted-foreground">实时访客</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总浏览量</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(summary.totalPageviews)}</div>
              <p className="text-xs text-muted-foreground">过去 24 小时</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">访问次数</CardTitle>
              <MousePointer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(summary.totalSessions)}</div>
              <p className="text-xs text-muted-foreground">过去 24 小时</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">访客数</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(summary.totalVisitors)}</div>
              <p className="text-xs text-muted-foreground">过去 24 小时</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">平均访问时间</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatTime(summary.avgSessionTime)}</div>
              <p className="text-xs text-muted-foreground">过去 24 小时</p>
            </CardContent>
          </Card>
        </div>

        {/* Debug/Test Section - only show if using demo data */}
        {dataSource === "mock" && config && (
          <RealtimeTest config={config} />
        )}

        {/* Websites Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              网站详细统计
            </CardTitle>
            <CardDescription>按当前在线访客数降序排列 • 共 {websites.length} 个网站</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`rounded-md border transition-opacity duration-200 ${loading ? "opacity-70" : ""}`}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>网站名称</TableHead>
                    <TableHead>网站地址</TableHead>
                    <TableHead className="text-center">当前在线</TableHead>
                    <TableHead className="text-right">浏览量</TableHead>
                    <TableHead className="text-right">访问次数</TableHead>
                    <TableHead className="text-right">访客数</TableHead>
                    <TableHead className="text-right">平均访问时间</TableHead>
                    <TableHead className="text-right">跳出率</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {websites.length === 0 && !loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        暂无网站数据
                      </TableCell>
                    </TableRow>
                  ) : websites.length === 0 && loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                          加载中...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    websites.map((website) => (
                      <TableRow key={website.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 bg-blue-500 rounded-full" />
                            {website.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <a
                            href={website.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {website.domain}
                          </a>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={website.currentOnline > 0 ? "default" : "secondary"}
                            className={website.currentOnline > 0 ? "bg-green-500 hover:bg-green-600" : ""}
                          >
                            {website.currentOnline}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">{formatNumber(website.pageviews)}</TableCell>
                        <TableCell className="text-right font-mono">{formatNumber(website.sessions)}</TableCell>
                        <TableCell className="text-right font-mono">{formatNumber(website.visitors)}</TableCell>
                        <TableCell className="text-right font-mono">{formatTime(website.avgSessionTime)}</TableCell>
                        <TableCell className="text-right font-mono">{website.bounceRate.toFixed(1)}%</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
