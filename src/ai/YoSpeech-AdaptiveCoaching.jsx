import { useState, useEffect, useRef } from "react";
import { db } from '../utils/db'

// ─── EXERCISE LIBRARY ─────────────────────────────────────────────────────────
// Full evidence-based speech therapy exercise bank
const EXERCISE_LIBRARY = {

  // ── BREATHING & FOUNDATION ──
  diaphragmatic_breathing: {
    id: "diaphragmatic_breathing",
    name: "Diaphragmatic Breathing",
    category: "foundation",
    difficulty: 1,
    duration: 5,
    targets: ["stutter", "anxiety", "general"],
    description: "Deep belly breathing to activate the parasympathetic nervous system and reduce speech anxiety.",
    steps: [
      "Place one hand on your chest, one on your belly.",
      "Inhale slowly through your nose for 4 counts — only your belly should rise.",
      "Hold for 2 counts.",
      "Exhale slowly through your mouth for 6 counts.",
      "Repeat 8 times without rushing.",
    ],
    successMetrics: ["Belly rises, chest stays still", "No rushing between cycles", "Shoulders stay relaxed"],
    emotionalStates: ["crisis", "low", "fragile", "steady", "open", "energised"],
    requiredStreak: 0,
    personalityFit: ["freezer", "rusher", "overthinker"],
  },

  easy_onset: {
    id: "easy_onset",
    name: "Easy Onset",
    category: "fluency",
    difficulty: 3,
    duration: 10,
    targets: ["stutter"],
    description: "Beginning words with a gentle, relaxed airflow instead of forcing sound — reduces blocking.",
    steps: [
      "Take a gentle breath before speaking.",
      "Start the first word with a soft 'h' breath — as if fogging a mirror.",
      "Let the sound flow out rather than pushing it.",
      "Practice with: 'Hello... How are you... Have a good day'",
      "Focus on the ease, not the perfection.",
    ],
    successMetrics: ["Smooth airflow at word start", "No tension in throat", "Words begin gently"],
    emotionalStates: ["fragile", "steady", "open", "energised"],
    requiredStreak: 2,
    personalityFit: ["perfectionist", "freezer"],
  },

  light_articulatory_contact: {
    id: "light_articulatory_contact",
    name: "Light Articulatory Contact",
    category: "fluency",
    difficulty: 3,
    duration: 10,
    targets: ["stutter"],
    description: "Touching lips, tongue and teeth lightly during speech to prevent tension that causes blocks.",
    steps: [
      "Say the word 'Peter' slowly — notice how your lips touch.",
      "Now say it again but with lips barely touching — feather-light contact.",
      "Practice word pairs: 'pop/bob', 'top/dob', 'cap/gap'",
      "Graduate to full sentences with light contact throughout.",
      "The goal: speak as if your mouth is made of tissue paper.",
    ],
    successMetrics: ["Lips and tongue feel relaxed", "No hard stops on consonants", "Smooth transitions"],
    emotionalStates: ["steady", "open", "energised"],
    requiredStreak: 5,
    personalityFit: ["perfectionist", "rusher"],
  },

  cancellation: {
    id: "cancellation",
    name: "Cancellation",
    category: "advanced_fluency",
    difficulty: 5,
    duration: 15,
    targets: ["stutter"],
    description: "After stuttering, pause deliberately, then repeat the word fluently. Builds control and reduces shame.",
    steps: [
      "Have a conversation or read aloud.",
      "When you stutter on a word — pause. Don't panic.",
      "Take a breath.",
      "Say the word again calmly, using easy onset.",
      "Continue speaking as if nothing happened.",
      "The stutter is not a failure — the pause is the skill.",
    ],
    successMetrics: ["Pause without panicking", "Successfully repeat stuttered word", "Continue naturally"],
    emotionalStates: ["steady", "open", "energised"],
    requiredStreak: 7,
    personalityFit: ["perfectionist", "avoider"],
  },

  pull_out: {
    id: "pull_out",
    name: "Pull-Out Technique",
    category: "advanced_fluency",
    difficulty: 5,
    duration: 15,
    targets: ["stutter"],
    description: "While in the middle of a stutter, slow down and ease out of it rather than forcing through.",
    steps: [
      "Begin speaking — allow a stutter to begin without fighting it.",
      "When you feel the stutter starting, consciously slow down.",
      "Ease the sound out — don't push or force.",
      "Complete the word slowly and gently.",
      "Resume normal speech pace.",
    ],
    successMetrics: ["Recognised stutter in real time", "Slowed down during stutter", "Completed word without force"],
    emotionalStates: ["open", "energised"],
    requiredStreak: 10,
    personalityFit: ["rusher", "freezer"],
  },

  // ── ANXIETY REDUCTION ──
  cognitive_reframe: {
    id: "cognitive_reframe",
    name: "Cognitive Reframing",
    category: "anxiety",
    difficulty: 2,
    duration: 8,
    targets: ["anxiety", "stutter", "general"],
    description: "Identify negative self-talk about speaking and replace it with accurate, balanced thinking.",
    steps: [
      "Write down one thought you have before a difficult speaking situation.",
      "Ask: Is this thought 100% true? What's the evidence against it?",
      "Rewrite the thought more accurately. Not 'I will fail' but 'I might struggle, and I'll handle it'.",
      "Say the reframed thought aloud three times.",
      "Notice how your body feels after.",
    ],
    successMetrics: ["Identified one negative thought", "Created a balanced reframe", "Felt slightly calmer"],
    emotionalStates: ["fragile", "steady", "open", "energised"],
    requiredStreak: 0,
    personalityFit: ["perfectionist", "overthinker"],
  },

  systematic_desensitisation: {
    id: "systematic_desensitisation",
    name: "Graduated Exposure",
    category: "anxiety",
    difficulty: 4,
    duration: 20,
    targets: ["anxiety", "stutter"],
    description: "Gradually face feared speaking situations starting from easiest to hardest — builds real-world confidence.",
    steps: [
      "List 5 speaking situations from least to most feared.",
      "Today: visualise the easiest one vividly for 2 minutes.",
      "Then do it in real life — even briefly.",
      "Report back: what actually happened vs what you feared?",
      "Next session: move one step up the ladder.",
    ],
    successMetrics: ["Completed visualisation", "Attempted real-world exposure", "Reported outcome honestly"],
    emotionalStates: ["steady", "open", "energised"],
    requiredStreak: 3,
    personalityFit: ["avoider", "freezer"],
  },

  box_breathing: {
    id: "box_breathing",
    name: "Box Breathing",
    category: "foundation",
    difficulty: 1,
    duration: 5,
    targets: ["anxiety", "stutter", "general"],
    description: "4-4-4-4 breathing pattern used by athletes and therapists to instantly calm the nervous system.",
    steps: [
      "Inhale for 4 counts.",
      "Hold for 4 counts.",
      "Exhale for 4 counts.",
      "Hold for 4 counts.",
      "Repeat 4 times. This is one set.",
      "Do 2-3 sets.",
    ],
    successMetrics: ["Completed all cycles", "Heart rate felt lower", "Mind felt quieter"],
    emotionalStates: ["crisis", "low", "fragile", "steady", "open", "energised"],
    requiredStreak: 0,
    personalityFit: ["rusher", "freezer", "overthinker"],
  },

  // ── GENERAL COMMUNICATION ──
  vocal_warmup: {
    id: "vocal_warmup",
    name: "Vocal Warm-Up",
    category: "general",
    difficulty: 1,
    duration: 5,
    targets: ["general", "anxiety"],
    description: "Activate your voice before speaking — reduces vocal strain and increases confidence.",
    steps: [
      "Hum gently for 30 seconds — feel the vibration in your chest.",
      "Say 'mah-may-mee-moh-moo' 5 times, slowly.",
      "Say 'bah-bay-bee-boh-boo' 5 times.",
      "Read any sentence aloud, emphasising different words each time.",
      "Yawn widely — this opens the throat naturally.",
    ],
    successMetrics: ["Voice feels warm and loose", "No throat tension", "Resonance felt in chest"],
    emotionalStates: ["low", "fragile", "steady", "open", "energised"],
    requiredStreak: 0,
    personalityFit: ["perfectionist", "avoider", "rusher", "freezer", "overthinker"],
  },

  pace_control: {
    id: "pace_control",
    name: "Pace & Pause Mastery",
    category: "general",
    difficulty: 3,
    duration: 12,
    targets: ["general", "stutter", "anxiety"],
    description: "Learn to use deliberate pausing and controlled pace — the mark of a confident communicator.",
    steps: [
      "Read a paragraph aloud at your normal speed. Time it.",
      "Read the same paragraph 30% slower. Notice what changes.",
      "Now add a deliberate 1-second pause at every comma and full stop.",
      "Record yourself and listen back.",
      "Identify 2 moments where the pause made you sound more authoritative.",
    ],
    successMetrics: ["Maintained slower pace throughout", "Used deliberate pauses", "Identified confidence moments"],
    emotionalStates: ["steady", "open", "energised"],
    requiredStreak: 3,
    personalityFit: ["rusher", "overthinker"],
  },

  storytelling_structure: {
    id: "storytelling_structure",
    name: "Structured Storytelling",
    category: "advanced_general",
    difficulty: 4,
    duration: 15,
    targets: ["general"],
    description: "Learn to tell any story with beginning, tension, and resolution — the foundation of compelling communication.",
    steps: [
      "Choose a simple real event from your week.",
      "Tell it in 3 parts: Setup (who, where, when), Conflict (what went wrong/interesting), Resolution (what happened).",
      "Time yourself — aim for 90 seconds.",
      "Tell the same story again but start with the conflict.",
      "Notice how starting with tension immediately grabs attention.",
    ],
    successMetrics: ["Used clear 3-part structure", "Stayed within time", "Felt engaged while telling it"],
    emotionalStates: ["steady", "open", "energised"],
    requiredStreak: 5,
    personalityFit: ["perfectionist", "overthinker"],
  },

  mirror_practice: {
    id: "mirror_practice",
    name: "Mirror Practice",
    category: "confidence",
    difficulty: 2,
    duration: 8,
    targets: ["anxiety", "general"],
    description: "Practice eye contact and facial expression in a safe, controlled environment.",
    steps: [
      "Stand in front of a mirror.",
      "Maintain eye contact with yourself for 30 seconds — don't look away.",
      "Introduce yourself aloud: name, where you're from, one thing you enjoy.",
      "Say one thing you appreciate about yourself as a communicator.",
      "Smile — and hold it while you speak for one full minute.",
    ],
    successMetrics: ["Held eye contact throughout", "Completed introduction without stopping", "Felt less uncomfortable by the end"],
    emotionalStates: ["fragile", "steady", "open", "energised"],
    requiredStreak: 0,
    personalityFit: ["avoider", "freezer"],
  },

  phone_simulation: {
    id: "phone_simulation",
    name: "Phone Call Simulation",
    category: "exposure",
    difficulty: 4,
    duration: 10,
    targets: ["stutter", "anxiety"],
    description: "Simulate a phone call to build confidence in one of the most feared speaking contexts.",
    steps: [
      "Choose a scenario: ordering food, asking for information, booking something.",
      "Write out the key things you need to say.",
      "Call a recorded voicemail or a trusted friend.",
      "Complete the simulated call without hanging up early.",
      "Debrief: what went better than you expected?",
    ],
    successMetrics: ["Completed the full call", "Did not hang up early", "Identified one positive moment"],
    emotionalStates: ["steady", "open", "energised"],
    requiredStreak: 7,
    personalityFit: ["avoider", "freezer"],
  },
};

