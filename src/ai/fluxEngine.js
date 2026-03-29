// ─── FLUX ENGINE v3 ───────────────────────────────────────────────────────────
// Pure offline intelligence. Zero network calls. Zero Claude API.
// All Claude API functions have been replaced with rule-based equivalents
// powered by fluxBrain.js and fluxResponses.js.
//
// Backwards-compatible: all original exports preserved.
// New exports: direct access to the full brain for advanced usage.
// ─────────────────────────────────────────────────────────────────────────────

import { db, getSetting, setSetting } from '../utils/db'
import {
  buildUserState,
  detectIntent,
  selectResponse,
  fillSlots,
  chat as brainChat,
  appendConversationLog,
  getConversationSummary,
  analyzeSessionOffline,
  continueStoryOffline,
  generateBraveMissionOffline,
  buildWeeklyReportOffline,
  buildLifeStoryOffline,
  analyzeCommSkillOffline,
  detectContext as brainDetectContext,
  getOfflineResponse as brainOfflineResponse,
  getOfflineMission as brainOfflineMission,
} from './fluxBrain'
import { pickByAgeGroup, pickResponse, ENCOURAGEMENT, CELEBRATIONS } from './fluxResponses'
import { getCurrentStage } from './fluxPersonality'

// ═══════════════════════════════════════════════════════════════════════════════
// MEMORY SYSTEM — Persistent user intelligence store
// Backwards-compatible keys preserved. Extended with new fields.
// ═══════════════════════════════════════════════════════════════════════════════

export const MemoryKeys = {
  INSIGHTS:         'flux_insights',
  STRENGTHS:        'flux_strengths',
  WEAKNESSES:       'flux_weaknesses',
  RECOMMENDATIONS:  'flux_recs',
  PROGRESS_STORY:   'flux_story',
  GOALS:            'flux_goals',
  // Extended keys (v3)
  AVOIDANCE_INDEX:  'flux_avoidance_index',
  SELF_EFFICACY:    'flux_self_efficacy',
  MOMENTUM:         'flux_momentum',
  PATTERN_DATA:     'flux_pattern_data',
  CONV_LOG:         'flux_conv_log',
  LIFE_STORY:       'flux_life_story_offline',
}

export const saveMemory = (key, data) => setSetting(key, JSON.stringify(data))

export const loadMemory = async (key, fallback = null) => {
  try {
    const r = await getSetting(key)
    return r ? JSON.parse(r) : fallback
  } catch { return fallback }
}

// ── Build user memory summary (legacy + extended) ─────────────────────────────
export const buildUserMemory = async (profile) => {
  const [insights, strengths, weaknesses, story, recs] = await Promise.all([
    loadMemory(MemoryKeys.INSIGHTS, []),
    loadMemory(MemoryKeys.STRENGTHS, []),
    loadMemory(MemoryKeys.WEAKNESSES, []),
    loadMemory(MemoryKeys.PROGRESS_STORY, ''),
    loadMemory(MemoryKeys.RECOMMENDATIONS, null),
  ])
  const sessions = await db.sessions.orderBy('date').reverse().limit(10).toArray()
  const recentTypes = sessions.map(s => s.type).join(', ')
  const avgScore = sessions.length
    ? Math.round(sessions.reduce((a, b) => a + (b.score || 0), 0) / sessions.length)
    : 0
  const totalSessions = await db.sessions.count()

  // Extended fields from the brain
  const avoidanceIndex = await getSetting(MemoryKeys.AVOIDANCE_INDEX, 50)
  const selfEfficacy   = await getSetting(MemoryKeys.SELF_EFFICACY, 40)
  const momentum       = await getSetting(MemoryKeys.MOMENTUM, 'low')

  return {
    insights:     insights.slice(-8),
    strengths:    strengths.slice(-6),
    weaknesses:   weaknesses.slice(-6),
    story,
    recs,
    recentTypes,
    avgScore,
    totalSessions,
    avoidanceIndex,
    selfEfficacy,
    momentum,
  }
}

