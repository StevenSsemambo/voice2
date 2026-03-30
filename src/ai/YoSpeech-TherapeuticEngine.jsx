import { useState, useEffect, useRef } from "react";
import { db } from '../utils/db'

// ─── THERAPEUTIC RESPONSE ARCHITECTURE ───────────────────────────────────────
//
// Every response the AI gives passes through 5 stages:
//   1. DETECT    — what is the user expressing? (intent + emotion)
//   2. VALIDATE  — acknowledge before anything else
//   3. EXPLORE   — deepen understanding if needed
//   4. REFRAME   — gently shift perspective
//   5. GUIDE     — only then offer direction
//
// This mirrors the structure of real speech therapy sessions.
// ─────────────────────────────────────────────────────────────────────────────

// ─── INTENT DETECTION ENGINE ─────────────────────────────────────────────────
const INTENT_PATTERNS = {
  shame: {
    keywords: ["embarrassed", "ashamed", "humiliated", "stupid", "idiot", "hate myself",
      "hate my voice", "hate my stutter", "pathetic", "useless", "broken", "damaged"],
    weight: 10,
  },
  frustration: {
    keywords: ["frustrated", "annoying", "annoyed", "can't do this", "not working",
      "pointless", "what's the point", "tired of", "fed up", "sick of", "giving up"],
    weight: 9,
  },
  hopelessness: {
    keywords: ["never get better", "will never", "impossible", "hopeless", "no point",
      "doesn't matter", "won't work", "nothing helps", "always fail", "always stutter"],
    weight: 10,
  },
  fear: {
    keywords: ["scared", "terrified", "afraid", "dreading", "panic", "anxious",
      "nervous", "worried", "fear", "frightened", "dread"],
    weight: 8,
  },
  avoidance: {
    keywords: ["avoided", "didn't go", "stayed quiet", "didn't speak", "skipped",
      "backed out", "cancelled", "hid", "pretended", "made excuses"],
    weight: 8,
  },
  progress: {
    keywords: ["better", "improved", "easier", "fluent", "managed", "did it",
      "succeeded", "proud", "confident", "good session", "worked"],
    weight: 7,
  },
  celebration: {
    keywords: ["did it", "made the call", "spoke up", "introduced myself", "presented",
      "nailed it", "finally", "for the first time", "proud of myself"],
    weight: 9,
  },
  confusion: {
    keywords: ["confused", "don't understand", "not sure", "unclear", "how do i",
      "what does", "explain", "don't get it", "lost"],
    weight: 6,
  },
  relapse: {
    keywords: ["got worse", "worse than before", "going backwards", "regressed",
      "bad week", "fell apart", "lost progress", "back to square one"],
    weight: 9,
  },
  comparison: {
    keywords: ["everyone else", "other people", "normal people", "they can",
      "why can't i", "compared to", "not like them", "different from"],
    weight: 8,
  },
  seeking_advice: {
    keywords: ["what should i", "how can i", "any tips", "advice", "suggest",
      "recommend", "help me", "what do i do", "tell me how"],
    weight: 5,
  },
  existential: {
    keywords: ["who am i", "define me", "part of me", "always been this way",
      "my identity", "stutter is me", "stutterer", "i am a stutterer"],
    weight: 9,
  },
};

function detectIntents(text) {
  const lower = text.toLowerCase();
  const detected = [];

  for (const [intent, pattern] of Object.entries(INTENT_PATTERNS)) {
    const matches = pattern.keywords.filter(kw => lower.includes(kw));
    if (matches.length > 0) {
      detected.push({
        intent,
        weight: pattern.weight * matches.length,
        matches,
      });
    }
  }

  return detected.sort((a, b) => b.weight - a.weight);
}

// ─── EMOTIONAL INTENSITY SCORER ───────────────────────────────────────────────
function scoreEmotionalIntensity(text) {
  const intensifiers = ["so", "really", "very", "extremely", "absolutely",
    "completely", "totally", "always", "never", "every time", "!!!", "..."];
  const lower = text.toLowerCase();
  let score = 1;
  intensifiers.forEach(word => {
    if (lower.includes(word)) score += 0.5;
  });
  if (text.includes("!")) score += 0.3;
  if (text.length > 200) score += 0.5; // long message = more emotion
  return Math.min(score, 5);
}

