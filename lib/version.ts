interface VersionInfo {
    version: string;
    buildTime: string;
    buildTimestamp: number;
}

// 默认版本信息
const defaultVersion: VersionInfo = {
    version: 'dev',
    buildTime: new Date().toISOString(),
    buildTimestamp: Date.now(),
};

// 获取版本信息
export function getVersionInfo(): VersionInfo {
    try {
        // 在构建时，版本文件会被生成
        const versionInfo = require('./version.json') as VersionInfo;
        return versionInfo;
    } catch (error) {
        // 如果版本文件不存在（比如在开发环境），返回默认版本
        return defaultVersion;
    }
}

// 格式化版本信息显示
export function formatVersionInfo(): string {
    const versionInfo = getVersionInfo();
    return `${versionInfo.version} / ${versionInfo.buildTime}`;
}

// 获取版权年份范围
export function getCopyrightYears(): string {
    const versionInfo = getVersionInfo();
    const startYear = 2025; // 起始年份（写死）
    const buildYear = new Date(versionInfo.buildTime).getFullYear();

    if (buildYear <= startYear) {
        return startYear.toString();
    } else {
        return `${startYear}-${buildYear}`;
    }
} 