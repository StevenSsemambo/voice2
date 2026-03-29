// ─── DAILY MISSION SYSTEM ─────────────────────────────────────────────────────
// Every morning Flux generates ONE specific, personalized mission.
// Core logic: 100% offline rule engine.
// Enhancement: Claude personalizes the message when online.
// ─────────────────────────────────────────────────────────────────────────────

import { getSetting, setSetting, getStreakCount, getTotalSessions, db } from '../utils/db'
import { callFluxAI, getOfflineResponse } from './fluxEngine'
import { isMorning, isSleepTime } from '../utils/adaptiveTheme'

// ─── MISSION POOL ─────────────────────────────────────────────────────────────
const MISSION_POOL = {
  breathe: [
    { id: 'b1', title: 'Morning Breath Reset', action: '/breathe', desc: 'Start your day with 5 breathing cycles before anything else. Set the tone.', icon: '💨', stars: 20 },
    { id: 'b2', title: 'Pre-Call Breathing',   action: '/breathe', desc: 'Before your next phone call or conversation, complete one breathing session.', icon: '💨', stars: 25 },
  ],
  speaklab: [
    { id: 's1', title: 'Rate Control Day',     action: '/speaklab', desc: 'Focus only on rate control today. Half your normal speed on everything.', icon: '🗣️', stars: 30 },
    { id: 's2', title: 'Easy Onset Focus',     action: '/speaklab', desc: 'Every word you say today — start it gently. Practice in SpeakLab first.', icon: '🗣️', stars: 30 },
  ],
  brave: [
    { id: 'v1', title: 'Real World Mission',   action: '/brave',    desc: 'Do one real speaking situation you\'ve been avoiding. Report back to Flux.', icon: '🦁', stars: 50 },
    { id: 'v2', title: 'Voluntary Stutter Day',action: '/brave',    desc: 'In your next three conversations, stutter voluntarily once each time. Elite-level therapy.', icon: '⭐', stars: 75 },
    { id: 'v3', title: 'Phone Call Challenge', action: '/brave',    desc: 'Make one phone call instead of texting. The full conversation.', icon: '📞', stars: 60 },
  ],
  gentle: [
    { id: 'g1', title: 'Low-Pressure Journal', action: '/journal',  desc: 'Just 30 seconds. Tell Flux how you\'re feeling today. No pressure.', icon: '🎙️', stars: 15 },
    { id: 'g2', title: 'Family Reading',       action: '/family',   desc: 'Read one passage with someone you trust today. Choral effect in action.', icon: '👨‍👩‍👧', stars: 20 },
  ],
  talktales: [
    { id: 't1', title: 'Story Challenge',      action: '/talktales', desc: 'Tell a story to Flux for at least 5 turns. Let it flow freely.', icon: '📖', stars: 35 },
  ],
  act: [
    { id: 'a1', title: 'Next ACT Session',     action: '/act',      desc: 'You\'re building something real. Time for the next ACT session.', icon: '🧘', stars: 40 },
  ],
  analysis: [
    { id: 'an1', title: 'Voice Snapshot',      action: '/analysis', desc: 'Record a 60-second free speech sample. See where you stand today.', icon: '📊', stars: 30 },
  ],
  sleep: [
    { id: 'sl1', title: 'Night Reflection',    action: '/journal',  desc: 'It\'s evening — the lowest-anxiety speaking window. Record how your voice feels tonight.', icon: '🌙', stars: 20 },
  ],
}