// ─── VALIDATION LIBRARY ───────────────────────────────────────────────────────
// Validation always comes first. Never skip this.
const VALIDATIONS = {
  shame: [
    "That feeling of shame after stuttering — it's one of the heaviest things a person can carry. And it makes complete sense that you feel it.",
    "Shame about speech runs so deep because speaking feels like such a fundamental part of who we are. What you're feeling is real, and it's understandable.",
    "I hear that. The shame doesn't come from weakness — it comes from caring deeply about how you connect with people. That's actually a beautiful thing, even when it hurts.",
    "That kind of shame is something so many people with stutters feel and almost no one talks about openly. You're not alone in this.",
  ],
  frustration: [
    "Of course you're frustrated. You're putting in real effort and it still feels hard. That frustration is completely valid.",
    "Frustration in this process is not a sign something's wrong — it's a sign you care enough to want more than you currently have.",
    "I hear how tired you are of this. That kind of frustration usually means you've been fighting for a long time. You don't have to pretend it doesn't hurt.",
    "Yes. It is frustrating. I'm not going to minimise that. Let's sit with it for a moment before we do anything else.",
  ],
  hopelessness: [
    "When hope runs out, it can feel like the truth. But hopelessness is a feeling, not a fact — and feelings change, especially with the right support.",
    "I'm not going to tell you to just 'think positive'. What I will tell you is that where you are right now is not where you'll always be.",
    "That feeling of 'it will never get better' — I've seen it in people who later made the most remarkable progress. It's not a prediction. It's exhaustion.",
    "I hear you. And I want you to know — I haven't given up on you, even when you have.",
  ],
  fear: [
    "Fear before speaking is one of the most human experiences there is. You're not broken for feeling it.",
    "That fear is your nervous system trying to protect you. It's not your enemy — it's just overprotective. We can work with that.",
    "Being afraid doesn't mean you're weak. The people I see make the most progress are often the ones who feel the most fear but show up anyway.",
    "I hear the anxiety in what you're describing. Let's not rush past it — it's worth understanding.",
  ],
  avoidance: [
    "Avoidance makes complete sense as a strategy — it works in the short term. The fact that you're recognising it is already a step beyond where most people get.",
    "I'm not here to judge the avoidance. It protected you when you needed it. The question is whether it's still serving you now.",
    "Avoiding hard situations doesn't make you weak — it makes you human. We'll work on this together, at a pace that feels possible.",
    "You noticed the avoidance. That awareness matters more than you know.",
  ],
  progress: [
    "Yes. I see that too. What you're describing is real progress — not luck, not accident.",
    "That's worth pausing on for a moment. What you just described took real courage to build.",
    "I've been tracking your journey. What you're feeling right now is earned.",
    "Progress in communication is rarely linear — but what you're describing is a genuine shift.",
  ],
  celebration: [
    "Wait — I want you to really take that in. What you just did is exactly what we've been building toward.",
    "That moment you just described? Remember it. Write it down if you have to. That's the real you — the one who can do this.",
    "I felt something reading that. You did something today that the version of you who started this journey couldn't do. That's everything.",
    "That's a breakthrough. Not a small win — a breakthrough. Let's acknowledge it properly.",
  ],
  relapse: [
    "What feels like going backwards is rarely that. Regression is part of every real learning curve — it doesn't erase what you've built.",
    "A bad week after good progress can feel like the ground disappearing. It's not. The progress is still there underneath.",
    "I understand how demoralising it feels to slip back. But your nervous system is reorganising, not retreating.",
    "Bad periods don't cancel good ones. They're part of the same journey.",
  ],
  comparison: [
    "Comparing your internal experience to other people's external presentation is one of the most painful and unfair things we do to ourselves.",
    "When you compare yourself to 'normal' speakers, you're comparing your worst moments to their best performance. It's never a fair fight.",
    "Other people's fluency isn't the standard you're measured against. Your own growth is the only comparison that matters.",
    "I understand the comparison — but every fluent speaker has something they struggle with that you can't see. Communication difficulty doesn't make you less.",
  ],
  existential: [
    "The question of whether your stutter is part of who you are is one of the deepest questions in this journey. There's no quick answer — but there is a real one.",
    "Your stutter is something that happens when you speak. It is not who you are. That distinction, when it truly lands, changes everything.",
    "Many people find that working through this question — whether the stutter defines them — is actually the most important work we do together.",
    "I hear the weight in what you're asking. This is important, and we're going to explore it properly.",
  ],
  confusion: [
    "That's a really fair question. Let me make sure I explain this clearly.",
    "Confusion here is completely understandable — this is nuanced work. Let me take it slower.",
    "Good that you asked. Let me break this down differently.",
    "You're right to want more clarity. Let me try a different approach.",
  ],
  seeking_advice: [
    "Good instinct to ask. Let me think about what will be most useful for where you are right now.",
    "I want to give you advice that actually fits your situation — not generic guidance. Let me be specific.",
    "Before I answer, let me make sure I understand what you're working with.",
    "Let me give you something you can actually use, not just a theory.",
  ],
};

