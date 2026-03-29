import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'

// ─── FLUX CANVAS — LIVING COMPANION ──────────────────────────────────────────
// Replaces static SVG Flux with a mic-reactive canvas character
// Reacts to: voice energy, breathing phases, achievements, mood, touch
// 100% offline — pure Canvas + WebAudio + requestAnimationFrame
// ─────────────────────────────────────────────────────────────────────────────

const PERSONA_COLORS = {
  classic:  { body: '#22d3ee', glow: '#0ea5e9', eye: '#075985', shimmer: '#bae6fd', mouth: '#0369a1' },
  coach:    { body: '#f97316', glow: '#fb923c', eye: '#7c2d12', shimmer: '#fed7aa', mouth: '#9a3412' },
  buddy:    { body: '#a78bfa', glow: '#8b5cf6', eye: '#4c1d95', shimmer: '#ede9fe', mouth: '#5b21b6' },
  gentle:   { body: '#34d399', glow: '#10b981', eye: '#064e3b', shimmer: '#a7f3d0', mouth: '#065f46' },
}

const MOOD_EXPRESSIONS = {
  happy:    { mouthArc: 0.5,  eyeScale: 1.0, browAngle:  0 },
  excited:  { mouthArc: 0.85, eyeScale: 1.2, browAngle: -5 },
  calm:     { mouthArc: 0.1,  eyeScale: 0.9, browAngle:  0 },
  thinking: { mouthArc: 0.0,  eyeScale: 0.95, browAngle: 8 },
  sad:      { mouthArc:-0.4,  eyeScale: 0.85, browAngle: 12 },
  tense:    { mouthArc: 0.0,  eyeScale: 0.8, browAngle: 15 },
}

