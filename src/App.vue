<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import AiAssistant from './components/AiAssistant.vue'
</script>

<template>
  <div class="app-container">
    <nav class="navbar">
      <div class="navbar-brand">
        <svg class="tomato-icon" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- 番茄主体 -->
          <circle cx="50" cy="55" r="40" fill="url(#tomatoGradient)" />
          <!-- 高光 -->
          <ellipse cx="35" cy="40" rx="12" ry="8" fill="rgba(255,255,255,0.4)" />
          <!-- 叶子 -->
          <path d="M50 15 Q35 5 25 20 Q30 25 35 20 Q40 10 50 15" fill="#4ECDC4" />
          <path d="M50 15 Q65 5 75 20 Q70 25 65 20 Q60 10 50 15" fill="#4ECDC4" />
          <path d="M50 15 Q50 5 50 25" stroke="#3DBBB3" stroke-width="3" fill="none" />
          <!-- 眼睛 -->
          <circle cx="38" cy="50" r="4" fill="#2D3436" />
          <circle cx="62" cy="50" r="4" fill="#2D3436" />
          <circle cx="40" cy="48" r="1.5" fill="white" />
          <circle cx="64" cy="48" r="1.5" fill="white" />
          <!-- 嘴巴 -->
          <path d="M42 60 Q50 68 58 60" stroke="#2D3436" stroke-width="3" stroke-linecap="round" fill="none" />
          <!-- 渐变定义 -->
          <defs>
            <linearGradient id="tomatoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#FF8E8E" />
              <stop offset="100%" style="stop-color:#FF6B6B" />
            </linearGradient>
          </defs>
        </svg>
        <span>番茄时钟</span>
      </div>
      <div class="navbar-nav">
        <RouterLink to="/" class="nav-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>计时器</span>
        </RouterLink>
        <RouterLink to="/tasks" class="nav-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
          </svg>
          <span>任务</span>
        </RouterLink>
        <RouterLink to="/stats" class="nav-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 3v18h18" />
            <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
          </svg>
          <span>统计</span>
        </RouterLink>
        <RouterLink to="/settings" class="nav-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
          <span>设置</span>
        </RouterLink>
      </div>
    </nav>

    <main class="main-content">
      <RouterView />
    </main>
    <AiAssistant />
  </div>
</template>

<style>
@import './assets/main.css';
</style>
