const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const installDir = path.join(__dirname, '..');
const appDir = path.join(installDir, 'app');

console.log('🗑️  正在卸载番茄时钟...');

try {
  if (fs.existsSync(appDir)) {
    // 强制删除目录
    if (process.platform === 'win32') {
      execSync(`rmdir /s /q "${appDir}"`);
    } else {
      execSync(`rm -rf "${appDir}"`);
    }
    console.log('✅ 应用已删除');
  }
  console.log('✅ 卸载完成');
} catch (error) {
  console.error('⚠️  卸载时出错:', error.message);
}
