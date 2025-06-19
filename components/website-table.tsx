import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { RefreshCw, Globe, Search, X, ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { useI18n } from "@/components/i18n-provider"

interface WebsiteStats {
  id: string
  name: string
  domain: string
  url: string
  pageviews: number
  sessions: number
  visitors: number
  avgSessionTime: number
  currentOnline: number
  bounceRate: number
}

type SortField = keyof WebsiteStats
type SortDirection = 'asc' | 'desc'

interface WebsiteTableProps {
  websites: WebsiteStats[]
  loading: boolean
  getUmamiWebsiteUrl?: (websiteId: string) => string | null
  formatNumber: (num: number) => string
  formatTime: (seconds: number) => string
}

export function WebsiteTable({ 
  websites, 
  loading, 
  getUmamiWebsiteUrl, 
  formatNumber, 
  formatTime 
}: WebsiteTableProps) {
  const { t } = useI18n()
  
  // 搜索状态
  const [searchTerm, setSearchTerm] = useState('')
  const [localSearchTerm, setLocalSearchTerm] = useState('')
  
  // 排序状态
  const [sortField, setSortField] = useState<SortField>('currentOnline')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  
  // 分页状态 - 从localStorage加载页面大小
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('website-table-page-size')
      return saved ? parseInt(saved) : 20
    }
    return 20
  })
  
  // 过滤和排序数据
  const filteredAndSortedWebsites = useMemo(() => {
    let filtered = websites
    
    // 搜索过滤
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      filtered = websites.filter(website => 
        website.name.toLowerCase().includes(term) ||
        website.domain.toLowerCase().includes(term)
      )
    }
    
    // 排序
    const sorted = [...filtered].sort((a, b) => {
      let aValue = a[sortField]
      let bValue = b[sortField]
      
      // 处理字符串字段
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
    
    return sorted
  }, [websites, searchTerm, sortField, sortDirection])
  
  // 分页数据
  const paginatedWebsites = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredAndSortedWebsites.slice(startIndex, endIndex)
  }, [filteredAndSortedWebsites, currentPage, pageSize])
  
  // 分页信息
  const totalPages = Math.ceil(filteredAndSortedWebsites.length / pageSize)
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, filteredAndSortedWebsites.length)
  
  // 处理搜索
  const handleSearch = () => {
    setSearchTerm(localSearchTerm)
    setCurrentPage(1) // 搜索后重置到第一页
  }
  
  const handleSearchClear = () => {
    setLocalSearchTerm('')
    setSearchTerm('')
    setCurrentPage(1)
  }
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }
  
  // 处理排序
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
    setCurrentPage(1) // 排序后重置到第一页
  }
  
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronsUpDown className="h-4 w-4 opacity-50" />
    }
    return sortDirection === 'asc' ?
      <ChevronUp className="h-4 w-4" /> :
      <ChevronDown className="h-4 w-4" />
  }
  
  // 处理分页
  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }
  
  const handlePageSizeChange = (size: string) => {
    const newSize = parseInt(size)
    setPageSize(newSize)
    setCurrentPage(1) // 改变页面大小后重置到第一页
    
    // 保存到localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('website-table-page-size', size)
    }
  }
  
  // 获取排序字段标签
  const getSortFieldLabel = (field: SortField) => {
    const labels: Record<SortField, string> = {
      id: 'ID',
      name: t('websiteName'),
      domain: t('websiteAddress'),
      url: 'URL',
      currentOnline: t('currentOnline'),
      pageviews: t('pageviews'),
      sessions: t('sessions'),
      visitors: t('visitors'),
      avgSessionTime: t('avgAccessTime'),
      bounceRate: t('bounceRate')
    }
    return labels[field] || field
  }

  return (
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
          })} • {t('totalWebsites', { count: filteredAndSortedWebsites.length })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* 搜索和控制栏 */}
        <div className="flex flex-col gap-4 mb-6">
          {/* 搜索框 */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchPlaceholder')}
                value={localSearchTerm}
                onChange={(e) => setLocalSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                className="pl-9 pr-9"
              />
              {localSearchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSearchClear}
                  disabled={loading}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={loading}
              variant="outline"
              className="w-full sm:w-auto"
            >
              {t('searchButton')}
            </Button>
          </div>

          {/* 排序控件 */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
            <Label className="text-sm whitespace-nowrap">{t('sortBy')}:</Label>
            <div className="flex items-center gap-2 flex-1 sm:flex-initial">
              <Select
                value={sortField}
                onValueChange={(value: SortField) => handleSort(value)}
                disabled={loading}
              >
                <SelectTrigger className="flex-1 sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">{t('websiteName')}</SelectItem>
                  <SelectItem value="domain">{t('websiteAddress')}</SelectItem>
                  <SelectItem value="currentOnline">{t('currentOnline')}</SelectItem>
                  <SelectItem value="pageviews">{t('pageviews')}</SelectItem>
                  <SelectItem value="sessions">{t('sessions')}</SelectItem>
                  <SelectItem value="visitors">{t('visitors')}</SelectItem>
                  <SelectItem value="avgSessionTime">{t('avgAccessTime')}</SelectItem>
                  <SelectItem value="bounceRate">{t('bounceRate')}</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                disabled={loading}
                className="px-3 min-w-[44px]"
              >
                {sortDirection === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>
        </div>

        <div className={`transition-opacity duration-200 ${loading ? "opacity-70" : ""}`}>
          {/* 移动端卡片视图 */}
          <div className="md:hidden space-y-3">
            {paginatedWebsites.length === 0 && !loading ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? '没有找到匹配的结果' : t('noWebsiteData')}
              </div>
            ) : paginatedWebsites.length === 0 && loading ? (
              <div className="text-center py-8">
                <div className="flex items-center justify-center">
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  {t('loading')}
                </div>
              </div>
            ) : (
              paginatedWebsites.map((website) => (
                <Card key={website.id} className="p-3 sm:p-4 mobile-card">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0" />
                        {getUmamiWebsiteUrl && getUmamiWebsiteUrl(website.id) ? (
                          <a
                            href={getUmamiWebsiteUrl(website.id)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-blue-600 hover:underline truncate text-sm"
                            title={t('viewInUmami')}
                          >
                            {website.name}
                          </a>
                        ) : (
                          <span className="font-medium truncate text-sm">{website.name}</span>
                        )}
                      </div>
                      <Badge
                        variant={website.currentOnline > 0 ? "default" : "secondary"}
                        className={`text-xs flex-shrink-0 ${website.currentOnline > 0 ? "bg-green-500 hover:bg-green-600" : ""}`}
                      >
                        {website.currentOnline} {t('online')}
                      </Badge>
                    </div>
                    <div>
                      <a
                        href={website.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-xs break-all"
                      >
                        {website.domain}
                      </a>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('pageviews')}:</span>
                        <span className="font-mono">{formatNumber(website.pageviews)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('sessions')}:</span>
                        <span className="font-mono">{formatNumber(website.sessions)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('visitors')}:</span>
                        <span className="font-mono">{formatNumber(website.visitors)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('bounceRate')}:</span>
                        <span className="font-mono">{website.bounceRate.toFixed(1)}%</span>
                      </div>
                      <div className="col-span-2 flex justify-between">
                        <span className="text-muted-foreground">{t('averageSessionTime')}:</span>
                        <span className="font-mono">{formatTime(website.avgSessionTime)}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* 桌面端表格视图 */}
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
                      {t('avgAccessTime')}
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
                {paginatedWebsites.length === 0 && !loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? t('noMatchingResults') : t('noWebsiteData')}
                    </TableCell>
                  </TableRow>
                ) : paginatedWebsites.length === 0 && loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        {t('loading')}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedWebsites.map((website) => (
                    <TableRow key={website.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 bg-blue-500 rounded-full" />
                          {getUmamiWebsiteUrl && getUmamiWebsiteUrl(website.id) ? (
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

        {/* 分页控件和页面大小设置 */}
        {filteredAndSortedWebsites.length > 0 && (
          <div className="flex flex-col gap-4 mt-6">
            {/* 信息和页面大小控件 */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs sm:text-sm text-muted-foreground">
                {t('showingItems', { 
                  start: startItem, 
                  end: endItem, 
                  total: filteredAndSortedWebsites.length 
                })}
              </div>
              
              {/* 页面大小选择器 */}
              <div className="flex items-center gap-2">
                <Label className="text-xs sm:text-sm whitespace-nowrap">{t('itemsPerPage')}</Label>
                <Select
                  value={pageSize.toString()}
                  onValueChange={handlePageSizeChange}
                  disabled={loading}
                >
                  <SelectTrigger className="w-16 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-xs sm:text-sm text-muted-foreground">{t('items')}</span>
              </div>
            </div>
            
            {/* 分页按钮 - 只在有多页时显示 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center">
                <div className="flex items-center gap-1 sm:gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1 || loading}
                    className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                  >
                    <ChevronsLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                  >
                    <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {/* 显示页码按钮 */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNumber}
                          variant={currentPage === pageNumber ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNumber)}
                          disabled={loading}
                          className="h-8 w-8 p-0 text-xs sm:h-9 sm:w-9 sm:text-sm"
                        >
                          {pageNumber}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || loading}
                    className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                  >
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages || loading}
                    className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                  >
                    <ChevronsRight className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 