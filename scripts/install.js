const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');
const os = require('os');

const platform = os.platform();
const arch = os.arch();

// GitHub 仓库信息
const GITHUB_OWNER = 'kevin-zhangwen';
const GITHUB_REPO = 'pomo-clock';
const VERSION = 'v1.0.0';               // 版本号

// 下载链接映射
const DOWNLOAD_URLS = {
  'darwin-arm64': `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/download/${VERSION}/pomo-clock-mac-arm64.zip`,
  'darwin-x64': `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/download/${VERSION}/pomo-clock-mac-x64.zip`,
  'linux-x64': `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/download/${VERSION}/pomo-clock-linux-x64.zip`,
  'win32-x64': `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/download/${VERSION}/pomo-clock-win-x64.zip`,
};

const installDir = path.join(__dirname, '..');
const appDir = path.join(installDir, 'app');

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // 重定向
        downloadFile(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

function extractZip(zipPath, destDir) {
  if (process.platform === 'darwin' || process.platform === 'linux') {
    execSync(`unzip -q "${zipPath}" -d "${destDir}"`);
  } else {
    // Windows
    execSync(`powershell -command "Expand-Archive -Path '${zipPath}' -DestinationPath '${destDir}' -Force"`);
  }
}

async function install() {
  const key = `${platform}-${arch}`;
  const downloadUrl = DOWNLOAD_URLS[key];

  if (!downloadUrl) {
    console.error(`❌ 不支持的平台: ${platform} ${arch}`);
    console.error('支持的平台: macOS (Intel/Apple Silicon), Linux (x64), Windows (x64)');
    process.exit(1);
  }

  console.log('🍅 正在安装番茄时钟...');
  console.log(`平台: ${platform} ${arch}`);

  // 检查本地是否有应用（开发模式）
  const localAppPath = path.join(__dirname, '..', '..', 'pomo-clock', 'electron', 'release', 'mac-arm64', '番茄时钟.app');
  if (fs.existsSync(localAppPath) && platform === 'darwin') {
    console.log('📦 使用本地应用...');
    if (!fs.existsSync(appDir)) {
      fs.mkdirSync(appDir, { recursive: true });
    }
    const targetDir = path.join(appDir, 'mac-arm64');
    fs.mkdirSync(targetDir, { recursive: true });
    execSync(`cp -R "${localAppPath}" "${targetDir}/"`);
    console.log('✅ 安装完成！运行: pomo-clock');
    return;
  }

  // 从 GitHub 下载
  console.log('⬇️  正在下载应用...');
  
  if (!fs.existsSync(appDir)) {
    fs.mkdirSync(appDir, { recursive: true });
  }

  const zipPath = path.join(appDir, 'download.zip');

  try {
    await downloadFile(downloadUrl, zipPath);
    console.log('📦 正在解压...');
    extractZip(zipPath, appDir);
    fs.unlinkSync(zipPath);
    console.log('✅ 安装完成！');
    console.log('');
    console.log('使用方法:');
    console.log('  pomo-clock     启动番茄时钟');
    console.log('  pomo           快捷启动');
  } catch (error) {
    console.error('❌ 安装失败:', error.message);
    console.error('');
    console.error('请确保:');
    console.error('1. 已连接到互联网');
    console.error('2. 你的平台受支持');
    console.error('3. GitHub Release 已发布');
    process.exit(1);
  }
}

install();
