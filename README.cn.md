# Umami Dashboard

[English](README.md) | [中文](README.cn.md)

一个现代化的 Umami 统计数据看板，提供实时的网站流量统计和监控功能。

## 功能特性

- 🚀 实时流量监控
- 📊 多网站统计数据聚合
- 📈 历史数据图表展示
- ⚙️ 灵活的配置管理
- 🔄 自动刷新设置
- 💾 本地数据存储
- 🌍 环境变量支持

## 快速开始

使用 Docker 一键启动：

```bash
docker run -p 3000:3000 songtianlun/umami-dashboard:latest
```

然后访问 [http://localhost:3000](http://localhost:3000) 即可开始使用。

## 支持的架构

Docker 镜像支持多种架构，实现最大兼容性：

| 架构 | 状态 | 示例设备 |
|------|------|---------|
| `linux/amd64` | ✅ | Intel/AMD 64位服务器、大多数PC |
| `linux/arm64` | ✅ | Apple Silicon (M1/M2/M3)、AWS Graviton、树莓派 4/5 (64位) |
| `linux/arm/v7` | ✅ | 树莓派 2/3、ARM 32位设备 |

Docker 会自动拉取适合你平台的正确镜像。你可以验证架构支持：

```bash
docker manifest inspect songtianlun/umami-dashboard:latest | grep architecture
```

## 环境变量配置

为了更好的部署体验，本应用支持通过环境变量预设配置信息。配置获取优先级如下：

1. **浏览器本地存储**：首先从 localStorage 读取用户保存的配置
2. **环境变量**：如果本地存储没有配置，则从环境变量读取

### 支持的环境变量

| 环境变量名 | 描述 | 示例值 |
|----------|------|--------|
| `UMAMI_SERVER_URL` | Umami 服务器地址 | `https://analytics.yoursite.com` |
| `UMAMI_USERNAME` | Umami 登录用户名 | `admin` |
| `UMAMI_PASSWORD` | Umami 登录密码 | `your-password` |
| `NEXT_PUBLIC_UMAMI_ANALYTICS_URL` | Umami 统计脚本 URL | `https://umami.xxx.com/script.js` |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | Umami 网站 ID | `xxxx` |

### 环境变量使用示例

#### Docker 部署
```bash
docker run -d \
  -p 3000:3000 \
  -e UMAMI_SERVER_URL=https://analytics.yoursite.com \
  -e UMAMI_USERNAME=admin \
  -e UMAMI_PASSWORD=your-password \
  umami-dashboard
```

#### Docker Compose
```yaml
version: '3.8'
services:
  umami-dashboard:
    build: .
    ports:
      - "3000:3000"
    environment:
      - UMAMI_SERVER_URL=https://analytics.yoursite.com
      - UMAMI_USERNAME=admin
      - UMAMI_PASSWORD=your-password
```

#### Vercel 部署
在 Vercel 项目设置中添加环境变量：
- `UMAMI_SERVER_URL`
- `UMAMI_USERNAME`  
- `UMAMI_PASSWORD`

#### 本地开发
创建 `.env.local` 文件：
```bash
UMAMI_SERVER_URL=https://analytics.yoursite.com
UMAMI_USERNAME=admin
UMAMI_PASSWORD=your-password

# Umami 统计脚本配置（选择一种方法）
# 方法一：完整脚本标签（推荐）
NEXT_PUBLIC_ANALYTICS_SCRIPT='<script defer src="https://umami.frytea.com/script.js" data-website-id="f7438333-3487-4446-bdb9-c47b35016ccf"></script>'

# 方法二：分别配置（如果使用方法一则注释掉以下两行）
# NEXT_PUBLIC_UMAMI_ANALYTICS_URL=https://umami.frytea.com/script.js
# NEXT_PUBLIC_UMAMI_WEBSITE_ID=f7438333-3487-4446-bdb9-c47b35016ccf
```

## 开发环境启动

### 1. 安装依赖
```bash
npm install
# 或
pnpm install
# 或
yarn install
```

### 2. 配置环境变量（可选）
创建 `.env.local` 文件并添加你的 Umami 服务器配置。

### 3. 启动开发服务器
```bash
npm run dev
# 或
pnpm dev
# 或
yarn dev
```

### 4. 打开浏览器
访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 配置管理

### 首次使用
1. 点击右上角的"设置"按钮
2. 填入你的 Umami 服务器信息：
   - 服务器地址（如：https://analytics.yoursite.com）
   - 用户名
   - 密码
3. 点击"测试连接"验证配置
4. 点击"保存配置"完成设置

### 配置重置
- 点击设置对话框中的重置按钮（🔄）
- 系统会清除本地保存的配置
- 如果设置了环境变量，会自动读取环境变量中的配置
- 如果没有环境变量，所有字段将被清空

### 配置优先级
1. **用户手动配置**：用户在设置界面保存的配置具有最高优先级
2. **环境变量配置**：当没有用户配置时，自动读取环境变量
3. **空配置**：如果以上都没有，字段保持为空

## 技术栈

- **前端框架**：Next.js 14 (App Router)
- **UI 组件**：Shadcn/ui + Tailwind CSS
- **图表库**：Recharts
- **状态管理**：React Hooks
- **数据存储**：LocalStorage + Session History
- **类型支持**：TypeScript

## 部署建议

### 生产环境部署
1. 使用环境变量设置默认配置
2. 建议设置只读的默认配置，让用户根据需要覆盖
3. 定期备份用户配置数据

### 安全考虑
- 环境变量中的密码信息请妥善保管
- 建议为 Dashboard 创建专用的 Umami 账号
- 在生产环境中使用 HTTPS

## 开发指南

### 项目结构
```
├── app/                    # Next.js App Router
│   ├── api/umami/         # API 路由
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 主页面
├── components/            # React 组件
│   ├── ui/               # UI 基础组件
│   ├── login-config.tsx  # 登录配置组件
│   └── ...
├── hooks/                # 自定义 Hooks
├── lib/                  # 工具函数
└── styles/               # 样式文件
```

### 添加新功能
1. 在 `components/` 目录下创建新组件
2. 在 `app/api/umami/` 下添加 API 路由
3. 更新主页面集成新功能

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！ 