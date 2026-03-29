// ─── FLUX BRAIN v1 ────────────────────────────────────────────────────────────
// 100% Offline Rule-Based Intelligence Engine
// UserState · Intent Detection · Response Selection · Memory Update
// Conversation Engine · Pattern Recognition · Adaptive Coaching
//
// Zero network calls. Zero Claude API. Pure logic reading local data.
// ─────────────────────────────────────────────────────────────────────────────

import {
  db, getSetting, setSetting,
  getRecentSessions, getTotalSessions, getStreakCount,
  getFearLadder, getRecentAnalyses, getActProgress,
} from '../utils/db'
import { getCurrentStage, getEvolutionProgress } from './fluxPersonality'
import {
  GREETINGS, FAREWELLS, CELEBRATIONS, STRUGGLE, ENCOURAGEMENT,
  APP_QUESTIONS, TECHNIQUE_HELP, SCIENCE_QA, STORY_PROMPTS,
  BRAVE_MISSIONS, WEEKLY_TEMPLATES, LIFE_STORY_TEMPLATES,
  pickResponse, pickByAgeGroup,
} from './fluxResponses'

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1 — USER STATE ENGINE
// Builds a complete psychological + behavioural snapshot from local data.
// Called before every chat response. Cached for 5 minutes.
// ═══════════════════════════════════════════════════════════════════════════════

let _userStateCache = null
let _userStateCacheTime = 0
const USER_STATE_TTL = 5 * 60 * 1000 // 5 minutes

