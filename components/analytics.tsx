import Script from 'next/script'

export default function Analytics() {
  // 读取环境变量中的统计脚本配置
  const analyticsUrl = process.env.NEXT_PUBLIC_UMAMI_ANALYTICS_URL
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID

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