// ─── REFRAMING ENGINE ─────────────────────────────────────────────────────────
const REFRAMES = {
  shame: [
    "Here's what I want you to consider: the shame you feel is not about your speech. It's about how much you want to connect with people. That desire is not a weakness.",
    "Shame shrinks the world. But you're here, working, showing up — that's the opposite of what shame wants you to do.",
    "The people who feel the most shame about stuttering are often the most articulate, thoughtful communicators when they find their footing. The sensitivity that creates shame also creates depth.",
  ],
  hopelessness: [
    "Hopelessness is often the last defence before a breakthrough. It's the mind saying 'I can't keep hoping and being disappointed' — which means you've been trying hard enough to be disappointed many times. That's not nothing.",
    "You haven't failed at getting better. You've been trying to get better in ways that haven't fully worked yet. That's a different thing entirely.",
    "The fact that you're still here, still talking about this, still in this session — that's not the behaviour of someone who has truly given up.",
  ],
  avoidance: [
    "Every situation you've avoided has stayed the same size in your mind. The moment you face it — even once — it begins to shrink. That's not motivation. That's neuroscience.",
    "Avoidance tells your brain: 'this situation is dangerous'. Exposure tells your brain: 'I survived this. It's manageable.' We're slowly updating that message.",
  ],
  relapse: [
    "Two steps forward, one step back is still one step forward. Your overall trajectory matters more than any single bad week.",
    "What you're experiencing is called a 'skill consolidation dip'. It happens when your brain is integrating new patterns. It's not regression — it's reorganisation.",
  ],
  comparison: [
    "Fluency is not the goal. Communication is. Some of the most powerful communicators in the world stutter. The goal is not to sound like everyone else — it's to be heard.",
    "When you stop measuring yourself against fluent speakers and start measuring yourself against who you were 3 months ago, the whole story changes.",
  ],
  existential: [
    "There's a difference between 'I am a stutterer' and 'I am a person who sometimes stutters'. One is an identity. The other is a description. The language you use matters more than you realise.",
    "Your stutter has shaped you — your empathy, your thoughtfulness, your awareness of how communication really works. That shaping is real. But it doesn't mean the stutter owns you.",
  ],
  fear: [
    "Fear before speaking is not a sign to stop. It's a sign that what you're about to do matters to you. Athletes call this 'activation'. The feeling is the same — only the interpretation differs.",
    "Your fear has kept you safe. Now we're asking it to step aside, just a little, just for a moment. Not to disappear — just to make room.",
  ],
  frustration: [
    "Frustration at this stage often means you're right at the edge of your current capability. The resistance you feel is the resistance of growth.",
    "The fact that you're frustrated means your standards have risen. You expect more of yourself now than you did at the start. That's progress wearing a difficult mask.",
  ],
};