// ─── RULE ENGINE ──────────────────────────────────────────────────────────────
const selectMission = async (profile, context) => {
  const { streak, sessions, lastSessionType, mood, daysSinceBrave, hour, actDone, actTotal } = context

  // RULE: stressed mood → always breathe first
  if (mood === 'stressed') return MISSION_POOL.breathe[0]

  // RULE: it's sleep time → night reflection
  if (hour >= 21) return MISSION_POOL.sleep[0]

  // RULE: no streak yet → easiest possible session
  if (streak === 0 && sessions < 3) return MISSION_POOL.gentle[0]

  // RULE: ACT in progress → next session
  if (actTotal > 0 && actDone < 8 && lastSessionType !== 'act') return MISSION_POOL.act[0]

  // RULE: no brave mission in 3+ days → brave mission
  if (daysSinceBrave >= 3) return MISSION_POOL.brave[Math.floor(Math.random() * MISSION_POOL.brave.length)]

  // RULE: amazing mood → hardest available
  if (mood === 'amazing') return MISSION_POOL.brave[1] // voluntary stutter

  // RULE: alternate session types (never same as last)
  const allPools = ['breathe', 'speaklab', 'brave', 'talktales', 'analysis']
  const available = allPools.filter(p => p !== lastSessionType)
  const pick = available[Math.floor(Math.random() * available.length)]
  const pool = MISSION_POOL[pick] || MISSION_POOL.speaklab
  return pool[Math.floor(Math.random() * pool.length)]
}

// ─── MAIN GENERATOR ───────────────────────────────────────────────────────────
export const generateDailyMission = async (profile) => {
  // Check cache (refresh once per day)
  const todayKey = new Date().toDateString()
  const cached   = await getSetting('daily_mission', null)
  if (cached) {
    try {
      const parsed = JSON.parse(cached)
      if (parsed.date === todayKey) return parsed
    } catch {}
  }

  // Gather context
  const [streak, sessions, actSessions] = await Promise.all([
    getStreakCount(),
    getTotalSessions(),
    db.actSessions?.count().catch(() => 0),
  ])

  const recentSessions = await db.sessions.orderBy('date').reverse().limit(5).toArray()
  const lastSessionType = recentSessions[0]?.type || null
  const mood = await getSetting('today_mood', null)
  const hour = new Date().getHours()

  // Days since last brave mission
  const lastBrave = await db.sessions.where('type').equals('brave').last().catch(() => null)
  const daysSinceBrave = lastBrave
    ? Math.floor((Date.now() - new Date(lastBrave.date)) / 86400000)
    : 99

  const context = { streak, sessions, lastSessionType, mood, daysSinceBrave, hour, actDone: actSessions, actTotal: actSessions }

  // Select base mission (offline)
  const baseMission = await selectMission(profile, context)

  // Try AI personalization (online)
  let personalMessage = baseMission.desc
  try {
    const result = await callFluxAI([{
      role: 'user',
      content: `Generate today's personalized daily mission message for ${profile?.name || 'the user'}.

Base mission: ${baseMission.title} — ${baseMission.desc}
User context: streak=${streak} days, sessions=${sessions}, last session=${lastSessionType}, mood=${mood || 'unknown'}, hour=${hour}

Write ONE sentence (max 20 words) that feels personal to this user's current situation.
Reference their streak or mood if relevant. Direct and warm. No preamble.`
    }], profile)

    if (result.source === 'ai' && result.text?.trim()) {
      personalMessage = result.text.trim()
    }
  } catch {}

  const mission = {
    ...baseMission,
    personalMessage,
    date: todayKey,
    generated: new Date().toISOString(),
    context: { streak, sessions, mood },
  }

  await setSetting('daily_mission', JSON.stringify(mission))
  return mission
}

// ─── MISSION COMPLETE ─────────────────────────────────────────────────────────
export const completeDailyMission = async () => {
  const cached = await getSetting('daily_mission', null)
  if (!cached) return
  try {
    const parsed = JSON.parse(cached)
    parsed.completed = true
    await setSetting('daily_mission', JSON.stringify(parsed))
  } catch {}
}

export const isDailyMissionDone = async () => {
  const cached = await getSetting('daily_mission', null)
  if (!cached) return false
  try {
    const parsed = JSON.parse(cached)
    return parsed.completed === true && parsed.date === new Date().toDateString()
  } catch { return false }
}
