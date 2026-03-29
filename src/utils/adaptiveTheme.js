// ─── ADAPTIVE THEME ENGINE ────────────────────────────────────────────────────
// Shifts app color palette based on: time of day, session type, mood, achievement
// 100% offline. Pure CSS variables + JS Date.
// ─────────────────────────────────────────────────────────────────────────────

export const TIME_THEMES = {
  dawn: {    // 5am–8am
    label: 'Dawn',
    primary:   '#f97316',   // warm amber
    secondary: '#fbbf24',
    glow:      'rgba(249,115,22,0.15)',
    bg1:       'rgba(249,115,22,0.06)',
    bg2:       'rgba(251,191,36,0.04)',
  },
  morning: { // 8am–12pm
    label: 'Morning',
    primary:   '#22d3ee',   // energizing cyan
    secondary: '#34d399',
    glow:      'rgba(34,211,238,0.12)',
    bg1:       'rgba(34,211,238,0.05)',
    bg2:       'rgba(52,211,153,0.04)',
  },
  afternoon: { // 12pm–5pm
    label: 'Afternoon',
    primary:   '#38bdf8',   // clear sky blue
    secondary: '#a78bfa',
    glow:      'rgba(56,189,248,0.12)',
    bg1:       'rgba(56,189,248,0.05)',
    bg2:       'rgba(167,139,250,0.04)',
  },
  evening: { // 5pm–9pm
    label: 'Evening',
    primary:   '#8b5cf6',   // calming violet
    secondary: '#a78bfa',
    glow:      'rgba(139,92,246,0.15)',
    bg1:       'rgba(139,92,246,0.07)',
    bg2:       'rgba(167,139,250,0.05)',
  },
  night: {   // 9pm–5am
    label: 'Night',
    primary:   '#6366f1',   // deep indigo
    secondary: '#818cf8',
    glow:      'rgba(99,102,241,0.12)',
    bg1:       'rgba(99,102,241,0.06)',
    bg2:       'rgba(129,140,248,0.04)',
  },
}

export const SESSION_THEMES = {
  breathe:         { primary: '#34d399', glow: 'rgba(52,211,153,0.2)',  label: 'Breathing' },
  brave:           { primary: '#f97316', glow: 'rgba(249,115,22,0.2)', label: 'Brave Mode' },
  act:             { primary: '#a78bfa', glow: 'rgba(167,139,250,0.2)',label: 'ACT Mode' },
  daf:             { primary: '#22d3ee', glow: 'rgba(34,211,238,0.2)', label: 'DAF Active' },
  speech_analysis: { primary: '#38bdf8', glow: 'rgba(56,189,248,0.2)', label: 'Analysis Mode' },
  celebration:     { primary: '#fbbf24', glow: 'rgba(251,191,36,0.3)', label: 'Celebration!' },
}

export const MOOD_THEMES = {
  amazing:  { tint: 'rgba(251,191,36,0.06)' },
  good:     { tint: 'rgba(52,211,153,0.04)' },
  okay:     { tint: 'rgba(34,211,238,0.04)' },
  rough:    { tint: 'rgba(167,139,250,0.06)' },
  stressed: { tint: 'rgba(251,113,133,0.06)' },
}

// Get current time theme
export const getTimeTheme = () => {
  const h = new Date().getHours()
  if (h >= 5  && h < 8)  return TIME_THEMES.dawn
  if (h >= 8  && h < 12) return TIME_THEMES.morning
  if (h >= 12 && h < 17) return TIME_THEMES.afternoon
  if (h >= 17 && h < 21) return TIME_THEMES.evening
  return TIME_THEMES.night
}

// Apply theme to CSS root variables
export const applyAdaptiveTheme = (overrideTheme = null) => {
  const theme = overrideTheme || getTimeTheme()
  const root  = document.documentElement

  root.style.setProperty('--adaptive-primary',   theme.primary)
  root.style.setProperty('--adaptive-secondary',  theme.secondary || theme.primary)
  root.style.setProperty('--adaptive-glow',       theme.glow)
  root.style.setProperty('--adaptive-bg1',        theme.bg1)
  root.style.setProperty('--adaptive-bg2',        theme.bg2 || 'transparent')
  root.style.setProperty('--aqua', theme.primary) // Shift the main accent
}

// Session-based theme (temporary, resets after)
export const applySessionTheme = (sessionType) => {
  const theme = SESSION_THEMES[sessionType]
  if (!theme) return () => {}
  applyAdaptiveTheme({ ...getTimeTheme(), primary: theme.primary, glow: theme.glow, bg1: theme.glow.replace('0.2', '0.06') })
  return () => applyAdaptiveTheme() // return cleanup
}

// Achievement pulse (2 seconds of gold)
export const achievementPulse = () => {
  const original = getTimeTheme()
  applyAdaptiveTheme(SESSION_THEMES.celebration)
  setTimeout(() => applyAdaptiveTheme(original), 2200)
}

// Mood tint applied as body background overlay
export const applyMoodTint = (moodId) => {
  const tint = MOOD_THEMES[moodId]?.tint || 'transparent'
  document.documentElement.style.setProperty('--mood-tint', tint)
}

// Check if it's sleep time (9pm–11pm = sleep mode suggestion)
export const isSleepTime = () => {
  const h = new Date().getHours()
  return h >= 21 && h <= 23
}

// Check if morning (good time for daily mission)
export const isMorning = () => {
  const h = new Date().getHours()
  return h >= 6 && h <= 10
}
