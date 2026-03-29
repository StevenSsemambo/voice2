// ─── FLUX LIFE STORY ENGINE ───────────────────────────────────────────────────
// Builds and maintains a compressed living narrative of the user's journey.
// Offline: fact-based summary from local data.
// Online: Claude rewrites into a warm narrative.
// ─────────────────────────────────────────────────────────────────────────────

import { db, getSetting, setSetting, getTotalSessions, getStreakCount } from '../utils/db'
import { callFluxAI, loadMemory, MemoryKeys } from './fluxEngine'

// ─── GATHER LIFE FACTS ────────────────────────────────────────────────────────
export const gatherLifeFacts = async () => {
  const [sessions, streak, insights, strengths, weaknesses, journalCount, braveCount, actDone] = await Promise.all([
    getTotalSessions(),
    getStreakCount(),
    loadMemory(MemoryKeys.INSIGHTS, []),
    loadMemory(MemoryKeys.STRENGTHS, []),
    loadMemory(MemoryKeys.WEAKNESSES, []),
    db.journal.count().catch(() => 0),
    db.braveStars.count().catch(() => 0),
    db.actSessions.count().catch(() => 0),
  ])

  const recentJournals = await db.journal.orderBy('date').reverse().limit(3).toArray()
  const moodHistory    = await db.settings.where('key').startsWith('mood_').toArray().catch(() => [])
  const firstSession   = await db.sessions.orderBy('date').first().catch(() => null)
  const bestStreak     = await getSetting('best_streak', streak)

  const daysSinceStart = firstSession
    ? Math.floor((Date.now() - new Date(firstSession.date)) / 86400000)
    : 0

  // Build offline fact list
  const facts = []
  if (daysSinceStart > 0) facts.push(`Started ${daysSinceStart} days ago`)
  if (sessions > 0)        facts.push(`Completed ${sessions} practice sessions`)
  if (braveCount > 0)      facts.push(`Earned ${braveCount} brave stars`)
  if (journalCount > 0)    facts.push(`Recorded ${journalCount} voice journal entries`)
  if (actDone > 0)         facts.push(`Completed ${actDone} of 8 ACT sessions`)
  if (streak > 0)          facts.push(`Current streak: ${streak} days`)
  if (strengths.length > 0) facts.push(`Strengths Flux identified: ${strengths.slice(0,3).join(', ')}`)
  if (weaknesses.length > 0) facts.push(`Areas still growing: ${weaknesses.slice(0,2).join(', ')}`)
  if (insights.length > 0) facts.push(`Recent insight: "${insights[insights.length-1]?.text}"`)

  return { facts, sessions, streak, braveCount, journalCount, actDone, daysSinceStart, strengths, weaknesses, insights }
}

// ─── BUILD STORY ──────────────────────────────────────────────────────────────
export const buildLifeStory = async (profile, forceRefresh = false) => {
  const storyKey  = 'flux_life_story'
  const dateKey   = 'flux_life_story_date'

  // Use cached story if recent (within 24h) and not forcing refresh
  if (!forceRefresh) {
    const cachedDate  = await getSetting(dateKey, null)
    const cachedStory = await getSetting(storyKey, null)
    if (cachedDate && cachedStory) {
      const age = (Date.now() - new Date(cachedDate)) / 3600000
      if (age < 24) return cachedStory
    }
  }

  const data = await gatherLifeFacts()

  // Offline story (always available)
  const offlineStory = buildOfflineStory(data, profile)

  // Try AI narrative
  try {
    const result = await callFluxAI([{
      role: 'user',
      content: `Build a short personal narrative (4-6 sentences) of this user's journey with YoSpeech.
This becomes Flux's "life story" context — used to make every future conversation feel personal.

USER: ${profile?.name || 'the user'}, ${profile?.ageGroup} group, ${profile?.mode || 'stutter'} mode
FACTS:
${data.facts.join('\n')}

Write in third person past+present tense. Warm and specific. Reference real numbers and real patterns.
No generic praise. This is a factual-emotional record that Flux will reference in conversations.
Include: how long they've been at it, what they've struggled with, what's improved, what they're working toward.`
    }], profile)

    if (result.source === 'ai' && result.text?.trim()) {
      const story = result.text.trim()
      await setSetting(storyKey, story)
      await setSetting(dateKey, new Date().toISOString())
      return story
    }
  } catch {}

  await setSetting(storyKey, offlineStory)
  await setSetting(dateKey, new Date().toISOString())
  return offlineStory
}

