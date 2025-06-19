import { Locale } from './i18n'

export const translations = {
  en: {
    // 网站标题和描述
    title: 'Umami Stats Panel',
    description: 'A simple Umami data statistics aggregation panel',

    // 导航和按钮
    refresh: 'Refresh',
    refreshing: 'Refreshing...',
    refreshData: 'Refresh Data',
    settings: 'Settings',
    login: 'Login',
    logout: 'Logout',
    save: 'Save',
    saveSettings: 'Save Settings',
    saveConfiguration: 'Save Config',
    cancel: 'Cancel',
    close: 'Close',
    updating: 'Updating',
    saving: 'Saving...',
    testing: 'Testing...',
    resetting: 'Resetting...',

    // 统计数据标题
    websiteStats: 'Website Stats',
    summaryStats: 'Summary Stats',
    dataSummary: 'Data Summary',
    totalPageviews: 'Total Views',
    totalSessions: 'Total Sessions',
    totalVisitors: 'Total Visitors',
    averageSessionTime: 'Avg Session Time',
    currentOnlineUsers: 'Online Users',
    currentOnline: 'Online',
    realtimeVisitors: 'Live Visitors',

    // 表格列标题
    website: 'Website',
    websiteName: 'Name',
    websiteAddress: 'Domain',
    domain: 'Domain',
    pageviews: 'Views',
    sessions: 'Sessions',
    visitors: 'Visitors',
    avgSessionTime: 'Avg Time',
    avgAccessTime: 'Avg Time',
    bounceRate: 'Bounce Rate',

    // 状态消息
    lastUpdated: 'Updated',
    dataUpdatedSuccessfully: 'Data Updated',
    dataUpdateFailed: 'Update Failed',
    fetchingLatestData: 'Fetching Data',
    fetchingFromServer: 'Fetching latest stats from server...',
    dataFetchSuccess: 'Fetched data for {count} websites',
    dataFetchFailed: 'Data fetch failed',
    checkConfiguration: 'Please check configuration',
    networkConnectionFailed: 'Network failed, check connection',
    unableToFetchStats: 'Unable to fetch stats, check network',
    refreshIntervalUpdated: 'Refresh interval updated',
    autoRefreshSetTo: 'Auto refresh: {interval}',

    // 配置提醒相关
    configurationIncomplete: 'Config Incomplete',
    pleaseCompleteConfiguration: 'Please complete Umami server config',
    configureServerFirst: 'Please configure server first',
    autoRefreshDisabled: 'Auto refresh disabled - config incomplete',
    refreshDisabledTooltip: 'Configure server URL, username and password first',

    // 数据状态
    realtimeData: 'Live Data',
    connectionFailed: 'Failed',
    notConnected: 'Not Connected',
    notConfigured: 'Not Configured',
    online: 'Online',
    loading: 'Loading...',
    noWebsiteData: 'No website data',

    // 时间描述
    past24Hours: 'Past 24h',
    timeDataSummary: 'Past 24h summary',
    server: 'Server',

    // 时间范围选择
    timeRange: 'Time Range',
    selectTimeRange: 'Select Range',
    timeRangeUpdated: 'Range Updated',
    timeRangeSetTo: 'Range: {range}',
    last24Hours: 'Last 24h',
    today: 'Today',
    thisWeek: 'This Week',
    last7Days: 'Last 7d',
    thisMonth: 'This Month',
    last30Days: 'Last 30d',

    // Umami 链接
    viewInUmami: 'View in Umami',
    goToUmamiDashboard: 'Go to Umami',

    // 排序相关
    sortBy: 'Sort by',
    ascending: 'Asc',
    descending: 'Desc',
    sortedBy: 'Sorted by {field} {direction}',
    totalWebsites: '{count} websites',

    // 配置相关
    serverConfiguration: 'Server Config',
    umamiConfiguration: 'Umami Config',
    connectionSettings: 'Connection',
    configurationDescription: 'Configure Umami server connection. Settings saved locally.',
    connectionSettingsDescription: 'Enter your Umami server address and credentials',
    serverUrl: 'Server URL',
    serverUrlPlaceholder: 'https://your-umami-server.com',
    username: 'Username',
    usernamePlaceholder: 'admin',
    password: 'Password',
    passwordPlaceholder: 'Password',
    autoRefreshSettings: 'Auto Refresh',
    refreshInterval: 'Refresh Interval',
    refreshIntervalDescription: 'Set auto refresh interval',
    selectRefreshInterval: 'Select interval',
    refreshIntervalNote: 'Choose auto refresh interval. "Disable" turns off auto-refresh.',
    seconds: 's',
    minute: 'min',
    minutes: 'min',
    disable: 'Disable',
    disableAutoRefresh: 'Disable Auto Refresh',

    // 连接测试相关
    testConnection: 'Test Connection',
    connectionSuccessful: 'Connected',
    connectionSuccessfulDescription: 'Umami server connection successful',
    connectionSuccessDescription: 'Connected to Umami server',
    connectionFailedDescription: 'Failed to connect to Umami server',
    connectionError: 'Connection Error',
    connectionErrorDescription: 'Network error or server not responding',
    incompleteConfiguration: 'Incomplete Config',
    fillAllFields: 'Please fill all required fields',

    // 保存和重置相关
    configurationSaved: 'Config Saved',
    configurationSavedDescription: 'Umami config saved and active',
    saveFailed: 'Save Failed',
    saveFailedDescription: 'Unable to save config, try again',
    configurationReset: 'Config Reset',
    configurationResetFromEnv: 'Config read from environment variables',
    configurationResetEmpty: 'No env variables, fields cleared',
    resetFailed: 'Reset Failed',
    resetFailedDescription: 'Unable to reset config, try again',
    resetTooltip: 'Read config from env variables, or clear all fields',

    // 实时测试相关
    realtimeDataTest: 'Live Data Test',
    realtimeDataTestDescription: 'Test live visitor data for specific website',
    configureUmamiFirst: 'Configure Umami connection first',
    selectWebsite: 'Select Website',
    selectWebsiteToTest: 'Select website to test',
    websiteIdManualInput: 'Website ID (Manual)',
    enterWebsiteId: 'Enter website ID (e.g., 2-cgs)',
    testRealtimeData: 'Test Live Data',
    testResults: 'Results:',
    websiteId: 'Website ID:',
    currentOnlineVisitors: 'Online Visitors:',
    error: 'Error:',
    apiEndpointTest: 'API Endpoint Test:',
    debugInfo: 'Debug Info:',

    // 语言设置
    languageSettings: 'Language',
    language: 'Language',
    english: 'English',
    chinese: '简体中文',
    selectLanguage: 'Select Language',

    // 时间相关
    justNow: 'Just now',
    secondsAgo: '{seconds}s ago',
    minuteAgo: '1m ago',
    minutesAgo: '{minutes}m ago',
    hourAgo: '1h ago',
    hoursAgo: '{hours}h ago',
    dayAgo: '1d ago',
    daysAgo: '{days}d ago',

    // 错误和警告
    noDataAvailable: 'No data',
    errorOccurred: 'Error occurred',
    retryLater: 'Try again later',

    // 实时测试
    realtimeTest: 'Live Test',
    connectionStatus: 'Status',
    connected: 'Connected',
    disconnected: 'Disconnected',

    // 图表和历史数据
    historyChart: 'History',
    trend: 'Trend',

    // 版权信息
    copyright: 'Copyright',
    allRightsReserved: 'All rights reserved',
    version: 'Version',

    // 详细统计
    detailedWebsiteStats: 'Website Details',

    // 分页控件
    showingItems: 'Showing {start} to {end} of {total} results',
    itemsPerPage: 'Per page:',
    items: 'items',
    noMatchingResults: 'No matching results found',
    searchPlaceholder: 'Search by name or domain...',
    searchButton: 'Search',
  },
  zh: {
    // 网站标题和描述
    title: 'Umami 统计面板',
    description: '一个简单的 Umami 数据统计汇聚面板',

    // 导航和按钮
    refresh: '刷新',
    refreshing: '刷新中...',
    refreshData: '刷新数据',
    settings: '设置',
    login: '登录',
    logout: '登出',
    save: '保存',
    saveSettings: '保存设置',
    saveConfiguration: '保存配置',
    cancel: '取消',
    close: '关闭',
    updating: '更新中',
    saving: '保存中...',
    testing: '测试中...',
    resetting: '重置中...',

    // 统计数据标题
    websiteStats: '网站统计',
    summaryStats: '汇总统计',
    dataSummary: '数据汇总',
    totalPageviews: '总页面浏览量',
    totalSessions: '总会话数',
    totalVisitors: '总访客数',
    averageSessionTime: '平均会话时长',
    currentOnlineUsers: '当前在线用户',
    currentOnline: '当前在线',
    realtimeVisitors: '实时访客',

    // 表格列标题
    website: '网站',
    websiteName: '网站名称',
    websiteAddress: '网站地址',
    domain: '域名',
    pageviews: '页面浏览量',
    sessions: '会话数',
    visitors: '访客数',
    avgSessionTime: '平均会话时长',
    avgAccessTime: '访问时间',
    bounceRate: '跳出率',

    // 状态消息
    lastUpdated: '最后更新',
    dataUpdatedSuccessfully: '数据更新成功',
    dataUpdateFailed: '数据更新失败',
    fetchingLatestData: '正在获取最新数据',
    fetchingFromServer: '正在从服务器获取最新统计数据...',
    dataFetchSuccess: '成功获取 {count} 个网站的实时数据',
    dataFetchFailed: '数据获取失败',
    checkConfiguration: '请检查配置信息',
    networkConnectionFailed: '网络连接失败，请检查网络连接',
    unableToFetchStats: '无法获取统计数据，请检查网络连接',
    refreshIntervalUpdated: '刷新间隔已更新',
    autoRefreshSetTo: '自动刷新已设置为: {interval}',

    // 配置提醒相关
    configurationIncomplete: '配置不完整',
    pleaseCompleteConfiguration: '请先完善 Umami 服务器配置',
    configureServerFirst: '请先完善服务器设置',
    autoRefreshDisabled: '自动刷新已禁用 - 配置不完整',
    refreshDisabledTooltip: '请先配置服务器地址、用户名和密码',

    // 数据状态
    realtimeData: '实时数据',
    connectionFailed: '连接失败',
    notConnected: '未连接',
    notConfigured: '未配置',
    online: '在线',
    loading: '加载中...',
    noWebsiteData: '暂无网站数据',

    // 时间描述
    past24Hours: '过去 24 小时',
    timeDataSummary: '过去 24 小时数据汇总',
    server: '服务器',

    // 时间范围选择
    timeRange: '时间范围',
    selectTimeRange: '选择时间范围',
    timeRangeUpdated: '时间范围已更新',
    timeRangeSetTo: '时间范围已设置为: {range}',
    last24Hours: '过去 24 小时',
    today: '今天',
    thisWeek: '本周',
    last7Days: '过去 7 天',
    thisMonth: '本月',
    last30Days: '过去 30 天',

    // Umami 链接
    viewInUmami: '在 Umami 中查看',
    goToUmamiDashboard: '前往 Umami 控制面板',

    // 排序相关
    sortBy: '排序方式',
    ascending: '升序',
    descending: '降序',
    sortedBy: '按{field}{direction}排列',
    totalWebsites: '共 {count} 个网站',

    // 配置相关
    serverConfiguration: '服务器配置',
    umamiConfiguration: 'Umami 配置',
    connectionSettings: '连接设置',
    configurationDescription: '配置你的 Umami 服务器连接信息。配置将保存在本地浏览器中。',
    connectionSettingsDescription: '请输入你的 Umami 服务器地址和登录凭据',
    serverUrl: '服务器地址',
    serverUrlPlaceholder: 'https://your-umami-server.com',
    username: '用户名',
    usernamePlaceholder: 'admin',
    password: '密码',
    passwordPlaceholder: '密码',
    autoRefreshSettings: '自动刷新设置',
    refreshInterval: '刷新间隔',
    refreshIntervalDescription: '设置面板数据的自动刷新间隔时间',
    selectRefreshInterval: '选择刷新间隔',
    refreshIntervalNote: '选择数据自动刷新的时间间隔，设置为"禁用"将关闭自动刷新',
    seconds: '秒',
    minute: '分钟',
    minutes: '分钟',
    disable: '禁用',
    disableAutoRefresh: '禁用自动刷新',

    // 连接测试相关
    testConnection: '测试连接',
    connectionSuccessful: '连接成功',
    connectionSuccessfulDescription: 'Umami 服务器连接测试成功',
    connectionSuccessDescription: '成功连接到 Umami 服务器',
    connectionFailedDescription: '无法连接到 Umami 服务器',
    connectionError: '连接错误',
    connectionErrorDescription: '网络错误或服务器无响应',
    incompleteConfiguration: '配置不完整',
    fillAllFields: '请填写所有必需的字段',

    // 保存和重置相关
    configurationSaved: '配置已保存',
    configurationSavedDescription: 'Umami 配置已成功保存并生效',
    saveFailed: '保存失败',
    saveFailedDescription: '无法保存配置，请重试',
    configurationReset: '配置已重置',
    configurationResetFromEnv: '已从环境变量读取原始配置信息',
    configurationResetEmpty: '环境变量未配置，已清空所有字段',
    resetFailed: '重置失败',
    resetFailedDescription: '无法重置配置，请重试',
    resetTooltip: '尝试从环境变量读取原始的配置信息，若不存在将置空所有字段',

    // 实时测试相关
    realtimeDataTest: '实时数据测试',
    realtimeDataTestDescription: '测试特定网站的实时访客数据获取',
    configureUmamiFirst: '请先配置 Umami 连接信息',
    selectWebsite: '选择网站',
    selectWebsiteToTest: '选择要测试的网站',
    websiteIdManualInput: '网站 ID（手动输入）',
    enterWebsiteId: '输入网站 ID（如：2-cgs）',
    testRealtimeData: '测试实时数据',
    testResults: '测试结果:',
    websiteId: '网站 ID:',
    currentOnlineVisitors: '在线访客:',
    error: '错误:',
    apiEndpointTest: 'API 端点测试:',
    debugInfo: '调试信息:',

    // 语言设置
    languageSettings: '语言设置',
    language: '语言',
    english: 'English',
    chinese: '简体中文',
    selectLanguage: '选择语言',

    // 时间相关
    justNow: '刚刚',
    secondsAgo: '{seconds} 秒前',
    minuteAgo: '1 分钟前',
    minutesAgo: '{minutes} 分钟前',
    hourAgo: '1 小时前',
    hoursAgo: '{hours} 小时前',
    dayAgo: '1 天前',
    daysAgo: '{days} 天前',

    // 错误和警告
    noDataAvailable: '暂无数据',
    errorOccurred: '发生错误',
    retryLater: '请稍后重试',

    // 实时测试
    realtimeTest: '实时测试',
    connectionStatus: '连接状态',
    connected: '已连接',
    disconnected: '已断开',

    // 图表和历史数据
    historyChart: '历史图表',
    trend: '趋势',

    // 版权信息
    copyright: '版权所有',
    allRightsReserved: '保留所有权利',
    version: '版本',

    // 详细统计
    detailedWebsiteStats: '网站详细统计',

    // 分页控件
    showingItems: '显示 {start} 到 {end} 项，共 {total} 个结果',
    itemsPerPage: '每页显示:',
    items: '条',
    noMatchingResults: '没有找到匹配的结果',
    searchPlaceholder: '搜索网站名称或域名...',
    searchButton: '搜索',
  }
}

export type TranslationKey = keyof typeof translations.en

export function getTranslation(locale: Locale, key: TranslationKey, params?: Record<string, string | number>): string {
  let text = translations[locale][key] || translations.en[key] || key

  if (params) {
    Object.entries(params).forEach(([param, value]) => {
      text = text.replace(`{${param}}`, String(value))
    })
  }

  return text
} 