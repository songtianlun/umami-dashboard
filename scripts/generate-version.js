const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

try {
    let gitVersion;

    // 首先检查环境变量 VERSION
    if (process.env.VERSION) {
        gitVersion = process.env.VERSION;
        console.log(`使用环境变量版本: ${gitVersion}`);
    } else {
        // 运行git命令获取版本信息
        gitVersion = execSync('git describe --dirty --always --tags --abbrev=7', { encoding: 'utf8' }).trim();
        console.log(`使用git版本: ${gitVersion}`);
    }

    // 生成版本对象
    const versionInfo = {
        version: gitVersion,
        buildTime: new Date().toISOString(),
        buildTimestamp: Date.now()
    };

    // 创建版本文件目录
    const versionDir = path.join(process.cwd(), 'lib');
    if (!fs.existsSync(versionDir)) {
        fs.mkdirSync(versionDir, { recursive: true });
    }

    // 写入版本文件
    const versionFilePath = path.join(versionDir, 'version.json');
    fs.writeFileSync(versionFilePath, JSON.stringify(versionInfo, null, 2));

    console.log(`版本信息已生成: ${gitVersion}`);
    console.log(`构建时间: ${versionInfo.buildTime}`);

} catch (error) {
    console.error('获取版本信息时出错:', error.message);

    // 如果git命令失败，使用默认版本
    const fallbackVersion = {
        version: 'dev-' + Date.now().toString(36),
        buildTime: new Date().toISOString(),
        buildTimestamp: Date.now()
    };

    const versionDir = path.join(process.cwd(), 'lib');
    if (!fs.existsSync(versionDir)) {
        fs.mkdirSync(versionDir, { recursive: true });
    }

    const versionFilePath = path.join(versionDir, 'version.json');
    fs.writeFileSync(versionFilePath, JSON.stringify(fallbackVersion, null, 2));

    console.log(`使用备用版本: ${fallbackVersion.version}`);
} 