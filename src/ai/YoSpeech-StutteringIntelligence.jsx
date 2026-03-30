import { useState, useEffect, useRef } from "react";

// ─── STUTTERING KNOWLEDGE BASE ────────────────────────────────────────────────
// The most comprehensive offline stutter intelligence ever built into an app

const STUTTER_TYPES = {
  repetitions: {
    id: "repetitions",
    name: "Repetitions",
    description: "Repeating sounds, syllables, or words",
    examples: ["I w-w-want to", "I want want to go", "Li-li-like this"],
    mechanism: "The speech motor system gets stuck in a loop, replaying the same movement pattern.",
    primaryTechniques: ["easy_onset", "diaphragmatic_breathing", "light_contact"],
    cognitivePattern: "Often triggered by anticipating difficulty — the brain 'pre-stutters' before the word.",
    bodyLocation: "Lips, tongue, jaw",
  },
  prolongations: {
    id: "prolongations",
    name: "Prolongations",
    description: "Stretching sounds out abnormally",
    examples: ["Liiiiike this", "Ssssomething happened", "I waaaant to go"],
    mechanism: "The airflow continues but the articulators freeze in position, unable to transition to the next sound.",
    primaryTechniques: ["easy_onset", "light_contact", "pace_control"],
    cognitivePattern: "Prolongations often increase when the speaker is trying to 'push through' rather than releasing.",
    bodyLocation: "Throat, tongue, lips",
  },
  blocks: {
    id: "blocks",
    name: "Blocks",
    description: "Complete stoppage — nothing comes out",
    examples: ["I want to... [silence] ...go", "[mouth open, no sound]"],
    mechanism: "Complete closure of the vocal tract — larynx, lips, or tongue locks shut. No airflow.",
    primaryTechniques: ["pull_out", "cancellation", "easy_onset", "diaphragmatic_breathing"],
    cognitivePattern: "Blocks are the most severe and often carry the most shame. The silence feels unbearable.",
    bodyLocation: "Larynx (most common), lips, tongue",
    note: "Blocks are the hardest to treat but respond very well to pull-out technique and airflow therapy.",
  },
};

const TRIGGER_PROFILES = {
  phones: {
    id: "phones",
    name: "Phone Calls",
    severity: 9,
    whyHard: [
      "No visual feedback — you can't see the listener's face",
      "Silence feels more dangerous on a phone",
      "You can't use gesture or expression to fill gaps",
      "The expectation to speak immediately when answered",
    ],
    cognitiveDistortions: [
      "They will hang up if I stutter",
      "They will think I'm mentally deficient",
      "I must speak immediately or seem rude",
    ],
    gradedExposure: [
      "Call a recorded voicemail and leave a message",
      "Call a business with a known script (e.g. 'What time do you close?')",
      "Call a trusted friend with no script",
      "Call a service line about something real",
      "Call in a professional context",
    ],
    immediateStrategies: [
      "Prepare 2–3 key sentences before calling",
      "Allow silence — it's your phone too",
      "If you block, slow down and use easy onset to restart",
      "End the call on your terms, not theirs",
    ],
  },
  authority: {
    id: "authority",
    name: "Authority Figures",
    severity: 8,
    whyHard: [
      "Power imbalance activates deeper fear responses",
      "Judgement feels more consequential",
      "The need to appear competent conflicts with the stutter",
      "Eye contact is expected and harder to maintain",
    ],
    cognitiveDistortions: [
      "They will judge my intelligence by my speech",
      "Stuttering means I'm not ready for this role",
      "They expect fluency and I'll disappoint them",
    ],
    gradedExposure: [
      "Ask a simple question to a teacher/manager in a low-stakes moment",
      "Disagree with something minor in a meeting",
      "Present an idea directly to a supervisor",
      "Have a longer 1:1 conversation with an authority figure",
      "Lead a discussion or meeting",
    ],
    immediateStrategies: [
      "Slow down — authority figures respect deliberate pacing",
      "Prepare your core message in advance",
      "Remember: they are evaluating your ideas, not your fluency",
      "Voluntary disclosure can immediately reduce pressure",
    ],
  },
  groups: {
    id: "groups",
    name: "Group Settings",
    severity: 8,
    whyHard: [
      "Multiple observers multiply perceived judgement",
      "Turn-taking pressure is unpredictable",
      "You can't control when the spotlight lands on you",
      "Other people speaking fluently creates comparison pressure",
    ],
    cognitiveDistortions: [
      "Everyone is watching me stutter",
      "I'm ruining the flow of the conversation",
      "They're waiting for me to finish — impatiently",
    ],
    gradedExposure: [
      "Speak in a group of 2–3 trusted people",
      "Ask one question in a small meeting",
      "Make a comment in a group of 5–6 people",
      "Present briefly to a small familiar group",
      "Speak in a large unknown group",
    ],
    immediateStrategies: [
      "Prepare one contribution before the meeting",
      "Speak earlier rather than later — waiting increases anxiety",
      "Focus on your message, not your delivery",
      "Use pauses deliberately — they read as confidence",
    ],
  },
  strangers: {
    id: "strangers",
    name: "Strangers",
    severity: 7,
    whyHard: [
      "No established relationship — first impressions feel permanent",
      "No context for how they'll react to stuttering",
      "Social scripts (greetings, introductions) are highest-risk words",
      "The interaction often can't be recovered if it goes wrong",
    ],
    cognitiveDistortions: [
      "They'll remember me as 'the one who stutters'",
      "They'll be uncomfortable and I'll make the situation worse",
      "A stranger has no reason to be patient with me",
    ],
    gradedExposure: [
      "Ask a stranger for the time",
      "Order something simple at a counter",
      "Ask for directions",
      "Make small talk with a shopkeeper",
      "Introduce yourself to someone new",
    ],
    immediateStrategies: [
      "Remember: most strangers are more focused on themselves than on you",
      "Voluntary disclosure ('I stutter — bear with me') removes the fear of them noticing",
      "Start with low-consequence interactions",
    ],
  },
  presentations: {
    id: "presentations",
    name: "Presentations & Public Speaking",
    severity: 10,
    whyHard: [
      "All attention focused on speaker with no escape",
      "Prepared content creates word-specific anticipatory anxiety",
      "Silence is magnified in a quiet room",
      "Performance expectation is at its highest",
    ],
    cognitiveDistortions: [
      "One stutter will ruin the entire presentation",
      "The audience will stop believing my content because of my speech",
      "I must be fluent to be credible",
    ],
    gradedExposure: [
      "Present to yourself in a mirror",
      "Present to one trusted person",
      "Present to a small familiar group",
      "Present to an unfamiliar small group",
      "Present to a large group",
    ],
    immediateStrategies: [
      "Know your material deeply — fluency comes from confidence in content",
      "Build in pauses deliberately — they feel longer to you than to the audience",
      "If you block, slow down and use easy onset to restart",
      "Voluntary disclosure at the start removes all anticipatory pressure",
      "The audience wants you to succeed — remember that",
    ],
  },
};

