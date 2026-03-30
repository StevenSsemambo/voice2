import { useState, useEffect, useRef } from "react";

// ─── MEMORY SCHEMA ────────────────────────────────────────────────────────────
// Every session creates a MemoryEntry stored in Dexie (simulated here with localStorage)
const MEMORY_ENTRY_SCHEMA = {
  id: null,                    // timestamp-based unique id
  date: null,                  // ISO date string
  dayOfWeek: null,
  emotionalState: null,        // derived state from Layer 2
  sessionType: null,           // session type from Layer 2
  exercisesCompleted: [],      // [{id, name, score, difficulty}]
  breakthroughs: [],           // significant positive moments
  struggles: [],               // specific difficulties noted
  avoidances: [],              // things user avoided
  winsReported: [],            // user-reported wins
  therapistNotes: [],          // AI-generated observations
  upcomingEvent: null,         // if user had something coming up
  streak: 0,                   // days in a row
  totalSessions: 0,
};

// ─── MEMORY STORE (simulated Dexie with localStorage) ─────────────────────────
const MemoryStore = {
  key: "yospeech_memory",

  getAll() {
    try {
      const raw = localStorage.getItem(this.key);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },

  save(entry) {
    const all = this.getAll();
    const existing = all.findIndex(e => e.id === entry.id);
    if (existing >= 0) all[existing] = entry;
    else all.unshift(entry);
    // Keep last 90 sessions
    const trimmed = all.slice(0, 90);
    localStorage.setItem(this.key, JSON.stringify(trimmed));
    return entry;
  },

  getLast(n = 5) {
    return this.getAll().slice(0, n);
  },

  getStreak() {
    const all = this.getAll();
    if (!all.length) return 0;
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < all.length; i++) {
      const sessionDate = new Date(all[i].date);
      sessionDate.setHours(0, 0, 0, 0);
      const diffDays = Math.round((today - sessionDate) / 86400000);
      if (diffDays === i) streak++;
      else break;
    }
    return streak;
  },

  getTotalSessions() {
    return this.getAll().length;
  },

  getWeakAreas() {
    const all = this.getAll().slice(0, 20);
    const scores = {};
    all.forEach(session => {
      session.exercisesCompleted?.forEach(ex => {
        if (!scores[ex.name]) scores[ex.name] = { total: 0, count: 0 };
        scores[ex.name].total += ex.score;
        scores[ex.name].count += 1;
      });
    });
    return Object.entries(scores)
      .map(([name, s]) => ({ name, avg: s.total / s.count }))
      .sort((a, b) => a.avg - b.avg)
      .slice(0, 3);
  },

  getStrongestAreas() {
    const all = this.getAll().slice(0, 20);
    const scores = {};
    all.forEach(session => {
      session.exercisesCompleted?.forEach(ex => {
        if (!scores[ex.name]) scores[ex.name] = { total: 0, count: 0 };
        scores[ex.name].total += ex.score;
        scores[ex.name].count += 1;
      });
    });
    return Object.entries(scores)
      .map(([name, s]) => ({ name, avg: s.total / s.count }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 3);
  },

  getRecentBreakthroughs() {
    return this.getAll()
      .slice(0, 10)
      .flatMap(s => s.breakthroughs || [])
      .slice(0, 5);
  },

  getRecentStruggles() {
    return this.getAll()
      .slice(0, 5)
      .flatMap(s => s.struggles || []);
  },

  getPendingUpcomingEvent() {
    const all = this.getAll().slice(0, 7);
    for (const s of all) {
      if (s.upcomingEvent) return s.upcomingEvent;
    }
    return null;
  },

  getEmotionalTrend() {
    const stateScores = {
      crisis: 1, low: 2, fragile: 3, steady: 4, open: 5, energised: 6
    };
    const recent = this.getAll().slice(0, 7);
    if (recent.length < 2) return "stable";
    const scores = recent.map(s => stateScores[s.emotionalState] || 3);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const latest = scores[0];
    if (latest > avg + 0.8) return "improving";
    if (latest < avg - 0.8) return "declining";
    return "stable";
  },

  getLongestNeglectedArea() {
    const all = this.getAll();
    const lastPracticed = {};
    all.forEach((session, idx) => {
      session.exercisesCompleted?.forEach(ex => {
        if (!lastPracticed[ex.name]) lastPracticed[ex.name] = idx;
      });
    });
    const sorted = Object.entries(lastPracticed).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || null;
  },

  clearAll() {
    localStorage.removeItem(this.key);
  },

  // Seed demo data for showcasing
  seedDemo() {
    const demoSessions = [
      {
        id: "demo_1",
        date: new Date(Date.now() - 86400000).toISOString(),
        dayOfWeek: "Saturday",
        emotionalState: "fragile",
        sessionType: "comfort",
        exercisesCompleted: [
          { id: "e1", name: "Diaphragmatic Breathing", score: 82, difficulty: "easy" },
          { id: "e2", name: "Easy Onset", score: 64, difficulty: "medium" },
        ],
        breakthroughs: ["Completed a full breathing set without stopping"],
        struggles: ["Blocked on 'please' twice during Easy Onset"],
        avoidances: [],
        winsReported: ["Had a short conversation with a shopkeeper"],
        therapistNotes: ["Showed real courage despite feeling fragile", "Easy Onset needs more work"],
        upcomingEvent: "Job interview on Monday",
        streak: 3,
        totalSessions: 7,
      },
      {
        id: "demo_2",
        date: new Date(Date.now() - 172800000).toISOString(),
        dayOfWeek: "Friday",
        emotionalState: "low",
        sessionType: "gentle",
        exercisesCompleted: [
          { id: "e1", name: "Diaphragmatic Breathing", score: 75, difficulty: "easy" },
        ],
        breakthroughs: [],
        struggles: ["Phone call simulation triggered strong anxiety"],
        avoidances: ["Skipped the phone call exercise"],
        winsReported: [],
        therapistNotes: ["Phone calls remain a significant trigger", "Energy was very low today"],
        upcomingEvent: "Job interview on Monday",
        streak: 2,
        totalSessions: 6,
      },
      {
        id: "demo_3",
        date: new Date(Date.now() - 259200000).toISOString(),
        dayOfWeek: "Thursday",
        emotionalState: "steady",
        sessionType: "standard",
        exercisesCompleted: [
          { id: "e1", name: "Diaphragmatic Breathing", score: 88, difficulty: "easy" },
          { id: "e3", name: "Pull-Out Technique", score: 71, difficulty: "hard" },
          { id: "e4", name: "Cancellation", score: 58, difficulty: "hard" },
        ],
        breakthroughs: ["First time attempting Pull-Out technique — showed courage"],
        struggles: ["Cancellation feels unnatural still"],
        avoidances: [],
        winsReported: ["Introduced myself in a meeting"],
        therapistNotes: ["Good session overall", "Cancellation needs consistent practice"],
        upcomingEvent: null,
        streak: 1,
        totalSessions: 5,
      },
    ];
    demoSessions.forEach(s => this.save(s));
  },
};

// ─── MEMORY ANALYSER ──────────────────────────────────────────────────────────
function analyseMemory(soul) {
  const sessions = MemoryStore.getAll();
  const streak = MemoryStore.getStreak();
  const total = MemoryStore.getTotalSessions();
  const weakAreas = MemoryStore.getWeakAreas();
  const strongAreas = MemoryStore.getStrongestAreas();
  const breakthroughs = MemoryStore.getRecentBreakthroughs();
  const struggles = MemoryStore.getRecentStruggles();
  const pendingEvent = MemoryStore.getPendingUpcomingEvent();
  const emotionalTrend = MemoryStore.getEmotionalTrend();
  const neglectedArea = MemoryStore.getLongestNeglectedArea();
  const lastSession = sessions[0] || null;

  return {
    sessions, streak, total, weakAreas, strongAreas,
    breakthroughs, struggles, pendingEvent, emotionalTrend,
    neglectedArea, lastSession,
    isFirstSession: total === 0,
  };
}

// ─── MEMORY REFERENCE GENERATOR ───────────────────────────────────────────────
// Generates natural language references the therapist will make
function generateMemoryReferences(analysis, soul, currentReading) {
  const refs = [];
  const name = soul?.name || "you";

  // Reference last session
  if (analysis.lastSession) {
    const dayAgo = Math.round(
      (Date.now() - new Date(analysis.lastSession.date)) / 86400000
    );
    const dayLabel = dayAgo === 1 ? "yesterday" : dayAgo === 0 ? "earlier today" : `${dayAgo} days ago`;

    if (analysis.lastSession.breakthroughs?.length) {
      refs.push({
        type: "breakthrough_recall",
        priority: 9,
        text: `${dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)}, you had a real moment — ${analysis.lastSession.breakthroughs[0].toLowerCase()}. I want you to hold onto that.`,
        trigger: "session_open",
      });
    }

    if (analysis.lastSession.struggles?.length && currentReading?.derivedState !== "crisis") {
      refs.push({
        type: "struggle_followup",
        priority: 7,
        text: `Last time, ${analysis.lastSession.struggles[0].toLowerCase()}. I'm watching how that develops today.`,
        trigger: "session_open",
      });
    }
  }

  // Reference pending upcoming event
  if (analysis.pendingEvent) {
    refs.push({
      type: "event_reminder",
      priority: 10,
      text: `I haven't forgotten about ${analysis.pendingEvent}. Today's session will keep that in mind.`,
      trigger: "session_open",
    });
  }

  // Reference emotional trend
  if (analysis.emotionalTrend === "improving" && analysis.total >= 3) {
    refs.push({
      type: "trend_positive",
      priority: 8,
      text: `Looking at the past week, ${name} — you've been trending upward emotionally. That's not luck. That's work.`,
      trigger: "encouragement",
    });
  } else if (analysis.emotionalTrend === "declining" && analysis.total >= 3) {
    refs.push({
      type: "trend_concern",
      priority: 8,
      text: `I've noticed the past few sessions have felt heavier. I'm not alarmed — but I am paying attention. We'll be gentle today.`,
      trigger: "session_open",
    });
  }

  // Reference streak
  if (analysis.streak >= 7) {
    refs.push({
      type: "streak_major",
      priority: 9,
      text: `${analysis.streak} days in a row. That kind of consistency is how real change happens, ${name}.`,
      trigger: "encouragement",
    });
  } else if (analysis.streak >= 3) {
    refs.push({
      type: "streak_building",
      priority: 6,
      text: `${analysis.streak} sessions in a row. You're building something real here.`,
      trigger: "encouragement",
    });
  }

  // Reference weak areas
  if (analysis.weakAreas?.length && currentReading?.derivedState !== "crisis") {
    refs.push({
      type: "weak_area_flag",
      priority: 5,
      text: `Your data shows ${analysis.weakAreas[0]?.name} is still your biggest challenge. We'll visit it today with fresh eyes.`,
      trigger: "exercise_intro",
    });
  }

  // Reference neglected area
  if (analysis.neglectedArea) {
    refs.push({
      type: "neglect_flag",
      priority: 4,
      text: `It's been a while since we worked on ${analysis.neglectedArea}. Not forgotten — just waiting for the right moment.`,
      trigger: "exercise_intro",
    });
  }

  // Reference total milestone
  if (analysis.total === 10 || analysis.total === 25 || analysis.total === 50) {
    refs.push({
      type: "milestone",
      priority: 10,
      text: `${name}, this is session number ${analysis.total}. That's a milestone worth acknowledging — most people quit long before this point.`,
      trigger: "session_open",
    });
  }

  // Sort by priority
  return refs.sort((a, b) => b.priority - a.priority);
}

// ─── TIMELINE FORMATTER ───────────────────────────────────────────────────────
function formatTimeline(sessions) {
  return sessions.slice(0, 10).map(s => {
    const date = new Date(s.date);
    const dayAgo = Math.round((Date.now() - date) / 86400000);
    const label = dayAgo === 0 ? "Today" : dayAgo === 1 ? "Yesterday" : `${dayAgo}d ago`;
    const stateColors = {
      crisis: "#818cf8", low: "#60a5fa", fragile: "#fbbf24",
      steady: "#34d399", open: "#a78bfa", energised: "#f472b6",
    };
    const stateEmojis = {
      crisis: "🌊", low: "🌧️", fragile: "🌤️",
      steady: "⚖️", open: "🌟", energised: "⚡",
    };
    return {
      ...s,
      label,
      color: stateColors[s.emotionalState] || "#64748b",
      emoji: stateEmojis[s.emotionalState] || "•",
      avgScore: s.exercisesCompleted?.length
        ? Math.round(s.exercisesCompleted.reduce((a, b) => a + b.score, 0) / s.exercisesCompleted.length)
        : null,
    };
  });
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function MemoryEngine({ soul = {}, currentReading = {}, onMemoryLoaded }) {
  const [analysis, setAnalysis] = useState(null);
  const [memoryRefs, setMemoryRefs] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [activeTab, setActiveTab] = useState("insights");
  const [loaded, setLoaded] = useState(false);
  const [newEntryMode, setNewEntryMode] = useState(false);
  const [newEntry, setNewEntry] = useState({
    breakthroughs: "", struggles: "", winsReported: "", upcomingEvent: ""
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Seed demo data if empty
    if (MemoryStore.getTotalSessions() === 0) {
      MemoryStore.seedDemo();
    }
    const a = analyseMemory(soul);
    const refs = generateMemoryReferences(a, soul, currentReading);
    const tl = formatTimeline(a.sessions);
    setAnalysis(a);
    setMemoryRefs(refs);
    setTimeline(tl);
    setLoaded(true);
    if (onMemoryLoaded) onMemoryLoaded({ analysis: a, references: refs });
  }, []);

  function saveNewEntry() {
    const entry = {
      id: `session_${Date.now()}`,
      date: new Date().toISOString(),
      dayOfWeek: new Date().toLocaleDateString("en", { weekday: "long" }),
      emotionalState: currentReading?.derivedState || "steady",
      sessionType: currentReading?.sessionRecommendation || "standard",
      exercisesCompleted: [],
      breakthroughs: newEntry.breakthroughs ? [newEntry.breakthroughs] : [],
      struggles: newEntry.struggles ? [newEntry.struggles] : [],
      avoidances: [],
      winsReported: newEntry.winsReported ? [newEntry.winsReported] : [],
      therapistNotes: [],
      upcomingEvent: newEntry.upcomingEvent || null,
      streak: MemoryStore.getStreak() + 1,
      totalSessions: MemoryStore.getTotalSessions() + 1,
    };
    MemoryStore.save(entry);
    const a = analyseMemory(soul);
    const refs = generateMemoryReferences(a, soul, currentReading);
    const tl = formatTimeline(a.sessions);
    setAnalysis(a);
    setMemoryRefs(refs);
    setTimeline(tl);
    setNewEntryMode(false);
    setSaved(true);
    setNewEntry({ breakthroughs: "", struggles: "", winsReported: "", upcomingEvent: "" });
    setTimeout(() => setSaved(false), 3000);
  }

  if (!loaded || !analysis) {
    return (
      <div style={{
        minHeight: "100vh", background: "#07080f",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ color: "#334155", fontSize: 14, fontFamily: "Georgia, serif", fontStyle: "italic" }}>
          Retrieving your memory...
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "Total Sessions", value: analysis.total, icon: "📅", color: "#6366f1" },
    { label: "Current Streak", value: `${analysis.streak}d`, icon: "🔥", color: "#f472b6" },
    { label: "Breakthroughs", value: analysis.breakthroughs.length, icon: "✨", color: "#fbbf24" },
    { label: "Trend", value: analysis.emotionalTrend === "improving" ? "↑ Up" : analysis.emotionalTrend === "declining" ? "↓ Down" : "→ Stable", icon: "📈", color: analysis.emotionalTrend === "improving" ? "#34d399" : analysis.emotionalTrend === "declining" ? "#f87171" : "#60a5fa" },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #07080f 0%, #0a0d14 50%, #07080f 100%)",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      color: "#cbd5e1",
      padding: "0 0 60px 0",
    }}>

      {/* Ambient */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "radial-gradient(ellipse 60% 35% at 70% 15%, rgba(99,102,241,0.05) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Header */}
      <div style={{
        maxWidth: 680, margin: "0 auto",
        padding: "32px 24px 0",
        display: "flex", alignItems: "center", gap: 14,
      }}>
        <div style={{
          width: 46, height: 46, borderRadius: "50%",
          background: "linear-gradient(135deg, #6366f1, #10b981)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, boxShadow: "0 0 20px rgba(99,102,241,0.25)",
        }}>🧠</div>
        <div>
          <div style={{ color: "#e2e8f0", fontSize: 17, fontWeight: 600 }}>Memory Engine</div>
          <div style={{ color: "#334155", fontSize: 12, fontStyle: "italic" }}>
            {soul?.name ? `${soul.name}'s journey — ${analysis.total} sessions` : `${analysis.total} sessions recorded`}
          </div>
        </div>
        <button
          onClick={() => setNewEntryMode(true)}
          style={{
            marginLeft: "auto",
            padding: "8px 16px",
            background: "rgba(99,102,241,0.12)",
            border: "1px solid rgba(99,102,241,0.25)",
            borderRadius: 10,
            color: "#818cf8", fontSize: 12,
            fontFamily: "Georgia, serif",
            cursor: "pointer",
          }}
        >+ Log Session</button>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "28px 24px 0" }}>

        {/* Saved confirmation */}
        {saved && (
          <div style={{
            padding: "12px 18px", marginBottom: 20,
            background: "rgba(52,211,153,0.08)",
            border: "1px solid rgba(52,211,153,0.2)",
            borderRadius: 12, color: "#34d399", fontSize: 13,
            animation: "fadeSlideIn 0.3s ease",
          }}>
            ✓ Session memory saved
          </div>
        )}

        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 24 }}>
          {statCards.map(card => (
            <div key={card.label} style={{
              padding: "16px 14px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 14,
              textAlign: "center",
            }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>{card.icon}</div>
              <div style={{ color: card.color, fontSize: 18, fontWeight: 600, marginBottom: 2 }}>
                {card.value}
              </div>
              <div style={{ color: "#334155", fontSize: 10, letterSpacing: "0.05em" }}>
                {card.label.toUpperCase()}
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 0 }}>
          {["insights", "timeline", "patterns"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: "10px 18px",
              background: "none",
              border: "none",
              borderBottom: activeTab === tab ? "2px solid #6366f1" : "2px solid transparent",
              color: activeTab === tab ? "#a5b4fc" : "#334155",
              fontSize: 13, fontFamily: "Georgia, serif",
              cursor: "pointer", textTransform: "capitalize",
              letterSpacing: "0.03em",
              transition: "all 0.2s",
              marginBottom: -1,
            }}>{tab}</button>
          ))}
        </div>

        {/* ── INSIGHTS TAB ── */}
        {activeTab === "insights" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Pending event banner */}
            {analysis.pendingEvent && (
              <div style={{
                padding: "16px 20px",
                background: "rgba(251,191,36,0.07)",
                border: "1px solid rgba(251,191,36,0.2)",
                borderRadius: 14,
                display: "flex", gap: 12, alignItems: "center",
              }}>
                <span style={{ fontSize: 22 }}>📅</span>
                <div>
                  <div style={{ color: "#fbbf24", fontSize: 11, letterSpacing: "0.06em", marginBottom: 3 }}>
                    UPCOMING EVENT IN FOCUS
                  </div>
                  <div style={{ color: "#e2e8f0", fontSize: 14 }}>{analysis.pendingEvent}</div>
                </div>
              </div>
            )}

            {/* Memory references — what the therapist will say */}
            <div style={{
              padding: "20px",
              background: "rgba(99,102,241,0.05)",
              border: "1px solid rgba(99,102,241,0.15)",
              borderRadius: 16,
            }}>
              <div style={{ color: "#6366f1", fontSize: 11, letterSpacing: "0.07em", marginBottom: 16 }}>
                🎙️ WHAT YOUR THERAPIST REMEMBERS
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {memoryRefs.slice(0, 4).map((ref, i) => (
                  <div key={i} style={{
                    padding: "13px 16px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 12,
                    display: "flex", gap: 12, alignItems: "flex-start",
                  }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: "#6366f1",
                      marginTop: 6, flexShrink: 0,
                    }} />
                    <div>
                      <div style={{ color: "#64748b", fontSize: 10, letterSpacing: "0.06em", marginBottom: 4 }}>
                        {ref.type.replace(/_/g, " ").toUpperCase()}
                      </div>
                      <div style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.6, fontStyle: "italic" }}>
                        "{ref.text}"
                      </div>
                    </div>
                  </div>
                ))}
                {memoryRefs.length === 0 && (
                  <div style={{ color: "#334155", fontSize: 13, fontStyle: "italic", textAlign: "center", padding: "10px 0" }}>
                    No memories yet — your first session will create them.
                  </div>
                )}
              </div>
            </div>

            {/* Skill areas */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{
                padding: "18px",
                background: "rgba(248,113,113,0.05)",
                border: "1px solid rgba(248,113,113,0.15)",
                borderRadius: 14,
              }}>
                <div style={{ color: "#f87171", fontSize: 11, letterSpacing: "0.06em", marginBottom: 12 }}>
                  ⚠ NEEDS WORK
                </div>
                {analysis.weakAreas.length ? analysis.weakAreas.map((a, i) => (
                  <div key={i} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ color: "#94a3b8", fontSize: 12 }}>{a.name}</span>
                      <span style={{ color: "#f87171", fontSize: 12 }}>{Math.round(a.avg)}%</span>
                    </div>
                    <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                      <div style={{ height: "100%", width: `${a.avg}%`, background: "#f87171", borderRadius: 2 }} />
                    </div>
                  </div>
                )) : <div style={{ color: "#334155", fontSize: 12 }}>No data yet</div>}
              </div>

              <div style={{
                padding: "18px",
                background: "rgba(52,211,153,0.05)",
                border: "1px solid rgba(52,211,153,0.15)",
                borderRadius: 14,
              }}>
                <div style={{ color: "#34d399", fontSize: 11, letterSpacing: "0.06em", marginBottom: 12 }}>
                  ✓ STRONGEST AREAS
                </div>
                {analysis.strongAreas.length ? analysis.strongAreas.map((a, i) => (
                  <div key={i} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ color: "#94a3b8", fontSize: 12 }}>{a.name}</span>
                      <span style={{ color: "#34d399", fontSize: 12 }}>{Math.round(a.avg)}%</span>
                    </div>
                    <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                      <div style={{ height: "100%", width: `${a.avg}%`, background: "#34d399", borderRadius: 2 }} />
                    </div>
                  </div>
                )) : <div style={{ color: "#334155", fontSize: 12 }}>No data yet</div>}
              </div>
            </div>

            {/* Recent breakthroughs */}
            {analysis.breakthroughs.length > 0 && (
              <div style={{
                padding: "18px 20px",
                background: "rgba(251,191,36,0.05)",
                border: "1px solid rgba(251,191,36,0.15)",
                borderRadius: 14,
              }}>
                <div style={{ color: "#fbbf24", fontSize: 11, letterSpacing: "0.06em", marginBottom: 12 }}>
                  ✨ RECENT BREAKTHROUGHS
                </div>
                {analysis.breakthroughs.map((b, i) => (
                  <div key={i} style={{
                    display: "flex", gap: 10, alignItems: "flex-start",
                    marginBottom: i < analysis.breakthroughs.length - 1 ? 10 : 0,
                  }}>
                    <span style={{ color: "#fbbf24", fontSize: 14, marginTop: 1 }}>→</span>
                    <span style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.5 }}>{b}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TIMELINE TAB ── */}
        {activeTab === "timeline" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {timeline.length === 0 && (
              <div style={{ color: "#334155", fontSize: 14, fontStyle: "italic", textAlign: "center", padding: "40px 0" }}>
                No sessions yet. Your timeline will build here.
              </div>
            )}
            {timeline.map((session, i) => (
              <div key={session.id} style={{
                padding: "18px 20px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 16,
                display: "flex", gap: 14, alignItems: "flex-start",
                animation: `fadeSlideIn 0.4s ${i * 0.05}s ease both`,
              }}>
                {/* State dot */}
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: `${session.color}15`,
                  border: `1px solid ${session.color}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, flexShrink: 0,
                }}>{session.emoji}</div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div>
                      <span style={{ color: "#e2e8f0", fontSize: 14 }}>{session.label}</span>
                      <span style={{ color: "#334155", fontSize: 12, marginLeft: 8 }}>· {session.dayOfWeek}</span>
                    </div>
                    {session.avgScore && (
                      <span style={{
                        padding: "3px 10px",
                        background: `${session.color}15`,
                        borderRadius: 10,
                        color: session.color,
                        fontSize: 11,
                      }}>{session.avgScore}% avg</span>
                    )}
                  </div>

                  {session.exercisesCompleted?.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                      {session.exercisesCompleted.map((ex, j) => (
                        <span key={j} style={{
                          padding: "3px 10px",
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 8,
                          color: "#64748b", fontSize: 11,
                        }}>{ex.name} · {ex.score}%</span>
                      ))}
                    </div>
                  )}

                  {session.breakthroughs?.length > 0 && (
                    <div style={{ color: "#fbbf24", fontSize: 12, fontStyle: "italic" }}>
                      ✨ {session.breakthroughs[0]}
                    </div>
                  )}

                  {session.therapistNotes?.length > 0 && (
                    <div style={{ color: "#334155", fontSize: 12, marginTop: 4, fontStyle: "italic" }}>
                      🎙️ "{session.therapistNotes[0]}"
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── PATTERNS TAB ── */}
        {activeTab === "patterns" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Emotional trend chart */}
            <div style={{
              padding: "20px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 16,
            }}>
              <div style={{ color: "#64748b", fontSize: 11, letterSpacing: "0.07em", marginBottom: 16 }}>
                EMOTIONAL STATE — LAST 7 SESSIONS
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 80 }}>
                {timeline.slice(0, 7).reverse().map((s, i) => {
                  const stateH = { crisis: 12, low: 25, fragile: 40, steady: 55, open: 68, energised: 80 };
                  const h = stateH[s.emotionalState] || 40;
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <div style={{ fontSize: 10, color: "#334155" }}>{s.emoji}</div>
                      <div style={{
                        width: "100%", height: h,
                        background: `linear-gradient(to top, ${s.color}80, ${s.color}30)`,
                        borderRadius: "4px 4px 2px 2px",
                        border: `1px solid ${s.color}30`,
                        transition: "height 0.5s ease",
                      }} />
                      <div style={{ color: "#1e293b", fontSize: 9 }}>{s.label.slice(0, 3)}</div>
                    </div>
                  );
                })}
                {timeline.length === 0 && (
                  <div style={{ color: "#334155", fontSize: 13, fontStyle: "italic", width: "100%", textAlign: "center", paddingBottom: 20 }}>
                    No data yet
                  </div>
                )}
              </div>
            </div>

            {/* Day/time patterns */}
            <div style={{
              padding: "20px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 16,
            }}>
              <div style={{ color: "#64748b", fontSize: 11, letterSpacing: "0.07em", marginBottom: 14 }}>
                SESSION PATTERNS
              </div>
              {[
                {
                  label: "Most active day",
                  value: (() => {
                    const days = analysis.sessions.map(s => s.dayOfWeek);
                    const counts = days.reduce((acc, d) => { acc[d] = (acc[d] || 0) + 1; return acc; }, {});
                    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
                    return top ? top[0] : "—";
                  })(),
                  icon: "📅",
                },
                {
                  label: "Emotional trend",
                  value: analysis.emotionalTrend.charAt(0).toUpperCase() + analysis.emotionalTrend.slice(1),
                  icon: "📈",
                },
                {
                  label: "Longest streak",
                  value: `${analysis.streak} days`,
                  icon: "🔥",
                },
                {
                  label: "Neglected area",
                  value: analysis.neglectedArea || "None",
                  icon: "⚠️",
                },
              ].map((p, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 0",
                  borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.05)" : "none",
                }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ fontSize: 16 }}>{p.icon}</span>
                    <span style={{ color: "#64748b", fontSize: 13 }}>{p.label}</span>
                  </div>
                  <span style={{ color: "#e2e8f0", fontSize: 13 }}>{p.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New entry modal */}
        {newEntryMode && (
          <div style={{
            position: "fixed", inset: 0,
            background: "rgba(7,8,15,0.92)",
            display: "flex", alignItems: "flex-end", justifyContent: "center",
            zIndex: 100,
            backdropFilter: "blur(8px)",
            animation: "fadeIn 0.3s ease",
          }}>
            <div style={{
              width: "100%", maxWidth: 640,
              background: "#0d1117",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "20px 20px 0 0",
              padding: "28px 24px 40px",
              animation: "slideUp 0.4s ease",
            }}>
              <div style={{ color: "#e2e8f0", fontSize: 16, marginBottom: 6 }}>Log Today's Session</div>
              <div style={{ color: "#334155", fontSize: 12, fontStyle: "italic", marginBottom: 24 }}>
                This builds your memory — your therapist will reference it next time.
              </div>
              {[
                { key: "breakthroughs", label: "A breakthrough or win", placeholder: "Something that went well..." },
                { key: "struggles", label: "A struggle or difficulty", placeholder: "Something that was hard..." },
                { key: "winsReported", label: "Real-life win (outside sessions)", placeholder: "e.g. I made a phone call..." },
                { key: "upcomingEvent", label: "Something coming up", placeholder: "e.g. Presentation on Thursday..." },
              ].map(field => (
                <div key={field.key} style={{ marginBottom: 16 }}>
                  <div style={{ color: "#475569", fontSize: 12, marginBottom: 6 }}>{field.label}</div>
                  <input
                    value={newEntry[field.key]}
                    onChange={e => setNewEntry(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    style={{
                      width: "100%", padding: "12px 16px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 10, color: "#e2e8f0", fontSize: 13,
                      fontFamily: "Georgia, serif", outline: "none",
                    }}
                  />
                </div>
              ))}
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button onClick={() => setNewEntryMode(false)} style={{
                  flex: 1, padding: "14px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12, color: "#475569",
                  fontFamily: "Georgia, serif", fontSize: 14, cursor: "pointer",
                }}>Cancel</button>
                <button onClick={saveNewEntry} style={{
                  flex: 2, padding: "14px",
                  background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                  border: "none", borderRadius: 12,
                  color: "#fff", fontFamily: "Georgia, serif",
                  fontSize: 14, cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(99,102,241,0.3)",
                }}>Save to Memory →</button>
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
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp {
          from { transform: translateY(40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder { color: #1e293b; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.2); border-radius: 2px; }
      `}</style>
    </div>
  );
}
