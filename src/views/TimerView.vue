<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useTimerStore } from '@/stores/timer'
import { useTasksStore } from '@/stores/tasks'
import { useSettingsStore } from '@/stores/settings'

const timerStore = useTimerStore()
const tasksStore = useTasksStore()
const settingsStore = useSettingsStore()

const showAbandonConfirm = ref(false)
const showCompletionAnim = ref(false)

const currentTask = computed(() => tasksStore.currentTask())

const statusIcon = computed(() => {
  switch (timerStore.state.currentType) {
    case 'work':
      return '🔥'
    case 'shortBreak':
      return '☕'
    case 'longBreak':
      return '🌴'
    default:
      return '🔥'
  }
})

const circumference = 2 * Math.PI * 120
const strokeDashoffset = computed(() => {
  return circumference - (timerStore.progress / 100) * circumference
})

// 计算番茄表情状态
const tomatoMood = computed(() => {
  if (timerStore.state.isPaused) return 'sleepy'
  if (timerStore.state.currentType === 'work') {
    if (timerStore.progress > 80) return 'happy'
    if (timerStore.progress > 50) return 'focused'
    return 'determined'
  }
  return 'relaxed'
})

// 计算番茄眼睛状态
const eyeState = computed(() => {
  if (timerStore.state.isPaused) return 'closed'
  if (timerStore.state.currentType !== 'work') return 'happy'
  return 'open'
})

// 计算番茄嘴巴状态
const mouthState = computed(() => {
  if (timerStore.state.isPaused) return 'small'
  if (timerStore.state.currentType !== 'work') return 'big-smile'
  if (timerStore.progress > 80) return 'smile'
  return 'neutral'
})

// 页面标题显示倒计时
watch(() => timerStore.formattedTime, (newTime) => {
  if (timerStore.state.isRunning) {
    document.title = `${newTime} - ${timerStore.currentLabel}`
  } else {
    document.title = '番茄时钟'
  }
})

// 监听番茄完成，显示庆祝动画
watch(() => timerStore.state.completedPomos, (newVal, oldVal) => {
  if (newVal > oldVal) {
    showCompletionAnim.value = true
    setTimeout(() => {
      showCompletionAnim.value = false
    }, 2000)
  }
})

onMounted(() => {
  // 请求通知权限
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
})

function handleAbandon() {
  timerStore.abandonTimer()
  showAbandonConfirm.value = false
}
</script>

