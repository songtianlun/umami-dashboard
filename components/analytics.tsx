export default function Analytics() {
  // 在服务端运行时读取环境变量（去掉 NEXT_PUBLIC_ 前缀）
  const analyticsUrl = process.env.UMAMI_ANALYTICS_URL || process.env.NEXT_PUBLIC_UMAMI_ANALYTICS_URL
  const websiteId = process.env.UMAMI_WEBSITE_ID || process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID

  // 开发环境下打印调试信息
  if (process.env.NODE_ENV === 'development') {
    console.log('Analytics Environment Variables:', {
      analyticsUrl,
      websiteId,
      isServer: typeof window === 'undefined',
      allEnv: Object.keys(process.env).filter(key => key.includes('UMAMI'))
    })
  }

  if (!analyticsUrl || !websiteId) {
    return null
  }

  // 直接生成脚本标签的 HTML
  const scriptHTML = `<script defer src="${analyticsUrl}" data-website-id="${websiteId}"></script>`

  return (
    <div dangerouslySetInnerHTML={{ __html: scriptHTML }} />
  )
}