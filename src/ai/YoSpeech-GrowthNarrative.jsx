import { useState, useEffect, useRef } from "react";

// ─── NARRATIVE ARCHITECTURE ───────────────────────────────────────────────────
// The Growth Narrative Engine does what no other layer does:
// It tells the user their own story back to them — with meaning.
//
// Three core functions:
//   1. STORY GENERATION  — weekly/monthly narrative of the user's journey
//   2. MILESTONE ENGINE  — recognises growth moments with emotional weight
//   3. IDENTITY SHIFT    — gradually rewrites how the user sees themselves
// ─────────────────────────────────────────────────────────────────────────────

// ─── NARRATIVE VOICE ──────────────────────────────────────────────────────────
// The narrator's voice is warm, literary, and deeply personal.
// It reads like a letter written by someone who has been paying close attention.

const NARRATIVE_OPENERS = {
  week_1: [
    "Every journey begins with a decision. This week, you made yours.",
    "The first week is the hardest to start and the easiest to underestimate. You did neither.",
    "Week one. Most people never get here. You did.",
  ],
  early: [
    "You are still in the early chapters. But early chapters matter — they set everything that follows.",
    "Something is beginning to move in you. It's not dramatic yet. But it's real.",
    "These early sessions are building something invisible. Trust the foundation.",
  ],
  building: [
    "The compound interest of consistent effort is beginning to show.",
    "You are no longer just trying — you are building. There is a difference.",
    "Somewhere in the last few weeks, 'I'm doing this' became 'I do this'.",
  ],
  breakthrough: [
    "There are weeks where everything shifts. This was one of them.",
    "Some weeks write themselves into the story permanently. This is one.",
    "What happened this week deserves to be remembered.",
  ],
  resilience: [
    "You fell. You came back. That is not a minor detail — that is the whole story.",
    "The measure of this journey was never how few times you struggled. It was how many times you returned.",
    "This week tested something deeper than technique. And you answered.",
  ],
  plateau: [
    "Plateaus feel like stagnation from the inside. From the outside, they look like consolidation.",
    "The silence before the next leap is still part of the leap.",
    "Not every week writes a headline. Some weeks just hold the ground — and that matters.",
  ],
  milestone: [
    "Some moments in a journey are markers. What you did this week is one of them.",
    "You crossed a line this week. You may not have noticed. I did.",
    "This is the kind of week you'll point to later and say — that's when things changed.",
  ],
};

// ─── WEEKLY NARRATIVE GENERATOR ───────────────────────────────────────────────
function generateWeeklyNarrative(soul, sessions, memoryAnalysis) {
  const name = soul?.name || "you";
  const total = memoryAnalysis?.total || sessions.length;
  const streak = memoryAnalysis?.streak || 0;
  const breakthroughs = memoryAnalysis?.breakthroughs || [];
  const weakAreas = memoryAnalysis?.weakAreas || [];
  const emotionalTrend = memoryAnalysis?.emotionalTrend || "stable";
  const recentSessions = sessions.slice(0, 7);
  const personality = soul?.communicationPersonality;
  const challenge = soul?.primaryChallenge;
  const shameLevel = soul?.shameLevel || 3;

  // Determine narrative type
  let narrativeType = "early";
  if (total <= 3) narrativeType = "week_1";
  else if (total <= 10) narrativeType = "early";
  else if (emotionalTrend === "improving" && breakthroughs.length >= 2) narrativeType = "breakthrough";
  else if (emotionalTrend === "declining") narrativeType = "resilience";
  else if (total >= 10 && total % 10 === 0) narrativeType = "milestone";
  else if (total >= 15) narrativeType = "building";
  else narrativeType = "plateau";

  const openerPool = NARRATIVE_OPENERS[narrativeType];
  const opener = openerPool[Math.floor(Math.random() * openerPool.length)];

  // Body paragraphs — built from actual data
  const paragraphs = [];

  // Emotional arc paragraph
  if (emotionalTrend === "improving") {
    paragraphs.push(
      `Looking at your emotional arc this week — you came in harder than you've been in a while. ` +
      `That upward movement isn't coincidence. It reflects something shifting inside you, not just in the exercises.`
    );
  } else if (emotionalTrend === "declining") {
    paragraphs.push(
      `This week was heavier. I'm not going to pretend otherwise. ` +
      `But I want you to notice something: you still showed up. That's not nothing — ` +
      `that's actually one of the hardest things a person can do when the ground feels unsteady.`
    );
  } else {
    paragraphs.push(
      `This week held its ground. Not every week is a leap — some weeks are about maintenance, ` +
      `about keeping the practice alive when there's no dramatic reason to. You did that.`
    );
  }

  // Breakthrough paragraph
  if (breakthroughs.length > 0) {
    const recent = breakthroughs[0];
    paragraphs.push(
      `There was a moment worth naming: ${recent.toLowerCase()}. ` +
      `I want you to sit with that for a second. ` +
      `That moment didn't happen by accident — it was built by everything that came before it.`
    );
  }

  // Struggle acknowledgement
  const recentStruggles = recentSessions.flatMap(s => s.struggles || []);
  if (recentStruggles.length > 0) {
    paragraphs.push(
      `You also struggled with ${recentStruggles[0].toLowerCase()} — and I noticed. ` +
      `We're not going to skip past it or minimise it. It's going in the record, ` +
      `and we're going to work on it directly.`
    );
  }

  // Personality-specific paragraph
  const personalityInsights = {
    perfectionist: `One thing I want you to notice, ${name}: the weeks where you judge yourself harshest ` +
      `are often the weeks where you actually made the most contact with the difficulty. ` +
      `Discomfort and failure are not the same thing.`,
    avoider: `You've been showing up to things this week that earlier you would have quietly stepped back from. ` +
      `That's not a small change. Avoidance built walls over years — ` +
      `and you're dismantling them brick by brick.`,
    rusher: `I want to reflect something back to you: there were moments this week where you slowed down. ` +
      `Actually slowed down. For someone whose instinct is to push through, ` +
      `that level of presence takes real practice.`,
    freezer: `The freeze is becoming less total. It still comes — but you're finding your way through it ` +
      `faster than before. The nervous system is learning something new about speaking.`,
    overthinker: `I noticed you spoke before finishing the thought this week. ` +
      `That sounds small. It isn't. The overthinking has been your protection — ` +
      `and you're starting to trust yourself enough to speak without it.`,
  };

  if (personality && personalityInsights[personality]) {
    paragraphs.push(personalityInsights[personality]);
  }

  // Challenge-specific paragraph
  const challengeInsights = {
    stutter: shameLevel >= 4
      ? `The shame this week — I want to name it. You carried it into at least one session ` +
        `and kept going anyway. That's not just practice. That's courage operating under weight.`
      : `Your relationship with the stutter is changing. Not because it's happening less — ` +
        `but because it's starting to matter differently. That's the real shift.`,
    anxiety: `The anxiety before speaking is still there. But you're learning to act alongside it ` +
      `rather than waiting for it to leave. That's the entire skill, ${name}.`,
    general: `Communication is becoming less something you do and more something you are. ` +
      `That transition is subtle and it's real.`,
  };

  if (challenge && challengeInsights[challenge]) {
    paragraphs.push(challengeInsights[challenge]);
  }

  // Closing — forward-looking
  const closings = [
    `Next week, we keep going. Not because the journey demands it — but because you've decided it's worth it.`,
    `The story isn't finished. It's only beginning to get interesting.`,
    `Carry this week forward. It earned its place in your story.`,
    `What you built this week doesn't disappear. It compounds.`,
  ];
  paragraphs.push(closings[Math.floor(Math.random() * closings.length)]);

  return { opener, paragraphs, narrativeType, total };
}

