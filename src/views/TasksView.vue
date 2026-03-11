<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTasksStore } from '@/stores/tasks'
import { useTimerStore } from '@/stores/timer'
import type { Task, TaskPriority, TaskStatus } from '@/types'

const tasksStore = useTasksStore()
const timerStore = useTimerStore()

const filter = ref<'all' | 'todo' | 'doing' | 'done'>('all')

const showAddModal = ref(false)
const editingTask = ref<Task | null>(null)

const newTask = ref({
  title: '',
  estimatedPomos: 1,
  priority: 'medium' as TaskPriority,
})

const filteredTasks = computed(() => {
  let tasks = tasksStore.tasks
  if (filter.value !== 'all') {
    tasks = tasks.filter(t => t.status === filter.value)
  }
  // 排序：进行中 > 待办 > 已完成，同状态按优先级
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  const statusOrder = { doing: 0, todo: 1, done: 2 }
  return tasks.sort((a, b) => {
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status]
    }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })
})

const currentTaskId = computed(() => tasksStore.currentTaskId)

const priorityOptions: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'high', label: '高', color: '#FF6B6B' },
  { value: 'medium', label: '中', color: '#FFE66D' },
  { value: 'low', label: '低', color: '#4ECDC4' },
]

const statusLabels: Record<TaskStatus, string> = {
  todo: '待办',
  doing: '进行中',
  done: '已完成',
}

const statusColors: Record<TaskStatus, string> = {
  todo: '#636E72',
  doing: '#FF6B6B',
  done: '#4ECDC4',
}

function openAddModal() {
  editingTask.value = null
  newTask.value = {
    title: '',
    estimatedPomos: 1,
    priority: 'medium',
  }
  showAddModal.value = true
}

function openEditModal(task: Task) {
  editingTask.value = task
  newTask.value = {
    title: task.title,
    estimatedPomos: task.estimatedPomos,
    priority: task.priority,
  }
  showAddModal.value = true
}

function closeModal() {
  showAddModal.value = false
  editingTask.value = null
}

function saveTask() {
  if (!newTask.value.title.trim()) return

  if (editingTask.value) {
    tasksStore.updateTask(editingTask.value.id, {
      title: newTask.value.title,
      estimatedPomos: newTask.value.estimatedPomos,
      priority: newTask.value.priority,
    })
  } else {
    tasksStore.addTask(
      newTask.value.title,
      newTask.value.estimatedPomos,
      newTask.value.priority
    )
  }
  closeModal()
}

function selectTask(taskId: string) {
  tasksStore.setCurrentTask(taskId)
  timerStore.setCurrentTask(taskId)
}

function completeTask(task: Task) {
  tasksStore.completeTask(task.id)
}

function deleteTask(taskId: string) {
  if (confirm('确定要删除这个任务吗？')) {
    tasksStore.deleteTask(taskId)
  }
}

function getProgressWidth(task: Task): string {
  const percentage = Math.min((task.actualPomos / task.estimatedPomos) * 100, 100)
  return `${percentage}%`
}
</script>