// ─── VOLUNTARY DISCLOSURE ENGINE ─────────────────────────────────────────────
// One of the most powerful tools for people who stutter — rarely taught
const DISCLOSURE_SCRIPTS = {
  casual: [
    "Just so you know, I stutter sometimes — it doesn't mean I'm nervous or unsure.",
    "I stutter occasionally — don't worry, I'll get there.",
    "I have a stutter — I'll take my time if you don't mind.",
  ],
  professional: [
    "Before I begin, I want to mention that I stutter. It doesn't affect my thinking or my message — I just need a moment sometimes.",
    "I stutter, and I've found that mentioning it upfront makes conversations easier for everyone.",
    "You may notice I stutter occasionally. I'm not nervous — it's just how I speak.",
  ],
  presentation: [
    "Good morning — I stutter, and I've decided that's not going to stop me from presenting today.",
    "Before I start, I want to acknowledge that I stutter. I've prepared this thoroughly and I'm confident in the content.",
    "I stutter — so if I take a moment here and there, I'm just working through it. Let's begin.",
  ],
  phone: [
    "Hi — I stutter, so please bear with me.",
    "Just a heads up — I have a stutter. I'll get through it.",
  ],
};

// ─── SHAME & IDENTITY WORK ────────────────────────────────────────────────────
const IDENTITY_WORK = {
  stages: [
    {
      id: "denial",
      name: "Denial & Hiding",
      description: "Pretending the stutter doesn't exist. Word substitution, avoidance, silence.",
      signs: ["Exhaustion from constant word-swapping", "Avoiding situations entirely", "Relief when you don't stutter, shame when you do"],
      nextStep: "The energy spent hiding is enormous. The first step is letting one trusted person see the real stutter.",
    },
    {
      id: "anger",
      name: "Anger & Frustration",
      description: "Resenting the stutter. Asking 'why me'. Feeling it's unfair.",
      signs: ["Rage after stuttering incidents", "Comparing yourself to fluent speakers", "Feeling cheated"],
      nextStep: "Anger at the stutter is actually progress — it means you've stopped pretending. Channel it into practice.",
    },
    {
      id: "bargaining",
      name: "Bargaining",
      description: "Believing if you just try hard enough, the stutter will disappear completely.",
      signs: ["Obsessing over fluency techniques", "Devastation when techniques don't work", "Making fluency the only measure of success"],
      nextStep: "The goal is not fluency — it is freedom. Freedom to speak even with a stutter.",
    },
    {
      id: "acceptance_approaching",
      name: "Approaching Acceptance",
      description: "Beginning to separate identity from stutter. Moments of speaking without shame.",
      signs: ["Occasionally forgetting to be ashamed", "Telling someone about your stutter voluntarily", "Speaking even when you know you'll stutter"],
      nextStep: "Each time you speak without shame, you're rewiring the connection between stutter and self-worth.",
    },
    {
      id: "integration",
      name: "Integration",
      description: "The stutter is part of your story, not the whole of it. It no longer controls decisions.",
      signs: ["Speaking up even in hard situations", "Disclosing naturally", "Measuring progress by freedom, not fluency"],
      nextStep: "Integration is not the end — it's a sustainable place from which to keep growing.",
    },
  ],

  detectStage(soul, memoryAnalysis) {
    const avoidance = soul?.avoidanceBehaviours?.length > 0;
    const shame = soul?.shameLevel;
    const hope = soul?.hopeLevel;
    const sessions = memoryAnalysis?.total || 0;

    if (avoidance && shame >= 4) return "denial";
    if (!avoidance && shame >= 3 && hope <= 2) return "anger";
    if (shame >= 3 && hope >= 3) return "bargaining";
    if (shame <= 2 && sessions >= 10) return "acceptance_approaching";
    if (shame <= 2 && hope >= 4 && sessions >= 20) return "integration";
    return "bargaining";
  },
};

