// ─── VOICE EMOTION DETECTION ENGINE ──────────────────────────────────────────
// 100% offline. Runs entirely on WebAudio API.
// Detects: pitch (F0), energy, speech rate, vocal tension (jitter)
// Flux uses these signals to adapt WITHOUT the user saying anything.
// ─────────────────────────────────────────────────────────────────────────────

// ─── PITCH DETECTION via Autocorrelation ──────────────────────────────────────
// McLeod Pitch Method - accurate down to ~80 Hz, works on device
export function detectPitch(buffer, sampleRate) {
  const SIZE = buffer.length
  const MAX_SAMPLES = Math.floor(SIZE / 2)
  const correlations = new Float32Array(MAX_SAMPLES)

  // Compute autocorrelation
  for (let i = 0; i < MAX_SAMPLES; i++) {
    let sum = 0
    for (let j = 0; j < MAX_SAMPLES; j++) {
      sum += (buffer[j] || 0) * (buffer[j + i] || 0)
    }
    correlations[i] = sum
  }

  // Find first trough then first peak after it
  let d = 0
  while (d < MAX_SAMPLES && correlations[d] > 0) d++
  if (d >= MAX_SAMPLES) return -1

  let maxVal = -1, maxPos = -1
  for (let i = d; i < MAX_SAMPLES; i++) {
    if (correlations[i] > maxVal) { maxVal = correlations[i]; maxPos = i }
  }

  if (maxPos === -1 || maxVal < 0.1) return -1

  // Parabolic interpolation for sub-sample accuracy
  let x1 = correlations[maxPos - 1] || 0
  let x2 = correlations[maxPos]
  let x3 = correlations[maxPos + 1] || 0
  let shift = (x3 - x1) / (2 * (2 * x2 - x1 - x3))
  let period = maxPos + shift

  return sampleRate / period
}

// ─── RMS ENERGY ───────────────────────────────────────────────────────────────
export function computeRMS(buffer) {
  let sum = 0
  for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i]
  return Math.sqrt(sum / buffer.length)
}

// Convert RMS to approximate dB
export function rmsToDB(rms) {
  return rms > 0 ? 20 * Math.log10(rms) : -100
}

// ─── JITTER (Pitch Irregularity = Vocal Tension) ──────────────────────────────
// Jitter = cycle-to-cycle variation in pitch period
// High jitter → vocal tension → likely anxious or struggling
export function computeJitter(pitchHistory) {
  if (pitchHistory.length < 3) return 0
  const valid = pitchHistory.filter(p => p > 0 && p < 600)
  if (valid.length < 3) return 0
  let totalDiff = 0
  for (let i = 1; i < valid.length; i++) {
    totalDiff += Math.abs(valid[i] - valid[i - 1])
  }
  const avgPitch = valid.reduce((a, b) => a + b, 0) / valid.length
  return avgPitch > 0 ? (totalDiff / (valid.length - 1)) / avgPitch : 0
}

// ─── EMOTION STATE CLASSIFIER ─────────────────────────────────────────────────
// Combines all signals into a readable emotional state
export function classifyVoiceState(metrics) {
  const { pitch, energy, jitter, wpm, pitchTrend } = metrics

  // No voice detected
  if (energy < 0.01) return { state: 'silent', confidence: 1, label: 'Listening', color: 'rgba(255,255,255,0.3)' }

  const states = []

  // Anxiety markers: high pitch + high jitter + fast rate
  if (pitch > 180 && jitter > 0.05 && wpm > 160) {
    states.push({ state: 'anxious', score: 0.8 })
  }

  // Tension: high jitter regardless of pitch
  if (jitter > 0.08) {
    states.push({ state: 'tense', score: 0.7 })
  }

  // Excitement: high energy + high pitch + fast rate but low jitter
  if (energy > 0.06 && pitch > 170 && wpm > 150 && jitter < 0.04) {
    states.push({ state: 'excited', score: 0.75 })
  }

  // Fatigue/sadness: low energy + low pitch + slow rate
  if (energy < 0.025 && pitch < 130 && wpm < 100) {
    states.push({ state: 'low', score: 0.7 })
  }

  // Calm confident: steady pitch + moderate energy + good rate
  if (jitter < 0.03 && energy > 0.03 && wpm >= 100 && wpm <= 160) {
    states.push({ state: 'confident', score: 0.8 })
  }

  // Struggling: pitch drops suddenly mid-sentence
  if (pitchTrend < -15) {
    states.push({ state: 'struggling', score: 0.65 })
  }

  // Pick highest scoring state
  if (states.length === 0) return { state: 'neutral', confidence: 0.5, label: 'Neutral', color: 'var(--aqua)' }

  const top = states.sort((a, b) => b.score - a.score)[0]

  const META = {
    anxious:   { label: 'Anxious',    color: 'var(--amber)',  suggestion: 'breathing' },
    tense:     { label: 'Tense',      color: 'var(--amber)',  suggestion: 'slow_down' },
    excited:   { label: 'Excited',    color: 'var(--jade)',   suggestion: 'channel_it' },
    low:       { label: 'Low energy', color: 'var(--violet)', suggestion: 'gentle_session' },
    confident: { label: 'Confident',  color: 'var(--aqua)',   suggestion: 'challenge' },
    struggling:{ label: 'Struggling', color: 'var(--rose)',   suggestion: 'pause' },
    neutral:   { label: 'Neutral',    color: 'var(--aqua)',   suggestion: null },
  }

  return { state: top.state, confidence: top.score, ...META[top.state] }
}

