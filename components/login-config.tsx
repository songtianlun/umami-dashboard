"use client"

import { useState, useEffect, forwardRef, useImperativeHandle } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, Save, TestTube, RotateCcw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useI18n } from "./i18n-provider"

interface LoginConfig {
    serverUrl: string
    username: string
    password: string
    serverAlias?: string
}

interface LoginConfigProps {
    onConfigSave: (config: LoginConfig) => void
    trigger?: React.ReactNode
}

export interface LoginConfigDialogRef {
    openDialog: () => void
}

// 从环境变量获取配置的函数
const getConfigFromEnv = async (): Promise<Partial<LoginConfig>> => {
    try {
        const response = await fetch("/api/umami/config")
        if (response.ok) {
            const envConfig = await response.json()
            return {
                serverUrl: envConfig.serverUrl || "",
                username: envConfig.username || "",
                password: envConfig.password || "",
                serverAlias: envConfig.serverAlias || "",
            }
        }
    } catch (error) {
        console.error("Failed to fetch config from environment:", error)
    }
    return {}
}

// 获取完整配置的函数（优先localStorage，后备环境变量）
const getFullConfig = async (): Promise<LoginConfig> => {
    // 先尝试从localStorage读取
    const saved = localStorage.getItem("umami-config")
    if (saved) {
        try {
            const parsedConfig = JSON.parse(saved)
            if (parsedConfig.serverUrl && parsedConfig.username && parsedConfig.password) {
                return parsedConfig
            }
        } catch (error) {
            console.error("Failed to parse saved config:", error)
        }
    }

    // localStorage没有完整配置，尝试从环境变量读取
    const envConfig = await getConfigFromEnv()
    return {
        serverUrl: envConfig.serverUrl || "",
        username: envConfig.username || "",
        password: envConfig.password || "",
        serverAlias: envConfig.serverAlias || "",
    }
}

