'use client'

import Script from 'next/script'

export default function Analytics() {
  // 读取环境变量中的统计脚本配置
  const analyticsScript = process.env.NEXT_PUBLIC_ANALYTICS_SCRIPT
  const analyticsUrl = process.env.NEXT_PUBLIC_UMAMI_ANALYTICS_URL
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID

  // 如果有完整的脚本配置，使用它
  if (analyticsScript) {
    // 解析脚本标签并提取属性
    const scriptMatch = analyticsScript.match(/<script[^>]*src="([^"]*)"[^>]*data-website-id="([^"]*)"[^>]*><\/script>/)
    if (scriptMatch) {
      const [, src, dataWebsiteId] = scriptMatch
      return (
        <Script
          src={src}
          data-website-id={dataWebsiteId}
          strategy="afterInteractive"
          defer
        />
      )
    }
  }

  // 如果有分别配置的URL和网站ID，使用它们
  if (analyticsUrl && websiteId) {
    return (
      <Script
        src={analyticsUrl}
        data-website-id={websiteId}
        strategy="afterInteractive"
        defer
      />
    )
  }

  // 没有配置则不渲染任何内容
  return null
} 