// ─── COACHING DECISION ENGINE ─────────────────────────────────────────────────
function selectExercises(soul, emotionalReading, memoryAnalysis) {
  const state = emotionalReading?.derivedState || "steady";
  const challenge = soul?.primaryChallenge || "general";
  const personality = soul?.communicationPersonality;
  const streak = memoryAnalysis?.streak || 0;
  const weakAreas = memoryAnalysis?.weakAreas || [];
  const neglected = memoryAnalysis?.neglectedArea;
  const pendingEvent = memoryAnalysis?.pendingEvent;

  // Filter eligible exercises
  let eligible = Object.values(EXERCISE_LIBRARY).filter(ex => {
    if (!ex.emotionalStates.includes(state)) return false;
    if (!ex.targets.includes(challenge) && !ex.targets.includes("general")) return false;
    if (ex.requiredStreak > streak) return false;
    return true;
  });

  // Score each exercise
  const scored = eligible.map(ex => {
    let score = 0;

    // Personality fit
    if (ex.personalityFit.includes(personality)) score += 4;

    // Weak area targeting
    if (weakAreas.some(w => w.name === ex.name)) score += 5;

    // Neglected area
    if (neglected === ex.name) score += 3;

    // Upcoming event — prioritise exposure exercises
    if (pendingEvent) {
      if (ex.category === "exposure" || ex.category === "anxiety") score += 4;
    }

    // State-based scoring
    const statePriority = {
      crisis: { foundation: 5, anxiety: 3 },
      low: { foundation: 4, anxiety: 4, confidence: 2 },
      fragile: { foundation: 3, fluency: 2, anxiety: 3, confidence: 3 },
      steady: { fluency: 4, anxiety: 3, general: 3, confidence: 3 },
      open: { advanced_fluency: 4, fluency: 3, anxiety: 3, exposure: 4 },
      energised: { advanced_fluency: 5, exposure: 5, advanced_general: 4 },
    };
    const categoryBonus = statePriority[state]?.[ex.category] || 0;
    score += categoryBonus;

    // Difficulty alignment with state
    const idealDifficulty = {
      crisis: 1, low: 1, fragile: 2, steady: 3, open: 4, energised: 5
    };
    const diffGap = Math.abs(ex.difficulty - (idealDifficulty[state] || 3));
    score -= diffGap;

    return { ...ex, score };
  });

  // Sort and pick
  scored.sort((a, b) => b.score - a.score);

  // Session structure based on state
  const sessionStructures = {
    crisis:    { count: 1, categories: ["foundation"] },
    low:       { count: 2, categories: ["foundation", "anxiety"] },
    fragile:   { count: 2, categories: ["foundation", "fluency"] },
    steady:    { count: 3, categories: ["foundation", "fluency", "general"] },
    open:      { count: 3, categories: ["fluency", "anxiety", "exposure"] },
    energised: { count: 4, categories: ["fluency", "advanced_fluency", "exposure", "general"] },
  };

  const structure = sessionStructures[state] || sessionStructures.steady;

  // Always start with a foundation exercise if state is fragile or below
  const selected = [];
  const usedCategories = new Set();

  if (["crisis", "low", "fragile"].includes(state)) {
    const foundation = scored.find(e => e.category === "foundation");
    if (foundation) { selected.push(foundation); usedCategories.add(foundation.id); }
  }

  for (const ex of scored) {
    if (selected.length >= structure.count) break;
    if (!usedCategories.has(ex.id)) {
      selected.push(ex);
      usedCategories.add(ex.id);
    }
  }

  return selected;
}

