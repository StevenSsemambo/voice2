import { useState, useEffect, useRef } from "react";
import { db } from '../utils/db'

// ─── SOUL MODEL SCHEMA ───────────────────────────────────────────────────────
const INITIAL_SOUL = {
  // Identity
  name: "",
  age: null,
  occupation: "",

  // Communication Profile
  primaryChallenge: null,       // "stutter" | "anxiety" | "general"
  stutterType: [],              // ["repetitions","prolongations","blocks"]
  anxietyTriggers: [],          // ["phones","authority","groups","strangers","presentations"]
  avoidanceBehaviours: [],      // ["word substitution","situation avoidance","silence"]

  // Psychological Signature
  communicationPersonality: null, // "perfectionist"|"avoider"|"rusher"|"freezer"|"overthinker"
  selfPerception: null,           // "very negative"|"negative"|"neutral"|"hopeful"|"positive"
  motivationCore: null,           // "career"|"relationships"|"confidence"|"specific_event"
  specificGoal: "",

  // Emotional Baseline
  currentEmotionalState: null,  // 1-5
  shameLevel: null,             // 1-5 (stutter users)
  hopeLevel: null,              // 1-5

  // Context
  previousTherapy: false,
  previousTherapyOutcome: null, // "helped"|"didn't help"|"partial"
  urgency: null,                // "immediate"|"weeks"|"months"|"no rush"

  // Meta
  createdAt: null,
  onboardingComplete: false,
};