// ─── MILESTONE SYSTEM ─────────────────────────────────────────────────────────
const MILESTONES = [
  {
    id: "first_session",
    trigger: (data) => data.total === 1,
    title: "The First Step",
    weight: "major",
    icon: "🌱",
    message: (soul) =>
      `${soul?.name || "You"} took the first step. Most people think about starting. You actually did.`,
    color: "#34d399",
  },
  {
    id: "three_sessions",
    trigger: (data) => data.total === 3,
    title: "Consistency Beginning",
    weight: "medium",
    icon: "🔁",
    message: (soul) =>
      `Three sessions. The brain starts to form new patterns at three. You're past the 'just trying' phase.`,
    color: "#60a5fa",
  },
  {
    id: "first_week",
    trigger: (data) => data.streak >= 7,
    title: "First Full Week",
    weight: "major",
    icon: "📅",
    message: (soul) =>
      `Seven days in a row. That's a week of choosing this every single day. That discipline is real.`,
    color: "#f472b6",
  },
  {
    id: "ten_sessions",
    trigger: (data) => data.total === 10,
    title: "Ten Sessions",
    weight: "major",
    icon: "🔟",
    message: (soul) =>
      `Ten sessions. You are now in the minority of people who actually stick with this. The progress from here accelerates.`,
    color: "#fbbf24",
  },
  {
    id: "first_breakthrough",
    trigger: (data) => data.breakthroughs?.length === 1,
    title: "First Breakthrough",
    weight: "landmark",
    icon: "⚡",
    message: (soul) =>
      `Something cracked open. The first breakthrough is the proof of concept — it shows what's possible. Hold onto it.`,
    color: "#a78bfa",
  },
  {
    id: "faced_trigger",
    trigger: (data) => data.recentSessions?.some(s => s.winsReported?.length > 0),
    title: "Faced a Real Situation",
    weight: "landmark",
    icon: "🦁",
    message: (soul) =>
      `${soul?.name || "You"} took this beyond the app and into real life. That's the whole point. That's everything.`,
    color: "#f97316",
  },
  {
    id: "shame_drop",
    trigger: (data) => data.soul?.shameLevel >= 4 && data.total >= 15,
    title: "Carrying It Lighter",
    weight: "landmark",
    icon: "🕊️",
    message: (soul) =>
      `Something has shifted in how you carry this. Not gone — but lighter. That shift is permanent.`,
    color: "#34d399",
  },
  {
    id: "twenty_five_sessions",
    trigger: (data) => data.total === 25,
    title: "25 Sessions",
    weight: "landmark",
    icon: "🌟",
    message: (soul) =>
      `25 sessions. You have now put in more work on your communication than most people put in their entire lives. This is mastery territory.`,
    color: "#fbbf24",
  },
  {
    id: "resilience",
    trigger: (data) => {
      const sessions = data.recentSessions || [];
      const hadLow = sessions.slice(2, 7).some(s =>
        s.emotionalState === "low" || s.emotionalState === "crisis"
      );
      const backUp = sessions[0]?.emotionalState === "steady" ||
        sessions[0]?.emotionalState === "open";
      return hadLow && backUp;
    },
    title: "Bounced Back",
    weight: "landmark",
    icon: "💪",
    message: (soul) =>
      `You had a hard stretch and came back from it. That resilience is now part of your story — and it always will be.`,
    color: "#818cf8",
  },
];

