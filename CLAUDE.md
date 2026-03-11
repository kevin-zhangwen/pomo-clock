# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Pomodoro timer (番茄时钟) application built with Vue 3, Vite, Pinia, and Capacitor. The app features a timer, task management, statistics tracking, and ambient background sounds (rain, cafe, forest). It can be deployed as a web app or packaged as a desktop app via Electron.

## Commands

```bash
npm run dev          # Start dev server with hot reload
npm run build        # Type-check and build for production
npm run preview      # Preview production build
npm run lint         # Run oxlint (fast) then eslint with auto-fix
```

## Architecture

### Tech Stack
- **Frontend**: Vue 3 (Composition API with `<script setup>`) + TypeScript
- **State Management**: Pinia stores with localStorage persistence
- **Routing**: Vue Router with 4 views: Timer, Tasks, Stats, Settings
- **Charts**: ECharts via vue-echarts for statistics visualization
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