<template>
  <div class="timer-view">
    <div class="timer-card" :class="[timerStore.state.currentType]" v-if="settingsStore.settings.animationEnabled">
      <div class="timer-animation">
        <!-- 进度环 -->
        <svg class="progress-ring" viewBox="0 0 280 280">
          <!-- 背景圆环 -->
          <circle
            class="progress-ring-bg"
            cx="140"
            cy="140"
            r="120"
          />
          <!-- 进度圆环 -->
          <circle
            class="progress-ring-fill"
            cx="140"
            cy="140"
            r="120"
            :style="{
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
              stroke: timerStore.currentColor
            }"
          />
        </svg>

        <!-- 中心内容 -->
        <div class="timer-center">
          <!-- 番茄 Mascot -->
          <div class="tomato-mascot" :class="[tomatoMood, { 'animating': timerStore.state.isRunning }]">
            <svg viewBox="0 0 100 100" class="tomato-svg">
              <defs>
                <linearGradient id="tomatoBody" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" :stop-color="timerStore.currentColor" />
                  <stop offset="100%" :stop-color="timerStore.currentColor" style="filter: brightness(0.8)" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              <!-- 番茄身体 -->
              <ellipse cx="50" cy="55" rx="38" ry="35" fill="url(#tomatoBody)" />

              <!-- 高光 -->
              <ellipse cx="35" cy="42" rx="10" ry="6" fill="rgba(255,255,255,0.3)" />

              <!-- 叶子 -->
              <g class="tomato-leaves">
                <path d="M50 20 Q38 10 30 22 Q35 26 40 22 Q45 14 50 20" fill="#4ECDC4" class="leaf" />
                <path d="M50 20 Q62 10 70 22 Q65 26 60 22 Q55 14 50 20" fill="#4ECDC4" class="leaf" />
                <path d="M50 20 Q50 8 50 26" stroke="#3DBBB3" stroke-width="2.5" fill="none" class="stem" />
              </g>

              <!-- 眼睛 -->
              <g class="tomato-eyes" :class="eyeState">
                <!-- 左眼 -->
                <circle cx="38" cy="50" r="4" fill="#2D3436" class="eye-left" />
                <circle cx="40" cy="48" r="1.5" fill="white" class="eye-shine-left" />

                <!-- 右眼 -->
                <circle cx="62" cy="50" r="4" fill="#2D3436" class="eye-right" />
                <circle cx="64" cy="48" r="1.5" fill="white" class="eye-shine-right" />

                <!-- 睡眠 Zzz 符号 -->
                <g v-if="timerStore.state.isPaused" class="sleep-z">
                  <text x="70" y="35" font-size="12" fill="#636E72">Z</text>
                  <text x="78" y="28" font-size="10" fill="#636E72">z</text>
                </g>
              </g>

              <!-- 嘴巴 -->
              <g class="tomato-mouth" :class="mouthState">
                <!-- 大笑 -->
                <path v-if="mouthState === 'big-smile'" d="M35 62 Q50 78 65 62" stroke="#2D3436" stroke-width="2.5" stroke-linecap="round" fill="none" />
                <!-- 微笑 -->
                <path v-else-if="mouthState === 'smile'" d="M40 64 Q50 72 60 64" stroke="#2D3436" stroke-width="2.5" stroke-linecap="round" fill="none" />
                <!-- 平静 -->
                <path v-else-if="mouthState === 'neutral'" d="M42 66 Q50 66 58 66" stroke="#2D3436" stroke-width="2.5" stroke-linecap="round" fill="none" />
                <!-- 小嘴（睡觉） -->
                <circle v-else-if="mouthState === 'small'" cx="50" cy="68" r="2" fill="#2D3436" />
              </g>

              <!-- 腮红 -->
              <ellipse cx="28" cy="58" rx="5" ry="3" fill="rgba(255,107,107,0.3)" class="blush" />
              <ellipse cx="72" cy="58" rx="5" ry="3" fill="rgba(255,107,107,0.3)" class="blush" />
            </svg>
          </div>

          <!-- 时间显示 -->
          <div class="time-display-wrapper">
            <div class="time-display" :class="{ 'flipping': timerStore.state.isRunning }">
              <span class="time-text">{{ timerStore.formattedTime }}</span>
            </div>
          </div>
          <div class="status-label" :style="{ color: timerStore.currentColor }">
            {{ timerStore.currentLabel }}
          </div>
        </div>
      </div>

      <!-- 庆祝动画 -->
      <div v-if="showCompletionAnim" class="celebration">
        <div class="confetti" v-for="i in 20" :key="i" :style="{ '--delay': `${i * 0.1}s`, '--rotation': `${Math.random() * 360}deg` }">
          🎉
        </div>
        <div class="completion-message">🎉 番茄完成！ 🎉</div>
      </div>

      <!-- 当前任务 -->
      <div class="current-task" v-if="currentTask">
        <div class="task-label">当前任务</div>
        <div class="task-title">{{ currentTask.title }}</div>
        <div class="task-progress">
          <span class="pomo-count">{{ currentTask.actualPomos }}</span>
          <span class="pomo-separator">/</span>
          <span class="pomo-target">{{ currentTask.estimatedPomos }}</span>
          <span class="pomo-icon">🍅</span>
        </div>
      </div>

      <!-- 控制按钮 -->
      <div class="timer-controls">
        <button
          v-if="!timerStore.state.isRunning && !timerStore.state.isPaused"
          class="btn btn-primary btn-large pulse-btn"
          @click="timerStore.startTimer"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          开始
        </button>

        <button
          v-else-if="timerStore.state.isRunning"
          class="btn btn-secondary btn-large"
          @click="timerStore.pauseTimer"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
          暂停
        </button>

        <button
          v-else-if="timerStore.state.isPaused"
          class="btn btn-primary btn-large"
          @click="timerStore.resumeTimer"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          继续
        </button>

        <button
          v-if="timerStore.state.isRunning || timerStore.state.isPaused"
          class="btn btn-secondary"
          @click="showAbandonConfirm = true"
        >
          放弃
        </button>

        <button
          v-if="timerStore.state.isRunning || timerStore.state.isPaused"
          class="btn btn-secondary"
          @click="timerStore.skipPhase"
        >
          跳过
        </button>
      </div>

      <!-- 今日完成数 -->
      <div class="today-stats">
        <span class="stats-label">今日完成</span>
        <span class="stats-number">{{ tasksStore.tasks.reduce((sum, t) => sum + t.actualPomos, 0) }}</span>
        <span class="stats-icon">🍅</span>
      </div>
    </div>

    <!-- 放弃确认弹窗 -->
    <div v-if="showAbandonConfirm" class="modal-overlay" @click="showAbandonConfirm = false">
      <div class="modal" @click.stop>
        <div class="modal-icon sad-tomato">🍅</div>
        <h3>确定要放弃吗？</h3>
        <p>放弃后这个番茄将不会被记录</p>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showAbandonConfirm = false">继续专注</button>
          <button class="btn btn-danger" @click="handleAbandon">放弃</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timer-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
}