<template>
  <div class="tasks-view">
    <div class="page-header">
      <h1 class="page-title">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
        </svg>
        任务列表
      </h1>
      <button class="btn btn-primary" @click="openAddModal">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        新建任务
      </button>
    </div>

    <!-- 筛选标签 -->
    <div class="filter-tabs">
      <button
        v-for="tab in [
          { key: 'all', label: '全部' },
          { key: 'todo', label: '待办' },
          { key: 'doing', label: '进行中' },
          { key: 'done', label: '已完成' },
        ]"
        :key="tab.key"
        class="filter-tab"
        :class="{ active: filter === tab.key }"
        @click="filter = tab.key as any"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 任务列表 -->
    <div class="tasks-list">
      <div
        v-for="task in filteredTasks"
        :key="task.id"
        class="task-item"
        :class="{
          'task-current': task.id === currentTaskId,
          'task-done': task.status === 'done',
        }"
      >
        <!-- 优先级指示器 -->
        <div
          class="priority-indicator"
          :style="{ backgroundColor: priorityOptions.find(p => p.value === task.priority)?.color }"
        ></div>

        <div class="task-content">
          <div class="task-main">
            <h3 class="task-title">{{ task.title }}</h3>
            <span
              class="task-status"
              :style="{ backgroundColor: statusColors[task.status] + '20', color: statusColors[task.status] }"
            >
              {{ statusLabels[task.status] }}
            </span>
          </div>

          <!-- 进度条 -->
          <div class="task-progress">
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{
                  width: getProgressWidth(task),
                  backgroundColor: task.status === 'done' ? '#4ECDC4' : '#FF6B6B',
                }"
              ></div>
            </div>
            <span class="progress-text">
              {{ task.actualPomos }}/{{ task.estimatedPomos }} 🍅
            </span>
          </div>

          <div class="task-meta">
            <span class="priority-badge" :style="{ color: priorityOptions.find(p => p.value === task.priority)?.color }">
              {{ priorityOptions.find(p => p.value === task.priority)?.label }}优先级
            </span>
            <span class="task-date">
              {{ new Date(task.createdAt).toLocaleDateString() }}
            </span>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="task-actions">
          <button
            v-if="task.status !== 'done'"
            class="action-btn action-select"
            :class="{ active: task.id === currentTaskId }"
            @click="selectTask(task.id)"
            :disabled="task.id === currentTaskId"
          >
            {{ task.id === currentTaskId ? '进行中' : '选择' }}
          </button>

          <button
            v-if="task.status === 'doing'"
            class="action-btn action-complete"
            @click="completeTask(task)"
          >
            完成
          </button>

          <button class="action-btn action-edit" @click="openEditModal(task)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>

          <button class="action-btn action-delete" @click="deleteTask(task.id)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </button>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredTasks.length === 0" class="empty-state">
        <div class="empty-icon">📋</div>
        <p>{{ filter === 'all' ? '还没有任务，创建一个吧！' : '该分类下没有任务' }}</p>
        <button v-if="filter === 'all'" class="btn btn-primary" @click="openAddModal">
          创建第一个任务
        </button>
      </div>
    </div>

    <!-- 添加/编辑任务弹窗 -->
    <div v-if="showAddModal" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <h3>{{ editingTask ? '编辑任务' : '新建任务' }}</h3>

        <div class="form-group">
          <label>任务名称</label>
          <input
            v-model="newTask.title"
            type="text"
            class="input"
            placeholder="输入任务名称..."
            @keyup.enter="saveTask"
          />
        </div>

        <div class="form-group">
          <label>预估番茄数</label>
          <div class="pomo-selector">
            <button
              v-for="n in 8"
              :key="n"
              class="pomo-btn"
              :class="{ active: newTask.estimatedPomos === n }"
              @click="newTask.estimatedPomos = n"
            >
              {{ n }}
            </button>
          </div>
        </div>

        <div class="form-group">
          <label>优先级</label>
          <div class="priority-selector">
            <button
              v-for="opt in priorityOptions"
              :key="opt.value"
              class="priority-btn"
              :class="{ active: newTask.priority === opt.value }"
              :style="{
                backgroundColor: newTask.priority === opt.value ? opt.color : 'transparent',
                borderColor: opt.color,
                color: newTask.priority === opt.value ? 'white' : opt.color,
              }"
              @click="newTask.priority = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" @click="closeModal">取消</button>
          <button class="btn btn-primary" @click="saveTask" :disabled="!newTask.title.trim()">
            {{ editingTask ? '保存' : '创建' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tasks-view {
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 28px;
  font-weight: 800;
  color: var(--color-text);
}

.filter-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.filter-tab {
  padding: 8px 20px;
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

.filter-tab:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.filter-tab.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  display: flex;
  align-items: stretch;
  background: white;
  border-radius: var(--radius-lg);
  border: 2px solid var(--color-border);
  overflow: hidden;
  transition: all 0.3s ease;
}

.task-item:hover {
  box-shadow: var(--shadow-sm);
}

.task-current {
  border-color: var(--color-primary);
  background: linear-gradient(to right, rgba(255, 107, 107, 0.05), white);
}

.task-done {
  opacity: 0.7;
}

.task-done .task-title {
  text-decoration: line-through;
}

.priority-indicator {
  width: 6px;
  flex-shrink: 0;
}

.task-content {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-main {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.task-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
  flex: 1;
}

.task-status {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.task-progress {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: var(--color-bg);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-light);
  white-space: nowrap;
}

.task-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--color-text-light);
}

.priority-badge {
  font-weight: 600;
}

.task-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border-left: 1px solid var(--color-border);
}

.action-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  color: var(--color-text);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.action-btn:hover {
  background: var(--color-primary);
  color: white;
}

.action-btn.action-select {
  width: auto;
  padding: 0 16px;
  font-family: var(--font-family);
  font-size: 14px;
  font-weight: 600;
}

.action-btn.action-select.active {
  background: var(--color-primary);
  color: white;
}

.action-btn.action-complete {
  width: auto;
  padding: 0 16px;
  font-family: var(--font-family);
  font-size: 14px;
  font-weight: 600;
  background: var(--color-secondary);
  color: white;
}

.action-btn.action-complete:hover {
  background: #3DBBB3;
}

.action-delete:hover {
  background: #FF6B6B !important;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: var(--radius-lg);
  border: 2px dashed var(--color-border);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state p {
  color: var(--color-text-light);
  margin-bottom: 24px;
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
  width: 90%;
  max-width: 420px;
  box-shadow: var(--shadow-lg);
}

.modal h3 {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 8px;
}

.pomo-selector {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pomo-btn {
  width: 40px;
  height: 40px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: white;
  font-family: var(--font-family);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.pomo-btn:hover {
  border-color: var(--color-primary);
}

.pomo-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.priority-selector {
  display: flex;
  gap: 12px;
}

.priority-btn {
  flex: 1;
  padding: 10px;
  border: 2px solid;
  border-radius: var(--radius-md);
  font-family: var(--font-family);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

@media (max-width: 640px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .task-item {
    flex-direction: column;
  }

  .priority-indicator {
    width: 100%;
    height: 4px;
  }

  .task-actions {
    border-left: none;
    border-top: 1px solid var(--color-border);
    justify-content: flex-end;
  }
}
</style>