export const buildUserState = async (profile, forceRefresh = false) => {
  if (!forceRefresh && _userStateCache && (Date.now() - _userStateCacheTime) < USER_STATE_TTL) {
    return _userStateCache
  }

  const now = Date.now()
  const ageGroup = profile?.ageGroup || 'explorer'
  const mode = profile?.mode || 'stutter'
  const name = profile?.name || 'friend'

  // ── Parallel data load ──────────────────────────────────────────────────────
  const [
    totalSessions,
    streak,
    recentSessions,
    fearLadder,
    analyses,
    actSessions,
    journalCount,
    braveStarCount,
    todayMood,
    lastBrave,
    lastJournal,
    conversationLog,
    patternData,
    bestStreak,
    totalBraveStars,
  ] = await Promise.all([
    getTotalSessions(),
    getStreakCount(),
    getRecentSessions(30),
    getFearLadder().catch(() => []),
    getRecentAnalyses(20).catch(() => []),
    getActProgress().catch(() => []),
    db.journal.count().catch(() => 0),
    db.braveStars.count().catch(() => 0),
    getSetting('today_mood', null),
    db.sessions.where('type').equals('brave').last().catch(() => null),
    db.journal.orderBy('date').last().catch(() => null),
    _loadConversationLog(),
    _loadPatternData(),
    getSetting('best_streak', 0),
    db.braveStars.count().catch(() => 0),
  ])

  // ── Time analysis ───────────────────────────────────────────────────────────
  const hour = new Date().getHours()
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night'
  const isWeekend = [0, 6].includes(new Date().getDay())

  // ── Session frequency analysis ──────────────────────────────────────────────
  const last7Days = recentSessions.filter(s => (now - new Date(s.date)) < 7 * 86400000)
  const last14Days = recentSessions.filter(s => (now - new Date(s.date)) < 14 * 86400000)
  const last30Days = recentSessions.filter(s => (now - new Date(s.date)) < 30 * 86400000)
  const sessionFrequency7 = last7Days.length
  const sessionFrequency14 = last14Days.length

  // Days since last session
  const lastSession = recentSessions[0] || null
  const daysSinceLastSession = lastSession
    ? Math.floor((now - new Date(lastSession.date)) / 86400000)
    : 999

  // Session type breakdown
  const sessionTypeCounts = recentSessions.reduce((acc, s) => {
    acc[s.type] = (acc[s.type] || 0) + 1; return acc
  }, {})
  const lastSessionType = lastSession?.type || null

  // ── Brave analysis ──────────────────────────────────────────────────────────
  const daysSinceBrave = lastBrave
    ? Math.floor((now - new Date(lastBrave.date)) / 86400000)
    : 999
  const braveSessionsTotal = sessionTypeCounts['brave'] || 0
  const hasVoluntaryStutter = await db.braveStars
    .where('type').equals('voluntary').count().catch(() => 0)

  // Fear ladder analysis
  const completedFear = fearLadder.filter(f => f.completed)
  const uncompletedFear = fearLadder.filter(f => !f.completed)
  const highestCompletedFear = completedFear.reduce((max, f) => Math.max(max, f.fearLevel || 0), 0)
  const nextFearItem = uncompletedFear.sort((a, b) => (a.fearLevel || 0) - (b.fearLevel || 0))[0] || null
  const fearLadderStall = nextFearItem && daysSinceBrave > 5

  // ── Speech analysis trends ──────────────────────────────────────────────────
  const avgFluency = analyses.length
    ? Math.round(analyses.reduce((a, b) => a + (b.fluencyScore || 70), 0) / analyses.length)
    : null
  const avgWpm = analyses.length
    ? Math.round(analyses.reduce((a, b) => a + (b.wpm || 0), 0) / analyses.length)
    : null
  const recentFluency = analyses.slice(0, 5)
  const olderFluency = analyses.slice(5, 10)
  const fluencyTrend = (recentFluency.length && olderFluency.length)
    ? Math.round(
        (recentFluency.reduce((a, b) => a + (b.fluencyScore || 70), 0) / recentFluency.length) -
        (olderFluency.reduce((a, b) => a + (b.fluencyScore || 70), 0) / olderFluency.length)
      )
    : 0
  const isPlateauing = analyses.length >= 5 && Math.abs(fluencyTrend) < 3

  // Top filler word across all analyses
  const fillerTotals = {}
  analyses.forEach(a => {
    try {
      const fw = typeof a.fillerWords === 'string' ? JSON.parse(a.fillerWords) : (a.fillerWords || [])
      fw.forEach(f => { fillerTotals[f.word] = (fillerTotals[f.word] || 0) + f.count })
    } catch {}
  })
  const topFiller = Object.entries(fillerTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || null

  // ── ACT progress ────────────────────────────────────────────────────────────
  const actDone = actSessions.length
  const actInProgress = actDone > 0 && actDone < 8
  const actComplete = actDone >= 8

  // ── Mood analysis ───────────────────────────────────────────────────────────
  const moodHistory = await _loadMoodHistory()
  const moodTrend = _computeMoodTrend(moodHistory)
  const currentMoodId = todayMood
  const moodLabel = { amazing: 'amazing', good: 'good', okay: 'okay', stressed: 'stressed', bad: 'bad' }[currentMoodId] || 'unknown'

  // ── Avoidance index (0-100, higher = more avoidance behaviour) ───────────────
  // Based on: session frequency, brave sessions ratio, fear ladder progress, days since brave
  let avoidanceIndex = 50 // baseline
  if (braveSessionsTotal > 0 && totalSessions > 0) {
    const braveRatio = braveSessionsTotal / totalSessions
    avoidanceIndex -= braveRatio * 30 // more brave sessions = less avoidance
  }
  if (daysSinceBrave > 7) avoidanceIndex += 15
  if (daysSinceBrave > 14) avoidanceIndex += 10
  if (fearLadderStall) avoidanceIndex += 10
  if (sessionFrequency7 > 4) avoidanceIndex -= 10
  avoidanceIndex = Math.max(0, Math.min(100, Math.round(avoidanceIndex)))

  // ── Self-efficacy index (0-100) ──────────────────────────────────────────────
  let selfEfficacy = 40
  selfEfficacy += Math.min(totalSessions * 0.5, 20)
  selfEfficacy += Math.min(streak * 1.5, 20)
  selfEfficacy += Math.min(braveStarCount * 1, 15)
  if (hasVoluntaryStutter > 0) selfEfficacy += 10
  if (avgFluency && avgFluency > 70) selfEfficacy += 5
  selfEfficacy = Math.max(0, Math.min(100, Math.round(selfEfficacy)))

  // ── Momentum (recent activity level) ────────────────────────────────────────
  const momentum = sessionFrequency7 >= 5 ? 'high'
    : sessionFrequency7 >= 3 ? 'good'
    : sessionFrequency7 >= 1 ? 'low'
    : 'stalled'

  // ── Pattern flags ────────────────────────────────────────────────────────────
  const flags = {
    newUser:           totalSessions < 3,
    returning:         daysSinceLastSession >= 2 && totalSessions > 0,
    longAbsence:       daysSinceLastSession >= 7,
    streakRisk:        streak > 2 && daysSinceLastSession >= 1,
    streakMilestone:   [7, 14, 21, 30, 60, 100].includes(streak),
    avoidingBrave:     daysSinceBrave > 7 && totalSessions > 5,
    avoidingAnalysis:  !sessionTypeCounts['analysis'] || sessionTypeCounts['analysis'] < 1,
    plateauing:        isPlateauing && totalSessions > 10,
    actReady:          !actInProgress && totalSessions >= 5 && !actComplete,
    actDue:            actInProgress && daysSinceBrave > 3,
    volunteerEligible: totalSessions >= 3 && !hasVoluntaryStutter,
    journalGap:        journalCount === 0 || (lastJournal && (now - new Date(lastJournal.date)) > 5 * 86400000),
    highAnxiety:       moodLabel === 'stressed' || moodLabel === 'bad',
    highMomentum:      momentum === 'high',
    fearLadderStall:   fearLadderStall,
    sessionTypeRut:    Object.keys(sessionTypeCounts).length <= 1 && totalSessions > 5,
  }

  // ── Dominant session type (what they do most) ────────────────────────────────
  const dominantType = Object.entries(sessionTypeCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || null

  // ── Weak areas (from pattern tracking) ──────────────────────────────────────
  const weakAreas = []
  if (avgWpm && avgWpm > 175) weakAreas.push('rate_control')
  if (topFiller) weakAreas.push(`filler_word_${topFiller}`)
  if (avoidanceIndex > 65) weakAreas.push('avoidance')
  if (!sessionTypeCounts['breathe']) weakAreas.push('breathing_practice')

  const state = {
    // Profile
    name, ageGroup, mode,
    // Session data
    totalSessions, streak, bestStreak: Math.max(streak, bestStreak || 0),
    sessionFrequency7, sessionFrequency14,
    daysSinceLastSession, lastSessionType,
    sessionTypeCounts, dominantType,
    // Brave
    braveStarCount: totalBraveStars, daysSinceBrave,
    braveSessionsTotal, hasVoluntaryStutter,
    highestCompletedFear, nextFearItem,
    fearLadderStall,
    // Analysis
    avgFluency, avgWpm, fluencyTrend, isPlateauing, topFiller,
    analysisCount: analyses.length,
    // ACT
    actDone, actInProgress, actComplete,
    // Mood
    currentMoodId, moodLabel, moodTrend,
    // Journal
    journalCount,
    // Computed indices
    avoidanceIndex, selfEfficacy, momentum,
    // Flags
    flags,
    weakAreas,
    // Context
    timeOfDay, isWeekend, hour,
    // History
    conversationLog,
    patternData,
    // Evolution
    evolutionStage: getCurrentStage(totalSessions),
    evolutionProgress: getEvolutionProgress(totalSessions),
  }

  _userStateCache = state
  _userStateCacheTime = Date.now()

  // Persist key flags to DB for cross-session memory
  await _persistStateFlags(state)

  return state
}

// ── Helpers for buildUserState ─────────────────────────────────────────────────

const _loadConversationLog = async () => {
  try {
    const raw = await getSetting('flux_conv_log', null)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

const _loadPatternData = async () => {
  try {
    const raw = await getSetting('flux_pattern_data', null)
    return raw ? JSON.parse(raw) : {
      topicsDiscussed: [],
      techniquesUsed: [],
      breakthroughMoments: [],
      lastCompliment: null,
      lastChallenge: null,
      consecutiveGoodSessions: 0,
      totalVoluntaryStutters: 0,
    }
  } catch {
    return {
      topicsDiscussed: [],
      techniquesUsed: [],
      breakthroughMoments: [],
      lastCompliment: null,
      lastChallenge: null,
      consecutiveGoodSessions: 0,
      totalVoluntaryStutters: 0,
    }
  }
}

const _loadMoodHistory = async () => {
  try {
    const keys = await db.settings.where('key').startsWith('mood_').toArray()
    return keys.map(k => ({ date: k.key.replace('mood_', ''), mood: k.value }))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 14)
  } catch { return [] }
}

const _computeMoodTrend = (moodHistory) => {
  if (moodHistory.length < 3) return 'neutral'
  const moodScore = { amazing: 5, good: 4, okay: 3, stressed: 2, bad: 1 }
  const recent = moodHistory.slice(0, 3).map(m => moodScore[m.mood] || 3)
  const older = moodHistory.slice(3, 7).map(m => moodScore[m.mood] || 3)
  if (!older.length) return 'neutral'
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length
  const delta = recentAvg - olderAvg
  if (delta > 0.5) return 'improving'
  if (delta < -0.5) return 'declining'
  return 'stable'
}

const _persistStateFlags = async (state) => {
  try {
    await setSetting('flux_avoidance_index', state.avoidanceIndex)
    await setSetting('flux_self_efficacy', state.selfEfficacy)
    await setSetting('flux_momentum', state.momentum)
  } catch {}
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2 — INTENT DETECTION ENGINE
// Classifies what the user is trying to communicate.
// Returns: { intent, subIntent, confidence, keywords }
// ═══════════════════════════════════════════════════════════════════════════════

const INTENT_PATTERNS = {
  // App questions
  ask_what_is_app:       [/what is yospeech/i, /what does this app do/i, /what.s yospeech/i, /about this app/i, /what is this/i],
  ask_what_is_flux:      [/who are you/i, /what are you/i, /what is flux/i, /who is flux/i, /are you ai/i, /are you a bot/i, /are you real/i],
  ask_how_feature:       [/how does (brave|speaklab|breathe|journal|family|act|daf|talktales|analysis|biomarker|progress|comm|wall)/i, /what is (brave|speaklab|breathe|journal|family|act|daf|talktales|analysis|progress)/i, /how do i use/i, /explain (the )?/i, /what.s the point of/i],
  ask_about_stuttering_science: [/why do i stutter/i, /what causes stutter/i, /is stutter.* curable/i, /is stutter.* genetic/i, /stutter.* brain/i, /neurology/i, /basal ganglia/i, /stutter.* cure/i, /can i stop stutter/i],
  ask_about_technique:   [/how do i do (easy onset|rate control|prolonged|cancellation|pull.?out|voluntary|choral|breathing)/i, /what is (easy onset|rate control|prolonged speech|cancellation|pull.?out|voluntary stutter)/i, /explain (easy onset|rate control|prolonged|cancellation|pull.?out|voluntary stutter)/i, /how does (easy onset|rate control|prolonged speech|daf|choral) work/i],
  ask_why_fluent_singing: [/why.*fluent.*sing/i, /sing.*don.t stutter/i, /why.*sing.*better/i, /stutter.*music/i],
  ask_why_fluent_alone:  [/why.*fluent.*alone/i, /why.*fluent.*family/i, /why.*stutter.*stranger/i, /why.*easy.*home/i, /why.*hard.*public/i],
  ask_about_avoidance:   [/what is avoidance/i, /word substitut/i, /why do i avoid/i, /why do i swap words/i, /switching words/i],
  ask_intelligence:      [/does stutter.*intellig/i, /am i less smart/i, /stutter.*stupid/i, /intellig.*stutter/i],
  ask_why_fear_worse:    [/why.*fear.*worse/i, /why.*anxiety.*stutter/i, /anxious.*stutter more/i, /nervous.*block/i],

  // Emotional states
  express_frustration:   [/frustrated/i, /so hard/i, /can't do this/i, /hate this/i, /pointless/i, /useless/i, /not working/i, /giving up/i, /want to quit/i, /hopeless/i, /sick of/i, /so tired of/i, /doesn.t help/i],
  express_anxiety:       [/scared/i, /anxious/i, /terrified/i, /nervous/i, /panic/i, /afraid/i, /worried/i, /dreading/i, /can.t breathe/i, /heart racing/i],
  express_sadness:       [/sad/i, /depressed/i, /down/i, /low/i, /unhappy/i, /miserable/i, /crying/i, /feel terrible/i],
  express_celebration:   [/did it/i, /i did/i, /i succeeded/i, /nailed it/i, /finally/i, /completed/i, /achieved/i, /i passed/i, /got the job/i, /made the call/i, /ordered/i, /survived/i],
  express_doubt:         [/not sure/i, /doubt/i, /maybe/i, /probably won.t/i, /probably can.t/i, /don.t think i can/i, /is it worth/i, /will this work/i, /does this actually help/i, /does this work/i],
  share_bad_experience:  [/terrible session/i, /awful/i, /blocked so (hard|bad|much)/i, /completely fell apart/i, /worst session/i, /embarrassing/i, /humiliating/i, /it was bad/i, /it went badly/i, /failed/i],
  share_good_experience: [/great session/i, /amazing session/i, /best session/i, /went well/i, /felt easy/i, /felt great/i, /felt good/i, /fluent today/i, /no blocks/i, /so much easier/i],

  // Practice-related
  ask_what_to_do:        [/what should i do/i, /where should i start/i, /what.s next/i, /recommend/i, /suggestion/i, /what do you think/i, /what would you do/i, /guide me/i, /help me choose/i],
  ask_for_motivation:    [/motivate me/i, /inspire me/i, /need motivation/i, /why should i/i, /remind me why/i, /is it worth it/i, /encourage me/i],
  ask_about_progress:    [/how am i doing/i, /my progress/i, /am i improving/i, /getting better/i, /have i improved/i, /check my progress/i, /how many sessions/i, /my stats/i, /my streak/i],
  ask_for_technique:     [/teach me/i, /how do i/i, /technique/i, /exercise for/i, /practice for/i, /help with/i, /tips for/i, /advice for/i, /best way to/i],

  // Conversation
  greeting:              [/^(hi|hey|hello|morning|afternoon|evening|yo|sup|hiya|heya|helo)[\s!.?]*$/i, /^good (morning|afternoon|evening)/i],
  farewell:              [/^(bye|goodbye|see you|cya|gotta go|talk later|ttyl|see ya|good night)[\s!.?]*$/i, /thanks.*bye/i, /bye.*thanks/i],
  thanks:                [/thank(s| you)/i, /appreciate/i, /that helps/i, /that.s helpful/i, /helpful/i],
  story_request:         [/tell (me )?a story/i, /story time/i, /want a story/i, /continue the story/i, /next part/i, /what happens/i, /and then/i],
  just_chatting:         [/how are you/i, /what.s up/i, /how.s it going/i, /what are you thinking/i, /talk to me/i, /just (want(ed)? to )?(chat|talk)/i],
  ask_about_day:         [/how was (my|your) day/i, /how did (your|my) day go/i, /had a (rough|good|bad|great) day/i, /today was/i, /this week/i],

  // Voluntary stutter
  report_voluntary_stutter: [/voluntary stutter/i, /stuttered on purpose/i, /did it on purpose/i, /stuttered deliberately/i, /intentional stutter/i],
  report_phone_call:        [/made (the|a) (call|phone call)/i, /called (them|the|a)/i, /phone call done/i, /survived the call/i],
  report_presentation:      [/did the presentation/i, /gave (the|a) (talk|speech|presentation)/i, /survived (the )?presentation/i, /presentation (went|done|complete)/i],
  report_introduction:      [/introduced myself/i, /said hi to/i, /met someone new/i, /talked to a stranger/i],
}

export const detectIntent = (message) => {
  if (!message || !message.trim()) return { intent: 'just_chatting', confidence: 0.3, keywords: [] }

  const msg = message.trim()
  const results = []

  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(msg)) {
        results.push({ intent, confidence: 0.9 })
        break
      }
    }
  }

  // Sort by confidence, return top match
  if (results.length === 0) return { intent: 'just_chatting', confidence: 0.3, keywords: extractKeywords(msg) }

  results.sort((a, b) => b.confidence - a.confidence)
  return { ...results[0], keywords: extractKeywords(msg) }
}

const extractKeywords = (msg) => {
  const stopWords = new Set(['i', 'me', 'my', 'the', 'a', 'an', 'is', 'it', 'to', 'do', 'in', 'on', 'of', 'for', 'and', 'or', 'but', 'so', 'was', 'are', 'be', 'at', 'by'])
  return msg.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w))
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3 — RESPONSE SELECTION ENGINE
// The core decision tree. 60+ rules. Priority-ordered.
// ═══════════════════════════════════════════════════════════════════════════════

export const selectResponse = (intent, state, rawMessage = '') => {
  const { ageGroup, name, streak, totalSessions, daysSinceBrave,
          avgFluency, avgWpm, currentMoodId, flags, nextFearItem,
          evolutionStage, daysSinceLastSession, actDone, hasVoluntaryStutter,
          selfEfficacy, avoidanceIndex, momentum, topFiller, fluencyTrend,
          isPlateauing, sessionTypeCounts, weakAreas } = state

  const ag = ageGroup || 'explorer'
  const stage = evolutionStage?.id || 'seed'

  // ── PRIORITY 1: Crisis / high distress ──────────────────────────────────────
  if (intent.intent === 'express_frustration' && rawMessage.match(/giving up|quit|hopeless|pointless/i)) {
    return _fillSlots(_crisisResponse(ag, state), state)
  }

  // ── PRIORITY 2: Direct celebrations ─────────────────────────────────────────
  if (intent.intent === 'report_voluntary_stutter') {
    return _fillSlots(pickByAgeGroup(CELEBRATIONS.voluntary_stutter, ag, 'vol_stutter'), state)
  }
  if (intent.intent === 'express_celebration') {
    const type = rawMessage.match(/stutter/i) ? 'voluntary_stutter'
      : totalSessions <= 3 ? 'first_brave'
      : streak > 0 && flags.streakMilestone ? 'streak_milestone'
      : 'big_win'
    return _fillSlots(pickByAgeGroup(CELEBRATIONS[type] || CELEBRATIONS.big_win, ag, `celeb_${type}`), state)
  }
  if (intent.intent === 'report_phone_call' || intent.intent === 'report_presentation' || intent.intent === 'report_introduction') {
    return _fillSlots(pickByAgeGroup(CELEBRATIONS.big_win, ag, 'celeb_brave'), state)
  }

  // ── PRIORITY 3: App/feature questions ───────────────────────────────────────
  if (intent.intent === 'ask_what_is_app') {
    return pickResponse(APP_QUESTIONS.what_is_yospeech.all, 'app_what')
  }
  if (intent.intent === 'ask_what_is_flux') {
    return pickResponse(APP_QUESTIONS.what_is_flux.all, 'app_flux')
  }
  if (intent.intent === 'ask_how_feature') {
    return _routeFeatureQuestion(rawMessage)
  }

  // ── PRIORITY 4: Science questions ───────────────────────────────────────────
  if (intent.intent === 'ask_about_stuttering_science') {
    const key = rawMessage.match(/curable|cure|stop/i) ? 'is_stuttering_curable'
      : rawMessage.match(/intellig|smart|stupid/i) ? 'does_stuttering_affect_intelligence'
      : 'why_do_i_stutter'
    return pickResponse(SCIENCE_QA[key]?.all || SCIENCE_QA.why_do_i_stutter.all, `sci_${key}`)
  }
  if (intent.intent === 'ask_why_fluent_singing') {
    return pickResponse(SCIENCE_QA.why_fluent_when_singing.all, 'sci_singing')
  }
  if (intent.intent === 'ask_why_fluent_alone') {
    return pickResponse(SCIENCE_QA.why_fluent_with_some_people.all, 'sci_alone')
  }
  if (intent.intent === 'ask_about_avoidance') {
    return pickResponse(SCIENCE_QA.what_is_avoidance.all, 'sci_avoidance')
  }
  if (intent.intent === 'ask_why_fear_worse') {
    return pickResponse(SCIENCE_QA.why_does_fear_make_it_worse.all, 'sci_fear')
  }
  if (intent.intent === 'ask_intelligence') {
    return pickResponse(SCIENCE_QA.does_stuttering_affect_intelligence.all, 'sci_intel')
  }

  // ── PRIORITY 5: Technique help ───────────────────────────────────────────────
  if (intent.intent === 'ask_about_technique') {
    return _routeTechniqueQuestion(rawMessage)
  }

  // ── PRIORITY 6: Emotional support ───────────────────────────────────────────
  if (intent.intent === 'express_anxiety') {
    return _fillSlots(_anxietyResponse(ag, state), state)
  }
  if (intent.intent === 'express_frustration') {
    return _fillSlots(_frustrationResponse(ag, state), state)
  }
  if (intent.intent === 'express_sadness') {
    return _fillSlots(_sadnessResponse(ag, state), state)
  }
  if (intent.intent === 'share_bad_experience') {
    return _fillSlots(pickByAgeGroup(STRUGGLE.bad_session, ag, 'bad_session'), state)
  }
  if (intent.intent === 'share_good_experience') {
    return _fillSlots(pickByAgeGroup(CELEBRATIONS.small_win, ag, 'good_session'), state)
  }
  if (intent.intent === 'express_doubt') {
    return _fillSlots(_doubtResponse(ag, state), state)
  }

  // ── PRIORITY 7: Progress inquiry ─────────────────────────────────────────────
  if (intent.intent === 'ask_about_progress') {
    return _buildProgressResponse(state)
  }

  // ── PRIORITY 8: Recommendation request ──────────────────────────────────────
  if (intent.intent === 'ask_what_to_do') {
    return _buildRecommendation(state)
  }
  if (intent.intent === 'ask_for_motivation') {
    return _buildMotivationResponse(ag, state)
  }

  // ── PRIORITY 9: Greetings with context ──────────────────────────────────────
  if (intent.intent === 'greeting') {
    return _buildContextualGreeting(state)
  }
  if (intent.intent === 'farewell') {
    return _fillSlots(pickByAgeGroup(FAREWELLS, ag, 'farewell'), state)
  }
  if (intent.intent === 'thanks') {
    return _thanksResponse(ag, state)
  }

  // ── PRIORITY 10: Story request ───────────────────────────────────────────────
  if (intent.intent === 'story_request') {
    return pickByAgeGroup(STORY_PROMPTS, ag, 'story')
  }

  // ── PRIORITY 11: Context-driven proactive coaching ──────────────────────────
  // (only fire if we have enough sessions to know the user)
  if (totalSessions >= 3) {
    if (flags.avoidingBrave && daysSinceBrave > 10) {
      return _fillSlots(_avoidanceChallengeResponse(ag, state), state)
    }
    if (flags.plateauing && stage !== 'seed') {
      return _fillSlots(pickByAgeGroup(STRUGGLE.plateau, ag, 'plateau'), state)
    }
    if (flags.streakMilestone) {
      return _fillSlots(pickByAgeGroup(CELEBRATIONS.streak_milestone, ag, 'streak'), state)
    }
    if (flags.actReady && stage !== 'seed') {
      return _fillSlots(_actNudge(ag, state), state)
    }
    if (flags.volunteerEligible && totalSessions >= 5) {
      return _fillSlots(_voluntaryStutterNudge(ag, state), state)
    }
  }

  // ── PRIORITY 12: Generic context-aware response ──────────────────────────────
  return _fillSlots(_contextualGeneral(ag, state, rawMessage), state)
}

// ── Intent routing helpers ─────────────────────────────────────────────────────

const _routeFeatureQuestion = (msg) => {
  const m = msg.toLowerCase()
  if (m.match(/brave/)) return pickResponse(APP_QUESTIONS.how_brave_missions.all, 'feat_brave')
  if (m.match(/speaklab|speak lab/)) return pickResponse(APP_QUESTIONS.how_speaklab.all, 'feat_speaklab')
  if (m.match(/breath/)) return pickResponse(APP_QUESTIONS.how_breathe.all, 'feat_breathe')
  if (m.match(/act|acceptance/)) return pickResponse(APP_QUESTIONS.how_act.all, 'feat_act')
  if (m.match(/daf|delayed/)) return pickResponse(APP_QUESTIONS.how_daf.all, 'feat_daf')
  if (m.match(/journal/)) return pickResponse(APP_QUESTIONS.how_journal.all, 'feat_journal')
  if (m.match(/family|famil/)) return pickResponse(APP_QUESTIONS.how_family.all, 'feat_family')
  if (m.match(/analysis|analyse|analyze/)) return pickResponse(APP_QUESTIONS.how_analysis.all, 'feat_analysis')
  if (m.match(/biomarker|voice.*detect|emotion/)) return pickResponse(APP_QUESTIONS.how_voice_biomarker.all, 'feat_bio')
  if (m.match(/progress|star|badge|achieve/)) return pickResponse(APP_QUESTIONS.how_progress.all, 'feat_progress')
  if (m.match(/talktale|story|tale/)) return pickResponse(APP_QUESTIONS.how_talktales.all, 'feat_tales')
  if (m.match(/comm.*academy|communication.*academy/)) return pickResponse(APP_QUESTIONS.how_comm_academy.all, 'feat_comm')
  if (m.match(/brave wall|wall/)) return pickResponse(APP_QUESTIONS.how_brave_wall.all, 'feat_wall')
  return pickResponse(APP_QUESTIONS.what_is_yospeech.all, 'feat_generic')
}

const _routeTechniqueQuestion = (msg) => {
  const m = msg.toLowerCase()
  if (m.match(/easy onset/)) return pickResponse(TECHNIQUE_HELP.easy_onset.all, 'tech_onset')
  if (m.match(/rate control|speak.*slow|slow.*speak/)) return pickResponse(TECHNIQUE_HELP.rate_control.all, 'tech_rate')
  if (m.match(/prolonged|continuous|connect words/)) return pickResponse(TECHNIQUE_HELP.prolonged_speech.all, 'tech_prolong')
  if (m.match(/breath/)) return pickResponse(TECHNIQUE_HELP.breathing_for_speech.all, 'tech_breath')
  if (m.match(/cancellation/)) return pickResponse(TECHNIQUE_HELP.cancellation.all, 'tech_cancel')
  if (m.match(/pull.?out/)) return pickResponse(TECHNIQUE_HELP.pull_out.all, 'tech_pullout')
  if (m.match(/voluntary|on purpose|intentional/)) return pickResponse(TECHNIQUE_HELP.voluntary_stutter_technique.all, 'tech_vol')
  if (m.match(/choral|read.*together|together.*read/)) return pickResponse(TECHNIQUE_HELP.choral_reading.all, 'tech_choral')
  // Generic technique question — give science encouragement
  return pickResponse(ENCOURAGEMENT.science_of_stuttering[['little','explorer'].includes(msg) ? 'explorer' : 'adult'] || ENCOURAGEMENT.science_of_stuttering.adult, 'tech_generic')
}

// ── Specialised response builders ──────────────────────────────────────────────

const _crisisResponse = (ag, state) => {
  const responses = {
    little: "I hear you — it's really hard sometimes. You know what though? The fact that you're still here talking to me means you haven't given up. That takes real courage. Want to just sit together for a minute? 💙",
    explorer: "Hey — I hear how frustrated you are. That's real and it makes sense. Here's the truth though: every person who's ever mastered something felt exactly what you're feeling right now. Not because they were weaker — because they were doing something genuinely hard. You're in the hard part. The hard part is where the change happens. 💧",
    navigator: "That frustration is real and I'm not going to pretend it isn't. But I want you to notice something: you're here. Even when it feels pointless, you came back. That's not nothing — that's actually the most important thing. The people who quit don't show up when it feels hard. You did. That matters.",
    adult: "I hear you. And I'm not going to give you a pep talk you don't want right now. What I will say is this: the research on every difficult human endeavour shows a predictable valley — a point where progress is invisible, effort feels wasted, and quitting feels rational. You're in that valley. The people who cross it aren't the most talented. They're the ones who don't stop moving in the valley. You're still moving.",
  }
  return responses[ag] || responses.explorer
}

const _anxietyResponse = (ag, state) => {
  const { nextFearItem, selfEfficacy } = state
  const responses = {
    little: "It's okay to feel scared! Even superheroes get nervous. Take three big breaths with me? In... hold... and out. Better? Your braveness is still there — it just needs a moment. 💧",
    explorer: "That anxiety you're feeling? Your amygdala is just doing its job — detecting something it thinks is threatening. Spoiler: it's wrong. Your voice is not dangerous. That fear signal is data, not a stop sign. Take a breath, and let's see if we can step toward it just a little. 💧",
    navigator: "The anxiety makes sense. Your nervous system is trying to protect you from a perceived threat. Here's the thing though — the threat isn't real. The situation might be uncomfortable, but you've survived every uncomfortable thing you've faced so far. Your track record is 100%. Before we do anything else, let's breathe. Try box breathing — in for 4, hold 4, out 4, hold 4. Then tell me what's scaring you.",
    adult: "Anxiety about speaking is one of the most studied human experiences. Here's what we know: the anticipatory anxiety almost always exceeds the actual experience. What you're imagining is worse than what will actually happen — that's the neuroscience. Before we address the situation, let's activate your parasympathetic system with a 4-7-8 breath: in for 4, hold for 7, out for 8. Then let's talk about what's actually in front of you.",
  }
  return responses[ag] || responses.explorer
}

const _frustrationResponse = (ag, state) => {
  const { totalSessions, streak, daysSinceLastSession } = state
  const responses = {
    little: "I know it's frustrating! Even the bravest speakers have frustrating days. That's completely normal! Maybe we need a small break, and then try something a tiny bit easier? I believe in you SO much. 💙",
    explorer: "That frustration makes complete sense — you're working on something genuinely hard. Here's what's actually happening in your brain: the parts being challenged are the same circuits that control speech timing. Rewiring those takes longer than you want it to. But look — {totalSessions} sessions. That's {totalSessions} times you've worked on this. That's not nothing. That's compounding. 🌊",
    navigator: "I'm not going to tell you the frustration is wrong — it's not. You're working hard and you want faster results. That's reasonable. What I will say: your {streak}-day streak means you've chosen this {streak} times. Every one of those was a moment you could have quit and didn't. What specifically is frustrating you right now? Let's get specific.",
    adult: "The frustration is valid and I won't minimise it. Here's the clinical reality though: speech fluency training shows non-linear progress — it plateaus, sometimes regresses slightly, then jumps. The frustration usually precedes a jump. The question is whether you stay in position for the jump or remove yourself right before it happens. {totalSessions} sessions, {streak} days. You're deep in. What's the specific thing that isn't moving?",
  }
  return _fillSlots(responses[ag] || responses.explorer, state)
}

const _sadnessResponse = (ag, state) => {
  const responses = {
    little: "It's okay to feel sad sometimes. I'm here and I care about you. You don't have to practice today — just talk to me if you want. 💙",
    explorer: "Hey — it's okay to have a hard day. Not every day is a practice day. Some days are just hard, and that's a completely human thing. Want to talk about what's going on? No pressure to practice anything. 💧",
    navigator: "Hard day. I hear it. You don't have to do anything today — sometimes the most useful thing is just acknowledging that today is rough. If you want to talk about what happened, I'm here. If you want a distraction, I have stories. What do you need?",
    adult: "I hear you. Some days the weight of this — the speech, the anxiety, the effort — just feels heavy. That's real. You don't have to be productive today. Is there something specific that's making today harder, or is it just a difficult patch?",
  }
  return responses[ag] || responses.explorer
}

const _doubtResponse = (ag, state) => {
  const { totalSessions, avgFluency, braveStarCount } = state
  if (totalSessions < 3) {
    const responses = {
      little: "I KNOW it works! Every single day, people just like you get braver and braver with practice! 🌟",
      explorer: "Three sessions isn't enough data to know yet — give it 10 and then ask me again. Every technique we use here is backed by real speech-language pathology research. 💧",
      navigator: "Fair question. The honest answer: {totalSessions} sessions is too early to see results. The research says consistent practice over 4–6 weeks shows measurable change. You haven't been at this long enough to judge yet.",
      adult: "Legitimate question, {totalSessions} sessions in. The evidence base for these techniques (exposure therapy, rate control, ACT) is robust — but early-stage progress is often imperceptible. The neurological changes are happening before the behavioural changes are visible. You need 3–4 consistent weeks before the data is meaningful.",
    }
    return _fillSlots(responses[ag] || responses.explorer, state)
  }
  // Has sessions — give data-backed response
  const dataResponse = {
    little: "Look at all your sessions! {totalSessions} times you practiced! That's amazing! Your brain IS changing! 🌟",
    explorer: "Here's the data on you specifically: {totalSessions} sessions, {braveStarCount} brave stars. If it wasn't working, you wouldn't still be here. Something is shifting — maybe slowly, but it's shifting. 💧",
    navigator: "{totalSessions} sessions is actually enough data to say: you're building something. Your fluency average is {avgFluency}/100. Whether it FEELS like it's working and whether it IS working are two different things — the science says you're moving, even when you can't feel it.",
    adult: "You asked if this works. Here's your data: {totalSessions} sessions, {braveStarCount} brave stars, fluency average {avgFluency}/100. Doubt is normal and even useful — it means you're being honest rather than running on blind faith. But the doubt should be fact-checked against the data, and the data says you're moving.",
  }
  return _fillSlots(dataResponse[ag] || dataResponse.explorer, state)
}

const _buildProgressResponse = (state) => {
  const { totalSessions, streak, avgFluency, avgWpm, braveStarCount,
          fluencyTrend, actDone, journalCount, ageGroup, name } = state
  const ag = ageGroup || 'explorer'

  const trendText = fluencyTrend > 3 ? 'trending up ↑' : fluencyTrend < -3 ? 'trending down ↓' : 'stable →'

  const responses = {
    little: `Here's your adventure so far, ${name}! ⭐ You've done ${totalSessions} sessions! Your streak is ${streak} days! You've earned ${braveStarCount} brave stars! You're doing SO amazing! Keep going! 🚀`,
    explorer: `Progress check for ${name}: ${totalSessions} sessions completed · ${streak}-day streak · ${braveStarCount} brave stars · ${avgFluency ? `fluency average ${avgFluency}/100 (${trendText})` : 'fluency tracking not started yet'} · ${actDone > 0 ? `${actDone}/8 ACT sessions` : 'ACT not started'} · ${journalCount} journal entries. How are you feeling about where you are? 🌊`,
    navigator: `Your data, ${name}: ${totalSessions} sessions · ${streak}-day streak · ${braveStarCount} brave stars · fluency ${avgFluency ? `${avgFluency}/100, ${trendText}` : 'not tracked yet'} · ${avgWpm ? `${avgWpm} WPM average` : ''} · ${actDone}/8 ACT sessions · ${journalCount} journal entries. What's your read on where you're at?`,
    adult: `Full progress picture, ${name}: Sessions: ${totalSessions} · Streak: ${streak} days · Brave stars: ${braveStarCount} · Fluency: ${avgFluency ? `${avgFluency}/100, ${trendText}` : 'not tracked'} · WPM: ${avgWpm || 'not tracked'} · ACT: ${actDone}/8 · Journal entries: ${journalCount}. The trend line matters more than any single number — and yours is ${trendText}.`,
  }
  return responses[ag] || responses.explorer
}

const _buildRecommendation = (state) => {
  const { totalSessions, flags, sessionTypeCounts, lastSessionType,
          avgFluency, daysSinceBrave, actDone, streak, ageGroup,
          nextFearItem, isPlateauing } = state
  const ag = ageGroup || 'explorer'

  // Rule-based recommendation tree
  let recommendation = ''
  let reason = ''

  if (totalSessions === 0) {
    recommendation = 'Start with Breathe — 5 minutes of box breathing'
    reason = 'It\'s the lowest-anxiety entry point and immediately calms the speech system.'
  } else if (flags.highAnxiety) {
    recommendation = 'Go to Breathe first, then come back'
    reason = 'Your mood signal says high anxiety. Speech practice on an anxious nervous system is less effective. Calm first.'
  } else if (!sessionTypeCounts['brave'] && totalSessions >= 3) {
    recommendation = 'Try BraveMissions for the first time'
    reason = 'You\'ve done enough foundation work. The fear ladder is where real change accelerates.'
  } else if (daysSinceBrave > 7 && nextFearItem) {
    recommendation = `Try the '${nextFearItem.situation}' on your fear ladder`
    reason = 'You haven\'t done a brave mission in a while. The avoidance muscle is getting stronger.'
  } else if (isPlateauing && !sessionTypeCounts['analysis']) {
    recommendation = 'Record a Speech Analysis session'
    reason = 'You\'re plateauing and haven\'t used analysis yet. The data will show exactly what to focus on.'
  } else if (actDone === 0 && totalSessions >= 5) {
    recommendation = 'Start ACT Session 1 — 10 minutes'
    reason = 'You have enough practice foundation. ACT therapy dramatically improves long-term outcomes.'
  } else if (!sessionTypeCounts['journal']) {
    recommendation = 'Record a 30-second Journal entry'
    reason = 'You haven\'t journaled yet. Evening voice recordings track your real progress better than scores.'
  } else if (lastSessionType === 'brave') {
    recommendation = 'Follow up with a SpeakLab session'
    reason = 'After brave exposure, motor training consolidates the gains.'
  } else {
    recommendation = 'Continue with SpeakLab — rate control focus'
    reason = 'Consistent motor training is the foundation everything else builds on.'
  }

  const prefix = {
    little: `I know exactly what to do! ${recommendation}! 🌟 ${reason}`,
    explorer: `My recommendation: **${recommendation}**. Why: ${reason} 🌊`,
    navigator: `Recommendation: ${recommendation}. Reasoning: ${reason}`,
    adult: `Based on your current data — ${recommendation}. Rationale: ${reason}`,
  }
  return prefix[ag] || prefix.explorer
}

const _buildMotivationResponse = (ag, state) => {
  const { totalSessions, streak, braveStarCount, avgFluency } = state
  const responses = {
    little: [
      `You've already done ${totalSessions} sessions! That means ${totalSessions} times you were BRAVE! You're basically a speech superhero already! 🦸⭐`,
      "Every time you practice, your voice gets a little braver. Like a muscle getting stronger. You're already so much stronger than when you started! 💪",
    ],
    explorer: [
      `Here's your motivation: you've already done ${totalSessions} sessions. That's ${totalSessions} times your brain rewired itself a little bit. You didn't feel each one — but they're adding up. The compound effect is real. 🌊`,
      `${streak} days straight. ${braveStarCount} brave stars. ${totalSessions} sessions. You keep showing up. Whatever happens next — you already proved you can do this. Keep going. 💧`,
      "The people who change their relationship with their voice aren't the most talented — they're the most consistent. You've got the consistency. The results come from that. 🔥",
    ],
    navigator: [
      `You want motivation? Look at the data: ${totalSessions} sessions, ${streak}-day streak, ${braveStarCount} brave stars. That's not motivation — that's evidence. Evidence that you've already been doing the hard thing, consistently. The results are built on that foundation. Keep the foundation strong.`,
      "Here's the truth: motivation is unreliable. It comes and goes. The people who actually change don't wait for motivation — they build systems. And you've built one. You showed up today. That's the system working.",
      `Your fluency average is ${avgFluency || 'still building'}. Every session adds to that number. You've earned everything you've built. That's not luck — that's you choosing this ${totalSessions} times.`,
    ],
    adult: [
      `The honest motivational case: ${totalSessions} sessions is a genuine investment. The neurological changes from this amount of practice are measurable in brain imaging — not subjective impressions. You've already changed your brain. The question is whether you continue to build on that investment or walk away from it.`,
      `Motivation fluctuates. What doesn't fluctuate: your ${totalSessions}-session track record. Every session you've done is a permanent deposit. You can't un-do that progress. The trajectory you're on leads somewhere real — and the only way off it is to stop showing up.`,
    ],
  }
  return _fillSlots(pickResponse(responses[ag] || responses.explorer, `motivation_${ag}`), state)
}

const _buildContextualGreeting = (state) => {
  const { timeOfDay, flags, streak, totalSessions, ageGroup, daysSinceLastSession } = state
  const ag = ageGroup || 'explorer'

  if (flags.streakMilestone && streak > 0) {
    return _fillSlots(pickByAgeGroup(GREETINGS.streak_milestone, ag, 'greet_milestone'), state)
  }
  if (flags.longAbsence || daysSinceLastSession >= 7) {
    return _fillSlots(pickByAgeGroup(GREETINGS.returning_after_break, ag, 'greet_return'), state)
  }
  if (flags.newUser) {
    const newUserGreet = {
      little: "Hi! I'm Flux! 💧 I'm so excited to be your speech friend! What's your name?",
      explorer: "Hey! I'm Flux — your speech companion. I grow with you the more we practice together. What are you working on today? 🌊",
      navigator: "Hey. I'm Flux — the AI companion in YoSpeech. I'm not going to give you a generic intro. Tell me: what's the one speaking situation that bothers you most?",
      adult: "Hello — I'm Flux. I'm the intelligence layer in YoSpeech. I work entirely offline and I get more useful the more data I have about you. What brings you here today?",
    }
    return newUserGreet[ag] || newUserGreet.explorer
  }

  const greetPool = GREETINGS[timeOfDay] || GREETINGS.afternoon
  return _fillSlots(pickByAgeGroup(greetPool, ag, `greet_${timeOfDay}`), state)
}

const _thanksResponse = (ag, state) => {
  const responses = {
    little:    ["You're welcome! That's what I'm here for! 💙⭐", "Always! You're my favourite! 🌟", "Anytime! I love helping you! 💧"],
    explorer:  ["Of course! That's what I'm here for. Anything else? 💧", "Always. You know I've got you. 🌊", "Happy to help. Keep going — you're doing the work. ✨"],
    navigator: ["Of course. What else do you need?", "Anytime. That's what I'm for.", "No problem. You doing okay?"],
    adult:     ["Of course. Anything else you need?", "Happy to help. Keep the momentum.", "Anytime, {name}."],
  }
  return _fillSlots(pickResponse(responses[ag] || responses.explorer, `thanks_${ag}`), state)
}

const _avoidanceChallengeResponse = (ag, state) => {
  const { nextFearItem, daysSinceBrave } = state
  const item = nextFearItem?.situation || 'the speaking situations you\'ve been avoiding'
  const responses = {
    little: `Hey — we haven't done a Brave Mission in ${daysSinceBrave} days! I miss being brave with you! Want to try a tiny one today? 🦁`,
    explorer: `Real talk, {name}: you've been doing the safe sessions for ${daysSinceBrave} days. No brave missions. I'm noticing that. The comfortable zone doesn't build the thing you're actually working on. ${nextFearItem ? `'${item}' is sitting on your fear ladder waiting. Want to take a run at it?` : 'Want to open BraveMissions and pick the next thing?'} 💧`,
    navigator: `I'm going to call something out: it's been ${daysSinceBrave} days since your last brave session. The avoidance muscle gets stronger the longer you feed it. ${nextFearItem ? `'${item}' has been on your fear ladder. What's the block?` : 'Your fear ladder has items waiting. What\'s the reason for the gap?'}`,
    adult: `Data observation: ${daysSinceBrave} days since your last brave mission. That's the longest gap in your recent history. Avoidance is the primary driver of long-term difficulty in stuttering — not the stuttering itself. ${nextFearItem ? `'${item}' is the next rung. What's making it feel off-limits right now?` : 'The fear ladder has items waiting. What\'s actually happening?'}`,
  }
  return responses[ag] || responses.explorer
}

