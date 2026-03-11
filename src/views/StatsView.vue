<script setup lang="ts">
import { computed, ref } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { useRecordsStore } from '@/stores/records'
import { useTasksStore } from '@/stores/tasks'

use([
  CanvasRenderer,
  LineChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
])

const recordsStore = useRecordsStore()
const tasksStore = useTasksStore()

const timeRange = ref<'week' | 'month'>('week')

// 今日统计
const todayStats = computed(() => {
  const today = new Date().toDateString()
  const todayRecords = recordsStore.records.filter(
    r => new Date(r.startedAt).toDateString() === today
  )

  const completed = todayRecords.filter(r => r.type === 'work' && r.completed).length
  const totalMinutes = todayRecords
    .filter(r => r.type === 'work' && r.completed)
    .reduce((sum, r) => sum + r.duration, 0) / 60

  return {
    pomos: completed,
    minutes: Math.round(totalMinutes),
    hours: (totalMinutes / 60).toFixed(1),
  }
})

// 总统计
const totalStats = computed(() => {
  const allCompleted = recordsStore.records.filter(r => r.type === 'work' && r.completed)
  const totalMinutes = allCompleted.reduce((sum, r) => sum + r.duration, 0) / 60

  return {
    pomos: allCompleted.length,
    hours: (totalMinutes / 60).toFixed(1),
    days: new Set(allCompleted.map(r => new Date(r.startedAt).toDateString())).size,
  }
})

// 趋势图数据
const trendChartOption = computed(() => {
  const stats = timeRange.value === 'week' ? recordsStore.weeklyStats : recordsStore.monthlyStats
  const dates = Object.keys(stats)
  const values = Object.values(stats)

  return {
    title: {
      text: timeRange.value === 'week' ? '近7天番茄数' : '近30天番茄数',
      left: 'center',
      textStyle: {
        fontFamily: 'Nunito',
        fontSize: 16,
        fontWeight: 700,
        color: '#2D3436',
      },
    },
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: {c} 🍅',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: dates.map(d => {
        const date = new Date(d)
        return `${date.getMonth() + 1}/${date.getDate()}`
      }),
      axisLine: {
        lineStyle: { color: '#FFE0E0' },
      },
      axisLabel: {
        color: '#636E72',
        fontFamily: 'Nunito',
      },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLine: { show: false },
      splitLine: {
        lineStyle: { color: '#FFF5F5' },
      },
      axisLabel: {
        color: '#636E72',
        fontFamily: 'Nunito',
      },
    },
    series: [
      {
        data: values,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          color: '#FF6B6B',
          width: 3,
        },
        itemStyle: {
          color: '#FF6B6B',
          borderColor: '#fff',
          borderWidth: 2,
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(255, 107, 107, 0.3)' },
              { offset: 1, color: 'rgba(255, 107, 107, 0.05)' },
            ],
          },
        },
      },
    ],
  }
})

// 任务分布数据
const taskDistribution = computed(() => {
  const distribution = {
    todo: tasksStore.tasks.filter(t => t.status === 'todo').length,
    doing: tasksStore.tasks.filter(t => t.status === 'doing').length,
    done: tasksStore.tasks.filter(t => t.status === 'done').length,
  }

  return {
    title: {
      text: '任务状态分布',
      left: 'center',
      textStyle: {
        fontFamily: 'Nunito',
        fontSize: 16,
        fontWeight: 700,
        color: '#2D3436',
      },
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      bottom: '5%',
      textStyle: {
        fontFamily: 'Nunito',
        color: '#636E72',
      },
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold',
            fontFamily: 'Nunito',
          },
        },
        data: [
          { value: distribution.todo, name: '待办', itemStyle: { color: '#636E72' } },
          { value: distribution.doing, name: '进行中', itemStyle: { color: '#FF6B6B' } },
          { value: distribution.done, name: '已完成', itemStyle: { color: '#4ECDC4' } },
        ],
      },
    ],
  }
})