// ── Rule-based memory update (replaces Claude API call) ────────────────────────
// Called after every session. Pure logic — no network.
export const updateMemoryAfterSession = async (sessionType, sessionData, profile) => {
  try {
    const state = await buildUserState(profile, true) // force refresh
    const score = sessionData?.score || sessionData?.fluencyScore || 0

    // ── Update insights ─────────────────────────────────────────────────────
    const insights = await loadMemory(MemoryKeys.INSIGHTS, [])
    let newInsight = null

    if (score >= 85) {
      newInsight = `Strong ${sessionType} session — score ${score}`
    } else if (score < 50 && score > 0) {
      newInsight = `${sessionType} session needs work — score ${score}`
    } else if (sessionType === 'brave') {
      newInsight = `Brave mission attempted — fear level ${sessionData?.fearLevel || 'unknown'}`
    } else if (sessionData?.fillerCount > 5) {
      newInsight = `High filler word count in ${sessionType} (${sessionData.fillerCount})`
    }

    if (newInsight) {
      insights.push({ text: newInsight, date: new Date().toISOString(), session: sessionType })
      await saveMemory(MemoryKeys.INSIGHTS, insights.slice(-30))
    }

    // ── Update strengths ─────────────────────────────────────────────────────
    if (score >= 80) {
      const strengths = await loadMemory(MemoryKeys.STRENGTHS, [])
      const strengthMap = {
        speaklab: 'Rate control and speech technique',
        brave:    'Exposure approach — brave sessions',
        breathe:  'Breathing technique',
        analysis: 'Speech monitoring and self-awareness',
        journal:  'Voice journaling consistency',
      }
      const newStrength = strengthMap[sessionType]
      if (newStrength && !strengths.includes(newStrength)) {
        strengths.push(newStrength)
        await saveMemory(MemoryKeys.STRENGTHS, strengths.slice(-20))
      }
    }

    // ── Update weaknesses ────────────────────────────────────────────────────
    if (score < 55 && score > 0) {
      const weaknesses = await loadMemory(MemoryKeys.WEAKNESSES, [])
      const weakMap = {
        speaklab: 'Speech technique consistency needs work',
        breathe:  'Breathing technique needs practice',
        analysis: 'Fluency scores below target',
      }
      const newWeakness = weakMap[sessionType]
      if (newWeakness && !weaknesses.includes(newWeakness)) {
        weaknesses.push(newWeakness)
        await saveMemory(MemoryKeys.WEAKNESSES, weaknesses.slice(-10))
      }
    }

    // ── Update recommendation ────────────────────────────────────────────────
    const sessionTypeOrder = ['breathe', 'speaklab', 'brave', 'analysis', 'journal', 'act']
    const nextType = sessionTypeOrder[(sessionTypeOrder.indexOf(sessionType) + 1) % sessionTypeOrder.length]
    const recText = `Next: try a ${nextType} session to complement today's work`
    await saveMemory(MemoryKeys.RECOMMENDATIONS, { text: recText, date: new Date().toISOString() })

    // ── Update progress story ────────────────────────────────────────────────
    const story = await loadMemory(MemoryKeys.PROGRESS_STORY, '')
    const scoreNote = score > 0 ? `Scored ${score}/100 in ${sessionType}.` : `Completed ${sessionType} session.`
    const updated = (story + ' ' + scoreNote).trim().slice(-500)
    await saveMemory(MemoryKeys.PROGRESS_STORY, updated)

    // ── Analyse and return feedback ──────────────────────────────────────────
    const feedback = analyzeSessionOffline(sessionType, sessionData, state)

    // ── Log to conversation for continuity ───────────────────────────────────
    await appendConversationLog('system', `Completed ${sessionType} session — score ${score}`)

    return {
      newInsight,
      strengthsToAdd:     score >= 80 ? [sessionType] : [],
      weaknessesToAddress: score < 55 && score > 0 ? [sessionType] : [],
      nextRec:            recText,
      progressNote:       scoreNote,
      feedback,
    }
  } catch (e) {
    console.warn('[FluxEngine] updateMemoryAfterSession error:', e.message)
    return null
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CORE CHAT — replaces callFluxAI
// Routes to the full brain engine. Returns same shape as original.
// ═══════════════════════════════════════════════════════════════════════════════

export const callFluxAI = async (messages, profile) => {
  try {
    // Extract the last user message from the messages array (legacy format)
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content || ''
    const result = await brainChat(lastUserMessage, profile)
    return { text: result.text, source: result.source, intent: result.intent }
  } catch (e) {
    console.warn('[FluxEngine] callFluxAI error:', e.message)
    return { text: brainOfflineResponse('general'), source: 'offline' }
  }
}

// Direct single-message chat (preferred for new code)
export const fluxChat = async (userMessage, profile) => {
  return brainChat(userMessage, profile)
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXERCISE ANALYSIS — replaces analyzeAttempt (was Claude API)
// ═══════════════════════════════════════════════════════════════════════════════

export const analyzeAttempt = async (desc, exerciseType, profile) => {
  try {
    const state = await buildUserState(profile)
    const score = _scoreFromDescription(desc)
    const feedback = analyzeSessionOffline(exerciseType || 'speaklab', { score }, state)
    return feedback.praise + (feedback.tip ? ' ' + feedback.tip : '')
  } catch {
    return brainOfflineResponse('encouragement')
  }
}

const _scoreFromDescription = (desc) => {
  if (!desc) return 60
  const lower = desc.toLowerCase()
  if (lower.match(/great|excellent|perfect|amazing|fluent|no block/)) return 88
  if (lower.match(/good|well|better|improved|ok/)) return 72
  if (lower.match(/hard|difficult|block|struggle|bad|terrible/)) return 40
  return 62
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMM SKILL ANALYSIS — replaces analyzeCommSkill (was Claude API)
// ═══════════════════════════════════════════════════════════════════════════════

export const analyzeCommSkill = async (skill, transcript, profile) => {
  try {
    return analyzeCommSkillOffline(skill, transcript, profile)
  } catch {
    return {
      score: 70,
      strengths:    ['You showed up and practiced'],
      improvements: ['Keep building consistency'],
      tip:          'Try again with even more confidence.',
      praise:       brainOfflineResponse('encouragement'),
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRESENTATION PLAN — replaces generatePresentationPlan (was Claude API)
// ═══════════════════════════════════════════════════════════════════════════════

export const generatePresentationPlan = async (topic, duration, profile) => {
  try {
    const ag = profile?.ageGroup || 'explorer'

    // Rule-based outline generator
    const durationSec = parseInt(duration) || 120
    const pointCount = durationSec <= 60 ? 2 : durationSec <= 180 ? 3 : 4

    const openings = {
      little:    `Start with: "I'm going to tell you about ${topic}!"`,
      explorer:  `Open with a question: "Have you ever wondered about ${topic}?"`,
      navigator: `Open with a bold claim or surprising fact about ${topic}.`,
      adult:     `Open with your conclusion: state what you'll prove about ${topic} in one sentence.`,
    }

    const tips = {
      little:    ['Speak slowly and clearly', 'Smile at your audience'],
      explorer:  ['Breathe before you begin', 'Speak to the back of the room'],
      navigator: ['Pause after your opening — it signals confidence', 'Use "firstly / secondly / finally" to signpost'],
      adult:     ['Lead with insight, not background', 'Strategic pauses carry more weight than filler words'],
    }

    const criteria = {
      little:    ['Spoke clearly', 'Finished the presentation', 'Remembered their points'],
      explorer:  ['Clear structure', 'Audible throughout', 'Confident delivery'],
      navigator: ['Compelling opening', 'Logical structure', 'Deliberate pacing', 'Strong close'],
      adult:     ['Thesis clarity', 'Evidence quality', 'Vocal delivery', 'Audience engagement', 'Time management'],
    }

    const outline = []
    outline.push(`Introduction: What you'll cover about ${topic}`)
    for (let i = 1; i < pointCount - 1; i++) {
      outline.push(`Point ${i}: Key aspect ${i} of ${topic}`)
    }
    outline.push(`Conclusion: What the audience should remember about ${topic}`)

    return {
      title:       `${topic} Presentation (${Math.round(durationSec / 60)} min)`,
      outline,
      openingHook: openings[ag] || openings.explorer,
      tips:        tips[ag] || tips.explorer,
      criteria:    criteria[ag] || criteria.explorer,
    }
  } catch {
    return {
      title:       topic,
      outline:     ['Introduction', 'Main point', 'Conclusion'],
      openingHook: 'Start with a compelling question.',
      tips:        ['Breathe before you begin', 'Pause for emphasis'],
      criteria:    ['Clarity', 'Confidence', 'Structure'],
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// BRAVE MISSION GENERATOR — replaces generateBraveMission (was Claude API)
// ═══════════════════════════════════════════════════════════════════════════════

export const generateBraveMission = async (fearLevel, situation, profile) => {
  return generateBraveMissionOffline(fearLevel, situation || '', profile)
}

// ═══════════════════════════════════════════════════════════════════════════════
// STORY CONTINUATION — replaces continueStory (was Claude API)
// ═══════════════════════════════════════════════════════════════════════════════

export const continueStory = async (userText, history, profile) => {
  return continueStoryOffline(userText, history, profile)
}

// ═══════════════════════════════════════════════════════════════════════════════
// PERSONALISED RECOMMENDATION — replaces getPersonalizedRecommendation
// ═══════════════════════════════════════════════════════════════════════════════

export const getPersonalizedRecommendation = async (profile) => {
  try {
    // Check 6-hour cache
    const saved = await loadMemory(MemoryKeys.RECOMMENDATIONS)
    if (saved?.date && (Date.now() - new Date(saved.date)) / 3600000 < 6) {
      return saved.text
    }

    const state = await buildUserState(profile)
    const intent = { intent: 'ask_what_to_do', confidence: 1, keywords: [] }
    const response = selectResponse(intent, state, 'what should I do')

    await saveMemory(MemoryKeys.RECOMMENDATIONS, {
      text: response,
      date: new Date().toISOString(),
    })
    return response
  } catch {
    return brainOfflineResponse('encouragement')
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXT DETECTION (extended) — backwards compatible
// ═══════════════════════════════════════════════════════════════════════════════

export const detectContext = brainDetectContext

// ═══════════════════════════════════════════════════════════════════════════════
// OFFLINE RESPONSE LIBRARY — backwards compatible, now routes to brain
// ═══════════════════════════════════════════════════════════════════════════════

export const getOfflineResponse = brainOfflineResponse
export const getOfflineMission  = brainOfflineMission

// ═══════════════════════════════════════════════════════════════════════════════
// NEW EXPORTS — direct brain access for upgraded pages
// ═══════════════════════════════════════════════════════════════════════════════

// Build full user intelligence state (for Home, Progress, Settings pages)
export { buildUserState } from './fluxBrain'

// Conversation log management
export { appendConversationLog, getConversationSummary, clearConversationLog } from './fluxBrain'

// Weekly report and life story (for WeeklyReport.jsx and Progress.jsx)
export { buildWeeklyReportOffline as generateWeeklyReport } from './fluxBrain'
export { buildLifeStoryOffline as buildLifeStory } from './fluxBrain'

// Session analysis (for SpeakLab, Adventure, Breathe)
export { analyzeSessionOffline } from './fluxBrain'