const buildOfflineStory = (data, profile) => {
  const name = profile?.name || 'the user'
  const parts = []

  if (data.daysSinceStart > 0) {
    parts.push(`${name} has been on this journey for ${data.daysSinceStart} days.`)
  }
  if (data.sessions > 0) {
    parts.push(`They've completed ${data.sessions} practice sessions and earned ${data.braveCount} brave moments.`)
  }
  if (data.strengths.length > 0) {
    parts.push(`Flux has identified strengths in: ${data.strengths.slice(0,2).join(' and ')}.`)
  }
  if (data.weaknesses.length > 0) {
    parts.push(`They're still working on: ${data.weaknesses[0]}.`)
  }
  if (data.actDone > 0) {
    parts.push(`They've completed ${data.actDone} ACT sessions — showing real psychological courage.`)
  }
  if (data.insights.length > 0) {
    parts.push(`Most recent observation: ${data.insights[data.insights.length-1]?.text}`)
  }

  return parts.join(' ')
}

// ─── CONTEXTUAL MOOD INTELLIGENCE ─────────────────────────────────────────────
// Detect patterns from historical mood and session data
export const analyzeMoodPatterns = async () => {
  try {
    // Get all mood check-ins from settings
    const allSettings = await db.settings.toArray()
    const moodSettings = allSettings.filter(s => s.key === 'today_mood')

    // Get recent sessions with timestamps
    const recentSessions = await db.sessions.orderBy('date').reverse().limit(30).toArray()

    // Day-of-week session analysis
    const daySessionCounts = Array(7).fill(0)
    recentSessions.forEach(s => {
      daySessionCounts[new Date(s.date).getDay()]++
    })
    const worstDay = daySessionCounts.indexOf(Math.min(...daySessionCounts))
    const bestDay  = daySessionCounts.indexOf(Math.max(...daySessionCounts))

    const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

    // Hour analysis
    const hourCounts = Array(24).fill(0)
    recentSessions.forEach(s => { hourCounts[new Date(s.date).getHours()]++ })
    const peakHour = hourCounts.indexOf(Math.max(...hourCounts))

    const patterns = []

    if (daySessionCounts[worstDay] === 0 && daySessionCounts[bestDay] > 2) {
      patterns.push({
        type: 'day_pattern',
        insight: `${DAYS[bestDay]}s are your strongest practice days. ${DAYS[worstDay]}s are your biggest gap.`,
        suggestion: `Try a quick 2-minute session this ${DAYS[worstDay]}.`,
      })
    }

    if (peakHour > 0) {
      const timeLabel = peakHour < 12 ? `${peakHour}am` : `${peakHour - 12}pm`
      patterns.push({
        type: 'time_pattern',
        insight: `You practice most consistently around ${timeLabel}.`,
        suggestion: `Set a gentle reminder for ${timeLabel} each day.`,
      })
    }

    // Streak break analysis
    const streaks = await db.streaks.orderBy('date').toArray()
    if (streaks.length > 7) {
      const gaps = []
      for (let i = 1; i < streaks.length; i++) {
        const d1 = new Date(streaks[i-1].date)
        const d2 = new Date(streaks[i].date)
        const diff = Math.floor((d2 - d1) / 86400000)
        if (diff > 1) gaps.push({ day: d1.getDay(), gap: diff })
      }
      if (gaps.length > 0) {
        const commonGapDay = gaps.sort((a,b)=>b.gap-a.gap)[0]?.day
        if (commonGapDay !== undefined) {
          patterns.push({
            type: 'streak_risk',
            insight: `Your streaks most often break after ${DAYS[commonGapDay]}s.`,
            suggestion: `${DAYS[commonGapDay]}s: even 2 minutes counts.`,
          })
        }
      }
    }

    return patterns
  } catch {
    return []
  }
}