// 历史记录
const recentRecords = computed(() => {
  return [...recordsStore.records]
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, 20)
})

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}分${secs}秒`
}

function getRecordTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    work: '专注',
    shortBreak: '短休息',
    longBreak: '长休息',
  }
  return labels[type] || type
}

function getRecordTypeColor(type: string): string {
  const colors: Record<string, string> = {
    work: '#FF6B6B',
    shortBreak: '#4ECDC4',
    longBreak: '#95E1D3',
  }
  return colors[type] || '#FF6B6B'
}
</script>

<template>
  <div class="stats-view">
    <h1 class="page-title">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 3v18h18" />
        <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
      </svg>
      数据统计
    </h1>

    <!-- 今日概览卡片 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon">🍅</div>
        <div class="stat-value">{{ todayStats.pomos }}</div>
        <div class="stat-label">今日番茄</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⏱️</div>
        <div class="stat-value">{{ todayStats.hours }}</div>
        <div class="stat-label">今日小时</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-value">{{ totalStats.pomos }}</div>
        <div class="stat-label">总番茄数</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📅</div>
        <div class="stat-value">{{ totalStats.days }}</div>
        <div class="stat-label">活跃天数</div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-grid">
      <div class="chart-card">
        <div class="chart-header">
          <h3>趋势分析</h3>
          <div class="chart-tabs">
            <button
              class="chart-tab"
              :class="{ active: timeRange === 'week' }"
              @click="timeRange = 'week'"
            >
              近7天
            </button>
            <button
              class="chart-tab"
              :class="{ active: timeRange === 'month' }"
              @click="timeRange = 'month'"
            >
              近30天
            </button>
          </div>
        </div>
        <v-chart class="chart" :option="trendChartOption" autoresize />
      </div>

      <div class="chart-card">
        <v-chart class="chart pie-chart" :option="taskDistribution" autoresize />
      </div>
    </div>

    <!-- 历史记录 -->
    <div class="history-card">
      <h3 class="history-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        最近记录
      </h3>
      <div class="history-list">
        <div
          v-for="record in recentRecords"
          :key="record.id"
          class="history-item"
        >
          <div
            class="history-type"
            :style="{ backgroundColor: getRecordTypeColor(record.type) + '20', color: getRecordTypeColor(record.type) }"
          >
            {{ getRecordTypeLabel(record.type) }}
          </div>
          <div class="history-info">
            <div class="history-task">
              {{ record.taskId ? tasksStore.tasks.find(t => t.id === record.taskId)?.title || '未知任务' : '未关联任务' }}
            </div>
            <div class="history-time">
              {{ new Date(record.startedAt).toLocaleString() }}
            </div>
          </div>
          <div class="history-duration">
            {{ formatDuration(record.duration) }}
          </div>
          <div class="history-status">
            <span v-if="record.completed" class="status-badge success">✓</span>
            <span v-else class="status-badge failed">✗</span>
          </div>
        </div>
        <div v-if="recentRecords.length === 0" class="empty-history">
          还没有记录，开始你的第一个番茄吧！
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stats-view {
  max-width: 1000px;
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

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 24px;
  text-align: center;
  border: 2px solid var(--color-border);
  transition: all 0.3s ease;
}

.stat-card:hover {
  box-shadow: var(--shadow-sm);
  transform: translateY(-2px);
}

.stat-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 36px;
  font-weight: 800;
  color: var(--color-primary);
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: var(--color-text-light);
  margin-top: 8px;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
}

.chart-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 24px;
  border: 2px solid var(--color-border);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.chart-header h3 {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text);
}

.chart-tabs {
  display: flex;
  gap: 8px;
}

.chart-tab {
  padding: 6px 12px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: white;
  font-family: var(--font-family);
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.3s ease;
}

.chart-tab:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.chart-tab.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.chart {
  width: 100%;
  height: 300px;
}

.pie-chart {
  height: 340px;
}

.history-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 24px;
  border: 2px solid var(--color-border);
}

.history-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 16px;
}

.history-list {
  max-height: 400px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  border-radius: var(--radius-md);
  transition: background 0.3s ease;
}

.history-item:hover {
  background: var(--color-bg);
}

.history-type {
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.history-info {
  flex: 1;
  min-width: 0;
}

.history-task {
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-time {
  font-size: 12px;
  color: var(--color-text-light);
  margin-top: 2px;
}

.history-duration {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-light);
  white-space: nowrap;
}

.history-status {
  width: 28px;
  text-align: center;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 14px;
}

.status-badge.success {
  background: #4ECDC4;
  color: white;
}

.status-badge.failed {
  background: #FF6B6B;
  color: white;
}

.empty-history {
  text-align: center;
  padding: 40px;
  color: var(--color-text-light);
}

@media (max-width: 640px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }

  .chart {
    height: 250px;
  }

  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .history-item {
    flex-wrap: wrap;
  }

  .history-duration {
    margin-left: auto;
  }
}
</style>