// ─── COACHING MESSAGE GENERATOR ───────────────────────────────────────────────
function generateCoachingIntro(exercise, soul, emotionalReading, position) {
  const name = soul?.name || "you";
  const state = emotionalReading?.derivedState || "steady";
  const personality = soul?.communicationPersonality;

  const intros = {
    first: {
      energised: `Let's open with ${exercise.name}. You're ready for this — go in with full intention.`,
      open: `We'll start with ${exercise.name}. Take your time, there's no rush.`,
      steady: `First up: ${exercise.name}. This is a solid foundation for today.`,
      fragile: `Let's begin gently with ${exercise.name}. No pressure — just presence.`,
      low: `We'll start very simply — ${exercise.name}. Just breathe and follow the steps.`,
      crisis: `Just one thing today, ${name}. ${exercise.name}. Nothing else matters right now.`,
    },
    middle: {
      energised: `Good. Now — ${exercise.name}. This is where it gets interesting.`,
      open: `Moving on to ${exercise.name}. You've earned this step.`,
      steady: `Next: ${exercise.name}. This builds on what you just did.`,
      fragile: `One more — ${exercise.name}. We'll take it slowly.`,
      low: `One more exercise — ${exercise.name}. You're doing well.`,
    },
    last: {
      energised: `Final exercise — ${exercise.name}. Finish strong, ${name}.`,
      open: `Last one: ${exercise.name}. Make it count.`,
      steady: `To close: ${exercise.name}. This will be a good end to today's session.`,
      fragile: `Last thing — ${exercise.name}. Then you're done for today.`,
      low: `Almost done — ${exercise.name}. Then you can rest.`,
    },
  };

  const positionKey = position === 0 ? "first" : position === "last" ? "last" : "middle";
  return intros[positionKey]?.[state] || `Next exercise: ${exercise.name}.`;
}

