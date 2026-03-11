<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useRecordsStore } from '@/stores/records'
import { useTasksStore } from '@/stores/tasks'
import type { Settings } from '@/types'

const settingsStore = useSettingsStore()
const recordsStore = useRecordsStore()
const tasksStore = useTasksStore()

const activeTab = ref<'timer' | 'notification' | 'data'>('timer')
const showClearConfirm = ref(false)
const importError = ref('')

// 背景音乐选项
const bgMusicOptions = [
  { value: 'none', label: '无', icon: '🔇' },
  { value: 'rain', label: '雨声', icon: '🌧️' },
  { value: 'cafe', label: '咖啡馆', icon: '☕' },
  { value: 'forest', label: '森林', icon: '🌲' },
]

// 当前试听的音乐类型
const previewType = ref<Settings['bgMusicType']>('none')
const isPreviewing = ref(false)

// 通知权限
const notificationStatus = ref<NotificationPermission>('default')

onMounted(() => {
  if ('Notification' in window) {
    notificationStatus.value = Notification.permission
  }
})

onUnmounted(() => {
  // 离开页面时停止试听
  if (isPreviewing.value) {
    settingsStore.stopMusic()
  }
})

function toggleMusicEnabled() {
  const enabled = !settingsStore.settings.bgMusicEnabled
  settingsStore.updateMusicSettings(
    enabled,
    settingsStore.settings.bgMusicType,
    settingsStore.settings.volume
  )
}

function selectMusicType(type: Settings['bgMusicType']) {
  if (type === 'none') return
  settingsStore.updateMusicSettings(
    settingsStore.settings.bgMusicEnabled,
    type,
    settingsStore.settings.volume
  )
  // 如果当前在试听，切换到新类型
  if (isPreviewing.value) {
    settingsStore.playMusic()
  }
}

function updateVolume(value: number) {
  settingsStore.setVolume(value)
}

function togglePreview() {
  if (isPreviewing.value) {
    settingsStore.stopMusic()
    isPreviewing.value = false
  } else {
    if (settingsStore.settings.bgMusicType !== 'none') {
      settingsStore.playMusic()
      isPreviewing.value = true
    }
  }
}

function requestNotification() {
  if ('Notification' in window) {
    Notification.requestPermission().then((permission) => {
      notificationStatus.value = permission
      settingsStore.updateSettings({ notificationEnabled: permission === 'granted' })
    })
  }
}

function updateDuration(key: 'workDuration' | 'shortBreakDuration' | 'longBreakDuration', value: number) {
  settingsStore.updateSettings({ [key]: value })
}