// ─── GUIDANCE GENERATOR ───────────────────────────────────────────────────────
function generateGuidance(intents, soul, emotionalReading, memoryAnalysis) {
  const topIntent = intents[0]?.intent;
  const state = emotionalReading?.derivedState || "steady";
  const personality = soul?.communicationPersonality;
  const name = soul?.name || "you";

  // Don't give guidance in crisis or low states — just hold space
  if (state === "crisis" || state === "low") {
    return "For now, I just want you to breathe. No exercises. No goals. Just exist here for a moment. We'll work when you're ready.";
  }

  const guidanceMap = {
    shame: {
      perfectionist: `${name}, one thing I want you to try this week: when you stutter, instead of immediately criticising yourself, pause and say internally — 'I was heard'. Not 'I failed'. Just 'I was heard'.`,
      avoider: `Try this: in the next 24 hours, say something out loud in a situation you'd normally stay quiet in. Anything. The goal isn't fluency — it's presence.`,
      default: `Start a shame log — not to dwell, but to track. Write down when shame appeared, what triggered it, and one thing that was true despite it. Patterns become manageable when they're visible.`,
    },
    hopelessness: {
      default: `I want you to find one moment from the past month where something was even slightly easier than before. One moment. Bring it to the next session. If you can't find one, I'll show you one from your data.`,
    },
    fear: {
      freezer: `Next time you feel the freeze before speaking — don't fight it. Name it. Internally say 'I notice I'm afraid'. That naming creates just enough distance to act anyway.`,
      avoider: `This week, choose one situation you'd normally avoid and stay in it for just 60 seconds longer than you want to. Not forever. Just 60 seconds.`,
      default: `Before your next difficult speaking situation, spend 60 seconds doing box breathing. Not to eliminate fear — just to lower the baseline enough to begin.`,
    },
    avoidance: {
      default: `Choose one thing you've been avoiding and do the smallest possible version of it. Not the full thing — the micro-version. A whisper when you'd go silent. A word when you'd say nothing.`,
    },
    relapse: {
      default: `Pull up your session history. Look at where you were 30 days ago. Compare it to now — not this week. The full arc. Then tell me what you see.`,
    },
    celebration: {
      default: `Now — what made that possible? What did you do differently? I want you to identify the specific decision or moment that let that happen. That's the thing to repeat.`,
    },
    seeking_advice: {
      default: `Here's where I'd focus first: the pattern that keeps showing up in your sessions. Not the biggest challenge — the most frequent one. Frequency tells us where the deepest work is.`,
    },
    comparison: {
      default: `This week, instead of noticing how others speak, notice one moment when you were understood — fully, clearly — despite difficulty. That's the real evidence.`,
    },
  };

  const intentGuidance = guidanceMap[topIntent];
  if (!intentGuidance) return null;

  return intentGuidance[personality] || intentGuidance.default || null;
}

// ─── FULL RESPONSE BUILDER ────────────────────────────────────────────────────
function buildTherapeuticResponse(userInput, soul, emotionalReading, memoryAnalysis) {
  const intents = detectIntents(userInput);
  const intensity = scoreEmotionalIntensity(userInput);
  const topIntent = intents[0]?.intent;
  const secondIntent = intents[1]?.intent;
  const state = emotionalReading?.derivedState || "steady";
  const name = soul?.name || "";

  if (!topIntent) {
    return {
      validation: null,
      reframe: null,
      guidance: "Tell me more. I want to understand what you're experiencing before I respond.",
      memoryRef: null,
      intents: [],
      intensity,
      fullResponse: "Tell me more. I want to understand what you're experiencing before I respond.",
    };
  }

  // Pick validation
  const validationPool = VALIDATIONS[topIntent] || VALIDATIONS.seeking_advice;
  const validation = validationPool[Math.floor(Math.random() * validationPool.length)];

  // Pick reframe (only if state allows it and not in crisis)
  let reframe = null;
  if (!["crisis", "low"].includes(state)) {
    const reframePool = REFRAMES[topIntent];
    if (reframePool) {
      reframe = reframePool[Math.floor(Math.random() * reframePool.length)];
    }
  }

  // Second intent bridge
  let bridge = null;
  if (secondIntent && secondIntent !== topIntent) {
    const bridgeMap = {
      "shame+fear": "And underneath that shame, I also hear fear.",
      "frustration+hopelessness": "The frustration is real — and it sounds like it's deepening into something heavier.",
      "avoidance+shame": "The avoidance and the shame feed each other. Understanding that cycle is the first step to breaking it.",
      "progress+fear": "It's interesting — you're making real progress, and yet the fear is still there. That's actually very common at this stage.",
      "celebration+disbelief": "I notice you're celebrating but also minimising. Let's hold the celebration a little longer.",
    };
    bridge = bridgeMap[`${topIntent}+${secondIntent}`] || null;
  }

  // Memory reference injection
  let memoryRef = null;
  if (memoryAnalysis?.references?.length) {
    const relevant = memoryAnalysis.references.find(r =>
      r.trigger === "encouragement" &&
      (topIntent === "hopelessness" || topIntent === "relapse" || topIntent === "frustration")
    );
    if (relevant) memoryRef = relevant.text;
  }

  // Guidance
  const guidance = generateGuidance(intents, soul, emotionalReading, memoryAnalysis);

  // Assemble full response
  const parts = [];
  if (validation) parts.push(validation);
  if (bridge) parts.push(bridge);
  if (memoryRef) parts.push(memoryRef);
  if (reframe) parts.push(reframe);
  if (guidance) parts.push(guidance);

  return {
    validation,
    bridge,
    reframe,
    guidance,
    memoryRef,
    intents,
    intensity,
    fullResponse: parts.join("\n\n"),
  };
}

