import { NextRequest, NextResponse } from "next/server"

interface LoginConfig {
    serverUrl: string
    username: string
    password: string
}

export async function POST(request: NextRequest) {
    try {
        const config: LoginConfig = await request.json()
        const { serverUrl, username, password } = config

        if (!serverUrl || !username || !password) {
            return NextResponse.json(
                { success: false, message: "缺少必需的配置参数" },
                { status: 400 }
            )
        }

        // Clean server URL
        const cleanUrl = serverUrl.replace(/\/$/, "")

        // Try to authenticate with Umami API
        const authResponse = await fetch(`${cleanUrl}/api/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username,
                password,
            }),
        })

        if (!authResponse.ok) {
            const errorText = await authResponse.text()
            console.error("Auth failed:", authResponse.status, errorText)

            return NextResponse.json(
                {
                    success: false,
                    message: authResponse.status === 401
                        ? "用户名或密码错误"
                        : `服务器响应错误: ${authResponse.status}`
                },
                { status: authResponse.status }
            )
        }

        const authData = await authResponse.json()

        if (authData.token) {
            return NextResponse.json({
                success: true,
                message: "连接成功",
                token: authData.token,
            })
        } else {
            return NextResponse.json(
                { success: false, message: "认证失败，未获取到访问令牌" },
                { status: 401 }
            )
        }
    } catch (error) {
        console.error("Auth error:", error)

        if (error instanceof TypeError && error.message.includes("fetch")) {
            return NextResponse.json(
                { success: false, message: "无法连接到服务器，请检查服务器地址是否正确" },
                { status: 500 }
            )
        }

        return NextResponse.json(
            { success: false, message: "内部服务器错误" },
            { status: 500 }
        )
    }
} 