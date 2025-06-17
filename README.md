# Umami Dashboard

[English](README.md) | [中文](README.cn.md)

A modern Umami analytics dashboard providing real-time website traffic statistics and monitoring capabilities.

## Features

- 🚀 Real-time traffic monitoring
- 📊 Multi-website statistics aggregation
- 📈 Historical data chart visualization
- ⚙️ Flexible configuration management
- 🔄 Auto-refresh settings
- 💾 Local data storage
- 🌍 Environment variable support

## Quick Start

Start with Docker in one command:

```bash
docker run -p 3000:3000 songtianlun/umami-dashboard:latest
```

Then visit [http://localhost:3000](http://localhost:3000) to start using the dashboard.

## Environment Variable Configuration

For better deployment experience, this application supports pre-setting configuration through environment variables. Configuration priority is as follows:

1. **Browser Local Storage**: First reads user-saved configuration from localStorage
2. **Environment Variables**: If no local storage configuration exists, reads from environment variables

### Supported Environment Variables

| Environment Variable | Description | Example Value |
|---------------------|-------------|---------------|
| `UMAMI_SERVER_URL` | Umami server address | `https://analytics.yoursite.com` |
| `UMAMI_USERNAME` | Umami login username | `admin` |
| `UMAMI_PASSWORD` | Umami login password | `your-password` |

### Environment Variable Usage Examples

#### Docker Deployment
```bash
docker run -d \
  -p 3000:3000 \
  -e UMAMI_SERVER_URL=https://analytics.yoursite.com \
  -e UMAMI_USERNAME=admin \
  -e UMAMI_PASSWORD=your-password \
  songtianlun/umami-dashboard:latest
```

#### Docker Compose
```yaml
version: '3.8'
services:
  umami-dashboard:
    image: songtianlun/umami-dashboard:latest
    ports:
      - "3000:3000"
    environment:
      - UMAMI_SERVER_URL=https://analytics.yoursite.com
      - UMAMI_USERNAME=admin
      - UMAMI_PASSWORD=your-password
```

#### Vercel Deployment
Add environment variables in Vercel project settings:
- `UMAMI_SERVER_URL`
- `UMAMI_USERNAME`  
- `UMAMI_PASSWORD`

#### Local Development
Create `.env.local` file:
```bash
UMAMI_SERVER_URL=https://analytics.yoursite.com
UMAMI_USERNAME=admin
UMAMI_PASSWORD=your-password
```

## Development Environment Setup

### 1. Install Dependencies
```bash
npm install
# or
pnpm install
# or
yarn install
```

### 2. Configure Environment Variables (Optional)
Create `.env.local` file and add your Umami server configuration.

### 3. Start Development Server
```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

### 4. Open Browser
Visit [http://localhost:3000](http://localhost:3000) to view the application.

## Configuration Management

### First-time Setup
1. Click the "Settings" button in the top right corner
2. Fill in your Umami server information:
   - Server address (e.g., https://analytics.yoursite.com)
   - Username
   - Password
3. Click "Test Connection" to verify configuration
4. Click "Save Configuration" to complete setup

### Configuration Reset
- Click the reset button (🔄) in the settings dialog
- System will clear locally saved configuration
- If environment variables are set, it will automatically read from environment variables
- If no environment variables exist, all fields will be cleared

### Configuration Priority
1. **User Manual Configuration**: User-saved configuration in settings interface has highest priority
2. **Environment Variable Configuration**: Automatically reads environment variables when no user configuration exists
3. **Empty Configuration**: If none of the above exist, fields remain empty

## Tech Stack

- **Frontend Framework**: Next.js 14 (App Router)
- **UI Components**: Shadcn/ui + Tailwind CSS
- **Chart Library**: Recharts
- **State Management**: React Hooks
- **Data Storage**: LocalStorage + Session History
- **Type Support**: TypeScript

## Deployment Recommendations

### Production Environment Deployment
1. Use environment variables to set default configuration
2. Recommend setting read-only default configuration, allowing users to override as needed
3. Regularly backup user configuration data

### Security Considerations
- Please securely manage password information in environment variables
- Recommend creating dedicated Umami accounts for Dashboard
- Use HTTPS in production environments

## Development Guide

### Project Structure
```
├── app/                    # Next.js App Router
│   ├── api/umami/         # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/            # React components
│   ├── ui/               # UI base components
│   ├── login-config.tsx  # Login configuration component
│   └── ...
├── hooks/                # Custom Hooks
├── lib/                  # Utility functions
└── styles/               # Style files
```

### Adding New Features
1. Create new components in `components/` directory
2. Add API routes under `app/api/umami/`
3. Update main page to integrate new features

## License

MIT License

## Contributing

Issues and Pull Requests are welcome! 