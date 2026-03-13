// 白噪音音频生成器
export class WhiteNoiseGenerator {
  private audioContext: AudioContext | null = null
  private nodes: AudioNode[] = []
  private gainNode: GainNode | null = null
  private isPlaying = false
  private currentType: 'rain' | 'cafe' | 'forest' | 'none' = 'none'
  private volume = 0.5

  constructor() {
    this.initAudioContext()
  }

  private initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    } catch (e) {
      console.error('Web Audio API not supported:', e)
    }
  }

  // 创建白噪音缓冲区
  private createWhiteNoiseBuffer(): AudioBuffer | null {
    if (!this.audioContext) return null

    const bufferSize = this.audioContext.sampleRate * 2 // 2秒缓冲区
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }

    return buffer
  }

  // 粉红噪音（更自然的白噪音）
  private createPinkNoiseBuffer(): AudioBuffer | null {
    if (!this.audioContext) return null

    const bufferSize = this.audioContext.sampleRate * 2
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
    const data = buffer.getChannelData(0)

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + white * 0.0555179
      b1 = 0.99332 * b1 + white * 0.0750759
      b2 = 0.96900 * b2 + white * 0.1538520
      b3 = 0.86650 * b3 + white * 0.3104856
      b4 = 0.55000 * b4 + white * 0.5329522
      b5 = -0.7616 * b5 - white * 0.0168980
      const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362
      data[i] = pink * 0.11
      b6 = white * 0.115926
    }

    return buffer
  }

  // 雨声音效
  private createRainNoise(): AudioNode | null {
    if (!this.audioContext) return null

    const buffer = this.createPinkNoiseBuffer()
    if (!buffer) return null

    const source = this.audioContext.createBufferSource()
    source.buffer = buffer
    source.loop = true

    // 低通滤波器，让雨声更柔和
    const filter = this.audioContext.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 800

    source.connect(filter)
    this.nodes.push(source, filter)

    return filter
  }

  // 咖啡馆音效（人声 + 餐具声模拟）
  private createCafeNoise(): AudioNode | null {
    if (!this.audioContext) return null

    const masterGain = this.audioContext.createGain()
    masterGain.gain.value = 0.6

    // 背景嗡嗡声
    const buffer = this.createPinkNoiseBuffer()
    if (buffer) {
      const bgSource = this.audioContext.createBufferSource()
      bgSource.buffer = buffer
      bgSource.loop = true

      const bgFilter = this.audioContext.createBiquadFilter()
      bgFilter.type = 'bandpass'
      bgFilter.frequency.value = 400
      bgFilter.Q.value = 0.5

      const bgGain = this.audioContext.createGain()
      bgGain.gain.value = 0.3

      bgSource.connect(bgFilter)
      bgFilter.connect(bgGain)
      bgGain.connect(masterGain)

      this.nodes.push(bgSource, bgFilter, bgGain)
      bgSource.start()
    }

    // 创建循环的随机"聊天"声
    this.createChatSounds(masterGain)

    this.nodes.push(masterGain)
    return masterGain
  }

  // 模拟咖啡馆聊天声
  private createChatSounds(destination: AudioNode) {
    if (!this.audioContext) return

    const createRandomChat = () => {
      if (!this.isPlaying || this.currentType !== 'cafe') return

      const oscillator = this.audioContext!.createOscillator()
      const gain = this.audioContext!.createGain()
      const filter = this.audioContext!.createBiquadFilter()

      // 随机频率模拟不同人的声音
      const freq = 150 + Math.random() * 400
      oscillator.frequency.value = freq
      oscillator.type = 'sawtooth'

      filter.type = 'bandpass'
      filter.frequency.value = freq
      filter.Q.value = 5

      // 随机音高变化模拟说话
      const now = this.audioContext!.currentTime
      oscillator.frequency.setValueAtTime(freq, now)
      oscillator.frequency.exponentialRampToValueAtTime(freq * (0.8 + Math.random() * 0.4), now + 0.1)

      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(0.05 + Math.random() * 0.05, now + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3 + Math.random() * 0.5)

      oscillator.connect(filter)
      filter.connect(gain)
      gain.connect(destination)

      oscillator.start(now)
      oscillator.stop(now + 1)

      // 递归创建下一个声音
      setTimeout(() => createRandomChat(), 200 + Math.random() * 800)
    }

    createRandomChat()
  }

  // 森林音效（风声 + 鸟鸣）
  private createForestNoise(): AudioNode | null {
    if (!this.audioContext) return null

    const masterGain = this.audioContext.createGain()
    masterGain.gain.value = 0.7

    // 风声（粉红噪音）
    const buffer = this.createPinkNoiseBuffer()
    if (buffer) {
      const windSource = this.audioContext.createBufferSource()
      windSource.buffer = buffer
      windSource.loop = true

      const windFilter = this.audioContext.createBiquadFilter()
      windFilter.type = 'bandpass'
      windFilter.frequency.value = 300
      windFilter.Q.value = 0.3

      // 风声起伏
      const windGain = this.audioContext.createGain()
      const now = this.audioContext.currentTime
      windGain.gain.setValueAtTime(0.1, now)
      windGain.gain.linearRampToValueAtTime(0.2, now + 3)
      windGain.gain.linearRampToValueAtTime(0.1, now + 6)

      // 循环起伏
      const modulateWind = () => {
        if (!this.isPlaying || this.currentType !== 'forest') return
        const time = this.audioContext!.currentTime
        windGain.gain.linearRampToValueAtTime(0.25, time + 4)
        windGain.gain.linearRampToValueAtTime(0.1, time + 8)
        setTimeout(modulateWind, 8000)
      }
      modulateWind()

      windSource.connect(windFilter)
      windFilter.connect(windGain)
      windGain.connect(masterGain)

      this.nodes.push(windSource, windFilter, windGain)
      windSource.start()
    }

    // 随机鸟鸣
    this.createBirdSounds(masterGain)

    this.nodes.push(masterGain)
    return masterGain
  }

  // 鸟鸣声
  private createBirdSounds(destination: AudioNode) {
    if (!this.audioContext) return

    const createBirdChirp = () => {
      if (!this.isPlaying || this.currentType !== 'forest') return

      const oscillator = this.audioContext!.createOscillator()
      const gain = this.audioContext!.createGain()

      // 高频鸟鸣
      const baseFreq = 2000 + Math.random() * 2000
      oscillator.type = 'sine'

      const now = this.audioContext!.currentTime
      oscillator.frequency.setValueAtTime(baseFreq, now)

      // 快速音高变化模拟鸟鸣
      for (let i = 0; i < 5; i++) {
        oscillator.frequency.setValueAtTime(
          baseFreq + (Math.random() - 0.5) * 500,
          now + i * 0.05
        )
      }

      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(0.03, now + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)

      oscillator.connect(gain)
      gain.connect(destination)

      oscillator.start(now)
      oscillator.stop(now + 0.4)

      // 随机间隔
      setTimeout(() => createBirdChirp(), 3000 + Math.random() * 7000)
    }

    // 延迟开始鸟鸣
    setTimeout(() => createBirdChirp(), 1000)
  }

  // 设置音量
  setVolume(value: number) {
    this.volume = Math.max(0, Math.min(1, value / 100))
    if (this.gainNode && this.audioContext) {
      this.gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime)
    }
  }

  // 播放指定类型的白噪音
  play(type: 'rain' | 'cafe' | 'forest' | 'none') {
    if (!this.audioContext) {
      this.initAudioContext()
    }

    // 恢复音频上下文（浏览器自动暂停后）
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume()
    }

    // 如果正在播放不同类型的音频，先停止
    if (this.isPlaying && this.currentType !== type) {
      this.stop()
    }

    if (type === 'none' || this.isPlaying) {
      return
    }

    this.currentType = type
    this.isPlaying = true

    // 创建主音量节点
    this.gainNode = this.audioContext!.createGain()
    this.gainNode.gain.value = this.volume
    this.gainNode.connect(this.audioContext!.destination)

    let sourceNode: AudioNode | null = null

    switch (type) {
      case 'rain':
        sourceNode = this.createRainNoise()
        break
      case 'cafe':
        sourceNode = this.createCafeNoise()
        break
      case 'forest':
        sourceNode = this.createForestNoise()
        break
    }

    if (sourceNode && this.gainNode) {
      sourceNode.connect(this.gainNode)

      // 淡入效果
      this.gainNode.gain.setValueAtTime(0, this.audioContext!.currentTime)
      this.gainNode.gain.linearRampToValueAtTime(this.volume, this.audioContext!.currentTime + 1)
    }
  }

  // 停止播放
  stop() {
    if (!this.isPlaying || !this.audioContext) return

    // 淡出效果
    if (this.gainNode) {
      const now = this.audioContext.currentTime
      this.gainNode.gain.setValueAtTime(this.volume, now)
      this.gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
    }

    // 延迟清理节点
    setTimeout(() => {
      this.nodes.forEach(node => {
        try {
          if (node instanceof AudioBufferSourceNode) {
            node.stop()
          }
          node.disconnect()
        } catch {
          // 忽略已断开连接的节点
        }
      })
      this.nodes = []

      if (this.gainNode) {
        this.gainNode.disconnect()
        this.gainNode = null
      }

      this.isPlaying = false
    }, 500)
  }

  // 获取播放状态
  getIsPlaying(): boolean {
    return this.isPlaying
  }

  // 获取当前类型
  getCurrentType(): string {
    return this.currentType
  }
}

// 单例实例
let noiseGenerator: WhiteNoiseGenerator | null = null

export function getNoiseGenerator(): WhiteNoiseGenerator {
  if (!noiseGenerator) {
    noiseGenerator = new WhiteNoiseGenerator()
  }
  return noiseGenerator
}
