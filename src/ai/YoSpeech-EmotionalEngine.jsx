import { useState, useEffect, useRef } from "react";

// ─── EMOTIONAL STATE SCHEMA ───────────────────────────────────────────────────
// Every session starts by building this object
const EMPTY_EMOTIONAL_READING = {
  timestamp: null,
  dayOfWeek: null,
  timeOfDay: null,           // "morning"|"afternoon"|"evening"|"night"
  selfReported: null,        // 1-5 (how user says they feel)
  energyLevel: null,         // 1-5
  recentWin: null,           // true|false|null
  recentStruggle: null,      // true|false|null
  struggleDescription: "",
  winDescription: "",
  avoidedSomething: null,    // true|false
  socialPressure: null,      // true|false (something coming up)
  upcomingEvent: "",
  derivedState: null,        // computed: "crisis"|"low"|"fragile"|"steady"|"open"|"energised"
  sessionRecommendation: null, // computed session type
  toneProfile: null,         // computed tone the AI should use
};

// ─── EMOTIONAL STATE DERIVER ──────────────────────────────────────────────────
function deriveEmotionalState(reading, soul) {
  const { selfReported, energyLevel, recentStruggle, recentWin, avoidedSomething, timeOfDay } = reading;

  let score = 0;
  if (selfReported) score += selfReported * 2;
  if (energyLevel) score += energyLevel;
  if (recentWin) score += 3;
  if (recentStruggle) score -= 3;
  if (avoidedSomething) score -= 2;

  // Personality modifiers from soul
  if (soul?.communicationPersonality === "perfectionist" && recentStruggle) score -= 2;
  if (soul?.communicationPersonality === "avoider" && avoidedSomething) score -= 3;
  if (soul?.hopeLevel <= 2) score -= 1;
  if (soul?.hopeLevel >= 4) score += 1;

  // Time of day modifiers
  if (timeOfDay === "night") score -= 1; // fatigue
  if (timeOfDay === "morning") score += 0.5;

  let derivedState;
  if (score <= 3) derivedState = "crisis";
  else if (score <= 6) derivedState = "low";
  else if (score <= 9) derivedState = "fragile";
  else if (score <= 12) derivedState = "steady";
  else if (score <= 15) derivedState = "open";
  else derivedState = "energised";

  return derivedState;
}

// ─── SESSION RECOMMENDER ──────────────────────────────────────────────────────
function recommendSession(state, soul) {
  const recommendations = {
    crisis: {
      type: "grounding",
      label: "Grounding Session",
      description: "No exercises today. Just breathing, reflection, and stabilising.",
      duration: "10 min",
      icon: "🌊",
      color: "#818cf8",
    },
    low: {
      type: "gentle",
      label: "Gentle Practice",
      description: "Light, low-pressure exercises. No new challenges today.",
      duration: "15 min",
      icon: "🌱",
      color: "#34d399",
    },
    fragile: {
      type: "comfort",
      label: "Comfort Zone Practice",
      description: "Familiar exercises you've already done well. Build confidence.",
      duration: "20 min",
      icon: "🛡️",
      color: "#fbbf24",
    },
    steady: {
      type: "standard",
      label: "Standard Session",
      description: "Regular coaching with balanced challenge and support.",
      duration: "25 min",
      icon: "⚖️",
      color: "#60a5fa",
    },
    open: {
      type: "growth",
      label: "Growth Session",
      description: "Push into slightly uncomfortable territory. You're ready.",
      duration: "30 min",
      icon: "🚀",
      color: "#a78bfa",
    },
    energised: {
      type: "challenge",
      label: "Challenge Session",
      description: "Maximum intensity. Tackle your hardest exercises today.",
      duration: "35 min",
      icon: "⚡",
      color: "#f472b6",
    },
  };

  return recommendations[state] || recommendations.steady;
}

