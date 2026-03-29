import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useApp } from './hooks/useAppContext'
import { getSetting } from './utils/db'

import BottomNav    from './components/shared/BottomNav'
import Notification from './components/shared/Notification'
import Flux         from './components/flux/Flux'
import DailyCheckIn, { useCheckIn } from './components/ui/DailyCheckIn'
import { FloatingReader } from './components/ui/ReadAloud'

// Pages
import Splash         from './pages/Splash'
import Auth           from './pages/Auth'
import Onboarding     from './pages/Onboarding'
import Home           from './pages/Home'
import Adventure      from './pages/Adventure'
import Breathe        from './pages/Breathe'
import SpeakLab       from './pages/SpeakLab'
import BraveMissions  from './pages/BraveMissions'
import TalkTales      from './pages/TalkTales'
import Journal        from './pages/Journal'
import FamilyMode     from './pages/FamilyMode'
import Progress       from './pages/Progress'
import Settings       from './pages/Settings'
import FluxChat       from './pages/FluxChat'
import CommAcademy    from './pages/CommAcademy'
import VoiceBiomarker from './pages/VoiceBiomarker'

import { applyAdaptiveTheme } from './utils/adaptiveTheme'

// V5
import SpeechAnalysis from './pages/SpeechAnalysis'
import ACTModule      from './pages/ACTModule'
import DAFMode        from './pages/DAFMode'
import BraveWall      from './pages/BraveWall'
import WeeklyReport   from './pages/WeeklyReport'

// ─────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5" style={{ background:'var(--ink)' }}>
      <Flux size={90} ageGroup="explorer" mood="happy"/>
      <p className="text-white/30 text-sm">Loading YoSpeech…</p>
    </div>
  )
}

function RequireProfile({ children }) {
  const { profile, loading } = useApp()
  const [onboarded, setOnboarded] = useState(null)

  useEffect(() => {
    getSetting('onboarded', false).then(setOnboarded)
  }, [])

  if (loading || onboarded === null) return <LoadingScreen/>
  if (!onboarded || !profile) return <Navigate to="/auth" replace/>
  return children
}

// ✅ FIXED WRAPPER
function HomeWrapper({ children }) {
  const shouldShow = useCheckIn()
  const { profile, setTodayMood } = useApp()

  // ✅ persistent dismissal
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem('checkin_done') === 'true'
  })

  const handleComplete = async (mood) => {
    setTodayMood(mood?.id)

    // ✅ mark dismissed
    sessionStorage.setItem('checkin_done', 'true')
    setDismissed(true)
  }

  return (
    <>
      {children}

      {shouldShow && !dismissed && (
        <DailyCheckIn
          key="daily-checkin" // ✅ force unmount
          ageGroup={profile?.ageGroup || 'explorer'}
          onComplete={handleComplete}
        />
      )}
    </>
  )
}

// ─────────────────────────────────────────────

export default function App() {

  useEffect(() => {
    applyAdaptiveTheme()
    const t = setInterval(applyAdaptiveTheme, 3600000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background:'var(--ink)' }}>
      {/* Main scrollable container */}
      <div className="relative h-full w-full max-w-md mx-auto flex flex-col overflow-hidden">
        
        {/* Content wrapper with independent scrolling */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="relative min-h-full">
            <Routes>
              <Route path="/"              element={<Splash />} />
              <Route path="/auth"          element={<Auth />} />
              <Route path="/onboarding"    element={<Onboarding />} />

              <Route path="/home" element={
                <RequireProfile>
                  <HomeWrapper>
                    <Home/>
                  </HomeWrapper>
                </RequireProfile>
              } />

              <Route path="/adventure"     element={<RequireProfile><Adventure /></RequireProfile>} />
              <Route path="/comm"          element={<RequireProfile><CommAcademy /></RequireProfile>} />
              <Route path="/breathe"       element={<RequireProfile><Breathe /></RequireProfile>} />
              <Route path="/speaklab"      element={<RequireProfile><SpeakLab /></RequireProfile>} />
              <Route path="/brave"         element={<RequireProfile><BraveMissions /></RequireProfile>} />
              <Route path="/talktales"     element={<RequireProfile><TalkTales /></RequireProfile>} />
              <Route path="/journal"       element={<RequireProfile><Journal /></RequireProfile>} />
              <Route path="/family"        element={<RequireProfile><FamilyMode /></RequireProfile>} />
              <Route path="/progress"      element={<RequireProfile><Progress /></RequireProfile>} />
              <Route path="/settings"      element={<RequireProfile><Settings /></RequireProfile>} />
              <Route path="/flux-chat"     element={<RequireProfile><FluxChat /></RequireProfile>} />

              <Route path="/analysis"      element={<RequireProfile><SpeechAnalysis /></RequireProfile>} />
              <Route path="/act"           element={<RequireProfile><ACTModule /></RequireProfile>} />
              <Route path="/daf"           element={<RequireProfile><DAFMode /></RequireProfile>} />
              <Route path="/brave-wall"    element={<RequireProfile><BraveWall /></RequireProfile>} />
              <Route path="/biomarker"     element={<RequireProfile><VoiceBiomarker /></RequireProfile>} />
              <Route path="/weekly-report" element={<RequireProfile><WeeklyReport /></RequireProfile>} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>

        <BottomNav />
        <Notification />
        <FloatingReader ageGroup="explorer" hidden={false} />
      </div>
    </div>
  )
}