function detectMilestones(soul, sessions, memoryAnalysis) {
  const data = {
    total: memoryAnalysis?.total || 0,
    streak: memoryAnalysis?.streak || 0,
    breakthroughs: memoryAnalysis?.breakthroughs || [],
    recentSessions: sessions.slice(0, 10),
    soul,
  };

  return MILESTONES.filter(m => {
    try { return m.trigger(data); }
    catch { return false; }
  });
}

// ─── IDENTITY SHIFT TRACKER ───────────────────────────────────────────────────
// Tracks the gradual shift in how the user describes themselves
const IDENTITY_SHIFTS = [
  {
    id: "from_broken",
    from: "I am broken",
    to: "I communicate differently",
    sessions: 5,
    marker: "The shift from broken to different changes everything. Different can be worked with.",
  },
  {
    id: "from_hiding",
    from: "I must hide this",
    to: "I can choose when to disclose",
    sessions: 10,
    marker: "Control returns when hiding becomes a choice rather than a compulsion.",
  },
  {
    id: "from_stutterer",
    from: "I am a stutterer",
    to: "I am a person who sometimes stutters",
    sessions: 15,
    marker: "Language shapes identity. This reframe is not semantic — it is fundamental.",
  },
  {
    id: "from_victim",
    from: "This happened to me",
    to: "I am working with this",
    sessions: 20,
    marker: "Agency. The shift from passive to active is where the real growth lives.",
  },
  {
    id: "from_fluency",
    from: "Success = fluency",
    to: "Success = freedom to speak",
    sessions: 25,
    marker: "When freedom replaces fluency as the goal, the whole journey changes its shape.",
  },
];

function getUnlockedShifts(total) {
  return IDENTITY_SHIFTS.filter(s => total >= s.sessions);
}

function getNextShift(total) {
  return IDENTITY_SHIFTS.find(s => total < s.sessions) || null;
}

// ─── LETTER GENERATOR ─────────────────────────────────────────────────────────
// The most personal thing the AI produces — a letter from the therapist
function generateTherapistLetter(soul, sessions, memoryAnalysis, milestone) {
  const name = soul?.name || "there";
  const total = memoryAnalysis?.total || 0;
  const challenge = soul?.primaryChallenge;
  const shameLevel = soul?.shameLevel || 3;
  const motivation = soul?.motivationCore;
  const breakthroughs = memoryAnalysis?.breakthroughs || [];

  const salutation = `Dear ${name},`;

  let body = "";

  if (milestone) {
    body = `I want to mark this moment properly.\n\n`;
    body += `${milestone.message(soul)}\n\n`;
  }

  if (total === 1) {
    body += `You've taken the first step of a journey that most people never start. ` +
      `I don't know yet exactly where this will lead you — but I know the direction. ` +
      `Forward.\n\n`;
    body += `Be patient with the process. Be patient with yourself.\n\n`;
    body += `I'll be with you every step.`;
  } else if (total <= 10) {
    body += `You're in the early weeks — the weeks where the work is invisible but the most important. ` +
      `Every technique you're practising is writing new neural pathways. `;
    if (challenge === "stutter") {
      body += `Every moment you face instead of flee is rewiring how your brain relates to speech. `;
    }
    body += `\n\nWhat I've noticed about you so far: `;
    if (shameLevel >= 4) {
      body += `You carry real weight around this. The shame is present. And yet you keep showing up. ` +
        `That combination — shame and courage operating at the same time — is the engine of change.`;
    } else {
      body += `You approach this with more honesty than most. That honesty is your biggest asset.`;
    }
    body += `\n\nKeep going. The early weeks always feel slower than they are.`;
  } else if (breakthroughs.length > 0) {
    body += `Something worth noting happened recently: ${breakthroughs[0].toLowerCase()}.\n\n`;
    body += `I want to be clear about what that means. It doesn't mean you've 'fixed' anything. ` +
      `It means the work you've been doing is reaching the surface. `;
    if (motivation === "career") {
      body += `The professional confidence you're building is real. `;
    } else if (motivation === "relationships") {
      body += `The way you show up in conversations is changing. People feel it, even if they can't name it. `;
    } else if (motivation === "specific_event") {
      body += `Every session is preparation. You are more ready than you think. `;
    }
    body += `\n\nDon't minimise this moment. Write it down somewhere.`;
  } else {
    body += `I've been watching your journey carefully.\n\n`;
    if (total >= 20) {
      body += `${total} sessions in — you are in a different category now. ` +
        `Not just in terms of skill, but in terms of who you are in relation to this challenge. ` +
        `You are no longer someone who hopes they can do this. You are someone who does it.\n\n`;
    }
    body += `The road isn't finished. But look back at where you started. ` +
      `That distance is yours. Nobody can take it.`;
  }

  const closing = `\n\nWith full belief in you,\nYour therapist`;
  return `${salutation}\n\n${body}${closing}`;
}