// ─── TONE PROFILE GENERATOR ───────────────────────────────────────────────────
function generateToneProfile(state, soul) {
  const tones = {
    crisis: {
      warmth: 10, directness: 2, challenge: 0, humour: 0, formality: 3,
      approach: "Hold space. No agenda. Pure presence and validation.",
      openingStyle: "soft_check_in",
    },
    low: {
      warmth: 9, directness: 3, challenge: 1, humour: 1, formality: 4,
      approach: "Gentle encouragement. Acknowledge difficulty. Small wins only.",
      openingStyle: "warm_acknowledgement",
    },
    fragile: {
      warmth: 8, directness: 4, challenge: 3, humour: 2, formality: 5,
      approach: "Steady presence. Familiar ground. Remind them of past wins.",
      openingStyle: "grounded_check_in",
    },
    steady: {
      warmth: 7, directness: 6, challenge: 5, humour: 4, formality: 6,
      approach: "Balanced coaching. Mix of support and gentle push.",
      openingStyle: "engaged_greeting",
    },
    open: {
      warmth: 6, directness: 7, challenge: 7, humour: 5, formality: 6,
      approach: "Energised coaching. Celebrate readiness. Push thoughtfully.",
      openingStyle: "excited_acknowledgement",
    },
    energised: {
      warmth: 6, directness: 9, challenge: 9, humour: 6, formality: 5,
      approach: "High energy. Match their momentum. Set ambitious targets.",
      openingStyle: "high_energy_launch",
    },
  };

  return tones[state] || tones.steady;
}

// ─── OPENING MESSAGE GENERATOR ────────────────────────────────────────────────
function generateOpeningMessage(reading, soul, sessionRec, tone) {
  const name = soul?.name || "there";
  const { derivedState, recentWin, recentStruggle, winDescription, struggleDescription, avoidedSomething, socialPressure, upcomingEvent } = reading;

  const openings = {
    soft_check_in: [
      `${name}... I'm glad you came today. That matters more than you know.`,
      `Hey ${name}. Just being here takes courage. Let's take this slowly together.`,
    ],
    warm_acknowledgement: [
      `${name}, I noticed today feels heavier. That's okay. We work with where you are, not where you think you should be.`,
      `Good to see you, ${name}. We'll keep things gentle today — no pressure, just presence.`,
    ],
    grounded_check_in: [
      `Welcome back, ${name}. Let's take a breath and find our footing together before we begin.`,
      `${name}, you showed up. That's the first win of today. Let's build from here.`,
    ],
    engaged_greeting: [
      `Good to have you here, ${name}. You seem centered today — let's make the most of it.`,
      `${name}, you're in a good place to work. I have a solid session planned for you.`,
    ],
    excited_acknowledgement: [
      `${name}, I can feel you're ready today. Let's use this well — we're going somewhere meaningful.`,
      `You brought good energy today, ${name}. I'm not going to waste it. Let's go.`,
    ],
    high_energy_launch: [
      `${name} — today is one of those sessions. You're firing on all cylinders. Let's push.`,
      `I see it, ${name}. Today we go further than usual. Trust the process and follow my lead.`,
    ],
  };

  const base = openings[tone.openingStyle]?.[Math.floor(Math.random() * 2)] || `Good to see you, ${name}.`;

  // Contextual additions
  let contextAdd = "";
  if (recentWin && winDescription) {
    contextAdd = ` And ${winDescription.toLowerCase()} — that's real progress. I haven't forgotten.`;
  } else if (recentStruggle && struggleDescription) {
    if (derivedState === "crisis" || derivedState === "low") {
      contextAdd = ` ${struggleDescription} — I hear that. We'll address it together, carefully.`;
    } else {
      contextAdd = ` What happened with ${struggleDescription.toLowerCase()} doesn't define the session ahead.`;
    }
  }

  if (avoidedSomething && (derivedState !== "crisis" && derivedState !== "low")) {
    contextAdd += " Avoidance is something we'll gently work on today — no pressure, just awareness.";
  }

  if (socialPressure && upcomingEvent) {
    contextAdd += ` I also haven't forgotten about ${upcomingEvent}. We'll keep that in view.`;
  }

  return base + contextAdd;
}