// ─── SECONDARY BEHAVIOURS DETECTOR ───────────────────────────────────────────
const SECONDARY_BEHAVIOURS = {
  physical: [
    { id: "eye_contact_break", name: "Breaking eye contact", description: "Looking away during or before a stutter" },
    { id: "head_movement", name: "Head movements", description: "Nodding, shaking, or jerking the head during blocks" },
    { id: "facial_tension", name: "Facial tension", description: "Grimacing, jaw clenching, eye squeezing" },
    { id: "body_tension", name: "Body tension", description: "Shoulder hunching, fist clenching, foot tapping" },
  ],
  linguistic: [
    { id: "word_substitution", name: "Word substitution", description: "Swapping feared words for easier ones" },
    { id: "circumlocution", name: "Circumlocution", description: "Talking around a topic to avoid a feared word" },
    { id: "starter_phrases", name: "Starter phrases", description: "Using 'um', 'like', 'you know' to delay feared words" },
    { id: "revision", name: "Sentence revision", description: "Changing what you're saying mid-sentence" },
  ],
  situational: [
    { id: "situation_avoidance", name: "Situation avoidance", description: "Not entering feared speaking situations" },
    { id: "role_avoidance", name: "Role avoidance", description: "Avoiding jobs, positions, or relationships requiring speech" },
    { id: "silence", name: "Strategic silence", description: "Going quiet and letting others speak" },
    { id: "pretending", name: "Pretending", description: "Pretending not to know something to avoid saying it" },
  ],
};

// ─── TECHNIQUE DEEP-DIVE ENGINE ───────────────────────────────────────────────
const TECHNIQUE_DEEP_KNOWLEDGE = {
  easy_onset: {
    name: "Easy Onset",
    science: "Reduces laryngeal tension at the moment of phonation — the period when stuttering most commonly occurs.",
    commonMistakes: [
      "Starting too forcefully before 'going gentle' — the gentleness must happen at the very beginning",
      "Over-breathing — a small, relaxed breath is all that's needed",
      "Trying to use it on every single word rather than just initiations",
    ],
    whenItWorks: "Best on words beginning with vowels and voiced consonants (b, d, g, m, n, v, z)",
    whenItStruggles: "Plosive consonants (p, t, k) require a modified version — reduced pressure rather than soft breath",
    progressIndicator: "When easy onset becomes automatic rather than effortful, it's working.",
    personalisation: {
      perfectionist: "Don't grade the quality of your easy onset — just notice whether airflow was present.",
      rusher: "You must slow down before you can use this. The technique requires a tiny pause before the word.",
      avoider: "Easy onset gives you a tool to face feared words instead of avoiding them. Use it as permission to stay.",
    },
  },
  pull_out: {
    name: "Pull-Out Technique",
    science: "Interrupts the automaticity of a block by introducing conscious control at the moment of maximum tension.",
    commonMistakes: [
      "Giving up and forcing through rather than slowing into the pull-out",
      "Waiting too long — the pull-out works better when initiated early in a block",
      "Confusing pull-out with cancellation — pull-out happens IN the stutter, cancellation AFTER",
    ],
    whenItWorks: "Blocks and prolongations — gives real-time control during the stutter itself",
    whenItStruggles: "Rapid repetitions are too fast for pull-out — use easy onset prevention instead",
    progressIndicator: "When you can notice a block beginning and consciously slow into it rather than panicking.",
    personalisation: {
      freezer: "The pull-out is designed for you. The freeze is a block — and pull-out is the direct antidote.",
      rusher: "You must resist the urge to push through. The pull-out requires slowing at the moment when rushing feels most urgent.",
    },
  },
  cancellation: {
    name: "Cancellation",
    science: "Post-event correction that teaches the motor system a successful alternative immediately after failure.",
    commonMistakes: [
      "Skipping the pause — the pause between the stutter and the repetition is essential",
      "Rushing the cancellation — it must be slower and more deliberate than normal speech",
      "Feeling shame about the stutter being 'exposed' — the cancellation IS the technique, not the failure",
    ],
    whenItWorks: "All stutter types — especially powerful for reducing shame because it converts a stutter into a demonstration of skill",
    whenItStruggles: "Fast-paced conversations where pausing feels socially impossible",
    progressIndicator: "When cancellation starts to feel like confidence rather than correction.",
    personalisation: {
      perfectionist: "Cancellation reframes the stutter from a mistake into a skill demonstration. Use that.",
      avoider: "Cancellation requires staying in the speaking moment after stuttering — that's the hardest part for you, and the most important.",
    },
  },
};

