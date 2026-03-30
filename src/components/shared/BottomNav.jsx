import { useLocation, useNavigate } from 'react-router-dom'

const NAV = [
  { path: '/home',      icon: '🏠', label: 'Home', showLabel: true },
  { path: '/adventure', icon: '🗺️', label: 'Explore', showLabel: true },
  { path: '/flux-chat', icon: '💧', label: 'Flux', special: true, showLabel: false },
  { path: '/progress',  icon: '🌌', label: 'Stars', showLabel: true },
  { path: '/settings',  icon: '⚙️', label: 'You', showLabel: true },
  { path: '/ai-therapy', icon: '🎙️', label: 'Therapy', showLabel: true },
  { path: '/ai-stutter', icon: '🧩', label: 'Stutter', showLabel: true },
]

// All V5 deep-link pages that should highlight the Explore tab
const EXPLORE_PATHS = [
  '/adventure', '/comm', '/brave', '/speaklab', '/breathe',
  '/talktales', '/journal', '/family',
  '/analysis', '/act', '/daf', '/brave-wall', '/biomarker', '/weekly-report',
]

// Paths that should highlight the Therapy tab
const THERAPY_PATHS = [
  '/ai-therapy',
  '/ai-checkin',
  '/soul-setup',
  '/ai-memory',
  '/ai-coaching',
  '/ai-story',
]

// Paths that should highlight the Stutter tab
const STUTTER_PATHS = [
  '/ai-stutter',
  '/speech-analysis',
  '/analysis',
  '/biomarker',
  '/act',
]

export default function BottomNav() {
  const location  = useLocation()
  const navigate  = useNavigate()
  const hidden    = ['/onboarding', '/flux-chat'].includes(location.pathname)
  
  if (hidden) return null

  // Determine active state for each nav item
  const isActive = (item) => {
    if (item.path === location.pathname) return true
    
    // Handle special cases for nested routes
    if (item.path === '/adventure' && EXPLORE_PATHS.includes(location.pathname)) return true
    if (item.path === '/ai-therapy' && THERAPY_PATHS.includes(location.pathname)) return true
    if (item.path === '/ai-stutter' && STUTTER_PATHS.includes(location.pathname)) return true
    
    return false
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom max-w-md mx-auto">
      <div className="glass-dark border-t" style={{ borderColor: 'rgba(255,255,255,0.06)', padding: '8px 4px' }}>
        <div className="flex justify-around items-center gap-0.5">
          {NAV.map(item => {
            const active = isActive(item)
            
            if (item.special) {
              // Special Flux button - larger and centered
              return (
                <button 
                  key={item.path} 
                  onClick={() => navigate(item.path)}
                  className="relative -mt-4 transition-all duration-200 active:scale-95"
                >
                  <div 
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all duration-200
                      ${active
                        ? 'text-[#05080f] shadow-lg'
                        : 'glass-2 text-white/50 hover:text-white/80'}`}
                    style={active ? { 
                      background: 'var(--aqua)', 
                      boxShadow: '0 0 20px rgba(34,211,238,0.5)' 
                    } : {}}
                  >
                    {item.icon}
                  </div>
                  {active && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  )}
                </button>
              )
            }
            
            // Regular navigation items - compact for mobile
            return (
              <button 
                key={item.path} 
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center justify-center gap-0.5 py-1 px-1 rounded-xl transition-all duration-200 active:scale-95 min-w-[44px]"
                style={{ opacity: active ? 1 : 0.7 }}
              >
                <span className={`text-lg transition-all duration-200 ${active ? 'scale-110' : ''}`}>
                  {item.icon}
                </span>
                {item.showLabel && (
                  <span className="text-[9px] font-display font-semibold tracking-tight">
                    {item.label}
                  </span>
                )}
                {active && !item.special && (
                  <div className="w-1 h-1 rounded-full bg-cyan-400 mt-0.5" />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
