import Dexie from 'dexie'

export const db = new Dexie('YoSpeechDB')

// ─── SCHEMA ───────────────────────────────────────────────────────────────────
// Version 1: original schema (never change — Dexie requires old versions)
db.version(1).stores({
  profile:        '++id, name, ageGroup, avatar, createdAt',
  sessions:       '++id, type, date, duration, score, data',
  recordings:     '++id, type, date, blob, duration, label',
  fearLadder:     '++id, situation, fearLevel, completed, completedAt',
  progress:       '++id, zone, mission, stars, date',
  journal:        '++id, date, blob, duration, mood',
  braveStars:     '++id, type, description, date',
  streaks:        '++id, date, completed',
  settings:       '++id, key, value',
  speechAnalysis: '++id, date, sessionType, wpm, fillerCount, fluencyScore',
  actSessions:    '++id, sessionNum, date, completed',
  braveWall:      '++id, date, situation, anonymous',
  weeklyReports:  '++id, weekStart, generatedAt',
  dafSessions:    '++id, date, delayMs, duration',
})

// ─── VERSION 2: add userState + conversationLog tables ────────────────────────
// userState:       Persists the computed psychological snapshot from fluxBrain.
//                  One row per key — same upsert pattern as settings.
//                  This lets the brain reconstruct its last known state on cold
//                  start without re-computing everything from scratch.
//
// conversationLog: Stores the last N Flux ↔ user exchanges as indexed rows.
//                  fluxBrain previously serialised this into a single settings
//                  JSON blob. A real table gives us date-based queries and
//                  clean truncation without deserialising the whole log.
db.version(2).stores({
  profile:         '++id, name, ageGroup, avatar, createdAt',
  sessions:        '++id, type, date, duration, score, data',
  recordings:      '++id, type, date, blob, duration, label',
  fearLadder:      '++id, situation, fearLevel, completed, completedAt',
  progress:        '++id, zone, mission, stars, date',
  journal:         '++id, date, blob, duration, mood',
  braveStars:      '++id, type, description, date',
  streaks:         '++id, date, completed',
  settings:        '++id, &key, value',       // &key = unique index (fixes prefix queries)
  speechAnalysis:  '++id, date, sessionType, wpm, fillerCount, fluencyScore',
  actSessions:     '++id, sessionNum, date, completed',
  braveWall:       '++id, date, situation, anonymous',
  weeklyReports:   '++id, weekStart, generatedAt',
  dafSessions:     '++id, date, delayMs, duration',
  // ── NEW v2 tables ──────────────────────────────────────────────────────────
  userState:       '++id, &key, value, updatedAt',       // psychological profile cache
  conversationLog: '++id, role, message, timestamp',     // chat history
})
// ─── VERSION 3: YoSpeech AI — Soul Model + Emotional Readings + AI Sessions ──
db.version(3).stores({
  profile:         '++id, name, ageGroup, avatar, createdAt',
  sessions:        '++id, type, date, duration, score, data',
  recordings:      '++id, type, date, blob, duration, label',
  fearLadder:      '++id, situation, fearLevel, completed, completedAt',
  progress:        '++id, zone, mission, stars, date',
  journal:         '++id, date, blob, duration, mood',
  braveStars:      '++id, type, description, date',
  streaks:         '++id, date, completed',
  settings:        '++id, &key, value',
  speechAnalysis:  '++id, date, sessionType, wpm, fillerCount, fluencyScore',
  actSessions:     '++id, sessionNum, date, completed',
  braveWall:       '++id, date, situation, anonymous',
  weeklyReports:   '++id, weekStart, generatedAt',
  dafSessions:     '++id, date, delayMs, duration',
  userState:       '++id, &key, value, updatedAt',
  conversationLog: '++id, role, message, timestamp',

  // ── NEW v3 tables ──
  soulModel:         '++id, createdAt, onboardingComplete',
  emotionalReadings: '++id, timestamp, derivedState',
  aiSessions:        '++id, date, emotionalState, streak',
})

// ─── CORE HELPERS ─────────────────────────────────────────────────────────────
export const getProfile  = () => db.profile.orderBy('id').last()
export const saveProfile = (data) =>
  db.profile.put({ ...data, createdAt: new Date().toISOString() })

export const addSession = (type, score, data = {}) =>
  db.sessions.add({
    type, score,
    data:     JSON.stringify(data),
    date:     new Date().toISOString(),
    duration: data.duration || 0,
  })

export const addRecording = (type, blob, duration, label = '') =>
  db.recordings.add({ type, blob, duration, label, date: new Date().toISOString() })

export const getRecentSessions = (limit = 20) =>
  db.sessions.orderBy('date').reverse().limit(limit).toArray()

export const getTotalSessions  = () => db.sessions.count()

export const addBraveStar = (type, description) =>
  db.braveStars.add({ type, description, date: new Date().toISOString() })

export const getFearLadder    = () => db.fearLadder.orderBy('fearLevel').toArray()
export const addFearItem      = (situation, fearLevel) =>
  db.fearLadder.add({ situation, fearLevel, completed: false, completedAt: null })