// ─── EXERCISE COMPONENT ───────────────────────────────────────────────────────
function ExerciseCard({ exercise, soul, emotionalReading, position, total, onComplete }) {
  const [phase, setPhase] = useState("intro"); // intro|active|rating|done
  const [currentStep, setCurrentStep] = useState(0);
  const [rating, setRating] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);
  const isLast = position === total - 1;

  const intro = generateCoachingIntro(exercise, soul, emotionalReading, position === 0 ? 0 : isLast ? "last" : "middle");
  const state = emotionalReading?.derivedState || "steady";

  const difficultyColors = { 1: "#34d399", 2: "#60a5fa", 3: "#fbbf24", 4: "#f97316", 5: "#f87171" };
  const difficultyLabels = { 1: "Gentle", 2: "Easy", 3: "Moderate", 4: "Challenging", 5: "Advanced" };

  useEffect(() => {
    if (phase === "active") {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [phase]);

  function formatTime(s) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }

  function completeExercise() {
    const score = rating
      ? Math.round((rating / 5) * 100)
      : 70;
    onComplete({
      id: exercise.id,
      name: exercise.name,
      score,
      difficulty: difficultyLabels[exercise.difficulty],
      duration: elapsed,
    });
    setPhase("done");
  }

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 20,
      overflow: "hidden",
      animation: "fadeSlideIn 0.5s ease",
    }}>
      {/* Exercise header */}
      <div style={{
        padding: "20px 24px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
      }}>
        <div>
          <div style={{ color: "#64748b", fontSize: 11, letterSpacing: "0.07em", marginBottom: 6 }}>
            EXERCISE {position + 1} OF {total}
          </div>
          <div style={{ color: "#e2e8f0", fontSize: 17, marginBottom: 4 }}>{exercise.name}</div>
          <div style={{ color: "#64748b", fontSize: 12, fontStyle: "italic", lineHeight: 1.5 }}>
            {exercise.description}
          </div>
        </div>
        <div style={{
          padding: "5px 12px",
          background: `${difficultyColors[exercise.difficulty]}15`,
          border: `1px solid ${difficultyColors[exercise.difficulty]}30`,
          borderRadius: 10,
          color: difficultyColors[exercise.difficulty],
          fontSize: 11, flexShrink: 0, marginLeft: 12,
          letterSpacing: "0.04em",
        }}>{difficultyLabels[exercise.difficulty]}</div>
      </div>

      {/* Therapist intro message */}
      {phase === "intro" && (
        <div style={{ padding: "20px 24px" }}>
          <div style={{
            padding: "16px 18px",
            background: "rgba(99,102,241,0.08)",
            border: "1px solid rgba(99,102,241,0.15)",
            borderRadius: 14,
            marginBottom: 20,
            display: "flex", gap: 12,
          }}>
            <span style={{ fontSize: 16 }}>🎙️</span>
            <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6, fontStyle: "italic" }}>
              "{intro}"
            </p>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: "#475569", fontSize: 11, letterSpacing: "0.06em", marginBottom: 10 }}>
              SUCCESS MARKERS
            </div>
            {exercise.successMetrics.map((m, i) => (
              <div key={i} style={{
                display: "flex", gap: 8, alignItems: "flex-start",
                marginBottom: 6,
              }}>
                <span style={{ color: "#34d399", fontSize: 12, marginTop: 2 }}>✓</span>
                <span style={{ color: "#64748b", fontSize: 13 }}>{m}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ color: "#334155", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
              ⏱ {exercise.duration} min
            </span>
          </div>
          <button
            onClick={() => setPhase("active")}
            style={{
              width: "100%", marginTop: 18,
              padding: "15px",
              background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              border: "none", borderRadius: 13,
              color: "#fff", fontSize: 15,
              fontFamily: "Georgia, serif",
              cursor: "pointer",
              boxShadow: "0 6px 20px rgba(99,102,241,0.3)",
            }}
          >Begin Exercise →</button>
        </div>
      )}

      {/* Active phase */}
      {phase === "active" && (
        <div style={{ padding: "20px 24px" }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 20,
          }}>
            <div style={{ color: "#64748b", fontSize: 12 }}>Step {currentStep + 1} of {exercise.steps.length}</div>
            <div style={{
              padding: "4px 12px",
              background: "rgba(99,102,241,0.1)",
              border: "1px solid rgba(99,102,241,0.2)",
              borderRadius: 10, color: "#818cf8", fontSize: 12, fontFamily: "monospace",
            }}>{formatTime(elapsed)}</div>
          </div>

          {/* Progress bar */}
          <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, marginBottom: 24 }}>
            <div style={{
              height: "100%",
              width: `${((currentStep + 1) / exercise.steps.length) * 100}%`,
              background: "linear-gradient(90deg, #6366f1, #10b981)",
              borderRadius: 2, transition: "width 0.4s ease",
            }} />
          </div>

          <div style={{
            padding: "22px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            marginBottom: 20,
            minHeight: 80,
          }}>
            <p style={{
              color: "#e2e8f0", fontSize: 16,
              lineHeight: 1.7, fontStyle: "italic",
            }}>
              {exercise.steps[currentStep]}
            </p>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(s => s - 1)}
                style={{
                  flex: 1, padding: "13px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12, color: "#475569",
                  fontFamily: "Georgia, serif", fontSize: 13, cursor: "pointer",
                }}
              >← Back</button>
            )}
            <button
              onClick={() => {
                if (currentStep < exercise.steps.length - 1) {
                  setCurrentStep(s => s + 1);
                } else {
                  setPhase("rating");
                }
              }}
              style={{
                flex: 2, padding: "13px",
                background: currentStep === exercise.steps.length - 1
                  ? "linear-gradient(135deg, #10b981, #059669)"
                  : "linear-gradient(135deg, #6366f1, #4f46e5)",
                border: "none", borderRadius: 12,
                color: "#fff", fontFamily: "Georgia, serif",
                fontSize: 14, cursor: "pointer",
                boxShadow: "0 4px 14px rgba(99,102,241,0.25)",
              }}
            >
              {currentStep === exercise.steps.length - 1 ? "Complete Exercise ✓" : "Next Step →"}
            </button>
          </div>
        </div>
      )}

      {/* Rating phase */}
      {phase === "rating" && (
        <div style={{ padding: "20px 24px" }}>
          <div style={{
            padding: "16px 18px", marginBottom: 20,
            background: "rgba(52,211,153,0.07)",
            border: "1px solid rgba(52,211,153,0.15)",
            borderRadius: 14,
            display: "flex", gap: 12, alignItems: "center",
          }}>
            <span style={{ fontSize: 20 }}>✓</span>
            <p style={{ color: "#6ee7b7", fontSize: 14, lineHeight: 1.5 }}>
              Exercise complete. Time: {formatTime(elapsed)}.
            </p>
          </div>
          <p style={{ color: "#64748b", fontSize: 14, marginBottom: 16, fontStyle: "italic" }}>
            How did that feel? Honest self-assessment builds faster progress.
          </p>
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {[
              { v: 1, label: "Struggled", color: "#f87171" },
              { v: 2, label: "Hard", color: "#f97316" },
              { v: 3, label: "Okay", color: "#fbbf24" },
              { v: 4, label: "Good", color: "#60a5fa" },
              { v: 5, label: "Nailed it", color: "#34d399" },
            ].map(opt => (
              <button key={opt.v} onClick={() => setRating(opt.v)} style={{
                flex: 1, padding: "12px 4px",
                background: rating === opt.v ? `${opt.color}20` : "rgba(255,255,255,0.03)",
                border: rating === opt.v ? `1px solid ${opt.color}50` : "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10, color: rating === opt.v ? opt.color : "#334155",
                fontSize: 10, fontFamily: "Georgia, serif",
                cursor: "pointer", transition: "all 0.2s",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              }}>
                <span style={{ fontSize: 14 }}>{opt.v}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
          <button
            onClick={completeExercise}
            disabled={!rating}
            style={{
              width: "100%", padding: "14px",
              background: rating ? "linear-gradient(135deg, #6366f1, #4f46e5)" : "rgba(255,255,255,0.04)",
              border: "none", borderRadius: 12,
              color: rating ? "#fff" : "#334155",
              fontFamily: "Georgia, serif", fontSize: 14,
              cursor: rating ? "pointer" : "default",
              transition: "all 0.2s",
            }}
          >{isLast ? "Complete Session →" : "Next Exercise →"}</button>
        </div>
      )}

      {phase === "done" && (
        <div style={{ padding: "16px 24px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: "#34d399", fontSize: 16 }}>✓</span>
          <span style={{ color: "#64748b", fontSize: 13, fontStyle: "italic" }}>
            {exercise.name} — completed
          </span>
          <span style={{ marginLeft: "auto", color: "#475569", fontSize: 12 }}>
            {rating ? `${Math.round((rating / 5) * 100)}%` : ""}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── MAIN COACHING ENGINE COMPONENT ──────────────────────────────────────────
export default function AdaptiveCoachingEngine({ soul = {}, emotionalReading = {}, memoryAnalysis = {}, onSessionComplete }) {
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [completedExercises, setCompletedExercises] = useState([]);
  const [sessionPhase, setSessionPhase] = useState("briefing"); // briefing|active|complete
  const [sessionScore, setSessionScore] = useState(null);

  useEffect(() => {
    const exercises = selectExercises(soul, emotionalReading, memoryAnalysis);
    setSelectedExercises(exercises);
  }, []);

  function handleExerciseComplete(result) {
    setCompletedExercises(prev => {
      const updated = [...prev, result];
      if (updated.length === selectedExercises.length) {
        const avg = Math.round(updated.reduce((a, b) => a + b.score, 0) / updated.length);
        setSessionScore(avg);
        setTimeout(() => setSessionPhase("complete"), 400);
      }
      return updated;
    });
  }

  const state = emotionalReading?.derivedState || "steady";
  const sessionRec = emotionalReading?.sessionRecommendation;
  const stateColors = {
    crisis: "#818cf8", low: "#60a5fa", fragile: "#fbbf24",
    steady: "#34d399", open: "#a78bfa", energised: "#f472b6",
  };
  const accentColor = stateColors[state] || "#6366f1";

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #07080f 0%, #0a0d14 60%, #07080f 100%)",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      color: "#cbd5e1",
      padding: "0 0 60px 0",
    }}>
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: `radial-gradient(ellipse 50% 35% at 80% 10%, ${accentColor}07 0%, transparent 70%)`,
        pointerEvents: "none", transition: "background 2s",
      }} />

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 24px 0" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
          <div style={{
            width: 46, height: 46, borderRadius: "50%",
            background: "linear-gradient(135deg, #6366f1, #10b981)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, boxShadow: `0 0 20px ${accentColor}25`,
          }}>🎯</div>
          <div>
            <div style={{ color: "#e2e8f0", fontSize: 17, fontWeight: 600 }}>Adaptive Coaching</div>
            <div style={{ color: "#334155", fontSize: 12, fontStyle: "italic" }}>
              {selectedExercises.length} exercises · personalised for today
            </div>
          </div>
          <div style={{
            marginLeft: "auto", padding: "5px 13px",
            background: `${accentColor}12`,
            border: `1px solid ${accentColor}25`,
            borderRadius: 20, color: accentColor, fontSize: 11,
          }}>{state.charAt(0).toUpperCase() + state.slice(1)} mode</div>
        </div>

        {/* Briefing phase */}
        {sessionPhase === "briefing" && (
          <div style={{ animation: "fadeSlideIn 0.5s ease" }}>
            <div style={{
              padding: "22px",
              background: "rgba(99,102,241,0.06)",
              border: "1px solid rgba(99,102,241,0.15)",
              borderRadius: 18, marginBottom: 20,
            }}>
              <div style={{ color: "#6366f1", fontSize: 11, letterSpacing: "0.07em", marginBottom: 12 }}>
                🧠 COACHING LOGIC — WHY THESE EXERCISES
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {selectedExercises.map((ex, i) => (
                  <div key={ex.id} style={{
                    display: "flex", gap: 12, alignItems: "flex-start",
                    padding: "12px 14px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 12,
                  }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: "50%",
                      background: `${accentColor}20`,
                      border: `1px solid ${accentColor}30`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: accentColor, fontSize: 11, flexShrink: 0,
                    }}>{i + 1}</div>
                    <div>
                      <div style={{ color: "#e2e8f0", fontSize: 14, marginBottom: 2 }}>{ex.name}</div>
                      <div style={{ color: "#475569", fontSize: 12 }}>
                        {ex.category.replace(/_/g, " ")} · {ex.duration} min
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {emotionalReading?.openingMessage && (
              <div style={{
                padding: "18px 20px", marginBottom: 20,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 16,
                display: "flex", gap: 12,
              }}>
                <span style={{ fontSize: 16, marginTop: 2 }}>🎙️</span>
                <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.65, fontStyle: "italic" }}>
                  "{emotionalReading.openingMessage}"
                </p>
              </div>
            )}

            <button
              onClick={() => setSessionPhase("active")}
              style={{
                width: "100%", padding: "17px",
                background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
                border: "none", borderRadius: 14,
                color: "#fff", fontSize: 16, fontFamily: "Georgia, serif",
                cursor: "pointer",
                boxShadow: `0 8px 24px ${accentColor}30`,
                letterSpacing: "0.02em",
              }}
            >Begin Session →</button>
          </div>
        )}

        {/* Active session */}
        {sessionPhase === "active" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Session progress */}
            <div style={{
              padding: "14px 18px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 14,
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <span style={{ color: "#475569", fontSize: 12 }}>
                {completedExercises.length} of {selectedExercises.length} complete
              </span>
              <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                <div style={{
                  height: "100%",
                  width: `${(completedExercises.length / selectedExercises.length) * 100}%`,
                  background: `linear-gradient(90deg, #6366f1, ${accentColor})`,
                  borderRadius: 2, transition: "width 0.5s ease",
                }} />
              </div>
              <span style={{ color: accentColor, fontSize: 12 }}>
                {Math.round((completedExercises.length / selectedExercises.length) * 100)}%
              </span>
            </div>

            {selectedExercises.map((ex, i) => (
              <ExerciseCard
                key={ex.id}
                exercise={ex}
                soul={soul}
                emotionalReading={emotionalReading}
                position={i}
                total={selectedExercises.length}
                onComplete={handleExerciseComplete}
              />
            ))}
          </div>
        )}

        {/* Complete phase */}
        {sessionPhase === "complete" && (
          <div style={{ animation: "fadeSlideIn 0.6s ease" }}>
            <div style={{
              padding: "32px",
              background: `${accentColor}08`,
              border: `1px solid ${accentColor}20`,
              borderRadius: 20, textAlign: "center", marginBottom: 20,
            }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>
                {sessionScore >= 80 ? "🌟" : sessionScore >= 60 ? "✨" : "🌱"}
              </div>
              <div style={{ color: "#e2e8f0", fontSize: 22, marginBottom: 8 }}>
                Session Complete
              </div>
              <div style={{ color: accentColor, fontSize: 36, fontWeight: 600, marginBottom: 8 }}>
                {sessionScore}%
              </div>
              <div style={{ color: "#64748b", fontSize: 13, fontStyle: "italic" }}>
                {sessionScore >= 80
                  ? "An excellent session. This is what consistent progress looks like."
                  : sessionScore >= 60
                  ? "Solid work. Every session like this compounds."
                  : "You showed up. That matters more than the score."}
              </div>
            </div>

            {/* Completed exercises summary */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {completedExercises.map((ex, i) => (
                <div key={i} style={{
                  padding: "12px 16px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 12,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ color: "#34d399" }}>✓</span>
                    <span style={{ color: "#94a3b8", fontSize: 13 }}>{ex.name}</span>
                  </div>
                  <span style={{
                    color: ex.score >= 80 ? "#34d399" : ex.score >= 60 ? "#fbbf24" : "#f87171",
                    fontSize: 13,
                  }}>{ex.score}%</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => onSessionComplete && onSessionComplete({
                exercises: completedExercises,
                avgScore: sessionScore,
                state,
              })}
              style={{
                width: "100%", padding: "16px",
                background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                border: "none", borderRadius: 14,
                color: "#fff", fontSize: 15, fontFamily: "Georgia, serif",
                cursor: "pointer",
                boxShadow: "0 6px 20px rgba(99,102,241,0.3)",
              }}
            >Save & Continue →</button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>
    </div>
  );
}