.timer-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 40px;
  box-shadow: var(--shadow-md);
  border: 3px solid var(--color-border);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  max-width: 480px;
  width: 100%;
  animation: fadeIn 0.5s ease;
  position: relative;
  overflow: hidden;
}

.timer-card.work {
  border-color: rgba(255, 107, 107, 0.3);
}

.timer-card.shortBreak {
  border-color: rgba(78, 205, 196, 0.3);
}

.timer-card.longBreak {
  border-color: rgba(149, 225, 211, 0.3);
}

.timer-animation {
  position: relative;
  width: 280px;
  height: 280px;
}

.progress-ring {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.progress-ring-bg {
  fill: none;
  stroke: var(--color-border);
  stroke-width: 12;
  stroke-linecap: round;
}

.progress-ring-fill {
  fill: none;
  stroke-width: 12;
  stroke-linecap: round;
  transition: stroke-dashoffset 1s linear, stroke 0.3s ease;
}

.timer-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

/* 番茄 Mascot 样式 */
.tomato-mascot {
  width: 100px;
  height: 100px;
  margin: 0 auto 8px;
  transition: transform 0.3s ease;
}

.tomato-mascot.animating {
  animation: gentle-bounce 2s ease-in-out infinite;
}

.tomato-mascot.sleepy {
  animation: none;
  transform: scale(0.95);
}

.tomato-svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1));
}

/* 叶子动画 */
.leaf {
  transform-origin: 50% 20%;
  animation: leaf-sway 3s ease-in-out infinite;
}

.leaf:nth-child(2) {
  animation-delay: 0.5s;
}

.stem {
  animation: stem-wiggle 4s ease-in-out infinite;
  transform-origin: 50% 100%;
}

/* 眼睛动画 */
.tomato-eyes .eye-left,
.tomato-eyes .eye-right {
  transition: all 0.3s ease;
}

.tomato-eyes.closed .eye-left,
.tomato-eyes.closed .eye-right {
  ry: 0.5;
  rx: 4;
}

.tomato-eyes.happy .eye-left,
.tomato-eyes.happy .eye-right {
  transform: translateY(2px);
}

.tomato-eyes .eye-shine-left,
.tomato-eyes .eye-shine-right {
  transition: opacity 0.3s ease;
}

.tomato-eyes.closed .eye-shine-left,
.tomato-eyes.closed .eye-shine-right {
  opacity: 0;
}

/* 睡眠 Zzz 动画 */
.sleep-z text {
  opacity: 0;
  animation: zzz-float 2s ease-in-out infinite;
}

.sleep-z text:nth-child(2) {
  animation-delay: 0.5s;
}

/* 腮红动画 */
.blush {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.tomato-mascot:not(.sleepy) .blush {
  opacity: 1;
}

/* 时间显示 - 翻页效果 */
.time-display-wrapper {
  perspective: 1000px;
}

.time-display {
  font-size: 56px;
  font-weight: 800;
  color: var(--color-text);
  line-height: 1;
  font-variant-numeric: tabular-nums;
  letter-spacing: -2px;
  transform-style: preserve-3d;
  transition: transform 0.3s ease;
}

.time-display.flipping {
  animation: subtle-flip 1s ease-in-out;
}

.time-text {
  display: inline-block;
  transition: all 0.3s ease;
}

.status-label {
  font-size: 18px;
  font-weight: 600;
  margin-top: 8px;
  transition: all 0.3s ease;
}

/* 庆祝动画 */
.celebration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 10;
}