// ─── SOCRATIC QUESTION GENERATOR ─────────────────────────────────────────────
// Sometimes the therapist asks rather than tells
const SOCRATIC_QUESTIONS = {
  shame: [
    "If a close friend described exactly what happened to you today, would you judge them as harshly as you're judging yourself?",
    "When did you first start feeling this way about your speech? What was happening in your life then?",
    "What would it feel like to speak and not care what anyone thought? Can you imagine that, even briefly?",
  ],
  hopelessness: [
    "Has there ever been a time — even a small moment — when speaking felt different? What was different about that moment?",
    "When you say 'it will never get better', what would have to happen for you to believe it could?",
    "What would you say to someone else who told you exactly what you just told me?",
  ],
  avoidance: [
    "What do you imagine happening in that situation that makes you want to avoid it? Walk me through the scene in your head.",
    "What's the worst realistic outcome if you don't avoid it? And what would you do then?",
    "What has avoidance cost you — not today, but over time?",
  ],
  fear: [
    "What specifically are you afraid people will think or do? Let's name it precisely.",
    "How many times has that fear come true exactly as you imagined? And how many times has it been different?",
    "What would you be doing differently right now if the fear were just a little smaller?",
  ],
  existential: [
    "If you woke up tomorrow and no longer stuttered, what would be different about who you are as a person?",
    "What has your stutter taught you about people — about who is worth your time and who isn't?",
    "Is there anything about how you communicate — the depth, the care, the thoughtfulness — that you think exists partly because of what you've been through?",
  ],
};