function exportData() {
  const data = {
    settings: settingsStore.settings,
    tasks: tasksStore.tasks,
    records: recordsStore.records,
    exportDate: new Date().toISOString(),
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `pomo-backup-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function importData(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string)
      if (data.settings) {
        settingsStore.updateSettings(data.settings)
      }
      if (data.tasks) {
        tasksStore.tasks = data.tasks
        tasksStore.saveTasks()
      }
      if (data.records) {
        recordsStore.records = data.records
        recordsStore.saveRecords()
      }
      importError.value = ''
      alert('数据导入成功！')
    } catch (err) {
      importError.value = '导入失败，请检查文件格式'
    }
  }
  reader.readAsText(file)
  ;(event.target as HTMLInputElement).value = ''
}

function clearAllData() {
  settingsStore.resetSettings()
  tasksStore.tasks = []
  tasksStore.saveTasks()
  recordsStore.clearAllRecords()
  showClearConfirm.value = false
  alert('所有数据已清空！')
}
</script>

<template>
  <div class="settings-view">
    <h1 class="page-title">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
      设置
    </h1>

    <!-- 设置标签页 -->
    <div class="settings-tabs">
      <button
        class="settings-tab"
        :class="{ active: activeTab === 'timer' }"
        @click="activeTab = 'timer'"
      >
        <span class="tab-icon">⏱️</span>
        <span>计时器</span>
      </button>
      <button
        class="settings-tab"
        :class="{ active: activeTab === 'notification' }"
        @click="activeTab = 'notification'"
      >
        <span class="tab-icon">🔔</span>
        <span>提醒与声音</span>
      </button>
      <button
        class="settings-tab"
        :class="{ active: activeTab === 'data' }"
        @click="activeTab = 'data'"
      >
        <span class="tab-icon">💾</span>
        <span>数据管理</span>
      </button>
    </div>

    <!-- 计时器设置 -->
    <div v-if="activeTab === 'timer'" class="settings-section">
      <div class="setting-card">
        <h3>⏱️ 时长设置（分钟）</h3>

        <div class="duration-settings">
          <div class="duration-item">
            <label>专注时长</label>
            <div class="duration-control">
              <button
                class="duration-btn"
                @click="updateDuration('workDuration', Math.max(1, settingsStore.settings.workDuration - 1))"
              >
                -
              </button>
              <span class="duration-value">{{ settingsStore.settings.workDuration }}</span>
              <button
                class="duration-btn"
                @click="updateDuration('workDuration', Math.min(60, settingsStore.settings.workDuration + 1))"
              >
                +
              </button>
            </div>
          </div>

          <div class="duration-item">
            <label>短休息时长</label>
            <div class="duration-control">
              <button
                class="duration-btn"
                @click="updateDuration('shortBreakDuration', Math.max(1, settingsStore.settings.shortBreakDuration - 1))"
              >
                -
              </button>
              <span class="duration-value">{{ settingsStore.settings.shortBreakDuration }}</span>
              <button
                class="duration-btn"
                @click="updateDuration('shortBreakDuration', Math.min(30, settingsStore.settings.shortBreakDuration + 1))"
              >
                +
              </button>
            </div>
          </div>

          <div class="duration-item">
            <label>长休息时长</label>
            <div class="duration-control">
              <button
                class="duration-btn"
                @click="updateDuration('longBreakDuration', Math.max(1, settingsStore.settings.longBreakDuration - 1))"
              >
                -
              </button>
              <span class="duration-value">{{ settingsStore.settings.longBreakDuration }}</span>
              <button
                class="duration-btn"
                @click="updateDuration('longBreakDuration', Math.min(60, settingsStore.settings.longBreakDuration + 1))"
              >
                +
              </button>
            </div>
          </div>

          <div class="duration-item">
            <label>长休息间隔</label>
            <div class="duration-control">
              <span class="interval-text">每</span>
              <button
                class="duration-btn"
                @click="settingsStore.updateSettings({ longBreakInterval: Math.max(2, settingsStore.settings.longBreakInterval - 1) })"
              >
                -
              </button>
              <span class="duration-value">{{ settingsStore.settings.longBreakInterval }}</span>
              <button
                class="duration-btn"
                @click="settingsStore.updateSettings({ longBreakInterval: Math.min(10, settingsStore.settings.longBreakInterval + 1) })"
              >
                +
              </button>
              <span class="interval-text">个番茄</span>
            </div>
          </div>
        </div>
      </div>

      <div class="setting-card">
        <h3>🎨 动画设置</h3>
        <div class="toggle-setting">
          <div class="toggle-info">
            <label>启用动画效果</label>
            <span class="toggle-desc">进度环动画、翻页效果等</span>
          </div>
          <label class="toggle-switch">
            <input
              type="checkbox"
              v-model="settingsStore.settings.animationEnabled"
              @change="settingsStore.saveSettings()"
            >
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
    </div>

    <!-- 提醒与声音设置 -->
    <div v-if="activeTab === 'notification'" class="settings-section">
      <div class="setting-card">
        <h3>🔔 通知设置</h3>

        <div class="toggle-setting">
          <div class="toggle-info">
            <label>桌面通知</label>
            <span class="toggle-desc">计时结束时显示桌面通知</span>
          </div>
          <div class="notification-status">
            <span v-if="notificationStatus === 'granted'" class="status-badge success">已授权</span>
            <span v-else-if="notificationStatus === 'denied'" class="status-badge error">已拒绝</span>
            <button v-else class="btn btn-primary btn-small" @click="requestNotification">请求授权</button>
          </div>
        </div>

        <div class="toggle-setting">
          <div class="toggle-info">
            <label>声音提醒</label>
            <span class="toggle-desc">计时开始/结束时播放提示音</span>
          </div>
          <label class="toggle-switch">
            <input
              type="checkbox"
              v-model="settingsStore.settings.soundEnabled"
              @change="settingsStore.saveSettings()"
            >
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div class="setting-card">
        <h3>🎵 背景音乐</h3>

        <div class="toggle-setting">
          <div class="toggle-info">
            <label>启用背景音乐</label>
            <span class="toggle-desc">专注时播放白噪音（休息时自动暂停）</span>
          </div>
          <label class="toggle-switch">
            <input
              type="checkbox"
              :checked="settingsStore.settings.bgMusicEnabled"
              @change="toggleMusicEnabled"
            >
            <span class="toggle-slider"></span>
          </label>
        </div>

        <div class="music-options" v-if="settingsStore.settings.bgMusicEnabled">
          <div class="music-grid">
            <button
              v-for="option in bgMusicOptions.filter(o => o.value !== 'none')"
              :key="option.value"
              class="music-option"
              :class="{ active: settingsStore.settings.bgMusicType === option.value }"
              @click="selectMusicType(option.value as Settings['bgMusicType'])"
            >
              <span class="music-icon">{{ option.icon }}</span>
              <span class="music-label">{{ option.label }}</span>
            </button>
          </div>

          <div class="volume-control">
            <label>音量</label>
            <input
              type="range"
              min="0"
              max="100"
              :value="settingsStore.settings.volume"
              @input="updateVolume(Number(($event.target as HTMLInputElement).value))"
              class="volume-slider"
            >
            <span class="volume-value">{{ settingsStore.settings.volume }}%</span>
          </div>

          <div class="preview-control">
            <button
              class="btn btn-secondary"
              :class="{ 'btn-primary': isPreviewing }"
              @click="togglePreview"
              :disabled="settingsStore.settings.bgMusicType === 'none'"
            >
              <span v-if="isPreviewing">🔊 停止试听</span>
              <span v-else>▶️ 试听</span>
            </button>
            <span class="preview-hint">点击试听当前选择的白噪音</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 数据管理 -->
    <div v-if="activeTab === 'data'" class="settings-section">
      <div class="setting-card">
        <h3>💾 数据备份与恢复</h3>

        <div class="data-actions">
          <div class="data-action">
            <div class="action-info">
              <h4>导出数据</h4>
              <p>将所有任务、记录和设置导出为 JSON 文件</p>
            </div>
            <button class="btn btn-primary" @click="exportData">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              导出
            </button>
          </div>

          <div class="data-action">
            <div class="action-info">
              <h4>导入数据</h4>
              <p>从 JSON 文件恢复数据（将覆盖现有数据）</p>
            </div>
            <label class="btn btn-secondary" style="cursor: pointer;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              导入
              <input type="file" accept=".json" @change="importData" style="display: none;">
            </label>
          </div>

          <p v-if="importError" class="error-message">{{ importError }}</p>
        </div>
      </div>

      <div class="setting-card danger-zone">
        <h3>⚠️ 危险区域</h3>

        <div class="data-action">
          <div class="action-info">
            <h4>清空所有数据</h4>
            <p>此操作不可撤销，将删除所有任务、记录和重置设置</p>
          </div>
          <button class="btn btn-danger" @click="showClearConfirm = true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
            清空数据
          </button>
        </div>
      </div>
    </div>

    <!-- 清空确认弹窗 -->
    <div v-if="showClearConfirm" class="modal-overlay" @click="showClearConfirm = false">
      <div class="modal" @click.stop>
        <div class="modal-icon">⚠️</div>
        <h3>确定要清空所有数据吗？</h3>
        <p>此操作不可撤销，所有任务、记录和设置将被永久删除！</p>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showClearConfirm = false">取消</button>
          <button class="btn btn-danger" @click="clearAllData">确认清空</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-view {
  max-width: 700px;
  margin: 0 auto;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 28px;
  font-weight: 800;
  color: var(--color-text);
  margin-bottom: 24px;
}

.settings-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.settings-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  background: white;
  color: var(--color-text);
  font-family: var(--font-family);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.settings-tab:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.settings-tab.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.tab-icon {
  font-size: 18px;
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.setting-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 24px;
  border: 2px solid var(--color-border);
}

.setting-card h3 {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.duration-settings {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.duration-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: var(--color-bg);
  border-radius: var(--radius-md);
}

.duration-item label {
  font-weight: 600;
  color: var(--color-text);
}

.duration-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.duration-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius-sm);
  background: white;
  color: var(--color-primary);
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-sm);
}

.duration-btn:hover {
  background: var(--color-primary);
  color: white;
}

.duration-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text);
  min-width: 36px;
  text-align: center;
}

.interval-text {
  font-size: 14px;
  color: var(--color-text-light);
}

.toggle-setting {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid var(--color-border);
}

.toggle-setting:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.toggle-info label {
  display: block;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 4px;
}

.toggle-desc {
  font-size: 14px;
  color: var(--color-text-light);
}

.toggle-switch {
  position: relative;
  width: 52px;
  height: 28px;
  cursor: pointer;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-border);
  border-radius: 28px;
  transition: 0.3s;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  height: 22px;
  width: 22px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  border-radius: 50%;
  transition: 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle-switch input:checked + .toggle-slider {
  background-color: var(--color-primary);
}

.toggle-switch input:checked + .toggle-slider::before {
  transform: translateX(24px);
}

.notification-status {
  display: flex;
  align-items: center;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge.success {
  background: #4ECDC420;
  color: #4ECDC4;
}

.status-badge.error {
  background: #FF6B6B20;
  color: #FF6B6B;
}

.btn-small {
  padding: 6px 12px;
  font-size: 12px;
}

.music-options {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
}

.music-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.music-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.music-option:hover {
  border-color: var(--color-primary);
}

.music-option.active {
  border-color: var(--color-primary);
  background: var(--color-bg);
}

.music-icon {
  font-size: 28px;
}

.music-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text);
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.volume-control label {
  font-weight: 600;
  color: var(--color-text);
}

.volume-slider {
  flex: 1;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--color-border);
  border-radius: 3px;
  outline: none;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  background: var(--color-primary);
  border-radius: 50%;
  cursor: pointer;
}

.volume-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  min-width: 40px;
  text-align: right;
}

.preview-control {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
}

.preview-control .btn {
  padding: 10px 20px;
  font-size: 14px;
}

.preview-hint {
  font-size: 13px;
  color: var(--color-text-light);
}

.data-actions {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.data-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: var(--color-bg);
  border-radius: var(--radius-md);
  flex-wrap: wrap;
  gap: 12px;
}

.action-info h4 {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 4px;
}

.action-info p {
  font-size: 13px;
  color: var(--color-text-light);
}

.danger-zone {
  border-color: #FF6B6B40;
}

.danger-zone h3 {
  color: #FF6B6B;
}

.error-message {
  color: #FF6B6B;
  font-size: 14px;
  padding: 8px 16px;
  background: #FF6B6B15;
  border-radius: var(--radius-sm);
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
  animation: bounce 0.3s ease;
}

.modal-icon {
  font-size: 48px;
  margin-bottom: 16px;
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

@media (max-width: 640px) {
  .music-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .data-action {
    flex-direction: column;
    align-items: stretch;
  }

  .duration-item {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
}
</style>
