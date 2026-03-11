# 🍅 番茄时钟 (Pomo Clock)

一个可爱的番茄工作法计时器桌面应用，帮助你提高工作效率。

## 安装

```bash
npm install -g pomo-clock
```

## 使用

安装完成后，可以通过以下命令启动：

```bash
pomo-clock
# 或简写
pomo
```

## 功能特性

- ⏱️ **番茄计时** - 25分钟专注 + 5分钟短休息 + 15分钟长休息
- ✅ **任务管理** - 创建任务并追踪完成的番茄数
- 📊 **数据统计** - 查看每日/每周/每月的专注统计
- 🎵 **白噪音** - 雨声、咖啡馆、森林环境音
- 🎨 **可爱动画** - 番茄 Mascot 陪伴你的专注时光

## 支持平台

- macOS (Intel & Apple Silicon)
- Linux (x64)
- Windows (x64)

## 开发

```bash
# 克隆仓库
git clone https://github.com/kevin-zhangwen/pomo-clock.git
cd pomo-clock

# 安装依赖
npm install

# 开发模式
npm run dev

# 构建桌面应用
cd electron
npm run electron:make
```

## License

MIT