// ─── CONVERSATION FLOW ────────────────────────────────────────────────────────
function buildCheckInFlow(soul) {
  const name = soul?.name || "there";
  const isReturning = soul?.onboardingComplete;

  return [
    {
      id: "greeting",
      type: "message",
      text: isReturning
        ? `Welcome back, ${name}.`
        : `Hello, ${name}. Let's begin.`,
      delay: 700,
      next: "feeling_check",
    },
    {
      id: "feeling_check",
      type: "scale",
      text: "Before anything else — how are you feeling right now, honestly?",
      soulKey: "selfReported",
      labels: ["Really struggling", "Not great", "Okay", "Pretty good", "Great"],
      next: "energy_check",
    },
    {
      id: "energy_check",
      type: "scale",
      text: "And your energy — how much do you have to give today?",
      soulKey: "energyLevel",
      labels: ["Drained", "Low", "Moderate", "Good", "High"],
      next: "since_last",
    },
    {
      id: "since_last",
      type: "message",
      text: "Tell me — since we last spoke, did anything happen related to your communication?",
      delay: 600,
      next: "win_check",
    },
    {
      id: "win_check",
      type: "choice",
      text: null,
      options: [
        { label: "I had a win — something went well", value: "win", icon: "✨" },
        { label: "I had a struggle — something was hard", value: "struggle", icon: "🌧️" },
        { label: "I avoided something I should have faced", value: "avoided", icon: "🚪" },
        { label: "Nothing significant happened", value: "nothing", icon: "—" },
      ],
      soulKey: "_recentEvent",
      next: (val) => {
        if (val === "win") return "win_describe";
        if (val === "struggle") return "struggle_describe";
        if (val === "avoided") return "avoided_confirm";
        return "upcoming_check";
      },
    },
    {
      id: "win_describe",
      type: "input_text",
      text: "Tell me about it. What happened?",
      placeholder: "e.g. I made a phone call without backing out...",
      soulKey: "winDescription",
      _setter: (r) => ({ ...r, recentWin: true }),
      next: "upcoming_check",
    },
    {
      id: "struggle_describe",
      type: "input_text",
      text: "I'm listening. What happened?",
      placeholder: "e.g. I stuttered badly in a meeting and felt ashamed...",
      soulKey: "struggleDescription",
      _setter: (r) => ({ ...r, recentStruggle: true }),
      next: "upcoming_check",
    },
    {
      id: "avoided_confirm",
      type: "message",
      text: "Avoidance is something I want us to understand together — not judge. We'll explore that today.",
      delay: 800,
      _setter: (r) => ({ ...r, avoidedSomething: true }),
      next: "upcoming_check",
    },
    {
      id: "upcoming_check",
      type: "choice",
      text: "Is there anything coming up that's on your mind — an event, a conversation, a situation you're dreading or preparing for?",
      options: [
        { label: "Yes, something specific", value: "yes", icon: "📅" },
        { label: "No, nothing particular", value: "no", icon: "✓" },
      ],
      soulKey: "_upcomingFlag",
      next: (val) => val === "yes" ? "upcoming_describe" : "reading_complete",
    },
    {
      id: "upcoming_describe",
      type: "input_text",
      text: "Tell me what's coming. I want to factor it into today's session.",
      placeholder: "e.g. Job interview on Friday, phone call with a client...",
      soulKey: "upcomingEvent",
      _setter: (r) => ({ ...r, socialPressure: true }),
      next: "reading_complete",
    },
    {
      id: "reading_complete",
      type: "complete",
      text: null,
    },
  ];
}