const FluxCanvas = forwardRef(function FluxCanvas({
  size = 120,
  mood = 'happy',
  persona = 'classic',
  micEnergy = 0,        // 0–1 from VoiceEmotionMonitor
  breathPhase = null,   // 'in' | 'hold' | 'out' | null
  speaking = false,
  floating = true,
  onClick,
  className = '',
  voiceState = null,
}, ref) {
  const canvasRef = useRef(null)
  const animRef   = useRef(null)
  const stateRef  = useRef({
    floatY: 0,
    floatDir: 1,
    bodyScale: 1,
    targetScale: 1,
    blinkT: 0,
    nextBlink: 3000,
    lastBlink: 0,
    mouthOpen: 0,
    shimmerAngle: 0,
    particleT: 0,
    celebrateT: 0,
    touchX: -1,
    touchY: -1,
    ripples: [],
  })

  const colors = PERSONA_COLORS[persona] || PERSONA_COLORS.classic
  const expression = MOOD_EXPRESSIONS[mood] || MOOD_EXPRESSIONS.happy

  useImperativeHandle(ref, () => ({
    celebrate: () => { stateRef.current.celebrateT = 60 },
    ripple: (x, y) => {
      stateRef.current.ripples.push({ x, y, r: 0, alpha: 0.8 })
    },
  }))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const DPR = window.devicePixelRatio || 1
    canvas.width  = size * DPR
    canvas.height = size * DPR
    ctx.scale(DPR, DPR)

    const CX = size / 2
    const CY = size / 2
    const R  = size * 0.36  // body radius

    let frame = 0
    const s = stateRef.current

    const draw = (ts) => {
      ctx.clearRect(0, 0, size, size)
      frame++

      // ── Float animation ──
      if (floating) {
        s.floatY += s.floatDir * 0.12
        if (Math.abs(s.floatY) > 8) s.floatDir *= -1
      }

      // ── Breath-driven body scale ──
      if (breathPhase === 'in') {
        s.targetScale = 1.0 + 0.2 * (micEnergy || 0.5)
      } else if (breathPhase === 'out') {
        s.targetScale = 0.9
      } else {
        s.targetScale = 1.0 + micEnergy * 0.12
      }
      s.bodyScale += (s.targetScale - s.bodyScale) * 0.06

      // ── Blink ──
      if (ts - s.lastBlink > s.nextBlink) {
        s.blinkT = 8
        s.lastBlink = ts
        s.nextBlink = 2500 + Math.random() * 3000
      }
      if (s.blinkT > 0) s.blinkT--

      // ── Mouth open when speaking / mic energy ──
      const targetMouth = speaking ? 0.4 + micEnergy * 0.6 : 0
      s.mouthOpen += (targetMouth - s.mouthOpen) * 0.15

      // ── Shimmer rotate ──
      s.shimmerAngle += 0.015

      // ── Celebration particles ──
      if (s.celebrateT > 0) s.celebrateT--

      const cy = CY + s.floatY

      // ── Draw outer glow rings ──
      const glowAlpha = 0.08 + micEnergy * 0.15
      ;[2.2, 1.7, 1.3].forEach((mult, i) => {
        const g = ctx.createRadialGradient(CX, cy, 0, CX, cy, R * mult * s.bodyScale)
        g.addColorStop(0, colors.glow + Math.round((glowAlpha - i*0.025)*255).toString(16).padStart(2,'0'))
        g.addColorStop(1, colors.glow + '00')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(CX, cy, R * mult * s.bodyScale, 0, Math.PI * 2)
        ctx.fill()
      })

      // ── Body ──
      ctx.save()
      ctx.translate(CX, cy)
      ctx.scale(s.bodyScale, s.bodyScale)

      const bodyGrad = ctx.createRadialGradient(-R*0.2, -R*0.3, 0, 0, 0, R)
      bodyGrad.addColorStop(0, colors.shimmer)
      bodyGrad.addColorStop(0.5, colors.body)
      bodyGrad.addColorStop(1, colors.glow)
      ctx.fillStyle = bodyGrad
      ctx.beginPath()

      // Slightly organic shape using bezier
      const rx = R * (1 + micEnergy * 0.05)
      const ry = R * (1 - micEnergy * 0.03)
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2)
      ctx.fill()

      // Shimmer highlight
      ctx.save()
      ctx.rotate(s.shimmerAngle)
      const shimmerGrad = ctx.createRadialGradient(-R*0.3, -R*0.3, 0, -R*0.3, -R*0.3, R*0.5)
      shimmerGrad.addColorStop(0, 'rgba(255,255,255,0.3)')
      shimmerGrad.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = shimmerGrad
      ctx.beginPath()
      ctx.ellipse(-R*0.2, -R*0.25, R*0.35, R*0.22, -0.4, 0, Math.PI*2)
      ctx.fill()
      ctx.restore()

      // ── Eyes ──
      const eyeR   = R * 0.22 * expression.eyeScale
      const eyeY   = -R * 0.12
      const eyeLX  = -R * 0.28
      const eyeRX  = R * 0.28

      // Eye look-toward-touch
      let eyeOffX = 0, eyeOffY = 0
      if (s.touchX > 0) {
        const dx = s.touchX - CX, dy = s.touchY - (cy)
        const dist = Math.sqrt(dx*dx+dy*dy)
        if (dist > 0) {
          eyeOffX = (dx/dist) * 2.5
          eyeOffY = (dy/dist) * 2.5
        }
      }

      const blinkScale = s.blinkT > 0 ? Math.max(0, 1 - (s.blinkT / 4)) : 1

      ;[[eyeLX, eyeY], [eyeRX, eyeY]].forEach(([ex, ey]) => {
        // White
        ctx.fillStyle = 'rgba(255,255,255,0.95)'
        ctx.beginPath()
        ctx.ellipse(ex, ey, eyeR, eyeR * blinkScale, 0, 0, Math.PI*2)
        ctx.fill()
        // Pupil
        if (blinkScale > 0.3) {
          ctx.fillStyle = colors.eye
          ctx.beginPath()
          ctx.arc(ex + eyeOffX, ey + eyeOffY * blinkScale, eyeR * 0.55, 0, Math.PI*2)
          ctx.fill()
          // Specular
          ctx.fillStyle = 'rgba(255,255,255,0.9)'
          ctx.beginPath()
          ctx.arc(ex + eyeOffX + eyeR*0.15, ey + eyeOffY*blinkScale - eyeR*0.15, eyeR*0.18, 0, Math.PI*2)
          ctx.fill()
        }
      })

      // ── Eyebrows (show tension/mood) ──
      if (expression.browAngle !== 0 || mood === 'tense') {
        ctx.strokeStyle = colors.eye
        ctx.lineWidth   = R * 0.06
        ctx.lineCap     = 'round'
        const browY     = eyeY - eyeR * 1.4
        const angle     = (expression.browAngle * Math.PI) / 180

        ;[[-1, eyeLX], [1, eyeRX]].forEach(([dir, bx]) => {
          ctx.save()
          ctx.translate(bx, browY)
          ctx.rotate(dir * angle)
          ctx.beginPath()
          ctx.moveTo(-eyeR*0.7, 0)
          ctx.lineTo(eyeR*0.7, 0)
          ctx.stroke()
          ctx.restore()
        })
      }

      // ── Mouth ──
      const mouthY = R * 0.28
      const mouthW = R * 0.5
      ctx.strokeStyle = colors.mouth
      ctx.lineWidth   = R * 0.07
      ctx.lineCap     = 'round'

      if (s.mouthOpen > 0.1) {
        // Open mouth (speaking)
        ctx.fillStyle = colors.eye + 'cc'
        ctx.beginPath()
        ctx.ellipse(0, mouthY, mouthW * 0.4, R * 0.12 * s.mouthOpen, 0, 0, Math.PI*2)
        ctx.fill()
        ctx.strokeStyle = colors.mouth
        ctx.stroke()
      } else {
        // Curved mouth based on mood
        const arc = expression.mouthArc
        ctx.beginPath()
        ctx.moveTo(-mouthW*0.5, mouthY)
        ctx.quadraticCurveTo(0, mouthY + arc * R * 0.35, mouthW*0.5, mouthY)
        ctx.stroke()
      }

      // ── Antennae ──
      const antennaColor = colors.shimmer
      ;[[-R*0.25, -R*0.85, -R*0.35, -R*1.1], [R*0.25, -R*0.85, R*0.35, -R*1.1]].forEach(([x1,y1,x2,y2]) => {
        ctx.strokeStyle = antennaColor
        ctx.lineWidth   = R * 0.05
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
        ctx.fillStyle = antennaColor
        ctx.beginPath()
        ctx.arc(x2, y2, R*0.09, 0, Math.PI*2)
        ctx.fill()
      })

      ctx.restore() // end body transform

      // ── Celebration particles ──
      if (s.celebrateT > 0) {
        const COLORS_P = ['#22d3ee','#fbbf24','#a78bfa','#34d399','#fb7185']
        const t = s.celebrateT
        for (let i = 0; i < 12; i++) {
          const angle  = (i / 12) * Math.PI * 2 + frame * 0.05
          const radius = (60 - t) * 1.5
          const px     = CX + Math.cos(angle) * radius
          const py     = cy + Math.sin(angle) * radius
          ctx.fillStyle = COLORS_P[i % COLORS_P.length]
          ctx.globalAlpha = t / 60
          ctx.beginPath()
          ctx.arc(px, py, 3, 0, Math.PI*2)
          ctx.fill()
        }
        ctx.globalAlpha = 1
      }

      // ── Ripples (on tap) ──
      s.ripples = s.ripples.filter(r => r.alpha > 0.02)
      s.ripples.forEach(r => {
        r.r     += 3
        r.alpha *= 0.88
        ctx.strokeStyle = colors.glow
        ctx.lineWidth   = 1.5
        ctx.globalAlpha = r.alpha
        ctx.beginPath()
        ctx.arc(r.x, r.y, r.r, 0, Math.PI*2)
        ctx.stroke()
      })
      ctx.globalAlpha = 1

      // ── Water droplets (speaking) ──
      if (speaking && micEnergy > 0.15) {
        for (let i = 0; i < 3; i++) {
          const angle = s.shimmerAngle + i * 2.1
          const dx = Math.cos(angle) * (R * 1.4 + micEnergy * 20)
          const dy = Math.sin(angle) * (R * 1.2 + micEnergy * 15)
          ctx.fillStyle = colors.body + 'aa'
          ctx.beginPath()
          ctx.arc(CX + dx, cy + dy, 3 + micEnergy * 4, 0, Math.PI*2)
          ctx.fill()
        }
      }

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animRef.current)
  }, [size, mood, persona, speaking, floating, micEnergy, breathPhase, colors, expression])

  // Track touch/mouse for eye direction
  const handlePointerMove = (e) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    stateRef.current.touchX = clientX - rect.left
    stateRef.current.touchY = clientY - rect.top
  }
  const handlePointerLeave = () => {
    stateRef.current.touchX = -1
    stateRef.current.touchY = -1
  }
  const handleClick = (e) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (rect) {
      const x = (e.clientX || e.touches?.[0]?.clientX || 0) - rect.left
      const y = (e.clientY || e.touches?.[0]?.clientY || 0) - rect.top
      stateRef.current.ripples.push({ x, y, r: 0, alpha: 0.7 })
    }
    onClick?.()
  }

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={`cursor-pointer select-none ${className}`}
      style={{ width: size, height: size, imageRendering: 'pixelated' }}
      onClick={handleClick}
      onMouseMove={handlePointerMove}
      onMouseLeave={handlePointerLeave}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerLeave}
      aria-label="Flux — your speech companion"
      role={onClick ? 'button' : 'img'}
    />
  )
})

export default FluxCanvas