const _actNudge = (ag, state) => {
  const { totalSessions, actDone } = state
  const responses = {
    little: "Hey! There's something really cool in the app called ACT — it's like a special adventure for your mind. Want to try it? 🌟",
    explorer: `You've done ${totalSessions} sessions — you're ready for the ACT module. It's 8 sessions of therapy that works differently from the practice exercises. Research shows it changes how you relate to stuttering at a deeper level. Session 1 is only 10 minutes. 🧘`,
    navigator: `With ${totalSessions} sessions behind you, you're ready to start ACT. It's not more practice exercises — it's a different kind of work. It directly addresses the psychological stuff: shame, avoidance, identity. The research on ACT for stuttering is strong. 8 sessions, 10 minutes each. Session 1?`,
    adult: `At ${totalSessions} sessions, the data suggests you'd benefit from starting the ACT module. It addresses the components that fluency practice alone doesn't reach — cognitive defusion, values clarification, acceptance, committed action. Research shows ACT produces measurably better long-term outcomes than fluency-focused training alone. 8 sessions, ~10 minutes each. Worth starting.`,
  }
  return responses[ag] || responses.explorer
}

const _voluntaryStutterNudge = (ag, state) => {
  const { totalSessions } = state
  const responses = {
    little: "Here's a SUPER brave challenge: try stuttering ON PURPOSE next time you talk to someone! It sounds scary but it's actually the coolest thing ever! Want to try? 🦁⭐",
    explorer: `Here's something I want to throw at you: voluntary stuttering. You stutter on a word on purpose. It sounds backwards, but it's actually the highest-impact technique available — it breaks the shame loop at the neural level. You've got ${totalSessions} sessions in — you're ready. Triple stars for trying it once. Want to know how to do it? 🌊`,
    navigator: `I want to introduce you to something: voluntary stuttering. Deliberate, intentional stuttering on a word you could say fluently. It's the technique most people avoid the longest and that has the most impact when they finally try it. ${totalSessions} sessions means you have enough foundation. The full explanation is in BraveMissions. Or I can explain it right now.`,
    adult: `At ${totalSessions} sessions, I want to flag something you may not have tried yet: voluntary stuttering. Intentional disfluency on a word you could say fluently. The research on this is unambiguous — it's the single most effective desensitisation technique available and it works faster than any other approach. Most people avoid it longest. It earns triple stars here because it deserves them. Worth trying this week.`,
  }
  return responses[ag] || responses.explorer
}

