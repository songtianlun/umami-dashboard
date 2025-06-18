"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RefreshCw, Globe, Users, Eye, Clock, MousePointer, TrendingUp, AlertCircle, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { LoginConfigDialog, getFullConfig, LoginConfigDialogRef } from "@/components/login-config"
import { AutoRefreshConfig } from "@/components/auto-refresh-config"
import { RealtimeTest } from "@/components/realtime-test"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SessionHistory } from "@/lib/session-history"
import { StatCardHistoryChart } from "@/components/history-chart"
import { LoadingCard } from "@/components/loading-card"
import { formatVersionInfo, getCopyrightYears } from "@/lib/version"
import { useI18n } from "@/components/i18n-provider"
import { LanguageConfig } from "@/components/language-config"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { TimeRangeConfig, TimeRangeValue, getSavedTimeRange, getTimeRangeTimestamps } from "@/components/time-range-config"

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
  const { t, locale } = useI18n()

  const [websites, setWebsites] = useState<WebsiteStats[]>([])
  const [summary, setSummary] = useState<SummaryStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [config, setConfig] = useState<LoginConfig | null>(null)
  const [refreshInterval, setRefreshInterval] = useState(30000) // 30 seconds default
  const [dataSource, setDataSource] = useState<"umami" | "error" | "loading" | "not-configured">("not-configured")
  const [statusMessage, setStatusMessage] = useState<string>("")
  const [currentTime, setCurrentTime] = useState(new Date())
  const [sortField, setSortField] = useState<SortField>('currentOnline')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [historyData, setHistoryData] = useState({
    totalPageviews: [] as Array<{ x: number, y: number }>,
    totalSessions: [] as Array<{ x: number, y: number }>,
    totalVisitors: [] as Array<{ x: number, y: number }>,
    avgSessionTime: [] as Array<{ x: number, y: number }>,
    totalCurrentOnline: [] as Array<{ x: number, y: number }>
  })
  const [showConfigOnStart, setShowConfigOnStart] = useState(false)
  const [timeRange, setTimeRange] = useState<TimeRangeValue>('24h')
  const loginConfigRef = useRef<LoginConfigDialogRef | null>(null)
  const { toast } = useToast()

  // 检查配置是否完整
  const isConfigComplete = (config: LoginConfig | null): boolean => {
    return !!(config?.serverUrl?.trim() && config?.username?.trim() && config?.password?.trim())
  }

  const fetchData = async (showToast: boolean = true) => {
    // 检查配置是否完整
    if (!isConfigComplete(config)) {
      console.log('Configuration incomplete, skipping data fetch')
      setStatusMessage(t('pleaseCompleteConfiguration'))
      setDataSource("not-configured")
      setLoading(false)
      setInitialLoad(false)

      if (showToast) {
        toast({
          title: t('configurationIncomplete'),
          description: t('pleaseCompleteConfiguration'),
          variant: "destructive",
        })
      }
      return
    }

    // Only show toast notification, don't set loading state immediately
    if (showToast) {
      toast({
        title: t('fetchingLatestData'),
        description: t('fetchingFromServer'),
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

      // Add time range to headers
      const timeRangeTimestamps = getTimeRangeTimestamps(timeRange)
      headers["x-time-range"] = encodeURIComponent(JSON.stringify(timeRangeTimestamps))

      const response = await fetch("/api/umami/stats", { headers })
      const data = await response.json()

      // Clear the loading timeout since we got a response
      clearTimeout(loadingTimeout)

      if (response.ok && data.websites && data.summary) {
        // Apply current sorting
        const sortedWebsites = sortWebsites(data.websites, sortField, sortDirection)

        setWebsites(sortedWebsites)
        setSummary(data.summary)
        setDataSource(data.source)
        setStatusMessage("")
        setLastUpdated(new Date())
        setLoading(false)
        setInitialLoad(false)

        // 保存数据到历史记录
        SessionHistory.addDataPoint(data.summary)

        // 更新历史图表数据
        setHistoryData({
          totalPageviews: SessionHistory.getChartData('totalPageviews'),
          totalSessions: SessionHistory.getChartData('totalSessions'),
          totalVisitors: SessionHistory.getChartData('totalVisitors'),
          avgSessionTime: SessionHistory.getChartData('avgSessionTime'),
          totalCurrentOnline: SessionHistory.getChartData('totalCurrentOnline')
        })

        if (showToast) {
          toast({
            title: t('dataUpdatedSuccessfully'),
            description: t('dataFetchSuccess', { count: data.websites.length }),
          })
        }
      } else {
        // Handle error response
        setStatusMessage(data.message || data.error || t('dataFetchFailed'))
        setDataSource("error")
        setLoading(false)
        setInitialLoad(false)

        if (showToast) {
          toast({
            title: t('dataUpdateFailed'),
            description: data.message || data.error || t('checkConfiguration'),
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
      clearTimeout(loadingTimeout)
      setLoading(false)
      setInitialLoad(false)
      setStatusMessage(t('networkConnectionFailed'))
      setDataSource("error")

      if (showToast) {
        toast({
          title: t('dataUpdateFailed'),
          description: t('unableToFetchStats'),
          variant: "destructive",
        })
      }
    }
  }

  useEffect(() => {
    // 使用新的配置获取方式（优先localStorage，后备环境变量）
    getFullConfig().then((loadedConfig) => {
      setConfig(loadedConfig)

      // 检查是否需要显示配置对话框
      if (!isConfigComplete(loadedConfig)) {
        setShowConfigOnStart(true)
        setDataSource("not-configured")
        setStatusMessage(t('pleaseCompleteConfiguration'))
        console.log(t('autoRefreshDisabled'))
      }
    })

    // Load refresh interval from localStorage
    const savedInterval = localStorage.getItem("umami-refresh-interval")
    if (savedInterval) {
      setRefreshInterval(parseInt(savedInterval))
    }

    // Load time range from localStorage
    const savedTimeRange = getSavedTimeRange()
    setTimeRange(savedTimeRange)
  }, [t])

  // 首次加载时检查配置
  useEffect(() => {
    if (config && isConfigComplete(config)) {
      fetchData(false) // Don't show toast on initial load
      setDataSource("loading")

      // 加载历史数据
      setHistoryData({
        totalPageviews: SessionHistory.getChartData('totalPageviews'),
        totalSessions: SessionHistory.getChartData('totalSessions'),
        totalVisitors: SessionHistory.getChartData('totalVisitors'),
        avgSessionTime: SessionHistory.getChartData('avgSessionTime'),
        totalCurrentOnline: SessionHistory.getChartData('totalCurrentOnline')
      })
    } else if (config) {
      setInitialLoad(false)
    }
  }, [config])

  // 自动刷新逻辑 - 只有配置完整时才启用
  useEffect(() => {
    if (refreshInterval > 0 && isConfigComplete(config)) {
      const interval = setInterval(() => fetchData(false), refreshInterval) // Don't show toast on auto-refresh
      return () => clearInterval(interval)
    } else if (!isConfigComplete(config) && refreshInterval > 0) {
      console.log(t('autoRefreshDisabled'))
    }
  }, [refreshInterval, config, t])

  // 首次打开自动弹出设置窗口
  useEffect(() => {
    if (showConfigOnStart && !initialLoad) {
      const timer = setTimeout(() => {
        loginConfigRef.current?.openDialog?.()
        setShowConfigOnStart(false)
      }, 1000) // 延迟1秒弹出，确保界面已加载

      return () => clearTimeout(timer)
    }
  }, [showConfigOnStart, initialLoad])

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

  // 重新获取数据当时间范围改变时
  useEffect(() => {
    if (config && isConfigComplete(config)) {
      fetchData(false) // 时间范围改变时不显示toast
    }
  }, [timeRange])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  const getRelativeTime = (timestamp: Date) => {
    const now = currentTime.getTime()
    const diff = now - timestamp.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (seconds < 30) return t('justNow')
    if (seconds < 60) return t('secondsAgo', { seconds })
    if (minutes === 1) return t('minuteAgo')
    if (minutes < 60) return t('minutesAgo', { minutes })
    if (hours === 1) return t('hourAgo')
    if (hours < 24) return t('hoursAgo', { hours })
    if (days === 1) return t('dayAgo')
    return t('daysAgo', { days })
  }

  const getSortFieldLabel = (field: SortField) => {
    switch (field) {
      case 'name': return t('websiteName')
      case 'domain': return t('websiteAddress')
      case 'currentOnline': return t('currentOnline')
      case 'pageviews': return t('pageviews')
      case 'sessions': return t('sessions')
      case 'visitors': return t('visitors')
      case 'avgSessionTime': return t('avgAccessTime')
      case 'bounceRate': return t('bounceRate')
      default: return field
    }
  }

  const sortWebsites = (websites: WebsiteStats[], field: SortField, direction: SortDirection) => {
    return [...websites].sort((a, b) => {
      let aValue = a[field]
      let bValue = b[field]

      // Handle string fields
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (direction === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronsUpDown className="h-4 w-4 opacity-50" />
    }
    return sortDirection === 'asc' ?
      <ChevronUp className="h-4 w-4" /> :
      <ChevronDown className="h-4 w-4" />
  }

  const handleConfigSave = (newConfig: LoginConfig) => {
    setConfig(newConfig)
    // 配置保存后自动刷新数据
    if (isConfigComplete(newConfig)) {
      setDataSource("loading")
      fetchData(true)
    }

    toast({
      title: t('configurationSaved'),
      description: t('configurationSavedDescription'),
    })
  }

  const handleRefreshIntervalChange = (interval: number) => {
    setRefreshInterval(interval)
    const intervalLabel = interval === 0 ? t('disable') : `${interval / 1000}${t('seconds')}`
    toast({
      title: t('refreshIntervalUpdated'),
      description: t('autoRefreshSetTo', { interval: intervalLabel }),
    })
  }

  const handleTimeRangeChange = (range: TimeRangeValue) => {
    setTimeRange(range)
  }

  // 生成 Umami 详情页面链接
  const getUmamiWebsiteUrl = (websiteId: string) => {
    if (config?.serverUrl) {
      try {
        const baseUrl = config.serverUrl.replace(/\/+$/, '') // 去除末尾斜杠
        return `${baseUrl}/websites/${websiteId}`
      } catch (error) {
        console.error('Error generating Umami URL:', error)
        return null
      }
    }
    return null
  }

  // 获取时间范围的描述文本
  const getTimeRangeDescription = (range: TimeRangeValue) => {
    switch (range) {
      case '24h':
        return t('past24Hours')
      case 'today':
        return t('today')
      case 'week':
        return t('thisWeek')
      case '7d':
        return t('last7Days')
      case 'month':
        return t('thisMonth')
      case '30d':
        return t('last30Days')
      default:
        return t('past24Hours')
    }
  }

  const getServerHostname = (serverUrl: string) => {
    try {
      if (!serverUrl || !serverUrl.trim()) {
        return null
      }
      return new URL(serverUrl).hostname
    } catch (error) {
      return null
    }
  }

  const getDataSourceBadge = () => {
    switch (dataSource) {
      case "umami":
        return { variant: "default" as const, text: t('realtimeData') }
      case "error":
        return { variant: "destructive" as const, text: t('connectionFailed') }
      case "not-configured":
        return { variant: "secondary" as const, text: t('notConfigured') }
      default:
        return { variant: "secondary" as const, text: t('notConnected') }
    }
  }

  const configComplete = isConfigComplete(config)

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Header */}
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('title')}</h1>
                <div className="flex items-center gap-2">
                  <Badge variant={getDataSourceBadge().variant}>
                    {getDataSourceBadge().text}
                  </Badge>
                  {loading && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      {t('updating')}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                <span>{getTimeRangeDescription(timeRange)} 数据汇总</span>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span className="text-xs">
                    {t('lastUpdated')}: {getRelativeTime(lastUpdated)}
                    <span className="text-muted-foreground/70 ml-1 hidden sm:inline">
                      ({lastUpdated.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })})
                    </span>
                  </span>
                </div>
                {config && getServerHostname(config.serverUrl) && (
                  <span className="text-xs hidden md:inline">• {t('server')}: {getServerHostname(config.serverUrl)}</span>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <TimeRangeConfig
                currentRange={timeRange}
                onRangeChange={handleTimeRangeChange}
              />
              <LanguageConfig />
              <AutoRefreshConfig
                currentInterval={refreshInterval}
                onIntervalChange={handleRefreshIntervalChange}
              />
              <LoginConfigDialog ref={loginConfigRef} onConfigSave={handleConfigSave} />
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      onClick={() => fetchData(true)}
                      disabled={loading || !configComplete}
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                      {loading ? t('refreshing') : t('refreshData')}
                    </Button>
                  </div>
                </TooltipTrigger>
                {!configComplete && (
                  <TooltipContent>
                    <p>{t('refreshDisabledTooltip')}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </div>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <Alert variant={dataSource === "not-configured" ? "default" : "destructive"}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{statusMessage}</AlertDescription>
            </Alert>
          )}

          {/* Summary Cards */}
          <div className={`grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5 transition-opacity duration-200 ${loading ? "opacity-70" : ""}`}>
            {summary ? (
              <>
                <Card className="col-span-2 sm:col-span-1 relative">
                  <StatCardHistoryChart data={historyData.totalCurrentOnline} />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('currentOnline')}</CardTitle>
                    <div className="flex items-center">
                      <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse mr-2" />
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{summary.totalCurrentOnline}</div>
                    <p className="text-xs text-muted-foreground">{t('realtimeVisitors')}</p>
                  </CardContent>
                </Card>

                <Card className="relative">
                  <StatCardHistoryChart data={historyData.totalPageviews} />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('totalPageviews')}</CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl md:text-2xl font-bold">{formatNumber(summary.totalPageviews)}</div>
                    <p className="text-xs text-muted-foreground">{getTimeRangeDescription(timeRange)}</p>
                  </CardContent>
                </Card>

                <Card className="relative">
                  <StatCardHistoryChart data={historyData.totalSessions} />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('totalSessions')}</CardTitle>
                    <MousePointer className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl md:text-2xl font-bold">{formatNumber(summary.totalSessions)}</div>
                    <p className="text-xs text-muted-foreground">{getTimeRangeDescription(timeRange)}</p>
                  </CardContent>
                </Card>

                <Card className="relative">
                  <StatCardHistoryChart data={historyData.totalVisitors} />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('totalVisitors')}</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl md:text-2xl font-bold">{formatNumber(summary.totalVisitors)}</div>
                    <p className="text-xs text-muted-foreground">{getTimeRangeDescription(timeRange)}</p>
                  </CardContent>
                </Card>

                <Card className="relative">
                  <StatCardHistoryChart data={historyData.avgSessionTime} />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('averageSessionTime')}</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl md:text-2xl font-bold">{formatTime(summary.avgSessionTime)}</div>
                    <p className="text-xs text-muted-foreground">{getTimeRangeDescription(timeRange)}</p>
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                <LoadingCard
                  title={t('currentOnline')}
                  icon={
                    <div className="flex items-center">
                      <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse mr-2" />
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </div>
                  }
                  description={t('realtimeVisitors')}
                  className="col-span-2 sm:col-span-1"
                />

                <LoadingCard
                  title={t('totalPageviews')}
                  icon={<Eye className="h-4 w-4 text-muted-foreground" />}
                  description={getTimeRangeDescription(timeRange)}
                />

                <LoadingCard
                  title={t('totalSessions')}
                  icon={<MousePointer className="h-4 w-4 text-muted-foreground" />}
                  description={getTimeRangeDescription(timeRange)}
                />

                <LoadingCard
                  title={t('totalVisitors')}
                  icon={<Users className="h-4 w-4 text-muted-foreground" />}
                  description={getTimeRangeDescription(timeRange)}
                />

                <LoadingCard
                  title={t('averageSessionTime')}
                  icon={<Clock className="h-4 w-4 text-muted-foreground" />}
                  description={getTimeRangeDescription(timeRange)}
                />
              </>
            )}
          </div>

          {/* Debug/Test Section - only show if config exists but no data */}
          {dataSource === "error" && config && (
            <RealtimeTest config={config} />
          )}

          {/* Websites Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                {t('detailedWebsiteStats')}
              </CardTitle>
              <CardDescription className="text-sm">
                {t('sortedBy', {
                  field: getSortFieldLabel(sortField),
                  direction: t(sortDirection === 'asc' ? 'ascending' : 'descending')
                })} • {t('totalWebsites', { count: websites.length })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`transition-opacity duration-200 ${loading ? "opacity-70" : ""}`}>
                {/* Mobile Card View */}
                <div className="md:hidden space-y-3">
                  {/* Mobile Sort Controls */}
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">{t('sortBy')}:</span>
                    <div className="flex items-center gap-2">
                      <select
                        value={sortField}
                        onChange={(e) => handleSort(e.target.value as SortField)}
                        className="text-sm border rounded px-2 py-1 bg-background"
                      >
                        <option value="currentOnline">{t('currentOnline')}</option>
                        <option value="name">{t('websiteName')}</option>
                        <option value="domain">{t('websiteAddress')}</option>
                        <option value="pageviews">{t('pageviews')}</option>
                        <option value="sessions">{t('sessions')}</option>
                        <option value="visitors">{t('visitors')}</option>
                        <option value="avgSessionTime">{t('avgAccessTime')}</option>
                        <option value="bounceRate">{t('bounceRate')}</option>
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
                      {t('noWebsiteData')}
                    </div>
                  ) : websites.length === 0 && loading ? (
                    <div className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        {t('loading')}
                      </div>
                    </div>
                  ) : (
                    websites.map((website) => (
                      <Card key={website.id} className="p-4 mobile-card">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 bg-blue-500 rounded-full" />
                              {getUmamiWebsiteUrl(website.id) ? (
                                <a
                                  href={getUmamiWebsiteUrl(website.id)!}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-medium text-blue-600 hover:underline truncate"
                                  title={t('viewInUmami')}
                                >
                                  {website.name}
                                </a>
                              ) : (
                                <span className="font-medium truncate">{website.name}</span>
                              )}
                            </div>
                            <Badge
                              variant={website.currentOnline > 0 ? "default" : "secondary"}
                              className={website.currentOnline > 0 ? "bg-green-500 hover:bg-green-600" : ""}
                            >
                              {website.currentOnline} {t('online')}
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
                              <span className="text-muted-foreground">{t('pageviews')}:</span>
                              <span className="ml-1 font-mono">{formatNumber(website.pageviews)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">{t('sessions')}:</span>
                              <span className="ml-1 font-mono">{formatNumber(website.sessions)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">{t('visitors')}:</span>
                              <span className="ml-1 font-mono">{formatNumber(website.visitors)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">{t('bounceRate')}:</span>
                              <span className="ml-1 font-mono">{website.bounceRate.toFixed(1)}%</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-muted-foreground">{t('averageSessionTime')}:</span>
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
                            {t('websiteName')}
                            {getSortIcon('name')}
                          </button>
                        </TableHead>
                        <TableHead>
                          <button
                            className="flex items-center gap-1 hover:text-foreground transition-colors"
                            onClick={() => handleSort('domain')}
                          >
                            {t('websiteAddress')}
                            {getSortIcon('domain')}
                          </button>
                        </TableHead>
                        <TableHead className="text-center">
                          <button
                            className="flex items-center gap-1 hover:text-foreground transition-colors mx-auto"
                            onClick={() => handleSort('currentOnline')}
                          >
                            {t('currentOnline')}
                            {getSortIcon('currentOnline')}
                          </button>
                        </TableHead>
                        <TableHead className="text-right">
                          <button
                            className="flex items-center gap-1 hover:text-foreground transition-colors ml-auto"
                            onClick={() => handleSort('pageviews')}
                          >
                            {t('pageviews')}
                            {getSortIcon('pageviews')}
                          </button>
                        </TableHead>
                        <TableHead className="text-right">
                          <button
                            className="flex items-center gap-1 hover:text-foreground transition-colors ml-auto"
                            onClick={() => handleSort('sessions')}
                          >
                            {t('sessions')}
                            {getSortIcon('sessions')}
                          </button>
                        </TableHead>
                        <TableHead className="text-right">
                          <button
                            className="flex items-center gap-1 hover:text-foreground transition-colors ml-auto"
                            onClick={() => handleSort('visitors')}
                          >
                            {t('visitors')}
                            {getSortIcon('visitors')}
                          </button>
                        </TableHead>
                        <TableHead className="text-right">
                          <button
                            className="flex items-center gap-1 hover:text-foreground transition-colors ml-auto"
                            onClick={() => handleSort('avgSessionTime')}
                          >
                            {t('averageSessionTime')}
                            {getSortIcon('avgSessionTime')}
                          </button>
                        </TableHead>
                        <TableHead className="text-right">
                          <button
                            className="flex items-center gap-1 hover:text-foreground transition-colors ml-auto"
                            onClick={() => handleSort('bounceRate')}
                          >
                            {t('bounceRate')}
                            {getSortIcon('bounceRate')}
                          </button>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {websites.length === 0 && !loading ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            {t('noWebsiteData')}
                          </TableCell>
                        </TableRow>
                      ) : websites.length === 0 && loading ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            <div className="flex items-center justify-center">
                              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                              {t('loading')}
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        websites.map((website) => (
                          <TableRow key={website.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 bg-blue-500 rounded-full" />
                                {getUmamiWebsiteUrl(website.id) ? (
                                  <a
                                    href={getUmamiWebsiteUrl(website.id)!}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                    title={t('viewInUmami')}
                                  >
                                    {website.name}
                                  </a>
                                ) : (
                                  <span>{website.name}</span>
                                )}
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

        {/* Version Info Footer */}
        <div className="container mx-auto px-4 py-4">
          <div className="text-center space-y-1">
            <p className="text-xs text-muted-foreground">
              {formatVersionInfo()}
            </p>
            <p className="text-xs text-muted-foreground">
              {getCopyrightYears()} Umami-Dashboard
            </p>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
