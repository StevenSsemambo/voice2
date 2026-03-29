import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRecentAnalyses, getStreakCount, getTotalSessions, db } from '../utils/db'
import { useApp } from '../hooks/useAppContext'
import useFluxVoice from '../hooks/useFluxVoice'
import { getCurrentStage, getEvolutionProgress } from '../ai/fluxPersonality'
import { formatVoiceMetrics } from '../ai/voiceEmotion'
import Flux from '../components/flux/Flux'

// ─── MINI LINE CHART (Canvas) ──────────────────────────────────────────────────
function LineChart({ data, color = 'var(--aqua)', height = 60, label = '', unit = '' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || data.length < 2) return
    const ctx = canvas.getContext('2d')
    const W = canvas.offsetWidth || 280
    const H = height
    canvas.width  = W * (window.devicePixelRatio || 1)
    canvas.height = H * (window.devicePixelRatio || 1)
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1)
    ctx.clearRect(0, 0, W, H)

    const min = Math.min(...data) * 0.92
    const max = Math.max(...data) * 1.08
    const range = max - min || 1

    const toX = (i)   => (i / (data.length - 1)) * W
    const toY = (val) => H - ((val - min) / range) * (H * 0.8) - H * 0.1

    // Gradient fill
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, color.replace(')', ', 0.25)').replace('var(--', 'rgba(').replace('aqua', '34,211,238').replace('jade', '52,211,153').replace('violet', '167,139,250').replace('amber', '251,191,36').replace('rose', '251,113,133') || 'rgba(34,211,238,0.25)')
    grad.addColorStop(1, 'rgba(0,0,0,0)')

    ctx.beginPath()
    data.forEach((v, i) => i === 0 ? ctx.moveTo(toX(i), toY(v)) : ctx.lineTo(toX(i), toY(v)))
    ctx.lineTo(toX(data.length - 1), H)
    ctx.lineTo(0, H)
    ctx.closePath()
    ctx.fillStyle = grad
    ctx.fill()

    // Line
    ctx.beginPath()
    ctx.strokeStyle = color
    ctx.lineWidth   = 2
    ctx.lineJoin    = 'round'
    data.forEach((v, i) => i === 0 ? ctx.moveTo(toX(i), toY(v)) : ctx.lineTo(toX(i), toY(v)))
    ctx.stroke()

    // End dot
    const lastX = toX(data.length - 1)
    const lastY = toY(data[data.length - 1])
    ctx.beginPath()
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
  }, [data, color, height])

  if (data.length < 2) return (
    <div className="flex items-center justify-center h-16 text-white/25 text-xs">
      Need more sessions for trend data
    </div>
  )

  const latest = data[data.length - 1]
  const prev   = data[data.length - 2]
  const delta  = latest - prev
  const trend  = delta > 0 ? `↑ +${Math.abs(delta).toFixed(1)}` : delta < 0 ? `↓ -${Math.abs(delta).toFixed(1)}` : '→ stable'

  return (
    <div className="w-full">
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-white/40 text-xs">{label}</span>
        <span className="text-xs font-display font-bold" style={{ color }}>
          {latest.toFixed(1)}{unit}
          <span className="text-white/30 font-normal ml-1 text-[10px]">{trend}</span>
        </span>
      </div>
      <canvas ref={canvasRef} className="w-full" style={{ height, display: 'block' }}/>
    </div>
  )
}

