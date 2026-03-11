#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const platform = os.platform();
const arch = os.arch();

// 获取安装目录
const installDir = path.join(__dirname, '..');
const appDir = path.join(installDir, 'app');

// 根据平台确定可执行文件
function getExecutablePath() {
  if (platform === 'darwin') {
    // macOS
    const appName = arch === 'arm64' ? '番茄时钟.app' : '番茄时钟.app';
    return path.join(appDir, 'mac-arm64', appName, 'Contents', 'MacOS', '番茄时钟');
  } else if (platform === 'linux') {
    return path.join(appDir, 'linux', 'pomo-clock');
  } else if (platform === 'win32') {
    return path.join(appDir, 'win', '番茄时钟.exe');
  }
  return null;
}

const executablePath = getExecutablePath();

if (!executablePath) {
  console.error(`不支持的平台: ${platform} ${arch}`);
  process.exit(1);
}

if (!fs.existsSync(executablePath)) {
  console.error('应用未安装，请运行: npm install');
  console.error('Expected path:', executablePath);
  process.exit(1);
}

// 启动应用
const child = spawn(executablePath, process.argv.slice(2), {
  detached: true,
  stdio: 'ignore'
});

child.unref();

console.log('🍅 番茄时钟已启动！');
