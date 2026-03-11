import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Settings } from '@/types'
import { defaultSettings } from '@/types'
import { getNoiseGenerator } from '@/utils/audio'

const STORAGE_KEY = 'pomo-settings'

export const useSettingsStore = defineStore('settings', () => {
  // State
  const settings = ref<Settings>({ ...defaultSettings })
  const noiseGenerator = getNoiseGenerator()
  const isMusicPlaying = ref(false)

  // Getters
  const workDurationSeconds = computed(() => settings.value.workDuration * 60)
  const shortBreakDurationSeconds = computed(() => settings.value.shortBreakDuration * 60)
  const longBreakDurationSeconds = computed(() => settings.value.longBreakDuration * 60)

  // Actions
  function loadSettings() {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        settings.value = { ...defaultSettings, ...parsed }
      } catch (e) {
        console.error('Failed to load settings:', e)
      }
    }
  }

  function saveSettings() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings.value))
  }

  function updateSettings(newSettings: Partial<Settings>) {
    settings.value = { ...settings.value, ...newSettings }
    saveSettings()
  }

  function resetSettings() {
    settings.value = { ...defaultSettings }
    saveSettings()
  }

  // 白噪音控制
  function updateMusicSettings(enabled: boolean, type: Settings['bgMusicType'], volume: number) {
    settings.value.bgMusicEnabled = enabled
    settings.value.bgMusicType = type
    settings.value.volume = volume
    noiseGenerator.setVolume(volume)

    if (enabled && type !== 'none') {
      noiseGenerator.play(type)
      isMusicPlaying.value = true
    } else {
      noiseGenerator.stop()
      isMusicPlaying.value = false
    }
    saveSettings()
  }

  function playMusic() {
    if (settings.value.bgMusicEnabled && settings.value.bgMusicType !== 'none') {
      noiseGenerator.setVolume(settings.value.volume)
      noiseGenerator.play(settings.value.bgMusicType)
      isMusicPlaying.value = true
    }
  }

  function stopMusic() {
    noiseGenerator.stop()
    isMusicPlaying.value = false
  }

  function setVolume(volume: number) {
    settings.value.volume = volume
    noiseGenerator.setVolume(volume)
    saveSettings()
  }

  // 初始化时加载
  loadSettings()

  return {
    settings,
    isMusicPlaying,
    workDurationSeconds,
    shortBreakDurationSeconds,
    longBreakDurationSeconds,
    loadSettings,
    saveSettings,
    updateSettings,
    resetSettings,
    updateMusicSettings,
    playMusic,
    stopMusic,
    setVolume,
  }
})