export const completeFearItem = (id) =>
  db.fearLadder.update(id, { completed: true, completedAt: new Date().toISOString() })

export const getJournalEntries = () => db.journal.orderBy('date').reverse().toArray()
export const addJournalEntry   = (blob, duration, mood) =>
  db.journal.add({ blob, duration, mood, date: new Date().toISOString() })

export const getZoneProgress  = (zone) => db.progress.where('zone').equals(zone).toArray()
export const saveZoneProgress = (zone, mission, stars) =>
  db.progress.add({ zone, mission, stars, date: new Date().toISOString() })

export const getTodayStreak = async () => {
  const today = new Date().toDateString()
  return db.streaks.where('date').equals(today).first()
}
export const markTodayStreak = async () => {
  const today = new Date().toDateString()
  const existing = await getTodayStreak()
  if (!existing) await db.streaks.add({ date: today, completed: true })
}
export const getStreakCount = async () => {
  const entries = await db.streaks.orderBy('date').reverse().toArray()
  let count = 0
  const now = new Date()
  for (let i = 0; i < entries.length; i++) {
    const d    = new Date(entries[i].date)
    const diff = Math.floor((now - d) / 86400000)
    if (diff === i) count++
    else break
  }
  return count
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
// Unique key index (v2) means we can use .get() and .put() directly,
// which is faster than the old where().first() pattern.
// Both the old and new style are supported for backwards compatibility.

export const getSetting = async (key, defaultVal = null) => {
  try {
    const row = await db.settings.where('key').equals(key).first()
    return row ? row.value : defaultVal
  } catch {
    return defaultVal
  }
}

export const setSetting = async (key, value) => {
  try {
    const existing = await db.settings.where('key').equals(key).first()
    if (existing) await db.settings.update(existing.id, { value })
    else          await db.settings.add({ key, value })
  } catch (e) {
    console.warn('[db] setSetting failed:', key, e.message)
  }
}

// Bulk-read multiple settings in one round-trip
export const getSettings = async (keys) => {
  const rows = await db.settings.where('key').anyOf(keys).toArray()
  const map  = {}
  rows.forEach(r => { map[r.key] = r.value })
  keys.forEach(k => { if (!(k in map)) map[k] = null })
  return map
}

// ─── USER STATE TABLE ─────────────────────────────────────────────────────────
// Stores the fluxBrain psychological snapshot so the brain can recover its
// last known state immediately on cold start, before async data loads finish.
//
// Keys mirror MemoryKeys in fluxEngine + computed indices from fluxBrain:
//   flux_avoidance_index · flux_self_efficacy · flux_momentum
//   flux_pattern_data    · flux_conv_log

export const getUserState = async (key, defaultVal = null) => {
  try {
    const row = await db.userState.where('key').equals(key).first()
    return row ? row.value : defaultVal
  } catch {
    return defaultVal
  }
}

export const setUserState = async (key, value) => {
  try {
    const existing = await db.userState.where('key').equals(key).first()
    const updatedAt = new Date().toISOString()
    if (existing) await db.userState.update(existing.id, { value, updatedAt })
    else          await db.userState.add({ key, value, updatedAt })
  } catch (e) {
    console.warn('[db] setUserState failed:', key, e.message)
  }
}

// Read multiple userState keys at once
export const getUserStateMap = async (keys) => {
  const rows = await db.userState.where('key').anyOf(keys).toArray()
  const map  = {}
  rows.forEach(r => { map[r.key] = r.value })
  keys.forEach(k => { if (!(k in map)) map[k] = null })
  return map
}

// Persist all computed brain indices in one transaction
export const persistBrainState = async ({ avoidanceIndex, selfEfficacy, momentum, patternData }) => {
  try {
    await db.transaction('rw', db.userState, async () => {
      const updatedAt = new Date().toISOString()
      const upsert    = async (key, value) => {
        const existing = await db.userState.where('key').equals(key).first()
        if (existing) await db.userState.update(existing.id, { value, updatedAt })
        else          await db.userState.add({ key, value, updatedAt })
      }
      if (avoidanceIndex !== undefined) await upsert('flux_avoidance_index', avoidanceIndex)
      if (selfEfficacy   !== undefined) await upsert('flux_self_efficacy',   selfEfficacy)
      if (momentum       !== undefined) await upsert('flux_momentum',        momentum)
      if (patternData    !== undefined) await upsert('flux_pattern_data',    JSON.stringify(patternData))
    })
  } catch (e) {
    console.warn('[db] persistBrainState failed:', e.message)
  }
}

// Get the last-persisted brain snapshot (used for cold-start hints)
export const getLastBrainSnapshot = async () => {
  try {
    const rows = await db.userState
      .where('key')
      .anyOf(['flux_avoidance_index', 'flux_self_efficacy', 'flux_momentum'])
      .toArray()
    const map = {}
    rows.forEach(r => { map[r.key] = r.value })
    return {
      avoidanceIndex: map['flux_avoidance_index'] ?? 50,
      selfEfficacy:   map['flux_self_efficacy']   ?? 40,
      momentum:       map['flux_momentum']        ?? 'low',
    }
  } catch {
    return { avoidanceIndex: 50, selfEfficacy: 40, momentum: 'low' }
  }
}

// ─── CONVERSATION LOG TABLE ────────────────────────────────────────────────────
// Stores Flux ↔ user chat exchanges as indexed rows.
// fluxBrain reads the last N entries to maintain conversational continuity.
// Rows are pruned to MAX_CONV_ENTRIES automatically on append.

const MAX_CONV_ENTRIES = 40  // keep 40 rows (~20 exchanges) — plenty for context

export const appendConversationEntry = async (role, message) => {
  try {
    await db.conversationLog.add({
      role,
      message:   String(message).slice(0, 400),  // cap per entry
      timestamp: Date.now(),
    })
    // Prune: keep only the latest MAX_CONV_ENTRIES rows
    const total = await db.conversationLog.count()
    if (total > MAX_CONV_ENTRIES) {
      const oldest = await db.conversationLog
        .orderBy('timestamp')
        .limit(total - MAX_CONV_ENTRIES)
        .toArray()
      await db.conversationLog.bulkDelete(oldest.map(r => r.id))
    }
  } catch (e) {
    console.warn('[db] appendConversationEntry failed:', e.message)
  }
}

export const getConversationHistory = async (limit = 20) => {
  try {
    return await db.conversationLog
      .orderBy('timestamp')
      .reverse()
      .limit(limit)
      .toArray()
      .then(rows => rows.reverse())  // return chronological order
  } catch {
    return []
  }
}

export const getConversationSummaryText = async (limit = 6) => {
  try {
    const rows = await getConversationHistory(limit)
    if (rows.length < 2) return null
    return rows
      .map(r => `${r.role === 'user' ? 'User' : 'Flux'}: ${r.message}`)
      .join('\n')
  } catch {
    return null
  }
}

export const clearConversationLog = async () => {
  try { await db.conversationLog.clear() } catch {}
}

// ─── V5 HELPERS ───────────────────────────────────────────────────────────────
export const getSessionsByType = (type, limit = 20) =>
  db.sessions.where('type').equals(type).reverse().limit(limit).toArray()

export const getSessionCount = () => db.sessions.count()

export const clearMemory = async () => {
  const memKeys = [
    'flux_insights', 'flux_strengths', 'flux_weaknesses',
    'flux_recs', 'flux_story', 'flux_goals',
    // v3 extended keys
    'flux_avoidance_index', 'flux_self_efficacy', 'flux_momentum',
    'flux_pattern_data', 'flux_conv_log',
    'flux_life_story_offline', 'flux_life_story_offline_date',
  ]
  for (const k of memKeys) {
    await db.settings.where('key').equals(k).delete()
  }
  // Also clear the dedicated tables
  await db.userState.clear().catch(() => {})
  await db.conversationLog.clear().catch(() => {})
}

export const saveSpeechAnalysis = (data) =>
  db.speechAnalysis.add({ ...data, date: new Date().toISOString() })

export const getRecentAnalyses = (limit = 20) =>
  db.speechAnalysis.orderBy('date').reverse().limit(limit).toArray()

export const getAnalysisTrend = async (days = 30) => {
  const since = new Date(Date.now() - days * 86400000).toISOString()
  return db.speechAnalysis.where('date').above(since).toArray()
}

export const saveActSession = (sessionNum, reflection, audioBlob = null) =>
  db.actSessions.add({
    sessionNum,
    reflection: reflection || '',
    completed:  true,
    date:       new Date().toISOString(),
  })

export const getActProgress = () =>
  db.actSessions.orderBy('sessionNum').toArray()

export const addBraveWallPost = (situation, anonymous = true) =>
  db.braveWall.add({ situation, anonymous, likes: 0, date: new Date().toISOString() })

export const getBraveWallPosts = (limit = 50) =>
  db.braveWall.orderBy('date').reverse().limit(limit).toArray()

export const saveWeeklyReport = (weekStart, report, stats) =>
  db.weeklyReports.add({
    weekStart,
    report,
    stats:       JSON.stringify(stats),
    generatedAt: new Date().toISOString(),
  })

export const getLatestWeeklyReport = () =>
  db.weeklyReports.orderBy('generatedAt').last()

export const getFluentStats = async () => {
  const [totalSessions, analyses, braveCount, actDone, journalCount] = await Promise.all([
    db.sessions.count(),
    db.speechAnalysis.orderBy('date').reverse().limit(10).toArray(),
    db.braveStars.count(),
    db.actSessions.count(),
    db.journal.count(),
  ])
  const avgFluency = analyses.length
    ? Math.round(analyses.reduce((a, b) => a + (b.fluencyScore || 70), 0) / analyses.length)
    : null
  const avgWpm = analyses.length
    ? Math.round(analyses.reduce((a, b) => a + (b.wpm || 0), 0) / analyses.length)
    : null
  return { totalSessions, avgFluency, avgWpm, braveCount, actDone, journalCount }
}