// ─── FLUX ADAPTIVE RESPONSE ───────────────────────────────────────────────────
// What Flux says/does based on voice emotion state
export const getEmotionAdaptation = (voiceState, ageGroup = 'explorer') => {
  const adaptations = {
    anxious: {
      fluxMessage: "I can hear some tension in your voice. That's completely normal. Want to take three breaths with me first?",
      action: 'suggest_breathe',
      adjustRate: 0.8,      // Speak slower
      adjustPitch: 0.95,    // Slightly lower pitch = calmer
    },
    tense: {
      fluxMessage: "Let your jaw drop a little. Your vocal muscles are working hard. Breathe out slowly.",
      action: 'jaw_relax',
      adjustRate: 0.85,
      adjustPitch: 0.95,
    },
    excited: {
      fluxMessage: ageGroup === 'adult' || ageGroup === 'navigator'
        ? "Good energy! Channel that into the exercise — excitement is flow waiting to happen."
        : "I can feel your energy! Let's use it! 🌟",
      action: 'encourage_forward',
      adjustRate: 0.95,
      adjustPitch: 1.05,
    },
    low: {
      fluxMessage: "Sounds like a quiet day. That's okay. Even a 2-minute session counts. Want to try the gentlest one?",
      action: 'suggest_short',
      adjustRate: 0.85,
      adjustPitch: 0.9,
    },
    confident: {
      fluxMessage: "Your voice sounds strong today. This is a great moment to try something slightly harder.",
      action: 'suggest_challenge',
      adjustRate: 1.0,
      adjustPitch: 1.0,
    },
    struggling: {
      fluxMessage: "I noticed. No pressure — take your time. Pausing is a technique, not a failure.",
      action: 'pause_support',
      adjustRate: 0.8,
      adjustPitch: 0.9,
    },
  }
  return adaptations[voiceState?.state] || null
}

// ─── LIVE VOICE EMOTION MONITOR ───────────────────────────────────────────────
// Drop into any page: monitors mic in background, emits state every 3s
export class VoiceEmotionMonitor {
  constructor(onStateChange) {
    this.onStateChange  = onStateChange
    this.audioCtx       = null
    this.analyser       = null
    this.stream         = null
    this.running        = false
    this.pitchHistory   = []
    this.interval       = null
    this.lastState      = null
    this.wordCount      = 0
    this.startTime      = null
    this.sampleRate     = 44100
  }

  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      this.sampleRate = this.audioCtx.sampleRate

      this.analyser = this.audioCtx.createAnalyser()
      this.analyser.fftSize = 2048
      this.audioCtx.createMediaStreamSource(this.stream).connect(this.analyser)

      this.running   = true
      this.startTime = Date.now()

      this.interval = setInterval(() => this._analyze(), 2000)
      return true
    } catch {
      return false
    }
  }

  _analyze() {
    if (!this.running || !this.analyser) return

    const timeBuffer = new Float32Array(this.analyser.fftSize)
    this.analyser.getFloatTimeDomainData(timeBuffer)

    const pitch  = detectPitch(timeBuffer, this.sampleRate)
    const energy = computeRMS(timeBuffer)

    if (pitch > 0) this.pitchHistory.push(pitch)
    if (this.pitchHistory.length > 20) this.pitchHistory.shift()

    const jitter      = computeJitter(this.pitchHistory)
    const elapsed     = (Date.now() - this.startTime) / 60000 // minutes
    const wpm         = elapsed > 0.1 ? this.wordCount / elapsed : 120
    const pitchTrend  = this._computePitchTrend()

    const avgPitch = this.pitchHistory.length > 0
      ? this.pitchHistory.reduce((a, b) => a + b) / this.pitchHistory.length
      : 0

    const metrics = { pitch: avgPitch, energy, jitter, wpm, pitchTrend }
    const voiceState = classifyVoiceState(metrics)

    // Only emit if state changed
    if (!this.lastState || voiceState.state !== this.lastState.state) {
      this.lastState = voiceState
      this.onStateChange?.(voiceState, metrics)
    }
  }

  _computePitchTrend() {
    if (this.pitchHistory.length < 4) return 0
    const recent = this.pitchHistory.slice(-4)
    const older  = this.pitchHistory.slice(-8, -4)
    if (older.length === 0) return 0
    const recentAvg = recent.reduce((a, b) => a + b) / recent.length
    const olderAvg  = older.reduce((a, b) => a + b) / older.length
    return recentAvg - olderAvg
  }

  addWord() { this.wordCount++ }

  stop() {
    this.running = false
    clearInterval(this.interval)
    this.stream?.getTracks().forEach(t => t.stop())
    this.audioCtx?.close().catch(() => {})
    this.analyser = null
  }

  getMetrics() {
    return {
      avgPitch:     this.pitchHistory.length > 0 ? this.pitchHistory.reduce((a,b)=>a+b)/this.pitchHistory.length : 0,
      jitter:       computeJitter(this.pitchHistory),
      sessionsData: { pitchHistory: [...this.pitchHistory] },
    }
  }
}

// ─── VOICE STATE INDICATOR (UI Component data) ────────────────────────────────
export const formatVoiceMetrics = (metrics) => ({
  pitchHz:  metrics.pitch > 0 ? `${Math.round(metrics.pitch)} Hz` : '—',
  energydB: `${Math.round(rmsToDB(metrics.energy))} dB`,
  tension:  metrics.jitter < 0.02 ? 'Relaxed' : metrics.jitter < 0.05 ? 'Mild tension' : metrics.jitter < 0.08 ? 'Tense' : 'High tension',
  tensionColor: metrics.jitter < 0.02 ? 'var(--jade)' : metrics.jitter < 0.05 ? 'var(--aqua)' : metrics.jitter < 0.08 ? 'var(--amber)' : 'var(--rose)',
})