// ─── STUTTER PATTERN ANALYSER ─────────────────────────────────────────────────
function analyseStutterPattern(soul, memoryAnalysis) {
  const stutterTypes = soul?.stutterType || [];
  const triggers = soul?.anxietyTriggers || [];
  const avoidances = soul?.avoidanceBehaviours || [];
  const shame = soul?.shameLevel || 3;
  const sessions = memoryAnalysis?.total || 0;

  const insights = [];

  // Type-specific insights
  if (stutterTypes.includes("blocks")) {
    insights.push({
      priority: 10,
      type: "stutter_type",
      icon: "🧱",
      title: "Blocking Pattern Detected",
      body: "Blocks are the most isolating stutter type because the silence feels endless from inside. The pull-out technique is your primary tool here — it works directly on the block mechanism.",
      action: "Prioritise pull-out practice in every session",
    });
  }

  if (stutterTypes.includes("repetitions") && stutterTypes.includes("blocks")) {
    insights.push({
      priority: 8,
      type: "pattern",
      icon: "🔄",
      title: "Mixed Pattern",
      body: "Having both repetitions and blocks suggests anticipatory anxiety is a key driver. You're stuttering on different words in different ways — the trigger is often the fear, not the word itself.",
      action: "Cognitive reframing and desensitisation work alongside technique",
    });
  }

  // Trigger insights
  if (triggers.includes("phones") && triggers.includes("authority")) {
    insights.push({
      priority: 9,
      type: "trigger",
      icon: "⚡",
      title: "Power & Distance Sensitivity",
      body: "You struggle most when there's no visual feedback AND when there's power asymmetry. Phone calls with authority figures would be your highest-difficulty situation.",
      action: "Build up to this combination gradually — it's the summit, not the starting point",
    });
  }

  // Avoidance insights
  if (avoidances.includes("word substitution") && avoidances.includes("situation avoidance")) {
    insights.push({
      priority: 9,
      type: "avoidance",
      icon: "🚪",
      title: "Double Avoidance Pattern",
      body: "You avoid both specific words AND entire situations. This suggests the avoidance has become a deeply habitual coping system. It's effective in the short term but continuously shrinks your world.",
      action: "Start with word-level avoidance — it's more granular and gives quicker wins",
    });
  }

  // Shame + sessions insight
  if (shame >= 4 && sessions < 5) {
    insights.push({
      priority: 8,
      type: "emotional",
      icon: "💜",
      title: "High Shame, Early Stage",
      body: "You're carrying significant shame at the start of this journey. That's common — but it means the emotional work is as important as the technical work right now.",
      action: "Shame work and identity exploration should run alongside every technique session",
    });
  }

  return insights.sort((a, b) => b.priority - a.priority);
}

