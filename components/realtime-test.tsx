"use client"

import { useState } from "react"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TestTube, Loader2, RefreshCw } from "lucide-react"

interface RealtimeTestProps {
    config: {
        serverUrl: string
        username: string
        password: string
    } | null
}

export function RealtimeTest({ config }: RealtimeTestProps) {
    const [websiteId, setWebsiteId] = useState("")
    const [testing, setTesting] = useState(false)
    const [results, setResults] = useState<any>(null)
    const [error, setError] = useState<string>("")
    const [websites, setWebsites] = useState<any[]>([])
    const [loadingWebsites, setLoadingWebsites] = useState(false)

    const loadWebsites = async () => {
        if (!config) return

        setLoadingWebsites(true)
        try {
            const response = await fetch("/api/umami/websites", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ config }),
            })

            const data = await response.json()

            if (response.ok) {
                setWebsites(data.websites || [])
                if (data.websites && data.websites.length > 0 && !websiteId) {
                    // Auto-select first website if none selected
                    setWebsiteId(data.websites[0].id)
                }
            } else {
                setError(data.error || "Failed to load websites")
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Network error")
        } finally {
            setLoadingWebsites(false)
        }
    }

    const testRealtime = async () => {
        if (!config || !websiteId) {
            setError("Please provide config and website ID")
            return
        }

        setTesting(true)
        setError("")
        setResults(null)

        try {
            const response = await fetch("/api/umami/test-realtime", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    config,
                    websiteId,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                setError(data.error || "Test failed")
            } else {
                setResults(data)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Network error")
        } finally {
            setTesting(false)
        }
    }

    // Auto-load websites when config is available
    React.useEffect(() => {
        if (config && websites.length === 0) {
            loadWebsites()
        }
    }, [config])

    if (!config) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TestTube className="h-5 w-5" />
                        实时数据测试
                    </CardTitle>
                    <CardDescription>
                        请先配置 Umami 连接信息
                    </CardDescription>
                </CardHeader>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TestTube className="h-5 w-5" />
                    实时数据测试
                </CardTitle>
                <CardDescription>
                    测试特定网站的实时访客数据获取
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Websites list */}
                {websites.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>选择网站</Label>
                            <Button
                                onClick={loadWebsites}
                                disabled={loadingWebsites}
                                variant="ghost"
                                size="sm"
                            >
                                <RefreshCw className={`h-3 w-3 ${loadingWebsites ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                        <Select value={websiteId} onValueChange={setWebsiteId}>
                            <SelectTrigger>
                                <SelectValue placeholder="选择要测试的网站" />
                            </SelectTrigger>
                            <SelectContent>
                                {websites.map((website) => (
                                    <SelectItem key={website.id} value={website.id}>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{website.name}</span>
                                            <span className="text-xs text-muted-foreground">{website.domain} ({website.id})</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="websiteId">网站 ID（手动输入）</Label>
                    <Input
                        id="websiteId"
                        placeholder="输入网站 ID（如：2-cgs）"
                        value={websiteId}
                        onChange={(e) => setWebsiteId(e.target.value)}
                    />
                </div>

                <Button
                    onClick={testRealtime}
                    disabled={testing || !websiteId}
                    className="w-full"
                >
                    {testing ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            测试中...
                        </>
                    ) : (
                        <>
                            <TestTube className="h-4 w-4 mr-2" />
                            测试实时数据
                        </>
                    )}
                </Button>

                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {results && (
                    <div className="space-y-3">
                        <h4 className="font-medium">测试结果:</h4>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span>网站 ID:</span>
                                <Badge variant="outline">{results.websiteId}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>当前在线访客:</span>
                                <Badge variant={results.activeUsers > 0 ? "default" : "secondary"}>
                                    {results.activeUsers}
                                </Badge>
                            </div>
                            {results.error && (
                                <div className="flex items-center justify-between">
                                    <span>错误:</span>
                                    <Badge variant="destructive">{results.error}</Badge>
                                </div>
                            )}
                        </div>

                        {/* Detailed endpoint results */}
                        <div className="space-y-2">
                            <h5 className="text-sm font-medium">API 端点测试:</h5>
                            {Object.entries(results.endpoints || {}).map(([endpoint, result]: [string, any]) => (
                                <div key={endpoint} className="border rounded p-2 text-xs space-y-1">
                                    <div className="font-mono text-xs break-all">{endpoint}</div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={result.status === 200 ? "default" : "destructive"} className="text-xs">
                                            {result.status}
                                        </Badge>
                                        {result.type && (
                                            <Badge variant="outline" className="text-xs">
                                                {result.type} {result.length !== null ? `(${result.length})` : ''}
                                            </Badge>
                                        )}
                                    </div>
                                    {result.data && (
                                        <pre className="bg-muted p-1 rounded text-xs max-h-20 overflow-auto">
                                            {JSON.stringify(result.data, null, 1)}
                                        </pre>
                                    )}
                                    {result.error && (
                                        <div className="text-destructive text-xs">{result.error}</div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Debug info */}
                        {results.debugInfo && results.debugInfo.length > 0 && (
                            <div className="space-y-1">
                                <h5 className="text-sm font-medium">调试信息:</h5>
                                {results.debugInfo.map((info: string, index: number) => (
                                    <div key={index} className="text-xs text-muted-foreground">{info}</div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
} 