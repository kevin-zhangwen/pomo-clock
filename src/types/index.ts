// 任务状态
export type TaskStatus = 'todo' | 'doing' | 'done'

// 任务优先级
export type TaskPriority = 'low' | 'medium' | 'high'

// 计时器类型
export type TimerType = 'work' | 'shortBreak' | 'longBreak'

// 任务
export interface Task {
  id: string
  title: string
  estimatedPomos: number
  actualPomos: number
  priority: TaskPriority
  status: TaskStatus
  createdAt: string
}

// 番茄记录
export interface PomoRecord {
  id: string
  taskId: string | null
  type: TimerType
  duration: number // 实际时长（秒）
  startedAt: string
  completed: boolean // 是否完成（未打断）
}

// 用户设置
export interface Settings {
  // 时长设置（分钟）
  workDuration: number
  shortBreakDuration: number
  longBreakDuration: number
  longBreakInterval: number

  // 提醒设置
  soundEnabled: boolean
  notificationEnabled: boolean

  // 动画设置
  animationEnabled: boolean

  // 背景音乐设置
  bgMusicEnabled: boolean
  bgMusicType: 'rain' | 'cafe' | 'forest' | 'none'
  volume: number // 0-100
}

// 计时器状态
export interface TimerState {
  timeLeft: number // 剩余秒数
  totalTime: number // 总秒数
  isRunning: boolean
  isPaused: boolean
  currentType: TimerType
  currentTaskId: string | null
  completedPomos: number // 当前会话完成的番茄数
}

// 默认设置
export const defaultSettings: Settings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  soundEnabled: true,
  notificationEnabled: true,
  animationEnabled: true,
  bgMusicEnabled: false,
  bgMusicType: 'rain',
  volume: 50,
}
