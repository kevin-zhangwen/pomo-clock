import { PageAgent } from 'page-agent'

const agent = new PageAgent({
  baseURL: 'https://page-agent-demo.alibaba-inc.com/api/v1',
  apiKey: 'demo',
  model: 'demo',
  language: 'zh-CN',
})

export async function testStartTimer() {
  console.log('测试：开始番茄钟')
  const result = await agent.execute('点击开始按钮，启动一个番茄钟')
  console.log('结果：', result)
  return result
}

export async function testAddTask() {
  console.log('测试：添加任务')
  const result = await agent.execute('导航到任务页面，添加一个名为"学习 PageAgent"的新任务')
  console.log('结果：', result)
  return result
}

export async function testViewStats() {
  console.log('测试：查看统计')
  const result = await agent.execute('导航到统计页面，查看今日番茄钟统计')
  console.log('结果：', result)
  return result
}

export async function testChangeSettings() {
  console.log('测试：修改设置')
  const result = await agent.execute('导航到设置页面，将番茄钟时长改为30分钟')
  console.log('结果：', result)
  return result
}

export async function runAllTests() {
  console.log('=== 开始自动化测试 ===')

  try {
    await testStartTimer()
    await testAddTask()
    await testViewStats()
    await testChangeSettings()
    console.log('=== 所有测试完成 ===')
  } catch (error) {
    console.error('测试失败：', error)
  }
}

if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).pageAgentTests = {
    testStartTimer,
    testAddTask,
    testViewStats,
    testChangeSettings,
    runAllTests,
  }
  console.log('PageAgent 测试已加载。使用 window.pageAgentTests.runAllTests() 运行所有测试')
}