// ─── PROGRESS POEM GENERATOR ─────────────────────────────────────────────────
// A short piece of narrative prose generated from the user's data
function generateProgressPoem(soul, memoryAnalysis) {
  const name = soul?.name || "the traveller";
  const streak = memoryAnalysis?.streak || 0;
  const total = memoryAnalysis?.total || 0;
  const trend = memoryAnalysis?.emotionalTrend || "stable";
  const challenge = soul?.primaryChallenge;

  const lines = [];

  lines.push(`${name} walked in.`);

  if (challenge === "stutter") {
    lines.push(`Carrying the weight of words unsaid,`);
    lines.push(`of mouths that opened and produced silence,`);
    lines.push(`of rooms left before the sentence finished.`);
  } else if (challenge === "anxiety") {
    lines.push(`Carrying the weight of rooms full of eyes,`);
    lines.push(`of the moment before speaking,`);
    lines.push(`of the voice that says: not yet, not you.`);
  } else {
    lines.push(`Carrying the gap between what is meant`);
    lines.push(`and what arrives.`);
  }

  lines.push(``);
  lines.push(`${total} sessions later.`);

  if (streak >= 7) {
    lines.push(`${streak} days without stopping.`);
  }

  lines.push(``);

  if (trend === "improving") {
    lines.push(`Something is moving upward.`);
    lines.push(`Not in a straight line — nothing real ever does.`);
    lines.push(`But upward.`);
  } else if (trend === "declining") {
    lines.push(`This week was harder.`);
    lines.push(`And still — here.`);
  } else {
    lines.push(`Steady.`);
    lines.push(`Which is its own kind of miracle.`);
  }

  lines.push(``);
  lines.push(`The story is not finished.`);
  lines.push(`It never was.`);

  return lines.join("\n");
}

// ─── DEMO DATA ────────────────────────────────────────────────────────────────
const DEMO_SESSIONS = [
  {
    id: "s1", date: new Date(Date.now() - 86400000).toISOString(),
    emotionalState: "open", streakDay: 5,
    breakthroughs: ["Made a phone call to a stranger without hanging up"],
    struggles: ["Blocked on 'please' in the simulation"],
    winsReported: ["Introduced myself at a new job"],
    exercisesCompleted: [
      { name: "Easy Onset", score: 78 },
      { name: "Diaphragmatic Breathing", score: 91 },
    ],
  },
  {
    id: "s2", date: new Date(Date.now() - 172800000).toISOString(),
    emotionalState: "fragile", streakDay: 4,
    breakthroughs: [],
    struggles: ["Phone anxiety was very high"],
    winsReported: [],
    exercisesCompleted: [{ name: "Box Breathing", score: 85 }],
  },
  {
    id: "s3", date: new Date(Date.now() - 259200000).toISOString(),
    emotionalState: "steady", streakDay: 3,
    breakthroughs: ["First time using cancellation in real conversation"],
    struggles: [],
    winsReported: ["Spoke up in a team meeting"],
    exercisesCompleted: [
      { name: "Cancellation", score: 65 },
      { name: "Pull-Out Technique", score: 58 },
    ],
  },
  {
    id: "s4", date: new Date(Date.now() - 345600000).toISOString(),
    emotionalState: "low", streakDay: 2,
    breakthroughs: [],
    struggles: ["Bad stutter in front of a manager"],
    winsReported: [],
    exercisesCompleted: [{ name: "Diaphragmatic Breathing", score: 88 }],
  },
  {
    id: "s5", date: new Date(Date.now() - 432000000).toISOString(),
    emotionalState: "energised", streakDay: 1,
    breakthroughs: ["Voluntarily disclosed stutter to a colleague for the first time"],
    struggles: [],
    winsReported: ["Had a 10-minute phone call without avoiding"],
    exercisesCompleted: [
      { name: "Easy Onset", score: 82 },
      { name: "Phone Call Simulation", score: 74 },
      { name: "Cancellation", score: 70 },
    ],
  },
];