// ─── CONVERSATION FLOW ────────────────────────────────────────────────────────
const buildFlow = () => [
  {
    id: "welcome",
    type: "message",
    text: "Hello. I'm really glad you're here.",
    delay: 600,
    next: "welcome2",
  },
  {
    id: "welcome2",
    type: "message",
    text: "Before we begin working together, I want to understand you — not just your speech, but who you are and what you're carrying.",
    delay: 1200,
    next: "ask_name",
  },
  {
    id: "ask_name",
    type: "input_text",
    text: "Let's start simply. What's your name?",
    placeholder: "Your first name...",
    soulKey: "name",
    next: (val) => "greet_name",
  },
  {
    id: "greet_name",
    type: "message",
    text: (soul) => `${soul.name}. That's a name I'll remember well.`,
    delay: 800,
    next: "ask_challenge",
  },
  {
    id: "ask_challenge",
    type: "message",
    text: "Tell me — what brings you here? What is the one thing about communication that weighs on you most?",
    delay: 600,
    next: "challenge_choice",
  },
  {
    id: "challenge_choice",
    type: "choice",
    options: [
      { label: "I stutter, and it controls my life", value: "stutter", icon: "🌊" },
      { label: "I freeze with anxiety when speaking", value: "anxiety", icon: "🌪️" },
      { label: "I want to communicate better overall", value: "general", icon: "🌱" },
    ],
    soulKey: "primaryChallenge",
    next: (val) => val === "stutter" ? "stutter_path_1" : val === "anxiety" ? "anxiety_path_1" : "general_path_1",
  },

  // ── STUTTER PATH ──
  {
    id: "stutter_path_1",
    type: "message",
    text: (soul) => `Thank you for telling me that, ${soul.name}. Stuttering is one of the most misunderstood experiences a person can carry. Most people only see the surface — they have no idea what it actually feels like inside.`,
    delay: 1400,
    next: "stutter_path_2",
  },
  {
    id: "stutter_path_2",
    type: "message",
    text: "I want to understand your stutter specifically. Which of these feels most familiar to you?",
    delay: 600,
    next: "stutter_type",
  },
  {
    id: "stutter_type",
    type: "multi_choice",
    options: [
      { label: "Repeating sounds or words  (li-li-like this)", value: "repetitions", icon: "🔁" },
      { label: "Stretching sounds out (liiiiike this)", value: "prolongations", icon: "〰️" },
      { label: "Getting completely stuck, nothing comes out", value: "blocks", icon: "🧱" },
    ],
    soulKey: "stutterType",
    next: "stutter_shame",
  },
  {
    id: "stutter_shame",
    type: "scale",
    text: "Be honest with me — how much shame do you carry about your stutter? There's no wrong answer here.",
    soulKey: "shameLevel",
    labels: ["None at all", "A little", "Sometimes", "A lot", "It defines me"],
    next: "stutter_triggers",
  },
  {
    id: "stutter_triggers",
    type: "multi_choice",
    text: "Which situations make it significantly worse?",
    options: [
      { label: "Phone calls", value: "phones", icon: "📞" },
      { label: "Authority figures (boss, teacher)", value: "authority", icon: "👔" },
      { label: "Groups of people", value: "groups", icon: "👥" },
      { label: "Strangers", value: "strangers", icon: "🚶" },
      { label: "Presentations & public speaking", value: "presentations", icon: "🎤" },
    ],
    soulKey: "anxietyTriggers",
    next: "avoidance",
  },
  {
    id: "avoidance",
    type: "multi_choice",
    text: "Do you do any of these to hide or avoid stuttering?",
    options: [
      { label: "Swap words you fear for easier ones", value: "word substitution", icon: "🔄" },
      { label: "Avoid situations entirely", value: "situation avoidance", icon: "🚪" },
      { label: "Go quiet and let others speak", value: "silence", icon: "🤐" },
    ],
    soulKey: "avoidanceBehaviours",
    next: "personality",
  },

  // ── ANXIETY PATH ──
  {
    id: "anxiety_path_1",
    type: "message",
    text: (soul) => `${soul.name}, speaking anxiety is more common than most people admit — and far more painful than they realise. The fear before speaking can be worse than the speaking itself.`,
    delay: 1400,
    next: "anxiety_path_2",
  },
  {
    id: "anxiety_path_2",
    type: "multi_choice",
    text: "Where does this anxiety hit you hardest?",
    options: [
      { label: "Phone calls", value: "phones", icon: "📞" },
      { label: "Authority figures", value: "authority", icon: "👔" },
      { label: "Groups of people", value: "groups", icon: "👥" },
      { label: "Strangers", value: "strangers", icon: "🚶" },
      { label: "Presentations", value: "presentations", icon: "🎤" },
    ],
    soulKey: "anxietyTriggers",
    next: "personality",
  },

  // ── GENERAL PATH ──
  {
    id: "general_path_1",
    type: "message",
    text: (soul) => `${soul.name}, wanting to communicate better is one of the most powerful decisions a person can make. It touches everything — career, relationships, how people perceive you, how you perceive yourself.`,
    delay: 1400,
    next: "general_path_2",
  },
  {
    id: "general_path_2",
    type: "multi_choice",
    text: "What area matters most to you right now?",
    options: [
      { label: "Speaking with more confidence", value: "confidence", icon: "💪" },
      { label: "Being clearer and more articulate", value: "clarity", icon: "✨" },
      { label: "Public speaking & presentations", value: "presentations", icon: "🎤" },
      { label: "Professional communication", value: "professional", icon: "💼" },
    ],
    soulKey: "anxietyTriggers",
    next: "personality",
  },

  // ── SHARED PATH ──
  {
    id: "personality",
    type: "choice",
    text: "When communication goes wrong, what do you do inside your head?",
    options: [
      { label: "I replay it and criticise myself harshly", value: "perfectionist", icon: "🔍" },
      { label: "I avoid the next situation to stay safe", value: "avoider", icon: "🛡️" },
      { label: "I rush through to get it over with", value: "rusher", icon: "💨" },
      { label: "I freeze and go completely blank", value: "freezer", icon: "❄️" },
      { label: "I overthink every word before speaking", value: "overthinker", icon: "🌀" },
    ],
    soulKey: "communicationPersonality",
    next: "self_perception",
  },
  {
    id: "self_perception",
    type: "scale",
    text: "Right now, how do you feel about yourself as a communicator?",
    soulKey: "selfPerception",
    labels: ["Hopeless", "Struggling", "Uncertain", "Hopeful", "Capable"],
    next: "motivation",
  },
  {
    id: "motivation",
    type: "choice",
    text: "What is driving you to work on this now?",
    options: [
      { label: "My career depends on it", value: "career", icon: "🚀" },
      { label: "My relationships are suffering", value: "relationships", icon: "❤️" },
      { label: "I just want to feel confident", value: "confidence", icon: "🌟" },
      { label: "There's a specific event coming up", value: "specific_event", icon: "📅" },
    ],
    soulKey: "motivationCore",
    next: (val) => val === "specific_event" ? "specific_goal" : "previous_therapy",
  },
  {
    id: "specific_goal",
    type: "input_text",
    text: "Tell me about it. What's the event, and when is it?",
    placeholder: "e.g. Job interview next month, wedding speech in 3 weeks...",
    soulKey: "specificGoal",
    next: "previous_therapy",
  },
  {
    id: "previous_therapy",
    type: "choice",
    text: "Have you worked with a speech therapist or coach before?",
    options: [
      { label: "Yes — and it helped", value: "helped", icon: "✅" },
      { label: "Yes — but it didn't really help", value: "didn't help", icon: "😔" },
      { label: "Yes — it partially helped", value: "partial", icon: "🔶" },
      { label: "No, this is my first time", value: "none", icon: "🌱" },
    ],
    soulKey: "previousTherapyOutcome",
    next: "emotional_state",
  },
  {
    id: "emotional_state",
    type: "scale",
    text: "One last thing — how are you feeling right now, in this moment?",
    soulKey: "currentEmotionalState",
    labels: ["Very heavy", "Low", "Okay", "Good", "Ready"],
    next: "hope_level",
  },
  {
    id: "hope_level",
    type: "scale",
    text: "And how much hope do you have that things can genuinely change for you?",
    soulKey: "hopeLevel",
    labels: ["None", "A little", "Some", "Quite a bit", "A lot"],
    next: "closing",
  },
  {
    id: "closing",
    type: "closing",
    text: null,
  },
];