.confetti {
  position: absolute;
  top: 50%;
  left: 50%;
  font-size: 24px;
  animation: confetti-pop 1.5s ease-out forwards;
  animation-delay: var(--delay);
  transform: rotate(var(--rotation));
}

.completion-message {
  position: absolute;
  top: 30%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 24px;
  font-weight: 800;
  color: var(--color-primary);
  background: white;
  padding: 12px 24px;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  animation: message-pop 0.5s ease-out;
}

.current-task {
  text-align: center;
  padding: 16px 24px;
  background: var(--color-bg);
  border-radius: var(--radius-md);
  border: 2px dashed var(--color-border);
  width: 100%;
  animation: slide-up 0.3s ease;
}

.task-label {
  font-size: 12px;
  color: var(--color-text-light);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 4px;
}

.task-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 8px;
}

.task-progress {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 16px;
}

.pomo-count {
  font-weight: 700;
  color: var(--color-primary);
}

.pomo-separator {
  color: var(--color-text-light);
}

.pomo-target {
  color: var(--color-text-light);
}

.pomo-icon {
  font-size: 14px;
}

.timer-controls {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.btn-large {
  padding: 16px 40px;
  font-size: 20px;
  border-radius: var(--radius-lg);
}

.pulse-btn {
  animation: pulse-glow 2s ease-in-out infinite;
}

.today-stats {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, var(--color-accent-light), var(--color-accent));
  border-radius: var(--radius-md);
  animation: slide-up 0.4s ease;
}

.stats-label {
  font-size: 14px;
  color: var(--color-text);
}

.stats-number {
  font-size: 24px;
  font-weight: 800;
  color: var(--color-primary);
}

.stats-icon {
  font-size: 20px;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.modal {
  background: white;
  border-radius: var(--radius-lg);
  padding: 32px;
  text-align: center;
  max-width: 360px;
  width: 90%;
  box-shadow: var(--shadow-lg);
  animation: modal-bounce 0.4s ease;
}

.modal-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.modal-icon.sad-tomato {
  animation: sad-wiggle 1s ease-in-out infinite;
}

.modal h3 {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 8px;
}

.modal p {
  color: var(--color-text-light);
  margin-bottom: 24px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

/* 动画定义 */
@keyframes gentle-bounce {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-5px) rotate(2deg); }
}

@keyframes leaf-sway {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(5deg); }
}

@keyframes stem-wiggle {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-3deg); }
  75% { transform: rotate(3deg); }
}

@keyframes zzz-float {
  0% {
    opacity: 0;
    transform: translate(0, 0) scale(0.5);
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(10px, -20px) scale(1);
  }
}

@keyframes subtle-flip {
  0% { transform: rotateX(0deg); }
  50% { transform: rotateX(10deg); }
  100% { transform: rotateX(0deg); }
}

@keyframes confetti-pop {
  0% {
    transform: translate(-50%, -50%) scale(0) rotate(var(--rotation));
    opacity: 1;
  }
  100% {
    transform: translate(calc(-50% + cos(var(--rotation)) * 150px), calc(-50% + sin(var(--rotation)) * 150px)) scale(1) rotate(calc(var(--rotation) + 360deg));
    opacity: 0;
  }
}

@keyframes message-pop {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.1);
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.4);
  }
  50% {
    box-shadow: 0 0 0 15px rgba(255, 107, 107, 0);
  }
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes modal-bounce {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes sad-wiggle {
  0%, 100% { transform: rotate(-5deg); }
  50% { transform: rotate(5deg); }
}

@media (max-width: 480px) {
  .timer-card {
    padding: 24px;
  }

  .timer-animation {
    width: 240px;
    height: 240px;
  }

  .tomato-mascot {
    width: 80px;
    height: 80px;
  }

  .time-display {
    font-size: 44px;
  }

  .btn-large {
    padding: 14px 32px;
    font-size: 18px;
  }

  .completion-message {
    font-size: 18px;
    padding: 8px 16px;
  }
}
</style>