const _contextualGeneral = (ag, state, rawMessage) => {
  const { totalSessions, flags, momentum, currentMoodId } = state

  // If they're just chatting casually
  if (rawMessage.length < 30) {
    return _fillSlots(pickByAgeGroup(ENCOURAGEMENT.general, ag, 'enc_general'), state)
  }

  // Context-driven general
  if (flags.highAnxiety) {
    return _fillSlots(pickByAgeGroup(ENCOURAGEMENT.general, ag, 'enc_anxiety'), state)
  }
  if (momentum === 'high') {
    return _fillSlots(pickByAgeGroup(ENCOURAGEMENT.before_hard_thing, ag, 'enc_momentum'), state)
  }
  return _fillSlots(pickByAgeGroup(ENCOURAGEMENT.general, ag, 'enc_ctx'), state)
}

// ── Slot filling ───────────────────────────────────────────────────────────────
export const fillSlots = (template, state) => _fillSlots(template, state)

const _fillSlots = (template, state) => {
  if (!template) return ''
  const {
    name = 'friend', streak = 0, totalSessions = 0, avgFluency = 0,
    avgWpm = 0, braveStarCount = 0, daysSinceBrave = 0,
    nextFearItem, evolutionStage, actDone = 0,
  } = state
  const days = Math.round(daysSinceBrave)
  const fearItem = nextFearItem?.situation || 'the next challenge'
  const score = avgFluency || 0
  const stage = evolutionStage?.name || 'Water Drop'

  return template
    .replace(/\{name\}/g, name)
    .replace(/\{streak\}/g, streak)
    .replace(/\{sessions\}/g, totalSessions)
    .replace(/\{totalSessions\}/g, totalSessions)
    .replace(/\{score\}/g, score)
    .replace(/\{avgFluency\}/g, score)
    .replace(/\{wpm\}/g, avgWpm || 0)
    .replace(/\{avgWpm\}/g, avgWpm || 0)
    .replace(/\{braveCount\}/g, braveStarCount)
    .replace(/\{braveStarCount\}/g, braveStarCount)
    .replace(/\{days\}/g, days)
    .replace(/\{daysSinceBrave\}/g, days)
    .replace(/\{fearItem\}/g, fearItem)
    .replace(/\{actDone\}/g, actDone)
    .replace(/\{stage\}/g, stage)
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4 — CONVERSATION ENGINE
// Manages multi-turn conversation state, log, and context injection.
// ═══════════════════════════════════════════════════════════════════════════════

const MAX_CONV_LOG = 20

export const appendConversationLog = async (role, message) => {
  try {
    const log = await _loadConversationLog()
    log.push({
      role,
      message: message.slice(0, 300), // cap at 300 chars per entry
      timestamp: Date.now(),
    })
    const trimmed = log.slice(-MAX_CONV_LOG)
    await setSetting('flux_conv_log', JSON.stringify(trimmed))
  } catch {}
}

export const getConversationSummary = async () => {
  try {
    const log = await _loadConversationLog()
    if (log.length < 2) return null
    const recent = log.slice(-6)
    return recent.map(e => `${e.role === 'user' ? 'User' : 'Flux'}: ${e.message}`).join('\n')
  } catch { return null }
}

export const clearConversationLog = async () => {
  try { await setSetting('flux_conv_log', JSON.stringify([])) } catch {}
}

// ── Main chat function ─────────────────────────────────────────────────────────
// This is what FluxChat.jsx calls instead of callFluxAI()
export const chat = async (userMessage, profile) => {
  try {
    // Build fresh user state
    const state = await buildUserState(profile, false)

    // Detect intent
    const intent = detectIntent(userMessage)

    // Select response
    const response = selectResponse(intent, state, userMessage)

    // Log the exchange
    await appendConversationLog('user', userMessage)
    await appendConversationLog('flux', response)

    // Update pattern data
    await _updatePatternData(intent, state)

    // Invalidate cache after update
    _userStateCache = null

    return { text: response, source: 'brain', intent: intent.intent }
  } catch (e) {
    console.warn('[FluxBrain] chat error:', e.message)
    return { text: "I'm here. Tell me what's on your mind. 💧", source: 'fallback', intent: 'unknown' }
  }
}

const _updatePatternData = async (intent, state) => {
  try {
    const pd = await _loadPatternData()

    // Track topics discussed
    if (!pd.topicsDiscussed.includes(intent.intent)) {
      pd.topicsDiscussed.push(intent.intent)
      if (pd.topicsDiscussed.length > 50) pd.topicsDiscussed.shift()
    }

    // Track voluntary stutters
    if (intent.intent === 'report_voluntary_stutter') {
      pd.totalVoluntaryStutters = (pd.totalVoluntaryStutters || 0) + 1
    }

    // Track good sessions
    if (intent.intent === 'share_good_experience') {
      pd.consecutiveGoodSessions = (pd.consecutiveGoodSessions || 0) + 1
    } else if (intent.intent === 'share_bad_experience') {
      pd.consecutiveGoodSessions = 0
    }

    await setSetting('flux_pattern_data', JSON.stringify(pd))
  } catch {}
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5 — SESSION ANALYSIS ENGINE (rule-based, replaces Claude)
// Called after every SpeakLab, Adventure, Breathe, or BraveMission session.
// Returns structured feedback without any API call.
// ═══════════════════════════════════════════════════════════════════════════════

export const analyzeSessionOffline = (sessionType, sessionData, state) => {
  const { ageGroup, totalSessions, streak } = state
  const ag = ageGroup || 'explorer'
  const score = sessionData?.score || sessionData?.fluencyScore || 0
  const duration = sessionData?.duration || 0

  // Score-based reaction
  let reaction = ''
  let tip = ''
  let praise = ''

  if (score >= 85) {
    praise = pickByAgeGroup(CELEBRATIONS.big_win, ag, `anal_great_${sessionType}`)
    tip = _getSessionTip(sessionType, 'advanced', ag)
    reaction = 'excellent'
  } else if (score >= 65) {
    praise = pickByAgeGroup(CELEBRATIONS.small_win, ag, `anal_good_${sessionType}`)
    tip = _getSessionTip(sessionType, 'intermediate', ag)
    reaction = 'good'
  } else {
    praise = pickByAgeGroup(ENCOURAGEMENT.general, ag, `anal_low_${sessionType}`)
    tip = _getSessionTip(sessionType, 'basic', ag)
    reaction = 'keep_going'
  }

  // Fill slots
  const filled = _fillSlots(praise, state)

  return {
    reaction,
    praise: filled,
    tip: _fillSlots(tip, state),
    score,
    sessionType,
    stars: score >= 85 ? 3 : score >= 65 ? 2 : 1,
  }
}

const _getSessionTip = (sessionType, level, ag) => {
  const tips = {
    speaklab: {
      basic:        "Focus on just one technique today — easy onset only. One thing done well beats three things done poorly.",
      intermediate: "Try combining rate control with easy onset on the same sentence. That's the compound technique.",
      advanced:     "Your scores are strong. Now try the technique in a real conversation — that's the next level.",
    },
    breathe: {
      basic:        "Make sure your belly moves, not your shoulders. Hand on stomach — feel it expand.",
      intermediate: "Try 4-7-8 breathing before your next speaking situation. It activates the parasympathetic system.",
      advanced:     "You've got the technique. Now use it as a pre-speech ritual — 3 breaths before every important conversation.",
    },
    brave: {
      basic:        "You showed up. That's the whole thing. The next one will be slightly less scary. That's how it works.",
      intermediate: "You're climbing the ladder. The next rung: try voluntary stuttering once in your next brave mission.",
      advanced:     "Your brave scores are strong. Time to tackle the highest-fear item on your ladder. That's where the real shift happens.",
    },
    adventure: {
      basic:        "Keep completing missions in order — each one builds on the last. Don't skip ahead.",
      intermediate: "You're progressing well through the zones. The Echo Caves (continuous phonation) is especially valuable — focus there.",
      advanced:     "The Bravery Bridge and Fluency Forest zones are the most clinically relevant. Prioritise those.",
    },
    analysis: {
      basic:        "Your first recordings establish a baseline. The trend over 10+ recordings is what actually matters.",
      intermediate: `Your WPM is the most actionable number. Target 110–140 for therapeutic speech.`,
      advanced:     "Track your filler words week-over-week. That's the clearest signal of improvement.",
    },
  }
  return tips[sessionType]?.[level] || tips.speaklab.intermediate
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 6 — OFFLINE STORY ENGINE (replaces continueStory)
// Generates story continuations using templates + user's age group
// ═══════════════════════════════════════════════════════════════════════════════

const STORY_CONTINUATIONS = {
  little: [
    "Suddenly, a friendly talking cloud appeared! 'I've been looking for someone brave,' it said. 'Will you help me find the lost rainbow?'",
    "Just then, a tiny glowing door appeared in the middle of the path. You opened it and discovered...",
    "A magical creature with golden wings landed beside you. 'I heard you were looking for adventure,' it whispered. 'Follow me!'",
    "The forest went very quiet. Then — from behind the biggest tree — something extraordinary happened...",
    "'Wait!' called a voice from behind you. You turned around and saw something that made your eyes go wide. It was...",
  ],
  explorer: [
    "That's when things got interesting. From the shadows stepped a figure you didn't expect — and they knew your name.",
    "You had about three seconds to decide. The obvious choice was safe. But there was another option, half-hidden in the dark...",
    "The note said one thing: 'Don't trust the map.' Which would have been more useful information before you'd already used it.",
    "Somewhere in the distance, something very large was moving. The question was: was it coming toward you, or had it already passed?",
    "'I need to tell you something,' they said. 'Something about why you're really here. You're not going to like it.'",
  ],
  navigator: [
    "The room fell silent. What you'd just said changed something — you could see it in every face. The question was whether that was good or catastrophic.",
    "Three days later, you'd understand exactly why that moment mattered. But standing there, all you knew was that something had shifted permanently.",
    "They handed you something small and heavy. 'This was meant for you,' they said. 'We've been waiting a long time.' You looked down and saw...",
    "The choice in front of you was genuinely impossible — both paths led somewhere real, and one of them you couldn't come back from.",
    "You'd expected a lot of things. You hadn't expected them to already know everything.",
  ],
  adult: [
    "Looking back, you'd identify this as the moment everything changed — not dramatically, but definitively. What made it pivotal was...",
    "They said nothing. Which, in its own way, said everything you needed to know. You made the decision then and there: you were going to...",
    "The document contained three sentences that rewrote the previous ten years of your understanding. You read them a second time. Then a third.",
    "You realised you'd been asking the wrong question the entire time. The right question — the one that actually mattered — was...",
    "Years later, in a different city, you'd tell this story to someone who needed to hear it. The way you'd tell it would begin with: 'There was a moment...'",
  ],
}

export const continueStoryOffline = (userText, history, profile) => {
  const ag = profile?.ageGroup || 'explorer'
  const validAg = ['little', 'explorer', 'navigator', 'adult'].includes(ag) ? ag : 'explorer'
  return pickResponse(STORY_CONTINUATIONS[validAg], `story_cont_${validAg}`)
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 7 — BRAVE MISSION GENERATOR (replaces generateBraveMission)
// Selects the most appropriate offline mission based on fear level
// ═══════════════════════════════════════════════════════════════════════════════

export const generateBraveMissionOffline = (fearLevel = 5, situation = '', profile) => {
  const fl = Math.max(1, Math.min(10, fearLevel))

  // Find the closest-matching mission by fear level
  const sorted = [...BRAVE_MISSIONS].sort((a, b) =>
    Math.abs(a.fearLevel - fl) - Math.abs(b.fearLevel - fl)
  )

  // If we have a specific situation, try to find a relevant one first
  if (situation.trim()) {
    const sitLower = situation.toLowerCase()
    const specific = BRAVE_MISSIONS.find(m =>
      sitLower.includes('order') && m.id === 'bm_order' ||
      sitLower.includes('call') && m.id === 'bm_phone' ||
      sitLower.includes('introduc') && m.id === 'bm_intro' ||
      sitLower.includes('interview') && m.id === 'bm_interview' ||
      sitLower.includes('present') && m.id === 'bm_presentation' ||
      sitLower.includes('disagree') && m.id === 'bm_disagree'
    )
    if (specific) return specific
  }

  return sorted[0] || BRAVE_MISSIONS[0]
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 8 — WEEKLY REPORT ENGINE (replaces generateWeeklyReport)
// Builds a personalised weekly report from local data. No API.
// ═══════════════════════════════════════════════════════════════════════════════

export const buildWeeklyReportOffline = async (profile) => {
  try {
    const now = Date.now()
    const weekAgo = new Date(now - 7 * 86400000).toISOString()
    const twoWeeksAgo = new Date(now - 14 * 86400000).toISOString()

    const [
      weekSessions, weekBrave, weekAnalyses, weekJournal,
      allSessions, streak, prevWeekSessions,
    ] = await Promise.all([
      db.sessions.where('date').above(weekAgo).toArray(),
      db.braveStars.where('date').above(weekAgo).count(),
      db.speechAnalysis.where('date').above(weekAgo).toArray(),
      db.journal.where('date').above(weekAgo).count(),
      db.sessions.count(),
      getStreakCount(),
      db.sessions.where('date').above(twoWeeksAgo)
        .filter(s => s.date < weekAgo).count(),
    ])

    const avgFluency = weekAnalyses.length
      ? Math.round(weekAnalyses.reduce((a, b) => a + (b.fluencyScore || 70), 0) / weekAnalyses.length)
      : null
    const totalMinutes = Math.round(weekSessions.reduce((a, b) => a + ((b.duration || 0) / 60), 0))
    const sessionCount = weekSessions.length
    const braveCount = weekBrave
    const minutes = totalMinutes
    const name = profile?.name || 'friend'
    const ag = profile?.ageGroup || 'explorer'
    const score = avgFluency || 0
    const comparison = prevWeekSessions > 0
      ? `${sessionCount > prevWeekSessions ? '+' : ''}${sessionCount - prevWeekSessions} vs last week`
      : 'first full week tracked'
    const weekStart = new Date(now - 7 * 86400000).toLocaleDateString()

    // Determine week quality
    const sessionDelta = prevWeekSessions > 0 ? sessionCount - prevWeekSessions : 0
    const weekType = sessionCount >= 5 && sessionDelta >= 0 ? 'strong_week'
      : sessionDelta >= 2 ? 'breakthrough_week'
      : sessionCount <= 2 ? 'tough_week'
      : 'average_week'

    const templatePool = WEEKLY_TEMPLATES[weekType]
    let narrative = pickResponse(templatePool, `weekly_${weekType}`)

    // Fill slots
    narrative = narrative
      .replace(/\{name\}/g, name)
      .replace(/\{sessionCount\}/g, sessionCount)
      .replace(/\{braveCount\}/g, braveCount)
      .replace(/\{score\}/g, score)
      .replace(/\{minutes\}/g, minutes)
      .replace(/\{comparison\}/g, comparison)
      .replace(/\{weekStart\}/g, weekStart)
      .replace(/\{scoreDelta\}/g, Math.abs(sessionDelta) * 3)
      .replace(/\{recommendation\}/g, _weeklyRecommendation(weekSessions))

    return {
      narrative,
      sessionCount,
      braveCount,
      journalEntries: weekJournal,
      avgFluency: score,
      totalMinutes,
      weekType,
      comparison,
    }
  } catch (e) {
    console.warn('[FluxBrain] weekly report error:', e.message)
    return {
      narrative: `Here's your week: ${await getTotalSessions()} total sessions overall. Keep building. 💧`,
      sessionCount: 0, braveCount: 0, journalEntries: 0,
      avgFluency: null, totalMinutes: 0, weekType: 'average_week',
    }
  }
}

const _weeklyRecommendation = (weekSessions) => {
  const types = weekSessions.map(s => s.type)
  if (!types.includes('brave')) return 'Add at least one Brave Mission next week'
  if (!types.includes('analysis')) return 'Record a Speech Analysis to track fluency trend'
  if (!types.includes('breathe')) return 'Add one Breathe session before a difficult speaking day'
  return 'Maintain consistency and add one harder Brave Mission'
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 9 — LIFE STORY ENGINE (replaces buildLifeStory)
// Template-based personal narrative. No API.
// ═══════════════════════════════════════════════════════════════════════════════

export const buildLifeStoryOffline = async (profile) => {
  try {
    const cacheKey = 'flux_life_story_offline'
    const cacheDateKey = 'flux_life_story_offline_date'

    const cachedDate = await getSetting(cacheDateKey, null)
    const cachedStory = await getSetting(cacheKey, null)
    if (cachedDate && cachedStory) {
      const ageHours = (Date.now() - new Date(cachedDate)) / 3600000
      if (ageHours < 24) return cachedStory
    }

    const [totalSessions, streak, braveCount, journalCount, actDone, analyses] = await Promise.all([
      getTotalSessions(),
      getStreakCount(),
      db.braveStars.count().catch(() => 0),
      db.journal.count().catch(() => 0),
      db.actSessions.count().catch(() => 0),
      getRecentAnalyses(5).catch(() => []),
    ])

    const firstSession = await db.sessions.orderBy('date').first().catch(() => null)
    const daysSince = firstSession
      ? Math.floor((Date.now() - new Date(firstSession.date)) / 86400000)
      : 0
    const avgFluency = analyses.length
      ? Math.round(analyses.reduce((a, b) => a + (b.fluencyScore || 70), 0) / analyses.length)
      : 0

    const name = profile?.name || 'friend'
    const template = pickResponse(LIFE_STORY_TEMPLATES, 'life_story')
    const story = template
      .replace(/\{name\}/g, name)
      .replace(/\{daysSince\}/g, daysSince)
      .replace(/\{sessions\}/g, totalSessions)
      .replace(/\{streak\}/g, streak)
      .replace(/\{braveCount\}/g, braveCount)
      .replace(/\{journalCount\}/g, journalCount)
      .replace(/\{actDone\}/g, actDone)
      .replace(/\{score\}/g, avgFluency)
      .replace(/\{topTechnique\}/g, 'rate control')
      .replace(/\{currentChallenge\}/g, 'building brave sessions consistency')
      .replace(/\{growthArea\}/g, 'fluency and consistency')
      .replace(/\{nextChallenge\}/g, 'advancing the fear ladder')

    await setSetting(cacheKey, story)
    await setSetting(cacheDateKey, new Date().toISOString())
    return story
  } catch {
    return `${profile?.name || 'Friend'}'s speech journey is underway. Every session is a step forward.`
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 10 — COMM SKILL ANALYSER (replaces analyzeCommSkill offline)
// ═══════════════════════════════════════════════════════════════════════════════

export const analyzeCommSkillOffline = (skill, transcript, profile) => {
  if (!transcript || transcript.length < 10) {
    return { score: 0, strengths: ['You started — that\'s step one'], improvements: ['Record more speech to get analysis'], tip: 'Try speaking for at least 30 seconds for useful feedback.', praise: 'Good start — let\'s get more data.' }
  }

  const words = transcript.trim().split(/\s+/)
  const wordCount = words.length
  const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 2)
  const sentenceCount = sentences.length || 1
  const avgWordsPerSentence = wordCount / sentenceCount

  // Base score
  let score = 70

  // Skill-specific scoring
  const skillScores = {
    clarity: () => {
      const longSentences = sentences.filter(s => s.split(/\s+/).length > 25).length
      score -= longSentences * 5
      if (avgWordsPerSentence < 15) score += 10
      return { strengths: avgWordsPerSentence < 15 ? ['Clear, concise sentences'] : [], improvements: longSentences > 0 ? ['Shorten your longest sentences'] : [] }
    },
    pacing: () => {
      const fillerCount = (transcript.match(/\b(um|uh|er|like|you know|basically)\b/gi) || []).length
      score -= fillerCount * 3
      return { strengths: fillerCount === 0 ? ['No filler words detected'] : [], improvements: fillerCount > 3 ? [`Reduce filler words (${fillerCount} detected)`] : [] }
    },
    structure: () => {
      const hasOpening = sentences[0]?.length > 20
      const hasConclusion = sentences[sentences.length - 1]?.length > 15
      if (hasOpening) score += 5
      if (hasConclusion) score += 5
      return { strengths: hasOpening ? ['Strong opening sentence'] : [], improvements: !hasConclusion ? ['Add a clearer conclusion'] : [] }
    },
  }

  const skillData = skillScores[skill]?.() || { strengths: [], improvements: [] }
  score = Math.max(20, Math.min(100, score))

  const praise = score >= 80
    ? pickByAgeGroup(CELEBRATIONS.big_win, profile?.ageGroup || 'explorer', 'comm_great')
    : pickByAgeGroup(CELEBRATIONS.small_win, profile?.ageGroup || 'explorer', 'comm_ok')

  const tip = skill === 'clarity'
    ? 'Try the "one idea per sentence" rule — if a sentence has two ideas, split it.'
    : skill === 'pacing'
    ? 'Replace filler words with a one-second deliberate pause. The pause reads as confidence.'
    : 'Start with your conclusion, then support it — don\'t build up to it.'

  return {
    score,
    strengths: skillData.strengths.length ? skillData.strengths : ['Completed a full response'],
    improvements: skillData.improvements.length ? skillData.improvements : ['Keep building consistency'],
    tip,
    praise: _fillSlots(praise, { name: profile?.name || 'friend', streak: 0, totalSessions: 0, avgFluency: score, avgWpm: 0, braveStarCount: 0, daysSinceBrave: 0, nextFearItem: null, evolutionStage: null, actDone: 0 }),
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 11 — CONTEXT DETECTION (extended, replaces detectContext)
// ═══════════════════════════════════════════════════════════════════════════════

export const detectContext = ({ missedDays = 0, streakDays = 0, sessionCount = 0, lastAction, mood } = {}) => {
  if (sessionCount === 0) return 'onboarding'
  if (lastAction === 'voluntary_stutter') return 'voluntary_stutter'
  if (lastAction === 'complete_brave') return 'brave_missions'
  if (lastAction === 'complete_session') return 'celebration'
  if (lastAction === 'abandon') return 'struggle'
  if (mood === 'stressed' || mood === 'bad') return 'high_anxiety'
  if (missedDays >= 7) return 'long_absence'
  if (missedDays >= 3) return 'missed_sessions'
  if (streakDays > 0 && missedDays === 0) return 'returning_user'
  return 'general'
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 12 — EXPORT: unified getOfflineResponse (backwards compat)
// Keeps existing pages working without changes to import paths
// ═══════════════════════════════════════════════════════════════════════════════

const _rotIdx = {}
const _getOfflinePool = (cat) => {
  const MAP = {
    onboarding:        GREETINGS.morning.explorer,
    celebration:       CELEBRATIONS.big_win.explorer,
    struggle:          STRUGGLE.bad_session.explorer,
    breathing:         ENCOURAGEMENT.general.explorer,
    brave_missions:    ENCOURAGEMENT.before_hard_thing.explorer,
    voluntary_stutter: CELEBRATIONS.voluntary_stutter.explorer,
    story_prompts:     STORY_PROMPTS.explorer,
    encouragement:     ENCOURAGEMENT.general.explorer,
    returning_user:    GREETINGS.returning_after_break.explorer,
    missed_sessions:   GREETINGS.returning_after_break.navigator,
    general:           ENCOURAGEMENT.general.explorer,
    comm_coaching:     ENCOURAGEMENT.general.adult,
    parent_tips:       ['Tip: When your child stutters, keep your face relaxed. Your calm is contagious. 💙', 'Respond to WHAT your child says, not HOW they say it. Their message matters most.', 'Slow your own speech slightly when talking with your child — it creates a calmer environment.', "Never finish your child's sentences. Let them complete every word at their own pace."],
    high_anxiety:      ENCOURAGEMENT.general.explorer,
    long_absence:      GREETINGS.returning_after_break.adult,
  }
  return MAP[cat] || ENCOURAGEMENT.general.explorer
}

export const getOfflineResponse = (cat, profile = null) => {
  const pool = _getOfflinePool(cat)
  if (!_rotIdx[cat]) _rotIdx[cat] = 0
  const r = pool[_rotIdx[cat] % pool.length]
  _rotIdx[cat]++
  const raw = r || "You're doing great. Keep going. 💧"
  // Fill the {name} slot immediately so callers never see a literal "{name}"
  const name = profile?.name || null
  return name ? raw.replace(/\{name\}/g, name) : raw.replace(/\{name\}/g, 'friend')
}

export const getOfflineMission = (lvl) => generateBraveMissionOffline(lvl)