// ─── SOUL INTERPRETER ─────────────────────────────────────────────────────────
function interpretSoul(soul) {
  const lines = [];

  if (soul.primaryChallenge === "stutter") {
    if (soul.shameLevel >= 4) lines.push("carries deep shame around stuttering");
    if (soul.avoidanceBehaviours.includes("situation avoidance")) lines.push("actively avoids triggering situations");
    if (soul.stutterType.includes("blocks")) lines.push("experiences blocking — the most isolating stutter type");
  }

  if (soul.communicationPersonality === "perfectionist") lines.push("holds themselves to an impossibly high standard");
  if (soul.communicationPersonality === "avoider") lines.push("has built a life around avoiding difficult moments");
  if (soul.hopeLevel <= 2) lines.push("needs hope rebuilt before skills can be trained");
  if (soul.motivationCore === "specific_event") lines.push(`working toward a real deadline: ${soul.specificGoal}`);
  if (soul.previousTherapyOutcome === "didn't help") lines.push("has been let down by therapy before — trust must be earned");

  return lines;
}

function generateClosingMessage(soul) {
  const insights = interpretSoul(soul);
  const challenge = soul.primaryChallenge;
  const personality = soul.communicationPersonality;

  let opening = "";
  if (soul.hopeLevel <= 2) {
    opening = `${soul.name}, I hear you. And I want you to know — the fact that you're here, doing this, matters more than you realise.`;
  } else if (soul.hopeLevel >= 4) {
    opening = `${soul.name}, that hope you're carrying? Hold onto it. It's going to be the fuel for everything we do together.`;
  } else {
    opening = `${soul.name}, thank you for being so open with me. That kind of honesty is exactly what makes real progress possible.`;
  }

  let middle = "";
  if (challenge === "stutter" && soul.shameLevel >= 4) {
    middle = "I want you to know something important: your stutter is not the problem. The shame around it is. And shame, unlike stuttering, can be completely dismantled.";
  } else if (challenge === "anxiety") {
    middle = "Speaking anxiety lives in the gap between who you think you should be and who you believe you are. We're going to close that gap — carefully, at your pace.";
  } else {
    middle = "Communication is a skill — not a talent. Every person you admire who speaks well worked for it. And now it's your turn.";
  }

  let personalityNote = "";
  if (personality === "perfectionist") personalityNote = "I also notice you're someone who holds themselves to a very high standard. We'll work with that — not against it.";
  else if (personality === "avoider") personalityNote = "I also see that you've been protecting yourself by avoiding. That's made sense until now. Slowly, we'll make the world feel safer.";
  else if (personality === "freezer") personalityNote = "That freezing you experience? It's your nervous system being over-protective. We'll teach it that speaking is safe.";

  return `${opening}\n\n${middle}\n\n${personalityNote}\n\nI've built your profile. Your journey starts now.`;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function YoSpeechOnboarding({ onComplete }) {
  const [soul, setSoul] = useState({ ...INITIAL_SOUL });
  const [flow] = useState(buildFlow());
  const [currentId, setCurrentId] = useState("welcome");
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState("");
  const [multiSelected, setMultiSelected] = useState([]);
  const [scaleVal, setScaleVal] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [phase, setPhase] = useState("flowing"); // "flowing"|"waiting"|"done"
  const [closingMessage, setClosingMessage] = useState("");
  const [closingVisible, setClosingVisible] = useState(false);
  const bottomRef = useRef(null);

  const currentStep = flow.find(s => s.id === currentId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (!currentStep) return;
    if (currentStep.type === "message" || currentStep.type === "closing") {
      processMessageStep(currentStep);
    } else {
      // Show therapist prompt then wait for input
      const promptText = typeof currentStep.text === "function"
        ? currentStep.text(soul)
        : currentStep.text;
      if (promptText) {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          setMessages(prev => [...prev, { from: "therapist", text: promptText, id: Date.now() }]);
          setPhase("waiting");
        }, 900);
      } else {
        setPhase("waiting");
      }
    }
  }, [currentId]);

  function processMessageStep(step) {
    setIsTyping(true);
    const delay = step.delay || 800;
    setTimeout(() => {
      setIsTyping(false);
      const text = typeof step.text === "function" ? step.text(soul) : step.text;
      if (text) setMessages(prev => [...prev, { from: "therapist", text, id: Date.now() }]);

      if (step.type === "closing") {
        const msg = generateClosingMessage(soul);
        setClosingMessage(msg);
        setTimeout(() => setClosingVisible(true), 400);
        setPhase("done");
        return;
      }

      if (step.next) {
        const nextId = typeof step.next === "function" ? step.next(null) : step.next;
        setTimeout(() => setCurrentId(nextId), 400);
      }
    }, delay);
  }

  function advanceFrom(stepId, value) {
    const step = flow.find(s => s.id === stepId);
    if (!step) return;
    const nextId = typeof step.next === "function" ? step.next(value) : step.next;
    setPhase("flowing");
    setTimeout(() => setCurrentId(nextId), 300);
  }

  function handleTextSubmit() {
    if (!inputVal.trim()) return;
    const val = inputVal.trim();
    setSoul(prev => ({ ...prev, [currentStep.soulKey]: val }));
    setMessages(prev => [...prev, { from: "user", text: val, id: Date.now() }]);
    setInputVal("");
    advanceFrom(currentId, val);
  }

  function handleChoice(value, label) {
    setSoul(prev => ({ ...prev, [currentStep.soulKey]: value }));
    setMessages(prev => [...prev, { from: "user", text: label, id: Date.now() }]);
    advanceFrom(currentId, value);
  }

  function handleMultiSubmit() {
    if (multiSelected.length === 0) return;
    const labels = currentStep.options
      .filter(o => multiSelected.includes(o.value))
      .map(o => o.label).join(", ");
    setSoul(prev => ({ ...prev, [currentStep.soulKey]: multiSelected }));
    setMessages(prev => [...prev, { from: "user", text: labels, id: Date.now() }]);
    setMultiSelected([]);
    advanceFrom(currentId, multiSelected);
  }

  function handleScaleSubmit() {
    if (scaleVal === null) return;
    const label = currentStep.labels[scaleVal - 1];
    setSoul(prev => ({ ...prev, [currentStep.soulKey]: scaleVal }));
    setMessages(prev => [...prev, { from: "user", text: label, id: Date.now() }]);
    setScaleVal(null);
    advanceFrom(currentId, scaleVal);
  }

  function toggleMulti(value) {
    setMultiSelected(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  }

  const finalSoul = { ...soul, createdAt: new Date().toISOString(), onboardingComplete: true };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a0a0f 0%, #0d1117 40%, #0a0f1a 100%)",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "0 0 120px 0",
      position: "relative",
      overflow: "hidden",
    }}>

      {/* Ambient background */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "radial-gradient(ellipse 60% 40% at 20% 20%, rgba(99,102,241,0.06) 0%, transparent 70%), radial-gradient(ellipse 50% 60% at 80% 80%, rgba(16,185,129,0.04) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Header */}
      <div style={{
        width: "100%", maxWidth: 640,
        padding: "32px 24px 0",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: "50%",
          background: "linear-gradient(135deg, #6366f1, #10b981)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, flexShrink: 0,
          boxShadow: "0 0 20px rgba(99,102,241,0.3)",
        }}>🎙️</div>
        <div>
          <div style={{ color: "#e2e8f0", fontSize: 16, fontWeight: 600, letterSpacing: "0.02em" }}>YoSpeech</div>
          <div style={{ color: "#64748b", fontSize: 12, fontStyle: "italic" }}>Your personal speech therapist</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", animation: "pulse 2s infinite" }} />
          <span style={{ color: "#10b981", fontSize: 11, letterSpacing: "0.05em" }}>SESSION ACTIVE</span>
        </div>
      </div>

      {/* Chat area */}
      <div style={{
        width: "100%", maxWidth: 640,
        padding: "32px 24px 0",
        display: "flex", flexDirection: "column", gap: 20,
      }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{
            display: "flex",
            justifyContent: msg.from === "user" ? "flex-end" : "flex-start",
            animation: "fadeSlideIn 0.4s ease forwards",
          }}>
            {msg.from === "therapist" && (
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "linear-gradient(135deg, #6366f1, #10b981)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, marginRight: 10, flexShrink: 0, marginTop: 4,
              }}>🎙️</div>
            )}
            <div style={{
              maxWidth: "78%",
              padding: "14px 18px",
              borderRadius: msg.from === "user" ? "20px 20px 4px 20px" : "4px 20px 20px 20px",
              background: msg.from === "user"
                ? "linear-gradient(135deg, #6366f1, #4f46e5)"
                : "rgba(255,255,255,0.04)",
              border: msg.from === "user" ? "none" : "1px solid rgba(255,255,255,0.07)",
              color: msg.from === "user" ? "#fff" : "#cbd5e1",
              fontSize: 15,
              lineHeight: 1.65,
              letterSpacing: "0.01em",
              backdropFilter: "blur(10px)",
              boxShadow: msg.from === "user"
                ? "0 4px 20px rgba(99,102,241,0.3)"
                : "0 2px 12px rgba(0,0,0,0.3)",
            }}>
              {msg.text}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, animation: "fadeSlideIn 0.3s ease" }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "linear-gradient(135deg, #6366f1, #10b981)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
            }}>🎙️</div>
            <div style={{
              padding: "14px 20px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "4px 20px 20px 20px",
              display: "flex", gap: 5, alignItems: "center",
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: "#6366f1",
                  animation: `typingDot 1.2s ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}

        {/* Closing message */}
        {closingVisible && (
          <div style={{
            margin: "16px 0",
            padding: "28px",
            background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(16,185,129,0.08))",
            border: "1px solid rgba(99,102,241,0.25)",
            borderRadius: 20,
            animation: "fadeSlideIn 0.6s ease forwards",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "linear-gradient(135deg, #6366f1, #10b981)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
              }}>🎙️</div>
              <span style={{ color: "#a5b4fc", fontSize: 13, letterSpacing: "0.05em", fontStyle: "italic" }}>Your therapist</span>
            </div>
            {closingMessage.split("\n\n").map((para, i) => (
              <p key={i} style={{
                color: "#e2e8f0", fontSize: 15, lineHeight: 1.75,
                marginBottom: i < closingMessage.split("\n\n").length - 1 ? 16 : 0,
                letterSpacing: "0.01em",
              }}>{para}</p>
            ))}
          </div>
        )}

        {/* Soul profile summary */}
        {phase === "done" && closingVisible && (
          <div style={{
            padding: "24px",
            background: "rgba(16,185,129,0.06)",
            border: "1px solid rgba(16,185,129,0.2)",
            borderRadius: 16,
            animation: "fadeSlideIn 0.8s 0.4s ease both",
          }}>
            <div style={{ color: "#10b981", fontSize: 12, letterSpacing: "0.08em", marginBottom: 14, fontFamily: "monospace" }}>
              ◆ SOUL MODEL BUILT
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {interpretSoul(soul).map((insight, i) => (
                <span key={i} style={{
                  padding: "6px 12px",
                  background: "rgba(16,185,129,0.1)",
                  border: "1px solid rgba(16,185,129,0.2)",
                  borderRadius: 20,
                  color: "#6ee7b7",
                  fontSize: 12,
                  lineHeight: 1.4,
                }}>{insight}</span>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        {phase === "done" && closingVisible && (
          <button
            onClick={() => onComplete && onComplete(finalSoul)}
            style={{
              padding: "18px 40px",
              background: "linear-gradient(135deg, #6366f1, #10b981)",
              border: "none",
              borderRadius: 14,
              color: "#fff",
              fontSize: 16,
              fontFamily: "'Georgia', serif",
              cursor: "pointer",
              letterSpacing: "0.03em",
              boxShadow: "0 8px 30px rgba(99,102,241,0.4)",
              animation: "fadeSlideIn 1s 0.8s ease both",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={e => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 12px 40px rgba(99,102,241,0.5)"; }}
            onMouseLeave={e => { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "0 8px 30px rgba(99,102,241,0.4)"; }}
          >
            Begin my journey →
          </button>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      {phase === "waiting" && currentStep && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          padding: "20px 24px 32px",
          background: "linear-gradient(to top, #0a0a0f 70%, transparent)",
          display: "flex", justifyContent: "center",
        }}>
          <div style={{ width: "100%", maxWidth: 640 }}>

            {/* Text input */}
            {currentStep.type === "input_text" && (
              <div style={{ display: "flex", gap: 10 }}>
                <input
                  autoFocus
                  value={inputVal}
                  onChange={e => setInputVal(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleTextSubmit()}
                  placeholder={currentStep.placeholder || "Type here..."}
                  style={{
                    flex: 1, padding: "16px 20px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 14,
                    color: "#e2e8f0", fontSize: 15,
                    fontFamily: "'Georgia', serif",
                    outline: "none",
                    backdropFilter: "blur(10px)",
                  }}
                />
                <button
                  onClick={handleTextSubmit}
                  style={{
                    padding: "16px 24px",
                    background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                    border: "none", borderRadius: 14,
                    color: "#fff", fontSize: 18, cursor: "pointer",
                    boxShadow: "0 4px 15px rgba(99,102,241,0.4)",
                  }}
                >→</button>
              </div>
            )}

            {/* Single choice */}
            {currentStep.type === "choice" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {currentStep.options.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => handleChoice(opt.value, opt.label)}
                    style={{
                      padding: "14px 20px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 14,
                      color: "#cbd5e1", fontSize: 14,
                      fontFamily: "'Georgia', serif",
                      cursor: "pointer", textAlign: "left",
                      display: "flex", alignItems: "center", gap: 12,
                      transition: "all 0.2s",
                      backdropFilter: "blur(10px)",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = "rgba(99,102,241,0.15)";
                      e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)";
                      e.currentTarget.style.color = "#e2e8f0";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                      e.currentTarget.style.color = "#cbd5e1";
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{opt.icon}</span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Multi choice */}
            {currentStep.type === "multi_choice" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {currentStep.options.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => toggleMulti(opt.value)}
                      style={{
                        padding: "13px 20px",
                        background: multiSelected.includes(opt.value)
                          ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
                        border: multiSelected.includes(opt.value)
                          ? "1px solid rgba(99,102,241,0.5)" : "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 14,
                        color: multiSelected.includes(opt.value) ? "#a5b4fc" : "#94a3b8",
                        fontSize: 14, fontFamily: "'Georgia', serif",
                        cursor: "pointer", textAlign: "left",
                        display: "flex", alignItems: "center", gap: 12,
                        transition: "all 0.2s",
                      }}
                    >
                      <span style={{ fontSize: 18 }}>{opt.icon}</span>
                      <span style={{ flex: 1 }}>{opt.label}</span>
                      {multiSelected.includes(opt.value) && <span style={{ color: "#6366f1" }}>✓</span>}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleMultiSubmit}
                  disabled={multiSelected.length === 0}
                  style={{
                    marginTop: 4,
                    padding: "14px",
                    background: multiSelected.length > 0
                      ? "linear-gradient(135deg, #6366f1, #4f46e5)"
                      : "rgba(255,255,255,0.05)",
                    border: "none", borderRadius: 14,
                    color: multiSelected.length > 0 ? "#fff" : "#475569",
                    fontSize: 14, fontFamily: "'Georgia', serif",
                    cursor: multiSelected.length > 0 ? "pointer" : "default",
                    transition: "all 0.2s",
                  }}
                >
                  {multiSelected.length === 0 ? "Select all that apply" : `Continue with ${multiSelected.length} selected →`}
                </button>
              </div>
            )}

            {/* Scale */}
            {currentStep.type === "scale" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => setScaleVal(n)}
                      style={{
                        flex: 1, padding: "16px 0",
                        background: scaleVal === n
                          ? "linear-gradient(135deg, #6366f1, #4f46e5)"
                          : "rgba(255,255,255,0.04)",
                        border: scaleVal === n
                          ? "1px solid rgba(99,102,241,0.5)"
                          : "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 12,
                        color: scaleVal === n ? "#fff" : "#64748b",
                        fontSize: 18, fontWeight: 600,
                        cursor: "pointer", transition: "all 0.2s",
                      }}
                    >{n}</button>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#475569", fontSize: 11 }}>{currentStep.labels[0]}</span>
                  <span style={{ color: "#475569", fontSize: 11 }}>{currentStep.labels[4]}</span>
                </div>
                {scaleVal && (
                  <div style={{
                    textAlign: "center", color: "#a5b4fc", fontSize: 13,
                    fontStyle: "italic", marginTop: -4,
                  }}>
                    "{currentStep.labels[scaleVal - 1]}"
                  </div>
                )}
                <button
                  onClick={handleScaleSubmit}
                  disabled={scaleVal === null}
                  style={{
                    padding: "14px",
                    background: scaleVal !== null
                      ? "linear-gradient(135deg, #6366f1, #4f46e5)"
                      : "rgba(255,255,255,0.05)",
                    border: "none", borderRadius: 14,
                    color: scaleVal !== null ? "#fff" : "#475569",
                    fontSize: 14, fontFamily: "'Georgia', serif",
                    cursor: scaleVal !== null ? "pointer" : "default",
                    transition: "all 0.2s",
                  }}
                >
                  {scaleVal ? "Continue →" : "Select a number"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes typingDot {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-4px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder { color: #334155; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.3); border-radius: 2px; }
      `}</style>
    </div>
  );
}