// ─── EXPOSURE HIERARCHY BUILDER ───────────────────────────────────────────────
function buildExposureHierarchy(soul) {
  const triggers = soul?.anxietyTriggers || [];
  const hierarchy = [];

  // Sort triggers by severity
  const sortedTriggers = triggers
    .map(t => TRIGGER_PROFILES[t])
    .filter(Boolean)
    .sort((a, b) => a.severity - b.severity);

  sortedTriggers.forEach(trigger => {
    trigger.gradedExposure.forEach((step, idx) => {
      hierarchy.push({
        triggerId: trigger.id,
        triggerName: trigger.name,
        step: idx + 1,
        description: step,
        difficulty: Math.round((idx + 1) / trigger.gradedExposure.length * 10),
        completed: false,
      });
    });
  });

  return hierarchy.sort((a, b) => a.difficulty - b.difficulty);
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function StutteringIntelligence({ soul = {}, emotionalReading = {}, memoryAnalysis = {} }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedTrigger, setSelectedTrigger] = useState(null);
  const [selectedTechnique, setSelectedTechnique] = useState(null);
  const [selectedStage, setSelectedStage] = useState(null);
  const [exposureHierarchy, setExposureHierarchy] = useState([]);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [disclosureContext, setDisclosureContext] = useState("casual");

  const stutterInsights = analyseStutterPattern(soul, memoryAnalysis);
  const identityStage = IDENTITY_WORK.detectStage(soul, memoryAnalysis);
  const currentStageData = IDENTITY_WORK.stages.find(s => s.id === identityStage);
  const userTriggers = (soul?.anxietyTriggers || []).map(t => TRIGGER_PROFILES[t]).filter(Boolean);
  const userStutterTypes = (soul?.stutterType || []).map(t => STUTTER_TYPES[t]).filter(Boolean);

  useEffect(() => {
    setExposureHierarchy(buildExposureHierarchy(soul));
  }, []);

  const accentColor = "#8b5cf6";
  const tabs = ["overview", "triggers", "techniques", "identity", "exposure", "disclosure"];

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #07080f 0%, #0c0a14 50%, #07080f 100%)",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      color: "#cbd5e1",
      paddingBottom: 60,
    }}>
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "radial-gradient(ellipse 50% 35% at 60% 20%, rgba(139,92,246,0.06) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Header */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "28px 24px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
          <div style={{
            width: 46, height: 46, borderRadius: "50%",
            background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, boxShadow: "0 0 20px rgba(139,92,246,0.3)",
          }}>🧩</div>
          <div>
            <div style={{ color: "#e2e8f0", fontSize: 17, fontWeight: 600 }}>Stuttering Intelligence</div>
            <div style={{ color: "#334155", fontSize: 12, fontStyle: "italic" }}>
              {soul?.name ? `${soul.name}'s personalised stutter profile` : "Deep stutter analysis & coaching"}
            </div>
          </div>
          <div style={{
            marginLeft: "auto", padding: "5px 13px",
            background: "rgba(139,92,246,0.1)",
            border: "1px solid rgba(139,92,246,0.25)",
            borderRadius: 20, color: "#a78bfa", fontSize: 11,
          }}>{userStutterTypes.length} type{userStutterTypes.length !== 1 ? "s" : ""} · {userTriggers.length} trigger{userTriggers.length !== 1 ? "s" : ""}</div>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", gap: 0,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          marginBottom: 24, overflowX: "auto",
        }}>
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: "10px 16px",
              background: "none", border: "none",
              borderBottom: activeTab === tab ? "2px solid #8b5cf6" : "2px solid transparent",
              color: activeTab === tab ? "#a78bfa" : "#334155",
              fontSize: 12, fontFamily: "Georgia, serif",
              cursor: "pointer", textTransform: "capitalize",
              letterSpacing: "0.03em", transition: "all 0.2s",
              marginBottom: -1, whiteSpace: "nowrap",
            }}>{tab}</button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Stutter types */}
            {userStutterTypes.length > 0 && (
              <div style={{
                padding: "20px",
                background: "rgba(139,92,246,0.05)",
                border: "1px solid rgba(139,92,246,0.15)",
                borderRadius: 16,
              }}>
                <div style={{ color: "#8b5cf6", fontSize: 11, letterSpacing: "0.07em", marginBottom: 14 }}>
                  YOUR STUTTER TYPES
                </div>
                {userStutterTypes.map(type => (
                  <div key={type.id} style={{
                    padding: "14px 16px", marginBottom: 10,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 14,
                  }}>
                    <div style={{ color: "#e2e8f0", fontSize: 14, marginBottom: 6 }}>{type.name}</div>
                    <div style={{ color: "#64748b", fontSize: 12, lineHeight: 1.6, marginBottom: 8 }}>
                      {type.mechanism}
                    </div>
                    <div style={{ color: "#475569", fontSize: 11, fontStyle: "italic" }}>
                      Body: {type.bodyLocation}
                    </div>
                    {type.note && (
                      <div style={{
                        marginTop: 8, padding: "8px 12px",
                        background: "rgba(139,92,246,0.08)",
                        borderRadius: 8, color: "#a78bfa", fontSize: 12,
                      }}>Note: {type.note}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pattern insights */}
            {stutterInsights.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ color: "#475569", fontSize: 11, letterSpacing: "0.07em" }}>
                  PATTERN INSIGHTS
                </div>
                {stutterInsights.map((insight, i) => (
                  <div key={i} style={{
                    padding: "16px 18px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 14,
                    animation: `fadeSlideIn 0.4s ${i * 0.08}s ease both`,
                  }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <span style={{ fontSize: 20 }}>{insight.icon}</span>
                      <div>
                        <div style={{ color: "#e2e8f0", fontSize: 14, marginBottom: 6 }}>{insight.title}</div>
                        <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6, marginBottom: 8 }}>
                          {insight.body}
                        </div>
                        <div style={{
                          display: "inline-block",
                          padding: "4px 12px",
                          background: "rgba(139,92,246,0.1)",
                          border: "1px solid rgba(139,92,246,0.2)",
                          borderRadius: 10, color: "#a78bfa", fontSize: 11,
                        }}>→ {insight.action}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Secondary behaviours */}
            <div style={{
              padding: "20px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 16,
            }}>
              <div style={{ color: "#64748b", fontSize: 11, letterSpacing: "0.07em", marginBottom: 14 }}>
                SECONDARY BEHAVIOURS TO WATCH
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  ...SECONDARY_BEHAVIOURS.linguistic.slice(0, 2),
                  ...SECONDARY_BEHAVIOURS.situational.slice(0, 2),
                ].map((beh, i) => (
                  <div key={i} style={{
                    display: "flex", gap: 10,
                    padding: "10px 12px",
                    background: "rgba(255,255,255,0.02)",
                    borderRadius: 10,
                  }}>
                    <span style={{ color: "#f97316", fontSize: 12, marginTop: 2 }}>⚠</span>
                    <div>
                      <span style={{ color: "#94a3b8", fontSize: 13 }}>{beh.name}</span>
                      <span style={{ color: "#334155", fontSize: 12 }}> — {beh.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TRIGGERS TAB ── */}
        {activeTab === "triggers" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {userTriggers.length === 0 && (
              <div style={{ color: "#334155", fontSize: 14, fontStyle: "italic", textAlign: "center", padding: "40px 0" }}>
                No triggers recorded. Update your profile to see personalised trigger analysis.
              </div>
            )}
            {userTriggers.map(trigger => (
              <div key={trigger.id}>
                <button
                  onClick={() => setSelectedTrigger(selectedTrigger === trigger.id ? null : trigger.id)}
                  style={{
                    width: "100%",
                    padding: "16px 20px",
                    background: selectedTrigger === trigger.id
                      ? "rgba(139,92,246,0.1)" : "rgba(255,255,255,0.03)",
                    border: selectedTrigger === trigger.id
                      ? "1px solid rgba(139,92,246,0.3)" : "1px solid rgba(255,255,255,0.07)",
                    borderRadius: selectedTrigger === trigger.id ? "14px 14px 0 0" : 14,
                    cursor: "pointer", textAlign: "left",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ color: "#e2e8f0", fontSize: 14, marginBottom: 2 }}>{trigger.name}</div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <div style={{ display: "flex", gap: 2 }}>
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div key={i} style={{
                            width: 10, height: 4, borderRadius: 2,
                            background: i < trigger.severity ? "#8b5cf6" : "rgba(255,255,255,0.08)",
                          }} />
                        ))}
                      </div>
                      <span style={{ color: "#475569", fontSize: 11 }}>severity {trigger.severity}/10</span>
                    </div>
                  </div>
                  <span style={{ color: "#334155", fontSize: 16 }}>
                    {selectedTrigger === trigger.id ? "▲" : "▼"}
                  </span>
                </button>

                {selectedTrigger === trigger.id && (
                  <div style={{
                    padding: "20px",
                    background: "rgba(139,92,246,0.05)",
                    border: "1px solid rgba(139,92,246,0.2)",
                    borderTop: "none",
                    borderRadius: "0 0 14px 14px",
                    animation: "fadeSlideIn 0.3s ease",
                  }}>
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ color: "#64748b", fontSize: 11, letterSpacing: "0.06em", marginBottom: 8 }}>
                        WHY THIS IS HARD
                      </div>
                      {trigger.whyHard.map((reason, i) => (
                        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                          <span style={{ color: "#8b5cf6", fontSize: 12 }}>•</span>
                          <span style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.5 }}>{reason}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <div style={{ color: "#64748b", fontSize: 11, letterSpacing: "0.06em", marginBottom: 8 }}>
                        COGNITIVE DISTORTIONS
                      </div>
                      {trigger.cognitiveDistortions.map((d, i) => (
                        <div key={i} style={{
                          padding: "8px 12px", marginBottom: 6,
                          background: "rgba(248,113,113,0.07)",
                          border: "1px solid rgba(248,113,113,0.15)",
                          borderRadius: 8,
                          color: "#fca5a5", fontSize: 12, fontStyle: "italic",
                        }}>"{d}"</div>
                      ))}
                    </div>

                    <div>
                      <div style={{ color: "#64748b", fontSize: 11, letterSpacing: "0.06em", marginBottom: 8 }}>
                        IMMEDIATE STRATEGIES
                      </div>
                      {trigger.immediateStrategies.map((s, i) => (
                        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                          <span style={{ color: "#34d399", fontSize: 12 }}>→</span>
                          <span style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.5 }}>{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── TECHNIQUES TAB ── */}
        {activeTab === "techniques" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {Object.values(TECHNIQUE_DEEP_KNOWLEDGE).map(tech => (
              <div key={tech.name}>
                <button
                  onClick={() => setSelectedTechnique(selectedTechnique === tech.name ? null : tech.name)}
                  style={{
                    width: "100%",
                    padding: "16px 20px",
                    background: selectedTechnique === tech.name
                      ? "rgba(139,92,246,0.1)" : "rgba(255,255,255,0.03)",
                    border: selectedTechnique === tech.name
                      ? "1px solid rgba(139,92,246,0.3)" : "1px solid rgba(255,255,255,0.07)",
                    borderRadius: selectedTechnique === tech.name ? "14px 14px 0 0" : 14,
                    cursor: "pointer", textAlign: "left",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}
                >
                  <span style={{ color: "#e2e8f0", fontSize: 14 }}>{tech.name}</span>
                  <span style={{ color: "#334155" }}>{selectedTechnique === tech.name ? "▲" : "▼"}</span>
                </button>

                {selectedTechnique === tech.name && (
                  <div style={{
                    padding: "20px",
                    background: "rgba(139,92,246,0.05)",
                    border: "1px solid rgba(139,92,246,0.2)",
                    borderTop: "none",
                    borderRadius: "0 0 14px 14px",
                    animation: "fadeSlideIn 0.3s ease",
                  }}>
                    <div style={{
                      padding: "12px 14px", marginBottom: 16,
                      background: "rgba(99,102,241,0.08)",
                      borderRadius: 10, color: "#94a3b8",
                      fontSize: 13, lineHeight: 1.6, fontStyle: "italic",
                    }}>{tech.science}</div>

                    <div style={{ marginBottom: 14 }}>
                      <div style={{ color: "#f87171", fontSize: 11, letterSpacing: "0.06em", marginBottom: 8 }}>
                        COMMON MISTAKES
                      </div>
                      {tech.commonMistakes.map((m, i) => (
                        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                          <span style={{ color: "#f87171", fontSize: 12 }}>✕</span>
                          <span style={{ color: "#94a3b8", fontSize: 13 }}>{m}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <div style={{ color: "#34d399", fontSize: 11, letterSpacing: "0.06em", marginBottom: 6 }}>
                        BEST FOR
                      </div>
                      <div style={{ color: "#94a3b8", fontSize: 13 }}>{tech.whenItWorks}</div>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <div style={{ color: "#fbbf24", fontSize: 11, letterSpacing: "0.06em", marginBottom: 6 }}>
                        PROGRESS INDICATOR
                      </div>
                      <div style={{ color: "#94a3b8", fontSize: 13, fontStyle: "italic" }}>
                        "{tech.progressIndicator}"
                      </div>
                    </div>

                    {/* Personalised note */}
                    {soul?.communicationPersonality && tech.personalisation?.[soul.communicationPersonality] && (
                      <div style={{
                        padding: "12px 14px",
                        background: "rgba(139,92,246,0.08)",
                        border: "1px solid rgba(139,92,246,0.2)",
                        borderRadius: 10,
                      }}>
                        <div style={{ color: "#8b5cf6", fontSize: 10, letterSpacing: "0.06em", marginBottom: 4 }}>
                          FOR YOU SPECIFICALLY
                        </div>
                        <div style={{ color: "#c4b5fd", fontSize: 13, fontStyle: "italic" }}>
                          "{tech.personalisation[soul.communicationPersonality]}"
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── IDENTITY TAB ── */}
        {activeTab === "identity" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Current stage card */}
            {currentStageData && (
              <div style={{
                padding: "22px",
                background: "rgba(139,92,246,0.08)",
                border: "1px solid rgba(139,92,246,0.25)",
                borderRadius: 18,
              }}>
                <div style={{ color: "#8b5cf6", fontSize: 11, letterSpacing: "0.07em", marginBottom: 10 }}>
                  YOUR CURRENT STAGE
                </div>
                <div style={{ color: "#e2e8f0", fontSize: 18, marginBottom: 8 }}>
                  {currentStageData.name}
                </div>
                <div style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.7, marginBottom: 14 }}>
                  {currentStageData.description}
                </div>
                <div style={{
                  padding: "12px 14px",
                  background: "rgba(52,211,153,0.07)",
                  border: "1px solid rgba(52,211,153,0.15)",
                  borderRadius: 10,
                  color: "#6ee7b7", fontSize: 13, fontStyle: "italic",
                }}>
                  Next step: {currentStageData.nextStep}
                </div>
              </div>
            )}

            {/* All stages journey */}
            <div style={{ color: "#475569", fontSize: 11, letterSpacing: "0.07em", marginBottom: 4 }}>
              THE JOURNEY
            </div>
            {IDENTITY_WORK.stages.map((stage, i) => {
              const isActive = stage.id === identityStage;
              const isPast = IDENTITY_WORK.stages.findIndex(s => s.id === identityStage) > i;
              return (
                <div key={stage.id}>
                  <button
                    onClick={() => setSelectedStage(selectedStage === stage.id ? null : stage.id)}
                    style={{
                      width: "100%",
                      padding: "14px 18px",
                      background: isActive ? "rgba(139,92,246,0.1)" : "rgba(255,255,255,0.02)",
                      border: isActive ? "1px solid rgba(139,92,246,0.3)" : "1px solid rgba(255,255,255,0.06)",
                      borderRadius: selectedStage === stage.id ? "12px 12px 0 0" : 12,
                      cursor: "pointer", textAlign: "left",
                      display: "flex", alignItems: "center", gap: 12,
                      marginBottom: selectedStage === stage.id ? 0 : 6,
                    }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: isPast ? "rgba(52,211,153,0.15)" : isActive ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.05)",
                      border: isPast ? "1px solid rgba(52,211,153,0.3)" : isActive ? "1px solid rgba(139,92,246,0.4)" : "1px solid rgba(255,255,255,0.08)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: isPast ? "#34d399" : isActive ? "#a78bfa" : "#334155",
                      fontSize: 12, flexShrink: 0,
                    }}>{isPast ? "✓" : i + 1}</div>
                    <div>
                      <div style={{
                        color: isActive ? "#e2e8f0" : isPast ? "#64748b" : "#475569",
                        fontSize: 13,
                      }}>{stage.name}</div>
                      {isActive && (
                        <div style={{ color: "#8b5cf6", fontSize: 10, letterSpacing: "0.04em" }}>← You are here</div>
                      )}
                    </div>
                  </button>
                  {selectedStage === stage.id && (
                    <div style={{
                      padding: "16px 18px",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderTop: "none", borderRadius: "0 0 12px 12px",
                      marginBottom: 6,
                      animation: "fadeSlideIn 0.3s ease",
                    }}>
                      <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6, marginBottom: 10 }}>
                        {stage.description}
                      </div>
                      <div style={{ color: "#475569", fontSize: 11, letterSpacing: "0.05em", marginBottom: 6 }}>
                        SIGNS OF THIS STAGE
                      </div>
                      {stage.signs.map((sign, j) => (
                        <div key={j} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                          <span style={{ color: "#334155", fontSize: 12 }}>•</span>
                          <span style={{ color: "#475569", fontSize: 12 }}>{sign}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── EXPOSURE TAB ── */}
        {activeTab === "exposure" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{
              padding: "16px 18px",
              background: "rgba(99,102,241,0.07)",
              border: "1px solid rgba(99,102,241,0.15)",
              borderRadius: 14, marginBottom: 4,
            }}>
              <div style={{ color: "#818cf8", fontSize: 13, lineHeight: 1.6 }}>
                Your personalised exposure ladder — from easiest to hardest.
                Tick each step when complete. Start from the bottom.
              </div>
            </div>
            {exposureHierarchy.length === 0 && (
              <div style={{ color: "#334155", fontSize: 13, textAlign: "center", padding: "30px 0" }}>
                Complete onboarding to generate your exposure ladder.
              </div>
            )}
            {exposureHierarchy.map((step, i) => (
              <div key={i} style={{
                padding: "14px 18px",
                background: completedSteps.has(i) ? "rgba(52,211,153,0.07)" : "rgba(255,255,255,0.03)",
                border: completedSteps.has(i) ? "1px solid rgba(52,211,153,0.2)" : "1px solid rgba(255,255,255,0.07)",
                borderRadius: 14,
                display: "flex", gap: 14, alignItems: "center",
                animation: `fadeSlideIn 0.4s ${i * 0.04}s ease both`,
                opacity: completedSteps.has(i) ? 0.6 : 1,
              }}>
                <button
                  onClick={() => setCompletedSteps(prev => {
                    const next = new Set(prev);
                    next.has(i) ? next.delete(i) : next.add(i);
                    return next;
                  })}
                  style={{
                    width: 24, height: 24, borderRadius: "50%",
                    background: completedSteps.has(i) ? "rgba(52,211,153,0.2)" : "rgba(255,255,255,0.05)",
                    border: completedSteps.has(i) ? "1px solid rgba(52,211,153,0.4)" : "1px solid rgba(255,255,255,0.12)",
                    color: completedSteps.has(i) ? "#34d399" : "#334155",
                    fontSize: 12, cursor: "pointer", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >{completedSteps.has(i) ? "✓" : ""}</button>
                <div style={{ flex: 1 }}>
                  <div style={{ color: completedSteps.has(i) ? "#475569" : "#94a3b8", fontSize: 13, lineHeight: 1.5 }}>
                    {step.description}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    <span style={{ color: "#334155", fontSize: 11 }}>{step.triggerName}</span>
                    <span style={{ color: "#1e293b", fontSize: 11 }}>·</span>
                    <span style={{ color: "#334155", fontSize: 11 }}>difficulty {step.difficulty}/10</span>
                  </div>
                </div>
                <div style={{
                  display: "flex", gap: 2, flexShrink: 0,
                }}>
                  {Array.from({ length: 10 }).map((_, j) => (
                    <div key={j} style={{
                      width: 6, height: 6, borderRadius: 1,
                      background: j < step.difficulty
                        ? `hsl(${260 - step.difficulty * 12}, 70%, 65%)`
                        : "rgba(255,255,255,0.06)",
                    }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── DISCLOSURE TAB ── */}
        {activeTab === "disclosure" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{
              padding: "18px",
              background: "rgba(251,191,36,0.06)",
              border: "1px solid rgba(251,191,36,0.15)",
              borderRadius: 14,
            }}>
              <div style={{ color: "#fbbf24", fontSize: 11, letterSpacing: "0.06em", marginBottom: 8 }}>
                WHY VOLUNTARY DISCLOSURE WORKS
              </div>
              <div style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.65 }}>
                Telling people you stutter before you stutter removes the anticipatory anxiety of them "discovering" it.
                It shifts control back to you. Research shows it consistently reduces stuttering frequency and severity —
                not by hiding the stutter, but by removing the fear of it being seen.
              </div>
            </div>

            {/* Context selector */}
            <div style={{ display: "flex", gap: 8 }}>
              {["casual", "professional", "presentation", "phone"].map(ctx => (
                <button key={ctx} onClick={() => setDisclosureContext(ctx)} style={{
                  flex: 1, padding: "9px 4px",
                  background: disclosureContext === ctx
                    ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.03)",
                  border: disclosureContext === ctx
                    ? "1px solid rgba(139,92,246,0.3)" : "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 10,
                  color: disclosureContext === ctx ? "#a78bfa" : "#475569",
                  fontSize: 11, fontFamily: "Georgia, serif",
                  cursor: "pointer", textTransform: "capitalize",
                  transition: "all 0.2s",
                }}>{ctx}</button>
              ))}
            </div>

            {/* Scripts */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {DISCLOSURE_SCRIPTS[disclosureContext]?.map((script, i) => (
                <div key={i} style={{
                  padding: "16px 18px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 14,
                  animation: "fadeSlideIn 0.3s ease",
                }}>
                  <div style={{ color: "#e2e8f0", fontSize: 14, lineHeight: 1.65, fontStyle: "italic", marginBottom: 10 }}>
                    "{script}"
                  </div>
                  <div style={{ color: "#334155", fontSize: 12 }}>
                    Tap to practise →
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              padding: "16px 18px",
              background: "rgba(52,211,153,0.06)",
              border: "1px solid rgba(52,211,153,0.15)",
              borderRadius: 14,
            }}>
              <div style={{ color: "#34d399", fontSize: 11, letterSpacing: "0.06em", marginBottom: 8 }}>
                YOUR PRACTICE CHALLENGE
              </div>
              <div style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.6 }}>
                This week: use voluntary disclosure in one real situation.
                Start with the casual script. Notice what happens to your anxiety before and after you say it.
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.25); border-radius: 2px; }
      `}</style>
    </div>
  );
}
