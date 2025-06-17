import { headers } from 'next/headers'

export default function Analytics() {
  // 强制这个组件在服务端执行（通过使用 headers()）
  headers() // 这个调用确保组件只在服务端执行
  
  // Umami 配置
  const umamiUrl = process.env.UMAMI_ANALYTICS_URL || process.env.NEXT_PUBLIC_UMAMI_ANALYTICS_URL
  const umamiWebsiteId = process.env.UMAMI_WEBSITE_ID || process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID
  
  // Rybbit 配置
  const rybbitUrl = process.env.RYBBIT_ANALYTICS_URL || process.env.NEXT_PUBLIC_RYBBIT_ANALYTICS_URL
  const rybbitSiteId = process.env.RYBBIT_SITE_ID || process.env.NEXT_PUBLIC_RYBBIT_SITE_ID

  const scripts = []
  const loadedServices = []

  // 添加 Umami 脚本
  if (umamiUrl && umamiWebsiteId) {
    scripts.push(`<script defer src="${umamiUrl}" data-website-id="${umamiWebsiteId}"></script>`)
    loadedServices.push('Umami')
  }

  // 添加 Rybbit 脚本
  if (rybbitUrl && rybbitSiteId) {
    scripts.push(`<script defer src="${rybbitUrl}" data-site-id="${rybbitSiteId}"></script>`)
    loadedServices.push('Rybbit')
  }

  // 开发环境下显示加载的统计服务
  if (process.env.NODE_ENV === 'development') {
    console.log('Analytics services loaded:', loadedServices.length > 0 ? loadedServices.join(', ') : 'None')
  }

  if (scripts.length === 0) {
    return null
  }

  // 合并所有脚本
  const allScriptsHTML = scripts.join('\n')

  return (
    <div dangerouslySetInnerHTML={{ __html: allScriptsHTML }} />
  )
}