export const LoginConfigDialog = forwardRef<LoginConfigDialogRef, LoginConfigProps>(
    ({ onConfigSave, trigger }, ref) => {
        const { t } = useI18n()
        const [config, setConfig] = useState<LoginConfig>({
            serverUrl: "",
            username: "",
            password: "",
            serverAlias: "",
        })
        const [isOpen, setIsOpen] = useState(false)
        const [testing, setTesting] = useState(false)
        const [saving, setSaving] = useState(false)
        const [resetting, setResetting] = useState(false)
        const [hasEnvConfig, setHasEnvConfig] = useState(false)
        const { toast } = useToast()

        // Expose openDialog method through ref
        useImperativeHandle(ref, () => ({
            openDialog: () => setIsOpen(true)
        }))

        useEffect(() => {
            // 使用新的配置获取方式
            getFullConfig().then(setConfig)

            // 检查环境变量是否存在
            getConfigFromEnv().then(envConfig => {
                const hasAnyEnvConfig = !!(envConfig.serverUrl || envConfig.username || envConfig.password || envConfig.serverAlias)
                setHasEnvConfig(hasAnyEnvConfig)
            })
        }, [])

        const testConnection = async () => {
            if (!config.serverUrl || !config.username || !config.password) {
                toast({
                    title: t('incompleteConfiguration'),
                    description: t('fillAllFields'),
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
                        title: t('connectionSuccessful'),
                        description: t('connectionSuccessfulDescription'),
                    })
                } else {
                    toast({
                        title: t('connectionFailed'),
                        description: result.message || t('connectionFailedDescription'),
                        variant: "destructive",
                    })
                }
            } catch (error) {
                toast({
                    title: t('connectionError'),
                    description: t('connectionErrorDescription'),
                    variant: "destructive",
                })
            } finally {
                setTesting(false)
            }
        }

        const handleSave = async () => {
            if (!config.serverUrl || !config.username || !config.password) {
                toast({
                    title: t('incompleteConfiguration'),
                    description: t('fillAllFields'),
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
                    title: t('configurationSaved'),
                    description: t('configurationSavedDescription'),
                })

                setIsOpen(false)
            } catch (error) {
                toast({
                    title: t('saveFailed'),
                    description: t('saveFailedDescription'),
                    variant: "destructive",
                })
            } finally {
                setSaving(false)
            }
        }

        const handleReset = async () => {
            setResetting(true)
            try {
                // 清除localStorage中的配置
                localStorage.removeItem("umami-config")

                // 尝试从环境变量读取配置
                const envConfig = await getConfigFromEnv()

                if (envConfig.serverUrl || envConfig.username || envConfig.password || envConfig.serverAlias) {
                    setConfig({
                        serverUrl: envConfig.serverUrl || "",
                        username: envConfig.username || "",
                        password: envConfig.password || "",
                        serverAlias: envConfig.serverAlias || "",
                    })
                    toast({
                        title: t('configurationReset'),
                        description: t('configurationResetFromEnv'),
                    })
                } else {
                    setConfig({
                        serverUrl: "",
                        username: "",
                        password: "",
                        serverAlias: "",
                    })
                    toast({
                        title: t('configurationReset'),
                        description: t('configurationResetEmpty'),
                    })
                }
            } catch (error) {
                toast({
                    title: t('resetFailed'),
                    description: t('resetFailedDescription'),
                    variant: "destructive",
                })
            } finally {
                setResetting(false)
            }
        }

        const handleInputChange = (field: keyof LoginConfig, value: string) => {
            setConfig((prev) => ({
                ...prev,
                [field]: value,
            }))
        }

        return (
            <TooltipProvider>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        {trigger || (
                            <Button variant="outline" size="sm" className="w-full sm:w-auto sm:min-w-[100px]">
                                <Settings className="h-4 w-4 mr-2" />
                                {t('settings')}
                            </Button>
                        )}
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>{t('umamiConfiguration')}</DialogTitle>
                            <DialogDescription>
                                {t('configurationDescription')}
                            </DialogDescription>
                        </DialogHeader>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">{t('connectionSettings')}</CardTitle>
                                <CardDescription>
                                    {t('connectionSettingsDescription')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="serverUrl">{t('serverUrl')}</Label>
                                    <Input
                                        id="serverUrl"
                                        placeholder={t('serverUrlPlaceholder')}
                                        value={config.serverUrl}
                                        onChange={(e) => handleInputChange("serverUrl", e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="username">{t('username')}</Label>
                                    <Input
                                        id="username"
                                        placeholder={t('usernamePlaceholder')}
                                        value={config.username}
                                        onChange={(e) => handleInputChange("username", e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">{t('password')}</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder={t('passwordPlaceholder')}
                                        value={config.password}
                                        onChange={(e) => handleInputChange("password", e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="serverAlias">{t('serverAlias')}</Label>
                                    <Input
                                        id="serverAlias"
                                        placeholder={t('serverAliasPlaceholder')}
                                        value={config.serverAlias || ""}
                                        onChange={(e) => handleInputChange("serverAlias", e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        {t('serverAliasDescription')}
                                    </p>
                                </div>

                                <div className="flex gap-2 pt-4">
                                    {hasEnvConfig && (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    onClick={handleReset}
                                                    disabled={resetting}
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    <RotateCcw className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{t('resetTooltip')}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    )}

                                    <Button
                                        onClick={testConnection}
                                        disabled={testing}
                                        variant="outline"
                                        className="flex-1"
                                    >
                                        <TestTube className="h-4 w-4 mr-2" />
                                        {testing ? t('testing') : t('testConnection')}
                                    </Button>

                                    <Button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex-1"
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        {saving ? t('saving') : t('saveConfiguration')}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </DialogContent>
                </Dialog>
            </TooltipProvider>
        )
    }
)

// 导出获取配置的函数供其他组件使用
export { getFullConfig } 