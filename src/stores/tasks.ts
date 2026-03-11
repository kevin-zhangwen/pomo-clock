import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Task, TaskStatus, TaskPriority } from '@/types'

const STORAGE_KEY = 'pomo-tasks'

export const useTasksStore = defineStore('tasks', () => {
  // State
  const tasks = ref<Task[]>([])
  const currentTaskId = ref<string | null>(null)

  // Getters
  const todoTasks = () => tasks.value.filter(t => t.status === 'todo')
  const doingTasks = () => tasks.value.filter(t => t.status === 'doing')
  const doneTasks = () => tasks.value.filter(t => t.status === 'done')
  const currentTask = () => tasks.value.find(t => t.id === currentTaskId.value) || null

  // Actions
  function loadTasks() {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        tasks.value = JSON.parse(saved)
      } catch (e) {
        console.error('Failed to load tasks:', e)
      }
    }
  }

  function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks.value))
  }

  function addTask(title: string, estimatedPomos: number = 1, priority: TaskPriority = 'medium') {
    const task: Task = {
      id: Date.now().toString(),
      title,
      estimatedPomos,
      actualPomos: 0,
      priority,
      status: 'todo',
      createdAt: new Date().toISOString(),
    }
    tasks.value.push(task)
    saveTasks()
    return task
  }

  function updateTask(id: string, updates: { title?: string; estimatedPomos?: number; actualPomos?: number; priority?: TaskPriority; status?: TaskStatus; createdAt?: string }) {
    const currentTask = tasks.value.find(t => t.id === id)
    if (currentTask) {
      currentTask.title = updates.title ?? currentTask.title
      currentTask.estimatedPomos = updates.estimatedPomos ?? currentTask.estimatedPomos
      currentTask.actualPomos = updates.actualPomos ?? currentTask.actualPomos
      currentTask.priority = updates.priority ?? currentTask.priority
      currentTask.status = updates.status ?? currentTask.status
      currentTask.createdAt = updates.createdAt ?? currentTask.createdAt
      saveTasks()
    }
  }

  function deleteTask(id: string) {
    tasks.value = tasks.value.filter(t => t.id !== id)
    if (currentTaskId.value === id) {
      currentTaskId.value = null
    }
    saveTasks()
  }

  function setCurrentTask(id: string | null) {
    currentTaskId.value = id
    if (id) {
      updateTask(id, { status: 'doing' })
    }
  }

  function completeTask(id: string) {
    updateTask(id, { status: 'done' })
    if (currentTaskId.value === id) {
      currentTaskId.value = null
    }
  }

  function incrementTaskPomos(id: string) {
    const task = tasks.value.find(t => t.id === id)
    if (task) {
      updateTask(id, { actualPomos: task.actualPomos + 1 })
    }
  }

  // 初始化时加载
  loadTasks()

  return {
    tasks,
    currentTaskId,
    todoTasks,
    doingTasks,
    doneTasks,
    currentTask,
    loadTasks,
    saveTasks,
    addTask,
    updateTask,
    deleteTask,
    setCurrentTask,
    completeTask,
    incrementTaskPomos,
  }
})