function getSocraticQuestion(intents, soul) {
  const topIntent = intents[0]?.intent;
  const pool = SOCRATIC_QUESTIONS[topIntent];
  if (!pool) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ─── RESPONSE MODE SELECTOR ───────────────────────────────────────────────────
// Decides whether to give a full response or just a Socratic question
function selectResponseMode(intents, emotionalReading, messageCount) {
  const state = emotionalReading?.derivedState || "steady";
  const topIntent = intents[0]?.intent;

  // Always full response for crisis
  if (state === "crisis") return "hold_space";

  // Alternate Socratic every 3 messages for deep intents
  const deepIntents = ["shame", "hopelessness", "existential", "fear", "avoidance"];
  if (deepIntents.includes(topIntent) && messageCount % 3 === 0) return "socratic";

  // Default: full therapeutic response
  return "full";
}

// ─── CHAT MESSAGE COMPONENT ───────────────────────────────────────────────────
function Message({ msg, isNew }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: msg.from === "user" ? "flex-end" : "flex-start",
      animation: isNew ? "fadeSlideIn 0.4s ease" : "none",
      marginBottom: 16,
    }}>
      {msg.from === "therapist" && (
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "linear-gradient(135deg, #6366f1, #10b981)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, marginRight: 10, flexShrink: 0, marginTop: 4,
        }}>🎙️</div>
      )}
      <div style={{ maxWidth: "80%", display: "flex", flexDirection: "column", gap: 4 }}>
        {/* Intent tags for therapist responses */}
        {msg.from === "therapist" && msg.intents?.length > 0 && (
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 4 }}>
            {msg.intents.slice(0, 2).map((intent, i) => (
              <span key={i} style={{
                padding: "2px 8px",
                background: "rgba(99,102,241,0.1)",
                border: "1px solid rgba(99,102,241,0.2)",
                borderRadius: 8, color: "#818cf8",
                fontSize: 10, letterSpacing: "0.04em",
              }}>{intent.intent}</span>
            ))}
          </div>
        )}
        <div style={{
          padding: "14px 18px",
          borderRadius: msg.from === "user" ? "18px 18px 4px 18px" : "4px 18px 18px 18px",
          background: msg.from === "user"
            ? "linear-gradient(135deg, #6366f1, #4f46e5)"
            : "rgba(255,255,255,0.04)",
          border: msg.from === "user" ? "none" : "1px solid rgba(255,255,255,0.07)",
          color: msg.from === "user" ? "#fff" : "#cbd5e1",
          fontSize: 14, lineHeight: 1.75,
          backdropFilter: "blur(8px)",
          boxShadow: msg.from === "user"
            ? "0 4px 16px rgba(99,102,241,0.25)"
            : "0 2px 10px rgba(0,0,0,0.2)",
          whiteSpace: "pre-wrap",
        }}>
          {msg.text}
        </div>
        {/* Response anatomy breakdown */}
        {msg.from === "therapist" && msg.anatomy && (
          <div style={{
            marginTop: 4,
            padding: "10px 14px",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.05)",
            borderRadius: 10,
          }}>
            <div style={{ color: "#334155", fontSize: 10, letterSpacing: "0.06em", marginBottom: 6 }}>
              RESPONSE ANATOMY
            </div>
            {Object.entries(msg.anatomy).filter(([, v]) => v).map(([key, val]) => (
              <div key={key} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                <span style={{
                  color: "#1e293b", fontSize: 10, letterSpacing: "0.04em",
                  width: 70, flexShrink: 0, paddingTop: 1,
                }}>{key.toUpperCase()}</span>
                <span style={{ color: "#334155", fontSize: 11, lineHeight: 1.5 }}>
                  {String(val).slice(0, 80)}{String(val).length > 80 ? "…" : ""}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── INTENSITY INDICATOR ─────────────────────────────────────────────────────
function IntensityMeter({ value }) {
  const levels = [
    { threshold: 1.5, label: "Neutral", color: "#64748b" },
    { threshold: 2.5, label: "Mild", color: "#60a5fa" },
    { threshold: 3.5, label: "Moderate", color: "#fbbf24" },
    { threshold: 4.5, label: "High", color: "#f97316" },
    { threshold: 6,   label: "Intense", color: "#f87171" },
  ];
  const level = levels.find(l => value <= l.threshold) || levels[levels.length - 1];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ color: "#334155", fontSize: 11 }}>Intensity</span>
      <div style={{ display: "flex", gap: 3 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <div key={n} style={{
            width: 16, height: 4, borderRadius: 2,
            background: n <= Math.round(value) ? level.color : "rgba(255,255,255,0.08)",
            transition: "background 0.4s",
          }} />
        ))}
      </div>
      <span style={{ color: level.color, fontSize: 11 }}>{level.label}</span>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function TherapeuticResponseEngine({
  soul = {},
  emotionalReading = {},
  memoryAnalysis = {},
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [showAnatomy, setShowAnatomy] = useState(false);
  const [lastIntensity, setLastIntensity] = useState(null);
  const [lastIntents, setLastIntents] = useState([]);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const name = soul?.name || "there";

  useEffect(() => {
    // Opening message shaped by emotional state
    const openings = {
      crisis: `I'm here, ${name}. Whatever you need to say — say it. This is a safe space.`,
      low: `${name}, I'm glad you're here. Take your time. There's no agenda today.`,
      fragile: `Good to see you, ${name}. How are you really feeling right now?`,
      steady: `Welcome, ${name}. I'm ready when you are. What's on your mind?`,
      open: `${name}, you seem in a good place today. What do you want to work through?`,
      energised: `${name} — let's use this energy well. What's alive for you today?`,
    };
    const state = emotionalReading?.derivedState || "steady";
    const opening = openings[state] || openings.steady;

    setTimeout(() => {
      setMessages([{ from: "therapist", text: opening, id: Date.now(), intents: [], anatomy: null }]);
    }, 400);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  function sendMessage() {
    if (!input.trim()) return;
    const userText = input.trim();
    setInput("");

    const userMsg = { from: "user", text: userText, id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    const intents = detectIntents(userText);
    const intensity = scoreEmotionalIntensity(userText);
    const mode = selectResponseMode(intents, emotionalReading, messageCount);

    setLastIntensity(intensity);
    setLastIntents(intents);

    setTimeout(() => {
      setIsTyping(false);
      let responseText = "";
      let anatomy = null;

      if (mode === "hold_space") {
        responseText = `I hear you, ${name}. I'm not going anywhere. Take all the time you need.`;
        anatomy = { mode: "hold space", note: "Crisis state — no advice, no reframe" };
      } else if (mode === "socratic") {
        const question = getSocraticQuestion(intents, soul);
        responseText = question || "Tell me more about what's happening for you right now.";
        anatomy = { mode: "socratic", intent: intents[0]?.intent, question: responseText };
      } else {
        const response = buildTherapeuticResponse(userText, soul, emotionalReading, memoryAnalysis);
        responseText = response.fullResponse;
        anatomy = {
          mode: "full therapeutic",
          detected: intents.slice(0, 2).map(i => i.intent).join(", "),
          validation: response.validation?.slice(0, 60),
          reframe: response.reframe?.slice(0, 60),
          guidance: response.guidance?.slice(0, 60),
          memory: response.memoryRef?.slice(0, 60),
        };
      }

      setMessages(prev => [...prev, {
        from: "therapist",
        text: responseText,
        id: Date.now(),
        intents,
        anatomy: showAnatomy ? anatomy : null,
        _anatomy: anatomy,
      }]);
      setMessageCount(c => c + 1);
    }, 1400 + Math.random() * 600); // Natural varied delay
  }

  function toggleAnatomy() {
    setShowAnatomy(prev => {
      const next = !prev;
      // Update existing messages to show/hide anatomy
      setMessages(msgs => msgs.map(m =>
        m.from === "therapist"
          ? { ...m, anatomy: next ? m._anatomy : null }
          : m
      ));
      return next;
    });
  }

  const QUICK_PROMPTS = [
    "I stuttered badly in a meeting today and felt so ashamed",
    "I don't think I'm ever going to get better at this",
    "I avoided making a phone call again today",
    "I actually introduced myself in class today without backing out",
    "Why do I always compare myself to fluent people?",
    "My stutter feels like it defines me",
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #07080f 0%, #0a0d14 50%, #07080f 100%)",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      display: "flex", flexDirection: "column",
      position: "relative",
    }}>

      {/* Ambient */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "radial-gradient(ellipse 55% 40% at 25% 25%, rgba(99,102,241,0.05) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Header */}
      <div style={{
        padding: "24px 24px 0",
        maxWidth: 680, margin: "0 auto", width: "100%",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{
          width: 42, height: 42, borderRadius: "50%",
          background: "linear-gradient(135deg, #6366f1, #10b981)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, boxShadow: "0 0 18px rgba(99,102,241,0.25)",
        }}>🎙️</div>
        <div>
          <div style={{ color: "#e2e8f0", fontSize: 15, fontWeight: 600 }}>Therapeutic Session</div>
          <div style={{ color: "#334155", fontSize: 11, fontStyle: "italic" }}>
            {name} · {emotionalReading?.derivedState || "steady"} state
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
          {lastIntensity && <IntensityMeter value={lastIntensity} />}
          <button
            onClick={toggleAnatomy}
            style={{
              padding: "5px 12px",
              background: showAnatomy ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.04)",
              border: showAnatomy ? "1px solid rgba(99,102,241,0.3)" : "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8,
              color: showAnatomy ? "#818cf8" : "#334155",
              fontSize: 11, fontFamily: "Georgia, serif",
              cursor: "pointer",
            }}
          >{showAnatomy ? "Hide" : "Show"} anatomy</button>
        </div>
      </div>

      {/* Intent display */}
      {lastIntents.length > 0 && (
        <div style={{
          maxWidth: 680, margin: "12px auto 0", width: "100%",
          padding: "0 24px",
        }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span style={{ color: "#1e293b", fontSize: 11, marginRight: 2 }}>Detected:</span>
            {lastIntents.slice(0, 3).map((intent, i) => (
              <span key={i} style={{
                padding: "2px 10px",
                background: i === 0 ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.04)",
                border: i === 0 ? "1px solid rgba(99,102,241,0.25)" : "1px solid rgba(255,255,255,0.07)",
                borderRadius: 10,
                color: i === 0 ? "#818cf8" : "#334155",
                fontSize: 11,
              }}>{intent.intent}</span>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div style={{
        flex: 1,
        maxWidth: 680, margin: "0 auto", width: "100%",
        padding: "24px 24px 180px",
        overflowY: "auto",
      }}>
        {messages.map((msg, i) => (
          <Message key={msg.id} msg={msg} isNew={i === messages.length - 1} />
        ))}

        {isTyping && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, animation: "fadeSlideIn 0.3s ease" }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "linear-gradient(135deg, #6366f1, #10b981)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
            }}>🎙️</div>
            <div style={{
              padding: "14px 18px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "4px 18px 18px 18px",
              display: "flex", gap: 5,
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

        {/* Quick prompts — only at start */}
        {messages.length <= 1 && !isTyping && (
          <div style={{ marginTop: 8 }}>
            <div style={{ color: "#1e293b", fontSize: 11, letterSpacing: "0.05em", marginBottom: 10 }}>
              TRY SAYING
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {QUICK_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(prompt); inputRef.current?.focus(); }}
                  style={{
                    padding: "11px 16px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 12,
                    color: "#475569", fontSize: 13,
                    fontFamily: "Georgia, serif",
                    cursor: "pointer", textAlign: "left",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = "rgba(99,102,241,0.08)";
                    e.currentTarget.style.color = "#94a3b8";
                    e.currentTarget.style.borderColor = "rgba(99,102,241,0.2)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                    e.currentTarget.style.color = "#475569";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                  }}
                >"{prompt}"</button>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        padding: "16px 24px 32px",
        background: "linear-gradient(to top, #07080f 65%, transparent)",
        display: "flex", justifyContent: "center",
      }}>
        <div style={{ width: "100%", maxWidth: 680 }}>
          <div style={{ display: "flex", gap: 10 }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Tell me what's on your mind..."
              rows={2}
              style={{
                flex: 1,
                padding: "14px 18px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 16, color: "#e2e8f0",
                fontSize: 14, fontFamily: "Georgia, serif",
                outline: "none", resize: "none",
                lineHeight: 1.6,
                backdropFilter: "blur(8px)",
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isTyping}
              style={{
                padding: "0 22px",
                background: input.trim() && !isTyping
                  ? "linear-gradient(135deg, #6366f1, #4f46e5)"
                  : "rgba(255,255,255,0.04)",
                border: "none", borderRadius: 16,
                color: input.trim() && !isTyping ? "#fff" : "#334155",
                fontSize: 18, cursor: input.trim() && !isTyping ? "pointer" : "default",
                transition: "all 0.2s",
                boxShadow: input.trim() ? "0 4px 14px rgba(99,102,241,0.3)" : "none",
              }}
            >→</button>
          </div>
          <div style={{ color: "#1e293b", fontSize: 11, textAlign: "center", marginTop: 8 }}>
            Enter to send · Shift+Enter for new line
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes typingDot {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-4px); }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        textarea::placeholder { color: #1e293b; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.2); border-radius: 2px; }
      `}</style>
    </div>
  );
}
