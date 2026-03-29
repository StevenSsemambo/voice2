// ONLY CHANGE IS IN THE TEXTAREA SECTION (scroll down to INPUT part)

import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../hooks/useAppContext'
import { callFluxAI, getOfflineResponse, detectContext } from '../ai/fluxEngine'
import { speak, stopSpeaking, speakFlux, ttsAvailable, preloadVoices } from '../ai/voiceEngine'
import { isSleepTime } from '../utils/adaptiveTheme'
import { buildEvolutionPrompt, loadPersona, getCurrentStage } from '../ai/fluxPersonality'
import { buildLifeStory } from '../ai/fluxLifeStory'
import Flux from '../components/flux/Flux'

const QUICK_PROMPTS = [
  "I'm nervous about speaking today 😟",
  "Give me a breathing tip 💨",
  "I need encouragement 💙",
  "I just stuttered badly — help",
  "What should I practice today?",
  "I did something brave today! ⭐",
  isSleepTime() ? "It's evening — how did my voice feel today? 🌙" : "What should I practice tomorrow?",
]

// SPEECH RECOGNITION (unchanged)
function useSpeechRecognition(onResult, onEnd) {
  const recRef = useRef(null)
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    setSupported(true)
    const rec = new SR()
    rec.continuous = false
    rec.interimResults = true
    rec.lang = 'en-US'
    rec.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join('')
      const final = e.results[e.results.length - 1].isFinal
      onResult(transcript, final)
    }
    rec.onend = () => { setListening(false); onEnd?.() }
    rec.onerror = () => setListening(false)
    recRef.current = rec
  }, [])

  const startListening = useCallback(() => {
    if (!recRef.current || listening) return
    stopSpeaking()
    try { recRef.current.start(); setListening(true) } catch {}
  }, [listening])

  const stopListening = useCallback(() => {
    try { recRef.current?.stop() } catch {}
    setListening(false)
  }, [])

  return { listening, supported, startListening, stopListening }
}

// MAIN COMPONENT
export default function FluxChat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [fluxSpeaking, setFluxSpeaking] = useState(false)
  const [voiceMode, setVoiceMode] = useState(false)
  const [interim, setInterim] = useState('')
  const [autoSpeak, setAutoSpeak] = useState(true)

  const chatRef = useRef(null)
  const { profile } = useApp()
  const navigate = useNavigate()
  const ageGroup = profile?.ageGroup || 'explorer'

  const { listening, supported: micOk, startListening, stopListening } =
    useSpeechRecognition(
      (text, final) => {
        setInput(text)
        if (final && text.trim()) { setInterim(''); sendMsg(text.trim()) }
        else setInterim(text)
      },
      () => setInterim('')
    )

  useEffect(() => {
    preloadVoices()
    const greeting = getOfflineResponse(detectContext({ sessionCount: 1, streakDays: 1 }))
    const msg = { role: 'assistant', text: greeting, id: 1 }
    setMessages([msg])
  }, [])

  const sendMsg = async (text) => {
    const msg = typeof text === 'string' ? text : input.trim()
    if (!msg || loading) return

    setInput('')
    setInterim('')

    const userMsg = { role: 'user', text: msg, id: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const result = await callFluxAI([], profile)
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: result.text,
        id: Date.now()
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Try again later',
        id: Date.now()
      }])
    }

    setLoading(false)
  }

  return (
    <div className="flex flex-col bg-ink" style={{ height: '100dvh' }}>

      {/* Messages */}
      <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : ''}`}>
            <div className={`px-4 py-3 rounded-2xl text-sm ${
              msg.role === 'user'
                ? 'bg-cyan-500 text-white'
                : 'bg-white/10 text-white'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* INPUT FIXED HERE */}
      <div className="px-4 py-3 border-t border-white/5">
        <div className="flex gap-2 items-end">

          <textarea
            value={input}
            onChange={e => {
              setInput(e.target.value)

              // ✅ auto expand
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMsg()
              }
            }}
            placeholder="Talk to Flux..."
            rows={1}
            className="flex-1 rounded-2xl px-4 py-3 text-sm outline-none resize-none placeholder-white/40"
            style={{
              minHeight: '44px',
              maxHeight: '120px',

              // ✅ CRITICAL FIX (forces dark input)
              background: 'rgba(15, 23, 42, 0.9)',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.12)'
            }}
          />

          <button
            onClick={() => sendMsg()}
            className="w-11 h-11 rounded-2xl bg-cyan-500 text-white">
            ➤
          </button>

        </div>
      </div>
    </div>
  )
}
