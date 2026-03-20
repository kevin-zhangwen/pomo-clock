import { PageAgent, type AgentConfig } from 'page-agent'

export interface PageAgentOptions {
  useDemo?: boolean
  apiKey?: string
  baseURL?: string
  model?: string
  language?: 'en-US' | 'zh-CN'
}

// API 配置常量
const DEFAULT_API_BASE_URL = 'https://coding.dashscope.aliyuncs.com/apps/anthropic'
const DEFAULT_MODEL = 'qwen-plus'
const DEMO_API_BASE_URL = 'https://page-agent-demo.alibaba-inc.com/api/v1'
const DEMO_MODEL = 'demo'

let pageAgentInstance: PageAgent | null = null

// 从环境变量获取 API Key（在模块加载时缓存）
const ENV_API_KEY: string = import.meta.env.VITE_DASHSCOPE_API_KEY ?? ''

export function createPageAgent(options: PageAgentOptions = {}): PageAgent {
  const {
    useDemo = !ENV_API_KEY, // 如果没有配置 API Key，默认使用 Demo
    apiKey = ENV_API_KEY,
    baseURL = DEFAULT_API_BASE_URL,
    model = DEFAULT_MODEL,
    language = 'zh-CN',
  } = options

  if (pageAgentInstance) {
    pageAgentInstance.dispose()
    pageAgentInstance = null
  }

  const config: AgentConfig = useDemo
    ? {
        baseURL: DEMO_API_BASE_URL,
        apiKey: 'demo',
        model: DEMO_MODEL,
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
