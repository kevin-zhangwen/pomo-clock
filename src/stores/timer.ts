import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { TimerType, TimerState } from '@/types'
import { useSettingsStore } from './settings'
import { useRecordsStore } from './records'
import { useTasksStore } from './tasks'

export const useTimerStore = defineStore('timer', () => {
  const settingsStore = useSettingsStore()
  const recordsStore = useRecordsStore()
  const tasksStore = useTasksStore()

  // State
  const state = ref<TimerState>({
    timeLeft: settingsStore.workDurationSeconds,
    totalTime: settingsStore.workDurationSeconds,
    isRunning: false,
    isPaused: false,
    currentType: 'work',
    currentTaskId: null,
    completedPomos: 0,
  })

  const timerInterval = ref<number | null>(null)
  const audioContext = ref<AudioContext | null>(null)

  // Getters
  const progress = computed(() => {
    return ((state.value.totalTime - state.value.timeLeft) / state.value.totalTime) * 100
  })

  const formattedTime = computed(() => {
    const minutes = Math.floor(state.value.timeLeft / 60)
    const seconds = state.value.timeLeft % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  })

  const currentColor = computed(() => {
    switch (state.value.currentType) {
      case 'work':
        return '#FF6B6B'
      case 'shortBreak':
        return '#4ECDC4'
      case 'longBreak':
        return '#95E1D3'
      default:
        return '#FF6B6B'
    }
  })

  const currentLabel = computed(() => {
    switch (state.value.currentType) {
      case 'work':
        return '专注中'
      case 'shortBreak':
        return '短休息'
      case 'longBreak':
        return '长休息'
      default:
        return '专注中'
    }
  })

  // Actions
  function initAudio() {
    if (!audioContext.value) {
      audioContext.value = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
  }

  function playSound(frequency: number = 800, duration: number = 0.2) {
    if (!settingsStore.settings.soundEnabled || !audioContext.value) return

    const oscillator = audioContext.value.createOscillator()
    const gainNode = audioContext.value.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.value.destination)

    oscillator.frequency.value = frequency
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.3, audioContext.value.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.value.currentTime + duration)

    oscillator.start(audioContext.value.currentTime)
    oscillator.stop(audioContext.value.currentTime + duration)
  }

  function playStartSound() {
    playSound(600, 0.1)
    setTimeout(() => playSound(800, 0.15), 150)
  }

  function playEndSound() {
    playSound(523, 0.1)
    setTimeout(() => playSound(659, 0.1), 100)
    setTimeout(() => playSound(784, 0.1), 200)
    setTimeout(() => playSound(1047, 0.3), 300)
  }

  function showNotification(title: string, body: string) {
    if (!settingsStore.settings.notificationEnabled) return

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/tomato.png' })
    }
  }

  function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }

  function getDurationForType(type: TimerType): number {
    switch (type) {
      case 'work':
        return settingsStore.workDurationSeconds
      case 'shortBreak':
        return settingsStore.shortBreakDurationSeconds
      case 'longBreak':
        return settingsStore.longBreakDurationSeconds
    }
  }

  function setTimerType(type: TimerType) {
    state.value.currentType = type
    const duration = getDurationForType(type)
    state.value.totalTime = duration
    state.value.timeLeft = duration
  }

  function switchToNextPhase() {
    const currentType = state.value.currentType

    // Save record for completed timer
    const duration = state.value.totalTime - state.value.timeLeft
    recordsStore.addRecord(currentType, state.value.currentTaskId, duration, duration > 10)

    // Update task pomos
    if (currentType === 'work' && state.value.currentTaskId) {
      tasksStore.incrementTaskPomos(state.value.currentTaskId)
    }

    // Determine next phase
    if (currentType === 'work') {
      state.value.completedPomos++

      // 停止背景音乐（休息时静音）
      settingsStore.stopMusic()

      // Check if long break is needed
      if (state.value.completedPomos % settingsStore.settings.longBreakInterval === 0) {
        setTimerType('longBreak')
        showNotification('长休息时间到了！', '恭喜你完成了一个番茄周期，好好放松一下吧~')
      } else {
        setTimerType('shortBreak')
        showNotification('短休息时间到了！', '完成了一个番茄，休息一下吧~')
      }
    } else {
      // Break is over, back to work
      setTimerType('work')
      showNotification('该专注了！', '休息结束，开始新的番茄吧~')
    }

    playEndSound()
    startTimer()
  }

  function tick() {
    if (state.value.timeLeft > 0) {
      state.value.timeLeft--
    } else {
      // Timer finished
      stopTimer()
      switchToNextPhase()
    }
  }

  function startTimer() {
    initAudio()
    requestNotificationPermission()

    if (state.value.isRunning) return

    state.value.isRunning = true
    state.value.isPaused = false
    playStartSound()

    // 工作时播放背景音乐，休息时暂停
    if (state.value.currentType === 'work') {
      settingsStore.playMusic()
    } else {
      settingsStore.stopMusic()
    }

    timerInterval.value = window.setInterval(tick, 1000)
  }

  function pauseTimer() {
    if (!state.value.isRunning) return

    state.value.isRunning = false
    state.value.isPaused = true

    if (timerInterval.value) {
      clearInterval(timerInterval.value)
      timerInterval.value = null
    }
  }

  function resumeTimer() {
    if (state.value.isRunning) return

    state.value.isRunning = true
    state.value.isPaused = false
    playStartSound()

    timerInterval.value = window.setInterval(tick, 1000)
  }

  function stopTimer() {
    state.value.isRunning = false
    state.value.isPaused = false

    if (timerInterval.value) {
      clearInterval(timerInterval.value)
      timerInterval.value = null
    }

    // 停止背景音乐
    settingsStore.stopMusic()
  }

  function resetTimer() {
    stopTimer()
    const duration = getDurationForType(state.value.currentType)
    state.value.timeLeft = duration
    state.value.totalTime = duration
  }

  function abandonTimer() {
    // Save incomplete record
    const duration = state.value.totalTime - state.value.timeLeft
    if (duration > 0) {
      recordsStore.addRecord(state.value.currentType, state.value.currentTaskId, duration, false)
    }

    stopTimer()
    resetTimer()
  }

  function skipPhase() {
    stopTimer()
    switchToNextPhase()
  }

  function setCurrentTask(taskId: string | null) {
    state.value.currentTaskId = taskId
  }

  // Reset timer when settings change
  function refreshDuration() {
    if (!state.value.isRunning && !state.value.isPaused) {
      const duration = getDurationForType(state.value.currentType)
      state.value.timeLeft = duration
      state.value.totalTime = duration
    }
  }

  return {
    state,
    progress,
    formattedTime,
    currentColor,
    currentLabel,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    resetTimer,
    abandonTimer,
    skipPhase,
    setCurrentTask,
    refreshDuration,
    playStartSound,
    playEndSound,
  }
})
