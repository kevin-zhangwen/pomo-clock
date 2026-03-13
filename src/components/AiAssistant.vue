<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { createPageAgent, disposePageAgent, type PageAgentOptions } from '@/utils/pageAgent'

const props = defineProps<{
  options?: PageAgentOptions
}>()

const isVisible = ref(false)
const isInitialized = ref(false)
const agentContainer = ref<HTMLElement | null>(null)

function initializeAgent() {
  if (isInitialized.value) return

  // 如果有环境变量配置的 API Key，自动使用真实 LLM
  const agent = createPageAgent({
    useDemo: props.options?.useDemo,
    apiKey: props.options?.apiKey,
    baseURL: props.options?.baseURL,
    model: props.options?.model,
    language: props.options?.language ?? 'zh-CN',
  })

  if (agent.panel && agentContainer.value) {
    agentContainer.value.appendChild(agent.panel.wrapper)
    agent.panel.collapse()
  }

  isInitialized.value = true
}

function togglePanel() {
  if (!isInitialized.value) {
    initializeAgent()
  }

  const agent = createPageAgent(props.options)
  if (agent.panel) {
    if (isVisible.value) {
      agent.panel.hide()
    } else {
      agent.panel.show()
    }
    isVisible.value = !isVisible.value
  }
}

onMounted(() => {
  initializeAgent()
})

onUnmounted(() => {
  disposePageAgent()
})
</script>

<template>
  <div class="ai-assistant">
    <button class="ai-toggle-btn" @click="togglePanel" :title="isVisible ? '关闭 AI 助手' : '打开 AI 助手'">
      <svg v-if="!isVisible" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M7.5 13A1.5 1.5 0 1 0 9 14.5 1.5 1.5 0 0 0 7.5 13m9 0a1.5 1.5 0 1 0 1.5 1.5 1.5 1.5 0 0 0-1.5-1.5M12 17.5a4.5 4.5 0 0 0 4.5-4.5h-9a4.5 4.5 0 0 0 4.5 4.5" />
      </svg>
      <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
    <div ref="agentContainer" class="agent-panel-container"></div>
  </div>
</template>

<style scoped>
.ai-assistant {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
}

.ai-toggle-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
}

.ai-toggle-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.ai-toggle-btn:active {
  transform: scale(0.95);
}

.agent-panel-container {
  position: absolute;
  bottom: 70px;
  right: 0;
}
</style>