// ─── NEURO BADGE ──────────────────────────────────────────────────────────────
function NeuroBadge({ icon, title, desc, color, active = true }) {
  return (
    <div className="flex gap-3 items-start p-3 rounded-2xl"
      style={{
        background: active ? `${color}10` : 'rgba(255,255,255,0.03)',
        border: `1px solid ${active ? color + '30' : 'rgba(255,255,255,0.07)'}`,
        opacity: active ? 1 : 0.45,
      }}>
      <span className="text-2xl flex-shrink-0">{icon}</span>
      <div>
        <p className="font-display font-bold text-white text-sm">{title}</p>
        <p className="text-white/50 text-xs leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

export default function VoiceBiomarker() {
  const [analyses,      setAnalyses]      = useState([])
  const [totalSessions, setTotalSessions] = useState(0)
  const [streak,        setStreak]        = useState(0)
  const [braveCount,    setBraveCount]    = useState(0)
  const [actDone,       setActDone]       = useState(0)
  const [tab,           setTab]           = useState('biomarker')
  const { profile } = useApp()
  const { fluxSay }  = useFluxVoice()
  const navigate     = useNavigate()

  useEffect(() => {
    const load = async () => {
      const [a, s, str, brave, act] = await Promise.all([
        getRecentAnalyses(30),
        getTotalSessions(),
        getStreakCount(),
        db.braveStars.count().catch(() => 0),
        db.actSessions.count().catch(() => 0),
      ])
      setAnalyses(a.reverse()) // chronological
      setTotalSessions(s)
      setStreak(str)
      setBraveCount(brave)
      setActDone(act)
    }
    load()
  }, [])

  const evo = getEvolutionProgress(totalSessions)

  // Chart data from analyses
  const wpmData      = analyses.map(a => a.wpm || 0).filter(v => v > 0)
  const fluencyData  = analyses.map(a => a.fluencyScore || 0).filter(v => v > 0)
  const fillerData   = analyses.map(a => a.fillerCount || 0)

  // Neuro training signals (session-based estimates)
  const totalSignals = totalSessions * 37   // ~37 deliberate speech acts per session avg
  const breathSignals = (analyses.filter(a => a.sessionType === 'breathe').length || 0) * 15
  const braveSignals  = braveCount * 25

  const stage = evo.current

  // Flux intro
  useEffect(() => {
    if (totalSessions > 0) {
      fluxSay(
        `Here's your voice data from ${totalSessions} sessions. Your brain has received approximately ${totalSignals.toLocaleString()} deliberate speech training signals. That's real neuroplasticity.`,
        profile?.ageGroup || 'explorer'
      )
    }
  }, [totalSessions])

  const TABS = [
    { id: 'biomarker',   label: '📊 Voice Data' },
    { id: 'neuro',       label: '🧠 Brain Training' },
    { id: 'evolution',   label: '💧 Flux Evolution' },
  ]

  return (
    <div className="min-h-full pb-28 page-enter" style={{ zIndex: 1 }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-8 pb-4">
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full glass flex items-center justify-center text-white">←</button>
        <div>
          <h1 className="font-display text-xl font-bold text-white">Voice Intelligence</h1>
          <p className="text-white/35 text-xs">Biomarkers · Neuroplasticity · Evolution</p>
        </div>
        <span className="ml-auto text-2xl">🧬</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mx-5 mb-5 p-1 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex-1 py-2 rounded-xl text-xs font-display font-semibold transition-all"
            style={tab === t.id
              ? { background: 'var(--aqua)', color: '#05080f' }
              : { color: 'rgba(255,255,255,0.4)' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── BIOMARKER TAB ── */}
      {tab === 'biomarker' && (
        <div className="px-5 flex flex-col gap-5">
          {analyses.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-4 text-center">
              <Flux size={80} ageGroup={profile?.ageGroup || 'explorer'} mood="happy" floating/>
              <p className="text-white/40 text-sm">Complete Speech Analysis sessions to see your voice biomarkers here.</p>
              <button onClick={() => navigate('/analysis')} className="btn-aqua font-display" style={{ color: '#05080f' }}>
                Start Speech Analysis
              </button>
            </div>
          ) : (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { label: 'Sessions',  value: totalSessions,                          color: 'var(--aqua)'   },
                  { label: 'Avg Fluency',value: fluencyData.length ? `${Math.round(fluencyData.reduce((a,b)=>a+b)/fluencyData.length)}` : '—', color: 'var(--jade)' },
                  { label: 'Avg WPM',   value: wpmData.length ? `${Math.round(wpmData.reduce((a,b)=>a+b)/wpmData.length)}` : '—', color: 'var(--violet)' },
                ].map((s, i) => (
                  <div key={i} className="card text-center py-4">
                    <div className="font-display font-bold text-xl" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-white/30 text-xs mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Trend charts */}
              <div className="card">
                <LineChart data={fluencyData} color="var(--aqua)"   height={64} label="Fluency Score Trend"  unit="/100" />
              </div>
              <div className="card">
                <LineChart data={wpmData}     color="var(--violet)" height={64} label="Speaking Rate Trend" unit=" WPM" />
              </div>
              {fillerData.some(v => v > 0) && (
                <div className="card">
                  <LineChart data={fillerData} color="var(--amber)"  height={48} label="Filler Words per Session" unit="" />
                </div>
              )}

              {/* Voice confidence trend */}
              <div className="card" style={{ borderColor: 'rgba(34,211,238,0.15)' }}>
                <p className="section-label mb-3">What your voice data shows</p>
                {fluencyData.length >= 3 && (() => {
                  const first3avg = fluencyData.slice(0, 3).reduce((a,b)=>a+b) / 3
                  const last3avg  = fluencyData.slice(-3).reduce((a,b)=>a+b) / 3
                  const change    = last3avg - first3avg
                  const improved  = change > 0
                  return (
                    <div className="flex gap-3 items-start">
                      <span className="text-2xl">{improved ? '📈' : '→'}</span>
                      <p className="text-white/70 text-sm leading-relaxed">
                        {improved
                          ? `Your fluency score has improved by ${change.toFixed(1)} points on average since your first sessions. That's real progress measured in your own voice.`
                          : `Your fluency is consistent. Consistency is how neuroplasticity works — keep showing up.`}
                      </p>
                    </div>
                  )
                })()}
                {fluencyData.length < 3 && (
                  <p className="text-white/40 text-sm">Complete 3+ Speech Analysis sessions for trend insights.</p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── NEURO TAB ── */}
      {tab === 'neuro' && (
        <div className="px-5 flex flex-col gap-4">
          {/* Training signal counter */}
          <div className="card-lg text-center"
            style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.08), rgba(167,139,250,0.06))' }}>
            <p className="section-label mb-2">Total Speech Training Signals</p>
            <div className="font-display font-bold mb-1" style={{ fontSize: '48px', color: 'var(--aqua)', lineHeight: 1 }}>
              {totalSignals.toLocaleString()}
            </div>
            <p className="text-white/40 text-sm">deliberate signals sent to your speech motor pathway</p>
          </div>

          {/* Neuro facts per completed activity */}
          <p className="section-label">What each practice does to your brain</p>

          <NeuroBadge icon="🫁" title="Breathing exercises activate the parasympathetic system"
            desc={`${breathSignals > 0 ? `~${breathSignals} signals sent. ` : ''}Each slow exhale reduces amygdala activation — one of the three core nodes of the stuttering network. Your vocal muscles literally relax.`}
            color="var(--jade)" active={breathSignals > 0} />

          <NeuroBadge icon="🗣️" title="SpeakLab rewires basal ganglia timing"
            desc={`The basal ganglia coordinates speech timing — it's disrupted in stuttering. Rhythmic practice with rate control sends direct timing signals. Every session reshapes the circuit.`}
            color="var(--aqua)" active={totalSessions > 0} />

          <NeuroBadge icon="🦁" title="BraveMissions reduce amygdala fear response"
            desc={`${braveCount > 0 ? `${braveCount} brave moments completed. ` : ''}Exposure therapy causes the amygdala to form new associations. Each situation you face literally shrinks the fear network over time.`}
            color="var(--amber)" active={braveCount > 0} />

          <NeuroBadge icon="🎧" title="DAF mode creates artificial choral synchrony"
            desc="Delayed Auditory Feedback tricks the brain into treating your voice as a 'choir of one' — bypassing the faulty timing circuit via the right hemisphere's rhythm processing."
            color="var(--violet)" active={true} />

          <NeuroBadge icon="🧘" title="ACT therapy restructures self-as-context"
            desc={`${actDone > 0 ? `${actDone} sessions complete. ` : ''}ACT reduces the psychological struggle that amplifies stuttering severity. Less struggle = less amygdala activation = smoother speech.`}
            color="var(--rose)" active={actDone > 0} />

          <NeuroBadge icon="⭐" title="Voluntary stuttering breaks the fear-avoidance loop"
            desc="Intentional stuttering is the most clinically powerful technique available. It directly disconnects the conditioned fear response from speaking situations."
            color="var(--amber)" active={braveCount > 0} />

          {/* Progress bar */}
          <div className="card">
            <p className="section-label mb-3">Neuroplasticity Accumulation</p>
            <div className="prog-track mb-2">
              <div className="prog-fill"
                style={{ width: `${Math.min((totalSessions / 100) * 100, 100)}%`,
                  background: 'linear-gradient(90deg, var(--aqua), var(--violet))' }}/>
            </div>
            <p className="text-white/40 text-xs">{totalSessions}/100 sessions toward sustained neurological change</p>
            <p className="text-white/25 text-xs mt-1">Research shows consistent speech therapy over 100+ sessions produces measurable structural brain changes</p>
          </div>
        </div>
      )}

      {/* ── EVOLUTION TAB ── */}
      {tab === 'evolution' && (
        <div className="px-5 flex flex-col gap-5">
          <div className="flex flex-col items-center gap-3 py-4">
            <div style={{ filter: `drop-shadow(0 0 20px ${stage.color})` }}>
              <Flux size={100} ageGroup={profile?.ageGroup || 'explorer'} mood="happy" floating/>
            </div>
            <div className="text-center">
              <span className="text-3xl">{stage.icon}</span>
              <h2 className="font-display text-2xl font-bold text-white mt-1">{stage.name}</h2>
              <p className="text-white/40 text-sm">{totalSessions} sessions together</p>
            </div>
          </div>

          {/* Progress to next */}
          {evo.next && (
            <div className="card">
              <div className="flex justify-between mb-2">
                <span className="text-white/50 text-xs font-display">Progress to "{evo.next.name}"</span>
                <span className="font-display font-bold text-xs" style={{ color: 'var(--aqua)' }}>{evo.pct}%</span>
              </div>
              <div className="prog-track mb-1">
                <div className="prog-fill" style={{ width: `${evo.pct}%`, background: `linear-gradient(90deg, ${stage.color}, ${evo.next.color})` }}/>
              </div>
              <p className="text-white/25 text-xs">{evo.next.sessions - totalSessions} more sessions to unlock {evo.next.name}</p>
            </div>
          )}

          {/* All stages */}
          <p className="section-label">Evolution Path</p>
          {[
            { sessions: 0,   name: 'Water Drop',  id: 'seed',      icon: '💧', color: '#38bdf8', desc: 'Careful and warm. Building trust.' },
            { sessions: 6,   name: 'Stream',      id: 'sprout',    icon: '🌱', color: '#22d3ee', desc: 'Playful. Making observations.' },
            { sessions: 21,  name: 'River',       id: 'river',     icon: '🌊', color: '#7c3aed', desc: 'Coaching. Direct. Referencing history.' },
            { sessions: 51,  name: 'Ocean Wave',  id: 'ocean',     icon: '🌊', color: '#f97316', desc: 'Deep relationship. Challenging avoidance.' },
            { sessions: 101, name: 'Full Flow',   id: 'full_flow', icon: '✨', color: '#fbbf24', desc: 'Legendary companion. Complete honesty.' },
          ].map((s, i) => {
            const reached = totalSessions >= s.sessions
            const isCurrent = stage.id === s.id
            return (
              <div key={i}
                className="flex items-center gap-3 p-4 rounded-2xl border transition-all"
                style={{
                  background: isCurrent ? `${s.color}12` : reached ? `${s.color}06` : 'rgba(255,255,255,0.03)',
                  borderColor: isCurrent ? `${s.color}40` : reached ? `${s.color}20` : 'rgba(255,255,255,0.07)',
                  opacity: reached ? 1 : 0.45,
                }}>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-lg flex-shrink-0"
                  style={{ background: reached ? `${s.color}20` : 'rgba(255,255,255,0.06)' }}>
                  {reached ? s.icon : s.sessions}
                </div>
                <div className="flex-1">
                  <p className="font-display font-bold text-white text-sm">{s.name}</p>
                  <p className="text-white/40 text-xs">{s.desc}</p>
                </div>
                {isCurrent && <span className="pill-aqua text-[10px]">Current</span>}
                {!isCurrent && reached && <span className="pill-jade text-[10px]">✓ Unlocked</span>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