// ─── STATE VISUALISER ─────────────────────────────────────────────────────────
const STATE_VISUALS = {
  crisis:    { color: "#818cf8", bg: "rgba(129,140,248,0.08)", label: "In Crisis",   emoji: "🌊" },
  low:       { color: "#60a5fa", bg: "rgba(96,165,250,0.08)",  label: "Low",         emoji: "🌧️" },
  fragile:   { color: "#fbbf24", bg: "rgba(251,191,36,0.08)",  label: "Fragile",     emoji: "🌤️" },
  steady:    { color: "#34d399", bg: "rgba(52,211,153,0.08)",  label: "Steady",      emoji: "⚖️" },
  open:      { color: "#a78bfa", bg: "rgba(167,139,250,0.08)", label: "Open",        emoji: "🌟" },
  energised: { color: "#f472b6", bg: "rgba(244,114,182,0.08)", label: "Energised",   emoji: "⚡" },
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function EmotionalEngine({ soul = {}, onReadingComplete }) {
  const [reading, setReading] = useState({ ...EMPTY_EMOTIONAL_READING });
  const [flow] = useState(() => buildCheckInFlow(soul));
  const [currentId, setCurrentId] = useState("greeting");
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState("");
  const [scaleVal, setScaleVal] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [phase, setPhase] = useState("flowing");
  const [finalReading, setFinalReading] = useState(null);
  const [sessionCard, setSessionCard] = useState(null);
  const [openingMsg, setOpeningMsg] = useState("");
  const [showSession, setShowSession] = useState(false);
  const bottomRef = useRef(null);

  const currentStep = flow.find(s => s.id === currentId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, showSession]);

  useEffect(() => {
    if (!currentStep) return;
    if (currentStep.type === "message") {
      processMessage(currentStep);
    } else if (currentStep.type === "complete") {
      finaliseReading();
    } else {
      showPrompt(currentStep);
    }
  }, [currentId]);

  function processMessage(step) {
    setIsTyping(true);
    if (step._setter) {
      setReading(prev => step._setter(prev));
    }
    setTimeout(() => {
      setIsTyping(false);
      if (step.text) {
        setMessages(prev => [...prev, { from: "therapist", text: step.text, id: Date.now() }]);
      }
      if (step.next) {
        const nextId = typeof step.next === "function" ? step.next(null) : step.next;
        setTimeout(() => setCurrentId(nextId), 400);
      }
    }, step.delay || 800);
  }

  function showPrompt(step) {
    if (step.text) {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, { from: "therapist", text: step.text, id: Date.now() }]);
        setPhase("waiting");
      }, 800);
    } else {
      setPhase("waiting");
    }
  }

  function advance(stepId, value) {
    const step = flow.find(s => s.id === stepId);
    if (!step) return;
    if (step._setter) setReading(prev => step._setter(prev));
    const nextId = typeof step.next === "function" ? step.next(value) : step.next;
    setPhase("flowing");
    setTimeout(() => setCurrentId(nextId), 300);
  }

  function handleScale() {
    if (scaleVal === null) return;
    const step = currentStep;
    const label = step.labels[scaleVal - 1];
    setReading(prev => ({ ...prev, [step.soulKey]: scaleVal }));
    setMessages(prev => [...prev, { from: "user", text: label, id: Date.now() }]);
    setScaleVal(null);
    advance(currentId, scaleVal);
  }

  function handleChoice(value, label) {
    setReading(prev => ({ ...prev, [currentStep.soulKey]: value }));
    setMessages(prev => [...prev, { from: "user", text: label, id: Date.now() }]);
    advance(currentId, value);
  }

  function handleText() {
    if (!inputVal.trim()) return;
    const val = inputVal.trim();
    setReading(prev => ({ ...prev, [currentStep.soulKey]: val }));
    setMessages(prev => [...prev, { from: "user", text: val, id: Date.now() }]);
    setInputVal("");
    advance(currentId, val);
  }

  function finaliseReading() {
    const now = new Date();
    const hour = now.getHours();
    const timeOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : hour < 21 ? "evening" : "night";
    const dayOfWeek = now.toLocaleDateString("en", { weekday: "long" });

    const finalR = {
      ...reading,
      timestamp: now.toISOString(),
      timeOfDay,
      dayOfWeek,
    };

    const derivedState = deriveEmotionalState(finalR, soul);
    finalR.derivedState = derivedState;

    const sessionRec = recommendSession(derivedState, soul);
    finalR.sessionRecommendation = sessionRec.type;

    const toneProfile = generateToneProfile(derivedState, soul);
    finalR.toneProfile = toneProfile;

    const opening = generateOpeningMessage(finalR, soul, sessionRec, toneProfile);
    finalR.openingMessage = opening;

    setFinalReading(finalR);
    setSessionCard(sessionRec);
    setOpeningMsg(opening);

    // Show therapist opening message
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { from: "therapist", text: opening, id: Date.now() }]);
      setTimeout(() => setShowSession(true), 800);
    }, 1200);
  }

  const visual = finalReading ? STATE_VISUALS[finalReading.derivedState] : null;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #07080f 0%, #0d1117 50%, #080f0d 100%)",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "0 0 140px 0",
      position: "relative", overflow: "hidden",
    }}>

      {/* Ambient glow that shifts with emotional state */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: visual
          ? `radial-gradient(ellipse 50% 40% at 30% 20%, ${visual.color}08 0%, transparent 70%)`
          : "radial-gradient(ellipse 50% 40% at 30% 20%, rgba(99,102,241,0.05) 0%, transparent 70%)",
        pointerEvents: "none",
        transition: "background 2s ease",
      }} />

      {/* Header */}
      <div style={{
        width: "100%", maxWidth: 640,
        padding: "28px 24px 0",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{
          width: 42, height: 42, borderRadius: "50%",
          background: "linear-gradient(135deg, #6366f1, #10b981)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, boxShadow: "0 0 16px rgba(99,102,241,0.25)",
        }}>🎙️</div>
        <div>
          <div style={{ color: "#e2e8f0", fontSize: 15, fontWeight: 600 }}>YoSpeech</div>
          <div style={{ color: "#475569", fontSize: 11, fontStyle: "italic" }}>Daily check-in</div>
        </div>
        {visual && (
          <div style={{
            marginLeft: "auto",
            padding: "6px 14px",
            background: visual.bg,
            border: `1px solid ${visual.color}30`,
            borderRadius: 20,
            display: "flex", alignItems: "center", gap: 6,
            animation: "fadeIn 0.5s ease",
          }}>
            <span style={{ fontSize: 14 }}>{visual.emoji}</span>
            <span style={{ color: visual.color, fontSize: 12, letterSpacing: "0.04em" }}>{visual.label}</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div style={{
        width: "100%", maxWidth: 640,
        padding: "28px 24px 0",
        display: "flex", flexDirection: "column", gap: 18,
      }}>
        {messages.map(msg => (
          <div key={msg.id} style={{
            display: "flex",
            justifyContent: msg.from === "user" ? "flex-end" : "flex-start",
            animation: "fadeSlideIn 0.4s ease forwards",
          }}>
            {msg.from === "therapist" && (
              <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: "linear-gradient(135deg, #6366f1, #10b981)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, marginRight: 10, flexShrink: 0, marginTop: 4,
              }}>🎙️</div>
            )}
            <div style={{
              maxWidth: "78%",
              padding: "13px 17px",
              borderRadius: msg.from === "user" ? "18px 18px 4px 18px" : "4px 18px 18px 18px",
              background: msg.from === "user"
                ? "linear-gradient(135deg, #6366f1, #4f46e5)"
                : "rgba(255,255,255,0.04)",
              border: msg.from === "user" ? "none" : "1px solid rgba(255,255,255,0.07)",
              color: msg.from === "user" ? "#fff" : "#cbd5e1",
              fontSize: 14, lineHeight: 1.7,
              backdropFilter: "blur(8px)",
              boxShadow: msg.from === "user"
                ? "0 4px 16px rgba(99,102,241,0.25)"
                : "0 2px 10px rgba(0,0,0,0.25)",
            }}>
              {msg.text}
            </div>
          </div>
        ))}

        {/* Typing */}
        {isTyping && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, animation: "fadeSlideIn 0.3s ease" }}>
            <div style={{
              width: 30, height: 30, borderRadius: "50%",
              background: "linear-gradient(135deg, #6366f1, #10b981)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
            }}>🎙️</div>
            <div style={{
              padding: "13px 18px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "4px 18px 18px 18px",
              display: "flex", gap: 5, alignItems: "center",
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: "50%", background: "#6366f1",
                  animation: `typingDot 1.2s ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}

        {/* Session Card */}
        {showSession && sessionCard && finalReading && (
          <div style={{ animation: "fadeSlideIn 0.6s ease forwards" }}>

            {/* Emotional state card */}
            <div style={{
              padding: "20px 24px",
              background: visual?.bg,
              border: `1px solid ${visual?.color}25`,
              borderRadius: 16,
              marginBottom: 12,
            }}>
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                marginBottom: 14,
              }}>
                <div>
                  <div style={{ color: "#64748b", fontSize: 11, letterSpacing: "0.07em", marginBottom: 4 }}>
                    TODAY'S EMOTIONAL STATE
                  </div>
                  <div style={{ color: visual?.color, fontSize: 22, fontWeight: 600 }}>
                    {visual?.emoji} {visual?.label}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "#64748b", fontSize: 11, letterSpacing: "0.05em", marginBottom: 4 }}>
                    {finalReading.dayOfWeek.toUpperCase()} · {finalReading.timeOfDay.toUpperCase()}
                  </div>
                  <div style={{ color: "#475569", fontSize: 12 }}>
                    Mood {finalReading.selfReported}/5 · Energy {finalReading.energyLevel}/5
                  </div>
                </div>
              </div>

              {/* Tone bars */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "Warmth", value: finalReading.toneProfile?.warmth },
                  { label: "Challenge", value: finalReading.toneProfile?.challenge },
                  { label: "Directness", value: finalReading.toneProfile?.directness },
                ].map(bar => (
                  <div key={bar.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ color: "#475569", fontSize: 11, width: 70 }}>{bar.label}</span>
                    <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                      <div style={{
                        height: "100%", width: `${(bar.value / 10) * 100}%`,
                        background: `linear-gradient(90deg, ${visual?.color}60, ${visual?.color})`,
                        borderRadius: 2,
                        transition: "width 1s ease",
                      }} />
                    </div>
                    <span style={{ color: "#475569", fontSize: 11, width: 20 }}>{bar.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Session recommendation */}
            <div style={{
              padding: "20px 24px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16,
              marginBottom: 16,
            }}>
              <div style={{ color: "#64748b", fontSize: 11, letterSpacing: "0.07em", marginBottom: 12 }}>
                RECOMMENDED SESSION
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: `${sessionCard.color}15`,
                  border: `1px solid ${sessionCard.color}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, flexShrink: 0,
                }}>{sessionCard.icon}</div>
                <div>
                  <div style={{ color: "#e2e8f0", fontSize: 16, marginBottom: 4 }}>
                    {sessionCard.label}
                  </div>
                  <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.5, marginBottom: 8 }}>
                    {sessionCard.description}
                  </div>
                  <div style={{
                    display: "inline-block",
                    padding: "3px 10px",
                    background: `${sessionCard.color}15`,
                    borderRadius: 10,
                    color: sessionCard.color,
                    fontSize: 11,
                    letterSpacing: "0.04em",
                  }}>{sessionCard.duration}</div>
                </div>
              </div>
            </div>

            {/* Therapist approach note */}
            <div style={{
              padding: "14px 18px",
              background: "rgba(99,102,241,0.06)",
              border: "1px solid rgba(99,102,241,0.15)",
              borderRadius: 12,
              marginBottom: 20,
              display: "flex", gap: 10, alignItems: "flex-start",
            }}>
              <span style={{ fontSize: 16, marginTop: 2 }}>🧠</span>
              <div>
                <div style={{ color: "#818cf8", fontSize: 11, letterSpacing: "0.06em", marginBottom: 4 }}>
                  MY APPROACH TODAY
                </div>
                <div style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.55, fontStyle: "italic" }}>
                  "{finalReading.toneProfile?.approach}"
                </div>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={() => onReadingComplete && onReadingComplete(finalReading)}
              style={{
                width: "100%",
                padding: "17px",
                background: `linear-gradient(135deg, ${sessionCard.color}, ${sessionCard.color}cc)`,
                border: "none", borderRadius: 14,
                color: "#fff", fontSize: 15,
                fontFamily: "'Georgia', serif",
                cursor: "pointer",
                letterSpacing: "0.03em",
                boxShadow: `0 8px 24px ${sessionCard.color}35`,
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={e => { e.target.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.target.style.transform = "translateY(0)"; }}
            >
              Begin {sessionCard.label} →
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Fixed input area */}
      {phase === "waiting" && currentStep && !showSession && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          padding: "20px 24px 32px",
          background: "linear-gradient(to top, #07080f 70%, transparent)",
          display: "flex", justifyContent: "center",
        }}>
          <div style={{ width: "100%", maxWidth: 640 }}>

            {currentStep.type === "scale" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => setScaleVal(n)} style={{
                      flex: 1, padding: "15px 0",
                      background: scaleVal === n ? "linear-gradient(135deg, #6366f1, #4f46e5)" : "rgba(255,255,255,0.04)",
                      border: scaleVal === n ? "1px solid rgba(99,102,241,0.5)" : "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12, color: scaleVal === n ? "#fff" : "#64748b",
                      fontSize: 17, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                    }}>{n}</button>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#334155", fontSize: 11 }}>{currentStep.labels?.[0]}</span>
                  <span style={{ color: "#334155", fontSize: 11 }}>{currentStep.labels?.[4]}</span>
                </div>
                {scaleVal && (
                  <div style={{ textAlign: "center", color: "#818cf8", fontSize: 12, fontStyle: "italic" }}>
                    "{currentStep.labels?.[scaleVal - 1]}"
                  </div>
                )}
                <button onClick={handleScale} disabled={scaleVal === null} style={{
                  padding: "14px",
                  background: scaleVal !== null ? "linear-gradient(135deg, #6366f1, #4f46e5)" : "rgba(255,255,255,0.05)",
                  border: "none", borderRadius: 12,
                  color: scaleVal !== null ? "#fff" : "#334155",
                  fontSize: 14, fontFamily: "'Georgia', serif",
                  cursor: scaleVal !== null ? "pointer" : "default", transition: "all 0.2s",
                }}>
                  {scaleVal ? "Continue →" : "Select a number"}
                </button>
              </div>
            )}

            {currentStep.type === "choice" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {currentStep.options.map(opt => (
                  <button key={opt.value} onClick={() => handleChoice(opt.value, opt.label)} style={{
                    padding: "13px 18px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.09)",
                    borderRadius: 13, color: "#94a3b8", fontSize: 14,
                    fontFamily: "'Georgia', serif",
                    cursor: "pointer", textAlign: "left",
                    display: "flex", alignItems: "center", gap: 12,
                    transition: "all 0.2s",
                  }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = "rgba(99,102,241,0.12)";
                      e.currentTarget.style.borderColor = "rgba(99,102,241,0.35)";
                      e.currentTarget.style.color = "#e2e8f0";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)";
                      e.currentTarget.style.color = "#94a3b8";
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{opt.icon}</span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            )}

            {currentStep.type === "input_text" && (
              <div style={{ display: "flex", gap: 10 }}>
                <input
                  autoFocus
                  value={inputVal}
                  onChange={e => setInputVal(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleText()}
                  placeholder={currentStep.placeholder || "Type here..."}
                  style={{
                    flex: 1, padding: "15px 18px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 13, color: "#e2e8f0", fontSize: 14,
                    fontFamily: "'Georgia', serif", outline: "none",
                    backdropFilter: "blur(8px)",
                  }}
                />
                <button onClick={handleText} style={{
                  padding: "15px 22px",
                  background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                  border: "none", borderRadius: 13,
                  color: "#fff", fontSize: 17, cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
                }}>→</button>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes typingDot {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-4px); }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder { color: #1e293b; }
      `}</style>
    </div>
  );
}
