import { PageAgent, type AgentConfig } from 'page-agent'

export interface PageAgentOptions {
  useDemo?: boolean
  apiKey?: string
  baseURL?: string
  model?: string
  language?: 'en-US' | 'zh-CN'
}

let pageAgentInstance: PageAgent | null = null

// 从环境变量获取 API Key
const getApiKeyFromEnv = (): string => {
  // Vite 环境变量
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viteKey = (import.meta as any).env?.VITE_DASHSCOPE_API_KEY
  if (viteKey) return viteKey

  return ''
}

export function createPageAgent(options: PageAgentOptions = {}): PageAgent {
  const envApiKey = getApiKeyFromEnv()

  const {
    useDemo = !envApiKey, // 如果没有配置 API Key，默认使用 Demo
    apiKey = envApiKey,
    baseURL = 'https://coding.dashscope.aliyuncs.com/apps/anthropic',
    model = 'qwen-plus',
    language = 'zh-CN',
  } = options

  if (pageAgentInstance) {
    pageAgentInstance.dispose()
    pageAgentInstance = null
  }

  const config: AgentConfig = useDemo
    ? {
        baseURL: 'https://page-agent-demo.alibaba-inc.com/api/v1',
        apiKey: 'demo',
        model: 'demo',
        language,
      }
    : {
        baseURL,
        apiKey,
        model,
        language,
      }

  pageAgentInstance = new PageAgent(config)

  return pageAgentInstance
}

export function getPageAgent(): PageAgent | null {
  return pageAgentInstance
}

export function disposePageAgent(): void {
  if (pageAgentInstance) {
    pageAgentInstance.dispose()
    pageAgentInstance = null
  }
}

export function showAgentPanel(): void {
  if (pageAgentInstance?.panel) {
    pageAgentInstance.panel.show()
  }
}

export function hideAgentPanel(): void {
  if (pageAgentInstance?.panel) {
    pageAgentInstance.panel.hide()
  }
}