const DEMO_MEMORY = {
  total: 12,
  streak: 5,
  breakthroughs: [
    "Made a phone call to a stranger without hanging up",
    "Voluntarily disclosed stutter to a colleague for the first time",
    "First time using cancellation in real conversation",
  ],
  emotionalTrend: "improving",
  weakAreas: [{ name: "Pull-Out Technique", avg: 58 }],
  strongAreas: [{ name: "Diaphragmatic Breathing", avg: 89 }],
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function GrowthNarrativeEngine({ soul = {}, sessions = DEMO_SESSIONS, memoryAnalysis = DEMO_MEMORY, onComplete }) {
  const [activeView, setActiveView] = useState("narrative");
  const [weeklyNarrative, setWeeklyNarrative] = useState(null);
  const [detectedMilestones, setDetectedMilestones] = useState([]);
  const [unlockedShifts, setUnlockedShifts] = useState([]);
  const [nextShift, setNextShift] = useState(null);
  const [letter, setLetter] = useState("");
  const [poem, setPoem] = useState("");
  const [activeMilestone, setActiveMilestone] = useState(null);
  const [letterVisible, setLetterVisible] = useState(false);
  const [shareVisible, setShareVisible] = useState(false);

  useEffect(() => {
    const narrative = generateWeeklyNarrative(soul, sessions, memoryAnalysis);
    const milestones = detectMilestones(soul, sessions, memoryAnalysis);
    const shifts = getUnlockedShifts(memoryAnalysis.total);
    const next = getNextShift(memoryAnalysis.total);
    const topMilestone = milestones.find(m => m.weight === "landmark") || milestones[0];
    const generatedLetter = generateTherapistLetter(soul, sessions, memoryAnalysis, topMilestone);
    const generatedPoem = generateProgressPoem(soul, memoryAnalysis);

    setWeeklyNarrative(narrative);
    setDetectedMilestones(milestones);
    setUnlockedShifts(shifts);
    setNextShift(next);
    setLetter(generatedLetter);
    setPoem(generatedPoem);
    setActiveMilestone(topMilestone || null);
  }, []);

  const views = ["narrative", "milestones", "identity", "letter", "poem"];

  const viewColors = {
    narrative: "#6366f1",
    milestones: "#fbbf24",
    identity: "#10b981",
    letter: "#f472b6",
    poem: "#8b5cf6",
  };

  const accentColor = viewColors[activeView] || "#6366f1";

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #07080f 0%, #0c0b10 50%, #07080f 100%)",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      color: "#cbd5e1",
      paddingBottom: 80,
    }}>

      {/* Ambient glow shifts per view */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: `radial-gradient(ellipse 55% 40% at 50% 10%, ${accentColor}07 0%, transparent 70%)`,
        pointerEvents: "none",
        transition: "background 1.5s ease",
      }} />

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "28px 24px 0" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
          <div style={{
            width: 46, height: 46, borderRadius: "50%",
            background: `linear-gradient(135deg, ${accentColor}, ${accentColor}99)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, boxShadow: `0 0 20px ${accentColor}30`,
            transition: "all 0.5s ease",
          }}>📖</div>
          <div>
            <div style={{ color: "#e2e8f0", fontSize: 17, fontWeight: 600 }}>Your Growth Story</div>
            <div style={{ color: "#334155", fontSize: 12, fontStyle: "italic" }}>
              {soul?.name ? `${soul.name} · ` : ""}{memoryAnalysis.total} sessions · {memoryAnalysis.streak} day streak
            </div>
          </div>
          {detectedMilestones.length > 0 && (
            <div style={{
              marginLeft: "auto", padding: "5px 13px",
              background: "rgba(251,191,36,0.1)",
              border: "1px solid rgba(251,191,36,0.25)",
              borderRadius: 20, color: "#fbbf24", fontSize: 11,
              animation: "pulseGlow 2s infinite",
            }}>✨ {detectedMilestones.length} milestone{detectedMilestones.length !== 1 ? "s" : ""}</div>
          )}
        </div>

        {/* Nav */}
        <div style={{
          display: "flex", gap: 6, marginBottom: 24,
          overflowX: "auto", paddingBottom: 4,
        }}>
          {views.map(view => (
            <button key={view} onClick={() => setActiveView(view)} style={{
              padding: "9px 16px",
              background: activeView === view
                ? `${viewColors[view]}18` : "rgba(255,255,255,0.03)",
              border: activeView === view
                ? `1px solid ${viewColors[view]}35` : "1px solid rgba(255,255,255,0.07)",
              borderRadius: 10,
              color: activeView === view ? viewColors[view] : "#334155",
              fontSize: 12, fontFamily: "Georgia, serif",
              cursor: "pointer", transition: "all 0.2s",
              textTransform: "capitalize", whiteSpace: "nowrap",
            }}>{view}</button>
          ))}
        </div>

        {/* ── NARRATIVE TAB ── */}
        {activeView === "narrative" && weeklyNarrative && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "fadeSlideIn 0.5s ease" }}>

            {/* Narrative type badge */}
            <div style={{
              padding: "8px 16px",
              background: "rgba(99,102,241,0.08)",
              border: "1px solid rgba(99,102,241,0.15)",
              borderRadius: 10,
              display: "inline-flex", alignItems: "center", gap: 8,
              alignSelf: "flex-start",
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#6366f1" }} />
              <span style={{ color: "#818cf8", fontSize: 11, letterSpacing: "0.05em" }}>
                WEEK {weeklyNarrative.total} NARRATIVE · {weeklyNarrative.narrativeType.replace(/_/g, " ").toUpperCase()}
              </span>
            </div>

            {/* Opener */}
            <div style={{
              padding: "26px 28px",
              background: "rgba(99,102,241,0.06)",
              border: "1px solid rgba(99,102,241,0.15)",
              borderRadius: 20,
            }}>
              <p style={{
                color: "#e2e8f0", fontSize: 20,
                lineHeight: 1.6, fontStyle: "italic",
                letterSpacing: "0.01em",
              }}>
                "{weeklyNarrative.opener}"
              </p>
            </div>

            {/* Body paragraphs */}
            {weeklyNarrative.paragraphs.map((para, i) => (
              <div key={i} style={{
                padding: "18px 22px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 16,
                animation: `fadeSlideIn 0.5s ${i * 0.1}s ease both`,
              }}>
                <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8, letterSpacing: "0.01em" }}>
                  {para}
                </p>
              </div>
            ))}

            {/* Stats that back the narrative */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
              gap: 10,
            }}>
              {[
                { label: "Sessions", value: memoryAnalysis.total, icon: "📅" },
                { label: "Streak", value: `${memoryAnalysis.streak}d`, icon: "🔥" },
                { label: "Trend", value: memoryAnalysis.emotionalTrend === "improving" ? "↑" : memoryAnalysis.emotionalTrend === "declining" ? "↓" : "→", icon: "📈" },
              ].map(stat => (
                <div key={stat.label} style={{
                  padding: "16px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 14, textAlign: "center",
                }}>
                  <div style={{ fontSize: 18, marginBottom: 6 }}>{stat.icon}</div>
                  <div style={{ color: "#e2e8f0", fontSize: 20, fontWeight: 600, marginBottom: 2 }}>{stat.value}</div>
                  <div style={{ color: "#334155", fontSize: 10, letterSpacing: "0.05em" }}>{stat.label.toUpperCase()}</div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShareVisible(true)}
              style={{
                padding: "14px",
                background: "rgba(99,102,241,0.1)",
                border: "1px solid rgba(99,102,241,0.2)",
                borderRadius: 14, color: "#818cf8",
                fontFamily: "Georgia, serif", fontSize: 14,
                cursor: "pointer",
              }}
            >Share this narrative →</button>
          </div>
        )}

        {/* ── MILESTONES TAB ── */}
        {activeView === "milestones" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, animation: "fadeSlideIn 0.5s ease" }}>
            {detectedMilestones.length === 0 && (
              <div style={{
                padding: "40px", textAlign: "center",
                color: "#334155", fontSize: 14, fontStyle: "italic",
              }}>
                Your milestones will appear here as you progress.
                The first one is closer than you think.
              </div>
            )}
            {detectedMilestones.map((milestone, i) => (
              <div key={milestone.id} style={{
                padding: "22px 24px",
                background: `${milestone.color}09`,
                border: `1px solid ${milestone.color}25`,
                borderRadius: 18,
                animation: `fadeSlideIn 0.5s ${i * 0.1}s ease both`,
              }}>
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{
                    width: 50, height: 50, borderRadius: 14,
                    background: `${milestone.color}15`,
                    border: `1px solid ${milestone.color}30`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 24, flexShrink: 0,
                  }}>{milestone.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                      <span style={{ color: "#e2e8f0", fontSize: 15 }}>{milestone.title}</span>
                      {milestone.weight === "landmark" && (
                        <span style={{
                          padding: "2px 8px",
                          background: `${milestone.color}15`,
                          borderRadius: 8, color: milestone.color,
                          fontSize: 10, letterSpacing: "0.04em",
                        }}>LANDMARK</span>
                      )}
                    </div>
                    <p style={{
                      color: "#94a3b8", fontSize: 14, lineHeight: 1.65,
                      fontStyle: "italic",
                    }}>
                      "{milestone.message(soul)}"
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Next milestone preview */}
            <div style={{
              padding: "18px 20px",
              background: "rgba(255,255,255,0.02)",
              border: "1px dashed rgba(255,255,255,0.08)",
              borderRadius: 16,
            }}>
              <div style={{ color: "#1e293b", fontSize: 11, letterSpacing: "0.06em", marginBottom: 8 }}>
                NEXT MILESTONE
              </div>
              {(() => {
                const upcoming = MILESTONES.find(m => !detectedMilestones.find(d => d.id === m.id));
                return upcoming ? (
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <span style={{ fontSize: 22, opacity: 0.4 }}>{upcoming.icon}</span>
                    <span style={{ color: "#334155", fontSize: 13 }}>{upcoming.title} — keep going</span>
                  </div>
                ) : (
                  <div style={{ color: "#334155", fontSize: 13 }}>You've reached all milestones. Remarkable.</div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ── IDENTITY TAB ── */}
        {activeView === "identity" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, animation: "fadeSlideIn 0.5s ease" }}>
            <div style={{
              padding: "18px 20px",
              background: "rgba(16,185,129,0.06)",
              border: "1px solid rgba(16,185,129,0.15)",
              borderRadius: 14,
            }}>
              <div style={{ color: "#10b981", fontSize: 11, letterSpacing: "0.06em", marginBottom: 8 }}>
                WHAT THIS TRACKS
              </div>
              <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.65 }}>
                The most important change in this journey is not in your speech — it's in how you see yourself.
                These identity shifts unlock as you build sessions. Each one is a permanent rewrite.
              </p>
            </div>

            {/* Unlocked shifts */}
            {unlockedShifts.map((shift, i) => (
              <div key={shift.id} style={{
                padding: "20px 22px",
                background: "rgba(16,185,129,0.06)",
                border: "1px solid rgba(16,185,129,0.18)",
                borderRadius: 16,
                animation: `fadeSlideIn 0.4s ${i * 0.08}s ease both`,
              }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                      <span style={{
                        padding: "4px 10px",
                        background: "rgba(248,113,113,0.1)",
                        border: "1px solid rgba(248,113,113,0.2)",
                        borderRadius: 8, color: "#fca5a5",
                        fontSize: 12, fontStyle: "italic",
                        textDecoration: "line-through",
                        opacity: 0.7,
                      }}>{shift.from}</span>
                      <span style={{ color: "#334155", fontSize: 14 }}>→</span>
                      <span style={{
                        padding: "4px 10px",
                        background: "rgba(52,211,153,0.1)",
                        border: "1px solid rgba(52,211,153,0.25)",
                        borderRadius: 8, color: "#6ee7b7",
                        fontSize: 12, fontStyle: "italic",
                      }}>{shift.to}</span>
                    </div>
                    <p style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6, fontStyle: "italic" }}>
                      "{shift.marker}"
                    </p>
                  </div>
                </div>
                <div style={{
                  display: "inline-block", padding: "3px 10px",
                  background: "rgba(16,185,129,0.1)",
                  borderRadius: 8, color: "#34d399", fontSize: 10,
                  letterSpacing: "0.04em",
                }}>UNLOCKED AT SESSION {shift.sessions}</div>
              </div>
            ))}

            {/* Next shift locked */}
            {nextShift && (
              <div style={{
                padding: "18px 20px",
                background: "rgba(255,255,255,0.02)",
                border: "1px dashed rgba(255,255,255,0.07)",
                borderRadius: 16,
                opacity: 0.5,
              }}>
                <div style={{ color: "#1e293b", fontSize: 11, letterSpacing: "0.05em", marginBottom: 10 }}>
                  NEXT SHIFT — UNLOCKS AT SESSION {nextShift.sessions}
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{
                    padding: "4px 10px",
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: 8, color: "#334155",
                    fontSize: 12, fontStyle: "italic",
                  }}>{nextShift.from}</span>
                  <span style={{ color: "#1e293b" }}>→</span>
                  <span style={{
                    padding: "4px 10px",
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: 8, color: "#334155",
                    fontSize: 12, fontStyle: "italic",
                  }}>{nextShift.to}</span>
                </div>
                <div style={{ height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 2, marginTop: 12 }}>
                  <div style={{
                    height: "100%",
                    width: `${Math.min((memoryAnalysis.total / nextShift.sessions) * 100, 100)}%`,
                    background: "linear-gradient(90deg, #10b981, #6366f1)",
                    borderRadius: 2, transition: "width 1s ease",
                  }} />
                </div>
                <div style={{ color: "#1e293b", fontSize: 11, marginTop: 6 }}>
                  {nextShift.sessions - memoryAnalysis.total} session{nextShift.sessions - memoryAnalysis.total !== 1 ? "s" : ""} away
                </div>
              </div>
            )}

            {unlockedShifts.length === 0 && (
              <div style={{ color: "#334155", fontSize: 14, fontStyle: "italic", textAlign: "center", padding: "30px 0" }}>
                Your first identity shift unlocks at session {IDENTITY_SHIFTS[0].sessions}.
                You're {IDENTITY_SHIFTS[0].sessions - memoryAnalysis.total} session{IDENTITY_SHIFTS[0].sessions - memoryAnalysis.total !== 1 ? "s" : ""} away.
              </div>
            )}
          </div>
        )}

        {/* ── LETTER TAB ── */}
        {activeView === "letter" && (
          <div style={{ animation: "fadeSlideIn 0.5s ease" }}>
            {!letterVisible ? (
              <div style={{
                padding: "40px 32px",
                background: "rgba(244,114,182,0.05)",
                border: "1px solid rgba(244,114,182,0.15)",
                borderRadius: 20, textAlign: "center",
              }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>✉️</div>
                <div style={{ color: "#e2e8f0", fontSize: 17, marginBottom: 10 }}>
                  A letter from your therapist
                </div>
                <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.65, marginBottom: 24, fontStyle: "italic" }}>
                  Written specifically for where you are in your journey right now.
                  {detectedMilestones.length > 0 && " It acknowledges a milestone you've reached."}
                </div>
                <button
                  onClick={() => setLetterVisible(true)}
                  style={{
                    padding: "14px 32px",
                    background: "linear-gradient(135deg, #f472b6, #db2777)",
                    border: "none", borderRadius: 14,
                    color: "#fff", fontFamily: "Georgia, serif",
                    fontSize: 15, cursor: "pointer",
                    boxShadow: "0 6px 20px rgba(244,114,182,0.3)",
                  }}
                >Open letter →</button>
              </div>
            ) : (
              <div style={{
                padding: "32px",
                background: "rgba(244,114,182,0.05)",
                border: "1px solid rgba(244,114,182,0.15)",
                borderRadius: 20,
                animation: "fadeSlideIn 0.6s ease",
              }}>
                <div style={{ color: "#f472b6", fontSize: 11, letterSpacing: "0.07em", marginBottom: 20 }}>
                  FROM YOUR THERAPIST
                </div>
                {letter.split("\n\n").map((para, i) => (
                  <p key={i} style={{
                    color: i === 0 ? "#e2e8f0" : "#94a3b8",
                    fontSize: i === 0 ? 15 : 14,
                    lineHeight: 1.8,
                    marginBottom: 16,
                    fontStyle: i === letter.split("\n\n").length - 1 ? "italic" : "normal",
                    whiteSpace: "pre-wrap",
                    animation: `fadeSlideIn 0.5s ${i * 0.12}s ease both`,
                  }}>{para}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── POEM TAB ── */}
        {activeView === "poem" && (
          <div style={{ animation: "fadeSlideIn 0.5s ease" }}>
            <div style={{
              padding: "36px 32px",
              background: "rgba(139,92,246,0.05)",
              border: "1px solid rgba(139,92,246,0.15)",
              borderRadius: 20,
            }}>
              <div style={{ color: "#8b5cf6", fontSize: 11, letterSpacing: "0.07em", marginBottom: 24 }}>
                YOUR JOURNEY IN WORDS
              </div>
              {poem.split("\n").map((line, i) => (
                <p key={i} style={{
                  color: line === "" ? "transparent" : i < 1 ? "#e2e8f0" : "#94a3b8",
                  fontSize: i < 1 ? 17 : 15,
                  lineHeight: line === "" ? "0.5" : 1.9,
                  fontStyle: "italic",
                  letterSpacing: "0.02em",
                  animation: `fadeSlideIn 0.4s ${Math.min(i * 0.06, 1)}s ease both`,
                }}>{line || "‌"}</p>
              ))}
            </div>

            <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
              <button
                onClick={() => {
                  const text = poem;
                  if (navigator.share) {
                    navigator.share({ text, title: "My YoSpeech Journey" });
                  } else {
                    navigator.clipboard?.writeText(text);
                  }
                }}
                style={{
                  flex: 1, padding: "13px",
                  background: "rgba(139,92,246,0.1)",
                  border: "1px solid rgba(139,92,246,0.2)",
                  borderRadius: 12, color: "#a78bfa",
                  fontFamily: "Georgia, serif", fontSize: 13,
                  cursor: "pointer",
                }}
              >Share poem</button>
            </div>
          </div>
        )}

        {/* Share modal */}
        {shareVisible && (
          <div style={{
            position: "fixed", inset: 0,
            background: "rgba(7,8,15,0.9)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 100, backdropFilter: "blur(8px)",
            animation: "fadeIn 0.3s ease",
          }}>
            <div style={{
              maxWidth: 480, width: "calc(100% - 48px)",
              background: "#0d1117",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 20, padding: "28px 24px",
              animation: "slideUp 0.4s ease",
            }}>
              <div style={{ color: "#e2e8f0", fontSize: 16, marginBottom: 8 }}>Share Your Progress</div>
              <div style={{ color: "#475569", fontSize: 13, marginBottom: 20, fontStyle: "italic" }}>
                Your narrative this week, ready to share.
              </div>
              <div style={{
                padding: "16px", background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 12, marginBottom: 20,
                color: "#94a3b8", fontSize: 13, lineHeight: 1.7,
                fontStyle: "italic",
              }}>
                "{weeklyNarrative?.opener}"
                {"\n\n"}Session {memoryAnalysis.total} · {memoryAnalysis.streak} day streak
                {"\n"}via YoSpeech
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setShareVisible(false)} style={{
                  flex: 1, padding: "13px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12, color: "#475569",
                  fontFamily: "Georgia, serif", fontSize: 14, cursor: "pointer",
                }}>Close</button>
                <button onClick={() => {
                  const text = `"${weeklyNarrative?.opener}"\n\nSession ${memoryAnalysis.total} · ${memoryAnalysis.streak} day streak\nvia YoSpeech`;
                  navigator.clipboard?.writeText(text);
                  setShareVisible(false);
                }} style={{
                  flex: 2, padding: "13px",
                  background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                  border: "none", borderRadius: 12,
                  color: "#fff", fontFamily: "Georgia, serif",
                  fontSize: 14, cursor: "pointer",
                }}>Copy to clipboard →</button>
              </div>
            </div>
          </div>
        )}

        {/* Session complete CTA */}
        {onComplete && (
          <div style={{ marginTop: 24 }}>
            <button onClick={onComplete} style={{
              width: "100%", padding: "17px",
              background: "linear-gradient(135deg, #6366f1, #10b981)",
              border: "none", borderRadius: 14,
              color: "#fff", fontSize: 16,
              fontFamily: "Georgia, serif",
              cursor: "pointer",
              boxShadow: "0 8px 28px rgba(99,102,241,0.3)",
              letterSpacing: "0.02em",
            }}>Complete Today's Journey →</button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(251,191,36,0); }
          50% { box-shadow: 0 0 12px 2px rgba(251,191,36,0.15); }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.2); border-radius: 2px; }
      `}</style>
    </div>
  );
}
