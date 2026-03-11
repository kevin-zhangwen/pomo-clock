import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { PomoRecord, TimerType } from '@/types'

const STORAGE_KEY = 'pomo-records'

export const useRecordsStore = defineStore('records', () => {
  // State
  const records = ref<PomoRecord[]>([])

  // Getters
  const todayRecords = computed(() => {
    const today = new Date().toDateString()
    return records.value.filter(r => new Date(r.startedAt).toDateString() === today)
  })

  const todayCompletedPomos = computed(() => {
    return todayRecords.value.filter(r => r.type === 'work' && r.completed).length
  })

  const weeklyStats = computed(() => {
    const stats: Record<string, number> = {}
    const today = new Date()
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toDateString()
      const count = records.value.filter(
        r => new Date(r.startedAt).toDateString() === dateStr && r.type === 'work' && r.completed
      ).length
      stats[dateStr] = count
    }
    return stats
  })

  const monthlyStats = computed(() => {
    const stats: Record<string, number> = {}
    const today = new Date()
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toDateString()
      const count = records.value.filter(
        r => new Date(r.startedAt).toDateString() === dateStr && r.type === 'work' && r.completed
      ).length
      stats[dateStr] = count
    }
    return stats
  })

  // Actions
  function loadRecords() {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        records.value = JSON.parse(saved)
      } catch (e) {
        console.error('Failed to load records:', e)
      }
    }
  }

  function saveRecords() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records.value))
  }

  function addRecord(type: TimerType, taskId: string | null, duration: number, completed: boolean): PomoRecord {
    const record: PomoRecord = {
      id: Date.now().toString(),
      taskId,
      type,
      duration,
      startedAt: new Date().toISOString(),
      completed,
    }
    records.value.push(record)
    saveRecords()
    return record
  }

  function getRecordsByDate(date: Date): PomoRecord[] {
    const dateStr = date.toDateString()
    return records.value.filter(r => new Date(r.startedAt).toDateString() === dateStr)
  }

  function getTaskPomoCount(taskId: string): number {
    return records.value.filter(r => r.taskId === taskId && r.type === 'work' && r.completed).length
  }

  function exportData(): string {
    return JSON.stringify({
      records: records.value,
      exportDate: new Date().toISOString(),
    }, null, 2)
  }

  function importData(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr)
      if (data.records && Array.isArray(data.records)) {
        records.value = data.records
        saveRecords()
        return true
      }
      return false
    } catch (e) {
      console.error('Failed to import data:', e)
      return false
    }
  }

  function clearAllRecords() {
    records.value = []
    saveRecords()
  }

  // 初始化时加载
  loadRecords()

  return {
    records,
    todayRecords,
    todayCompletedPomos,
    weeklyStats,
    monthlyStats,
    loadRecords,
    saveRecords,
    addRecord,
    getRecordsByDate,
    getTaskPomoCount,
    exportData,
    importData,
    clearAllRecords,
  }
})
