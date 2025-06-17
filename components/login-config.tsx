"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, Save, TestTube } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface LoginConfig {
    serverUrl: string
    username: string
    password: string
}

interface LoginConfigProps {
    onConfigSave: (config: LoginConfig) => void
    trigger?: React.ReactNode
}

export function LoginConfigDialog({ onConfigSave, trigger }: LoginConfigProps) {
    const [config, setConfig] = useState<LoginConfig>({
        serverUrl: "",
        username: "",
        password: "",
    })
    const [isOpen, setIsOpen] = useState(false)
    const [testing, setTesting] = useState(false)
    const [saving, setSaving] = useState(false)
    const { toast } = useToast()

    useEffect(() => {
        // Load saved config from localStorage
        const saved = localStorage.getItem("umami-config")
        if (saved) {
            try {
                const parsedConfig = JSON.parse(saved)
                setConfig(parsedConfig)
            } catch (error) {
                console.error("Failed to parse saved config:", error)
            }
        }
    }, [])

    const testConnection = async () => {
        if (!config.serverUrl || !config.username || !config.password) {
            toast({
                title: "配置不完整",
                description: "请填写所有必需的字段",
                variant: "destructive",
            })
            return
        }

        setTesting(true)
        try {
            const response = await fetch("/api/umami/auth", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(config),
            })

            const result = await response.json()

            if (response.ok && result.success) {
                toast({
                    title: "连接成功",
                    description: "Umami 服务器连接测试成功",
                })
            } else {
                toast({
                    title: "连接失败",
                    description: result.message || "无法连接到 Umami 服务器",
                    variant: "destructive",
                })
            }
        } catch (error) {
            toast({
                title: "连接错误",
                description: "网络错误或服务器无响应",
                variant: "destructive",
            })
        } finally {
            setTesting(false)
        }
    }

    const handleSave = async () => {
        if (!config.serverUrl || !config.username || !config.password) {
            toast({
                title: "配置不完整",
                description: "请填写所有必需的字段",
                variant: "destructive",
            })
            return
        }

        setSaving(true)
        try {
            // Save to localStorage
            localStorage.setItem("umami-config", JSON.stringify(config))

            // Notify parent component
            onConfigSave(config)

            toast({
                title: "配置已保存",
                description: "Umami 配置已成功保存并生效",
            })

            setIsOpen(false)
        } catch (error) {
            toast({
                title: "保存失败",
                description: "无法保存配置，请重试",
                variant: "destructive",
            })
        } finally {
            setSaving(false)
        }
    }

    const handleInputChange = (field: keyof LoginConfig, value: string) => {
        setConfig((prev) => ({
            ...prev,
            [field]: value,
        }))
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        设置
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Umami 配置</DialogTitle>
                    <DialogDescription>
                        配置你的 Umami 服务器连接信息。配置将保存在本地浏览器中。
                    </DialogDescription>
                </DialogHeader>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">连接设置</CardTitle>
                        <CardDescription>
                            请输入你的 Umami 服务器地址和登录凭据
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="serverUrl">服务器地址</Label>
                            <Input
                                id="serverUrl"
                                placeholder="https://your-umami-server.com"
                                value={config.serverUrl}
                                onChange={(e) => handleInputChange("serverUrl", e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="username">用户名</Label>
                            <Input
                                id="username"
                                placeholder="admin"
                                value={config.username}
                                onChange={(e) => handleInputChange("username", e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">密码</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="密码"
                                value={config.password}
                                onChange={(e) => handleInputChange("password", e.target.value)}
                            />
                        </div>

                        <div className="flex gap-2 pt-4">
                            <Button
                                onClick={testConnection}
                                disabled={testing}
                                variant="outline"
                                className="flex-1"
                            >
                                <TestTube className="h-4 w-4 mr-2" />
                                {testing ? "测试中..." : "测试连接"}
                            </Button>

                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1"
                            >
                                <Save className="h-4 w-4 mr-2" />
                                {saving ? "保存中..." : "保存配置"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </DialogContent>
        </Dialog>
    )
} 