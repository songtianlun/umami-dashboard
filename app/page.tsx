"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RefreshCw, Globe, Users, Eye, Clock, MousePointer, TrendingUp, AlertCircle, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react"
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

type SortField = 'name' | 'domain' | 'currentOnline' | 'pageviews' | 'sessions' | 'visitors' | 'avgSessionTime' | 'bounceRate'
type SortDirection = 'asc' | 'desc'

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
  const [sortField, setSortField] = useState<SortField>('currentOnline')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
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

      // Apply current sorting
      const sortedWebsites = sortWebsites(data.websites, sortField, sortDirection)

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

  // Re-sort websites when sort criteria changes
  useEffect(() => {
    if (websites.length > 0) {
      const sortedWebsites = sortWebsites(websites, sortField, sortDirection)
      setWebsites(sortedWebsites)
    }
  }, [sortField, sortDirection])

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

  const sortWebsites = (websites: WebsiteStats[], field: SortField, direction: SortDirection) => {
    return [...websites].sort((a, b) => {
      let aValue: any = a[field]
      let bValue: any = b[field]

      // Handle special cases
      if (field === 'name' || field === 'domain') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      // Compare values
      if (aValue < bValue) {
        return direction === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return direction === 'asc' ? 1 : -1
      }
      return 0
    })
  }

  const handleSort = (field: SortField) => {
    let newDirection: SortDirection = 'desc'

    if (sortField === field) {
      // If clicking the same field, toggle direction
      newDirection = sortDirection === 'asc' ? 'desc' : 'asc'
    } else {
      // If clicking a different field, use default direction
      newDirection = field === 'name' || field === 'domain' ? 'asc' : 'desc'
    }

    setSortField(field)
    setSortDirection(newDirection)
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronsUpDown className="h-3 w-3 text-muted-foreground" />
    }

    return sortDirection === 'asc'
      ? <ChevronUp className="h-3 w-3 text-foreground" />
      : <ChevronDown className="h-3 w-3 text-foreground" />
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
      <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Umami 统计面板</h1>
              <div className="flex items-center gap-2">
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
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
              <span>过去 24 小时数据汇总</span>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span className="text-xs">
                  最后更新: {getRelativeTime(lastUpdated)}
                  <span className="text-muted-foreground/70 ml-1 hidden sm:inline">
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
                <span className="text-xs hidden md:inline">• 服务器: {new URL(config.serverUrl).hostname}</span>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <AutoRefreshConfig
              currentInterval={refreshInterval}
              onIntervalChange={handleRefreshIntervalChange}
            />
            <LoginConfigDialog onConfigSave={handleConfigSave} />
            <Button onClick={() => fetchData(true)} disabled={loading} variant="outline" size="sm" className="w-full sm:w-auto">
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
        <div className={`grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5 transition-opacity duration-200 ${loading ? "opacity-70" : ""}`}>
          <Card className="col-span-2 sm:col-span-1">
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
              <div className="text-xl md:text-2xl font-bold">{formatNumber(summary.totalPageviews)}</div>
              <p className="text-xs text-muted-foreground">过去 24 小时</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">访问次数</CardTitle>
              <MousePointer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{formatNumber(summary.totalSessions)}</div>
              <p className="text-xs text-muted-foreground">过去 24 小时</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">访客数</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{formatNumber(summary.totalVisitors)}</div>
              <p className="text-xs text-muted-foreground">过去 24 小时</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">平均访问时间</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{formatTime(summary.avgSessionTime)}</div>
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
            <CardDescription className="text-sm">
              按{
                sortField === 'name' ? '网站名称' :
                  sortField === 'domain' ? '网站地址' :
                    sortField === 'currentOnline' ? '当前在线' :
                      sortField === 'pageviews' ? '浏览量' :
                        sortField === 'sessions' ? '访问次数' :
                          sortField === 'visitors' ? '访客数' :
                            sortField === 'avgSessionTime' ? '访问时间' :
                              '跳出率'
              }{sortDirection === 'asc' ? '升序' : '降序'}排列 • 共 {websites.length} 个网站
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`transition-opacity duration-200 ${loading ? "opacity-70" : ""}`}>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {/* Mobile Sort Controls */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">排序方式:</span>
                  <div className="flex items-center gap-2">
                    <select
                      value={sortField}
                      onChange={(e) => handleSort(e.target.value as SortField)}
                      className="text-sm border rounded px-2 py-1 bg-background"
                    >
                      <option value="currentOnline">当前在线</option>
                      <option value="name">网站名称</option>
                      <option value="domain">网站地址</option>
                      <option value="pageviews">浏览量</option>
                      <option value="sessions">访问次数</option>
                      <option value="visitors">访客数</option>
                      <option value="avgSessionTime">访问时间</option>
                      <option value="bounceRate">跳出率</option>
                    </select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                      className="p-2"
                    >
                      {sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {websites.length === 0 && !loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    暂无网站数据
                  </div>
                ) : websites.length === 0 && loading ? (
                  <div className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      加载中...
                    </div>
                  </div>
                ) : (
                  websites.map((website) => (
                    <Card key={website.id} className="p-4 mobile-card">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 bg-blue-500 rounded-full" />
                            <span className="font-medium truncate">{website.name}</span>
                          </div>
                          <Badge
                            variant={website.currentOnline > 0 ? "default" : "secondary"}
                            className={website.currentOnline > 0 ? "bg-green-500 hover:bg-green-600" : ""}
                          >
                            {website.currentOnline} 在线
                          </Badge>
                        </div>
                        <div>
                          <a
                            href={website.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm break-all"
                          >
                            {website.domain}
                          </a>
                        </div>
                        <div className="mobile-stats-grid">
                          <div>
                            <span className="text-muted-foreground">浏览量:</span>
                            <span className="ml-1 font-mono">{formatNumber(website.pageviews)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">访问次数:</span>
                            <span className="ml-1 font-mono">{formatNumber(website.sessions)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">访客数:</span>
                            <span className="ml-1 font-mono">{formatNumber(website.visitors)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">跳出率:</span>
                            <span className="ml-1 font-mono">{website.bounceRate.toFixed(1)}%</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-muted-foreground">平均访问时间:</span>
                            <span className="ml-1 font-mono">{formatTime(website.avgSessionTime)}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <button
                          className="flex items-center gap-1 hover:text-foreground transition-colors"
                          onClick={() => handleSort('name')}
                        >
                          网站名称
                          {getSortIcon('name')}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          className="flex items-center gap-1 hover:text-foreground transition-colors"
                          onClick={() => handleSort('domain')}
                        >
                          网站地址
                          {getSortIcon('domain')}
                        </button>
                      </TableHead>
                      <TableHead className="text-center">
                        <button
                          className="flex items-center gap-1 hover:text-foreground transition-colors mx-auto"
                          onClick={() => handleSort('currentOnline')}
                        >
                          当前在线
                          {getSortIcon('currentOnline')}
                        </button>
                      </TableHead>
                      <TableHead className="text-right">
                        <button
                          className="flex items-center gap-1 hover:text-foreground transition-colors ml-auto"
                          onClick={() => handleSort('pageviews')}
                        >
                          浏览量
                          {getSortIcon('pageviews')}
                        </button>
                      </TableHead>
                      <TableHead className="text-right">
                        <button
                          className="flex items-center gap-1 hover:text-foreground transition-colors ml-auto"
                          onClick={() => handleSort('sessions')}
                        >
                          访问次数
                          {getSortIcon('sessions')}
                        </button>
                      </TableHead>
                      <TableHead className="text-right">
                        <button
                          className="flex items-center gap-1 hover:text-foreground transition-colors ml-auto"
                          onClick={() => handleSort('visitors')}
                        >
                          访客数
                          {getSortIcon('visitors')}
                        </button>
                      </TableHead>
                      <TableHead className="text-right">
                        <button
                          className="flex items-center gap-1 hover:text-foreground transition-colors ml-auto"
                          onClick={() => handleSort('avgSessionTime')}
                        >
                          平均访问时间
                          {getSortIcon('avgSessionTime')}
                        </button>
                      </TableHead>
                      <TableHead className="text-right">
                        <button
                          className="flex items-center gap-1 hover:text-foreground transition-colors ml-auto"
                          onClick={() => handleSort('bounceRate')}
                        >
                          跳出率
                          {getSortIcon('bounceRate')}
                        </button>
                      </TableHead>
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
