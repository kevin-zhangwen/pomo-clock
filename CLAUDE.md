# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Pomodoro timer (番茄时钟) application built with Vue 3, Vite, Pinia, and Capacitor. The app features a timer, task management, statistics tracking, and ambient background sounds (rain, cafe, forest). It can be deployed as a web app, iOS app, or packaged as a desktop app via Electron.

## Commands

```bash
npm run dev          # Start dev server with hot reload
npm run build        # Type-check and build for production
npm run preview      # Preview production build
npm run lint         # Run oxlint (fast) then eslint with auto-fix

# iOS
npm run ios:prepare  # Build and copy web assets to iOS
npm run ios:open     # Open Xcode project
npm run ios:sync     # Sync Capacitor plugins to iOS
npm run ios:run      # Run iOS app on simulator/device
npm run ios:build    # Build and sync iOS project
```

## iOS Build Guide

### Prerequisites
- macOS with Xcode 15+ installed
- Apple Developer account (for device deployment)
- CocoaPods: `sudo gem install cocoapods`

### Build Steps

1. **Prepare the iOS project:**
   ```bash
   npm run ios:prepare
   ```

2. **Open Xcode:**
   ```bash
   npm run ios:open
   ```

3. **Configure signing in Xcode:**
   - Select "App" target
   - Go to "Signing & Capabilities" tab
   - Select your Team and configure signing certificate

4. **Run on simulator or device:**
   - In Xcode: Select target device and press Cmd+R
   - Or via CLI: `npm run ios:run`

### App Icon
Replace `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` with your 1024x1024 app icon.

## Architecture

### Tech Stack
- **Frontend**: Vue 3 (Composition API with `<script setup>`) + TypeScript
- **State Management**: Pinia stores with localStorage persistence
- **Routing**: Vue Router with 4 views: Timer, Tasks, Stats, Settings
- **Charts**: ECharts via vue-echarts for statistics visualization
- **Mobile**: Capacitor for iOS native builds
- **Desktop**: Capacitor + @capacitor-community/electron for native desktop builds

### Store Architecture (src/stores/)
Four Pinia stores with localStorage persistence:
- **timer.ts**: Timer state, controls (start/pause/stop/reset), phase switching, sound effects, notifications
- **tasks.ts**: Task CRUD, status management (todo/doing/done), pomo counting
- **records.ts**: Completed pomo session history, daily/weekly/monthly statistics, data export/import
- **settings.ts**: Timer durations, notification/sound preferences, background music control

### Key Data Flow
1. Timer store uses settings store for durations and records store for session logging
2. When a work session completes, records are saved and tasks get pomo increments
3. Settings store manages the WhiteNoiseGenerator singleton for ambient sounds

### Audio System (src/utils/audio.ts)
Web Audio API-based white noise generator supporting rain, cafe, and forest sounds. Uses procedural audio synthesis (no audio files).

### Views (src/views/)
- **TimerView.vue**: Main timer display with circular progress, controls, and task selection
- **TasksView.vue**: Task list with drag-to-reorder, priority, and status management
- **StatsView.vue**: Charts showing daily/weekly/monthly pomo completion
- **SettingsView.vue**: Timer durations, sound/notification toggles, data management

### Electron Integration (electron/)
The `electron/` directory contains Capacitor Electron platform code:
- `electron/src/index.ts`: Main process entry point
- `electron/src/setup.ts`: Window and app lifecycle management

### Path Alias
`@` is aliased to `src/` (configured in vite.config.ts)

### Linting
Two-stage linting: oxlint runs first (fast), then ESLint. Config in eslint.config.ts and .oxlintrc.json.
