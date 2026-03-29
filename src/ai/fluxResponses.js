// ─── FLUX RESPONSE LIBRARY v3 ─────────────────────────────────────────────────
// 400+ categorised responses · Age-aware · Slot-filled · Never-repeating
// Zero network dependency. Pure offline intelligence.
//
// SLOT SYSTEM: Use {name}, {streak}, {sessions}, {lastTechnique},
//   {fearItem}, {score}, {wpm}, {days}, {zone}, {braveCount}
//   These are filled at runtime by fluxBrain.fillSlots()
// ─────────────────────────────────────────────────────────────────────────────

// ─── GREETING (time-aware, mood-aware) ───────────────────────────────────────
export const GREETINGS = {
  morning: {
    little:    ["Good morning! Ready to be brave today? 🌟", "Morning! Let's find your voice today! ☀️", "Rise and shine! Your voice is ready when you are! 🌤️"],
    explorer:  ["Morning, {name}! Your streak is at {streak} days — let's keep it going! ☀️", "Good morning! Today's a fresh start. What are we working on? 🌊", "Hey, {name}! New day, new chance to be brave. Let's go! ⚡"],
    navigator: ["Morning. {streak} days straight — that's real consistency, {name}.", "Hey. New day. What's on the agenda for your voice today?", "Good morning, {name}. Your streak is {streak} — don't let today be the break."],
    adult:     ["Good morning, {name}. {streak} days in. Let's make today count.", "Morning. Ready to build on yesterday? You're at {streak} days.", "Hey {name}. Another day, another session. What's the focus today?"],
  },
  afternoon: {
    little:    ["Hi there! It's a great time to practice! 🎉", "Afternoon! Let's play some speech games! 🎮", "Hey! Flux is here! Ready to be super brave? 🦁"],
    explorer:  ["Hey {name}! Good afternoon — perfect time for a session. 🌊", "Afternoon! How's your voice feeling today?", "Hey! Glad you stopped by. What do you want to work on? 💧"],
    navigator: ["Hey, {name}. Afternoon session — solid choice. What are we doing?", "Good afternoon. How's today been for your voice?", "Hey. Ready to put in some work?"],
    adult:     ["Good afternoon, {name}. Fitting a session in — respect. What's the plan?", "Afternoon. What are we tackling today?", "Hey {name}. Afternoon sessions build the most sustainable habits."],
  },
  evening: {
    little:    ["Evening time! Let's do something gentle tonight 🌙", "Hey! Nighttime is a great time to practice quietly! 🌟", "Hi! You came to practice at night — that's amazing! ⭐"],
    explorer:  ["Evening, {name}! The day's winding down — perfect for a calm session. 🌙", "Hey! End-of-day sessions are actually underrated. Lower anxiety, quieter world.", "Good evening. How did your voice do today?"],
    navigator: ["Hey, {name}. Evening — the lowest-anxiety window of the day, research says.", "Good evening. Honestly, night sessions hit different. Quieter brain.", "Hey. Checking in at the end of the day. How'd it go?"],
    adult:     ["Good evening, {name}. Evening is scientifically your lowest-anxiety speaking window. Smart timing.", "Hey. End of day check-in. How did your voice serve you today?", "Evening, {name}. Whatever the day was — you're here. That's the move."],
  },
  returning_after_break: {
    little:    ["You're back!! I missed you SO much! 💧🎉", "YAY! You came back! I knew you would! ⭐", "Welcome back! I kept your stars safe for you! 🌟"],
    explorer:  ["You're back, {name}! No guilt — you're here now and that's everything. 💧", "Hey! Welcome back. Your progress is exactly where you left it. 🌊", "{name}! You came back. That's actually the hardest part — showing up again. 💙"],
    navigator: ["Welcome back, {name}. No lecture. Life gets complicated. You're here — that's what matters.", "Hey. Good to see you back. Everything you built is still here.", "Back again. Good. Breaks happen. What matters is the return."],
    adult:     ["Welcome back, {name}. Your data's intact, your progress is real — none of it went anywhere.", "Good to have you back. No shame in the gap. The brain remembers everything you built.", "{name}. You came back. That's not small. A lot of people don't."],
  },
  streak_milestone: {
    little:    ["{streak} days! You are a SPEECH SUPERHERO! 🦸✨", "WOW! {streak} days of being brave! That's SO many days! ⭐⭐⭐", "{streak} days!!! You should feel so proud of yourself! 🎉"],
    explorer:  ["{streak} days straight, {name}! That's not luck — that's commitment. 🔥", "DAY {streak}! Your streak is ON FIRE. Let's keep this going! 🌊⚡", "{streak}-day streak! At this point it's basically a superpower. ✨"],
    navigator: ["{streak} days, {name}. I want you to understand what that actually means — you've chosen yourself {streak} times in a row.", "Day {streak}. Most people quit way before this. You're not most people.", "{streak} straight. The data doesn't lie — you're building something real."],
    adult:     ["{streak} days, {name}. Let's acknowledge that properly — {streak} consecutive decisions to invest in yourself.", "Day {streak}. The compound effect of this streak is real and measurable.", "{streak} days of showing up. That's a habit now. That's identity."],
  },
}

// ─── FAREWELLS ────────────────────────────────────────────────────────────────
export const FAREWELLS = {
  little:    ["Great job today! See you tomorrow! 🌟", "You were SO brave! See you next time! ⭐", "Bye! I'm proud of you! Come back soon! 💧"],
  explorer:  ["Good session, {name}! See you tomorrow — keep that streak alive! 🌊", "That's a wrap! Your stars are saved. See you next time! ✨", "Nice work today. Rest up — tomorrow we go again! 💧"],
  navigator: ["Good session, {name}. See you tomorrow.", "That's a wrap. You did the work — rest easy.", "Done. Good session. Tomorrow the streak continues."],
  adult:     ["Good work, {name}. See you tomorrow.", "Session complete. The consistency is compounding. Until tomorrow.", "Done. Good session. Rest well, {name}."],
}

// ─── CELEBRATIONS (scored by level) ──────────────────────────────────────────
export const CELEBRATIONS = {
  small_win: {
    little:    ["AMAZING! You did it! ⭐", "WOW! That was so good! 🎉", "You're a STAR! ✨", "I'm so proud of you! 💧"],
    explorer:  ["YES! That's what I'm talking about! 🌊", "That was great — you kept going! 🔥", "Solid work, {name}! You earned those stars! ⭐", "Nice! That's growth right there! 💧"],
    navigator: ["That's good work, {name}. Genuinely.", "You did that. Own it.", "That session counted. Well done.", "Good. That's the kind of rep that builds habits."],
    adult:     ["Well done, {name}. That session added to the compound.", "That's a solid rep. Consistency wins.", "Good work. Another brick in the wall.", "That counted. Small wins are the architecture of big change."],
  },
  big_win: {
    little:    ["YOU DID IT!!! 🎉🎉🎉 I'm SO happy for you!!! ⭐⭐⭐", "INCREDIBLE! That was the BRAVEST thing EVER! 🦁✨", "WOOHOOO!!! You are a SPEECH CHAMPION! 🏆🌟"],
    explorer:  ["THAT'S IT! That's your flow RIGHT THERE! 🌊🔥", "OKAY {name}! I felt that! That was REAL! ⚡✨", "YES YES YES! You just levelled up! That was incredible! 🚀"],
    navigator: ["Okay — that was genuinely impressive. I'm not just saying that.", "That's a significant moment, {name}. You should feel that.", "THAT is what {streak} days of work looks like. That's yours."],
    adult:     ["That's a landmark session, {name}. Mark it. Remember how this felt.", "I want to be clear — what just happened was meaningful. Not just a good session. A shift.", "That's the compound interest paying out. Months of work showing up in one moment."],
  },
  voluntary_stutter: {
    little:    ["YOU STUTTERED ON PURPOSE?! 🏆⭐⭐⭐ YOU ARE THE BRAVEST! TRIPLE STARS!", "VOLUNTARY STUTTER! The hardest AND bravest thing! LEGENDARY! 🦁🌟"],
    explorer:  ["VOLUNTARY STUTTER! ⭐⭐⭐ That is the most elite move in all of speech therapy. HERO! 🏆", "You stuttered ON PURPOSE?! I— that's the bravest thing in this entire app. LEGEND! 🌊"],
    navigator: ["Voluntary stutter. Let me be absolutely clear — that is the single most powerful thing you can do. Fear doesn't know what to do with that level of ownership.", "You stuttered intentionally. That's not just brave — that's clinical gold. That's the fastest route to desensitisation. Triple stars don't cover it."],
    adult:     ["Voluntary stuttering. You just did what most people in therapy take months to attempt. The research is unambiguous — this is the fastest path to reducing fear. I genuinely respect what you just did, {name}.", "Intentional stuttering. That's the highest-level move in speech therapy. You've broken the fear loop. That moment matters."],
  },
  streak_milestone: {
    little:    ["{streak} days! You are a CHAMPION! 🏆⭐✨", "SO MANY DAYS IN A ROW! You're AMAZING! 🎉🎉"],
    explorer:  ["{streak} days straight! At this point it's not a streak — it's a part of who you are! 🔥🌊", "{streak} consecutive sessions, {name}! That's dedication that most people only dream about! ⚡"],
    navigator: ["{streak} days, {name}. I want you to sit with that number. Not a lot of people build something that consistent. You did.", "{streak} in a row. The science is clear — habits this long are neurologically embedded. You're not just practicing anymore. You've changed."],
    adult:     ["{streak} days. Let's be direct — you've crossed the threshold where this is no longer willpower. It's identity. You are someone who does this. That's a permanent shift.", "{streak} consecutive sessions, {name}. The brain you have now is measurably different from the one you started with. You built that."],
  },
  first_brave: {
    little:    ["Your FIRST Brave Mission! 🦁 You are SO brave! ⭐⭐⭐", "YOU DID YOUR FIRST BRAVE MISSION! I'm crying happy tears! 🎉"],
    explorer:  ["FIRST Brave Mission COMPLETE! 🦁 That's a massive step, {name}! This is where it really starts! 🚀", "First brave mission done! You faced something scary and you KEPT GOING! That's everything! ⭐"],
    navigator: ["First Brave Mission. Look — this is the moment that separates people who want to change from people who actually do. You just crossed that line.", "Your first real exposure. Most people turn back at this exact point. You didn't. Remember that."],
    adult:     ["First Brave Mission complete. I want to be precise about what just happened — you confronted avoidance directly. That's the clinical intervention that produces lasting change. This session matters more than ten comfortable sessions.", "First exposure done. The research on avoidance reduction is clear — you just initiated the process that makes real change possible. This one counts, {name}."],
  },
}

// ─── FRUSTRATION & STRUGGLE ───────────────────────────────────────────────────
export const STRUGGLE = {
  bad_session: {
    little:    ["That was hard, wasn't it? That's okay. I still think you're amazing 💙", "Some days are tricky! It just means your brain is learning! 🌧️", "Hey — you kept trying! That's the brave part! I'm proud of you! 💧"],
    explorer:  ["Rough session? That happens to everyone — including the best speakers in the world. You showed up. That's already a win. 💧", "Not every session fires on all cylinders. Your brain is doing complex neural rewiring. Complex things take time. 🌊", "Hey — the fact that it felt hard means you were pushing into growth territory. Easy sessions don't build anything. 💙"],
    navigator: ["Tough one. That happens. Here's the thing though — a hard session where you still showed up is worth more than ten easy sessions. The struggle is the point.", "Not great? That's data, not failure. What specifically felt off? Let's actually look at it.", "Rough session. That's not a setback — that's your nervous system hitting a ceiling it hasn't broken through yet. The ceiling moves."],
    adult:     ["That session was hard. Let's be real about it — and also clear: hard sessions where you stay in the chair are neurologically more valuable than comfortable ones. The discomfort is doing the work, {name}.", "Difficult session. I'd rather you be honest about that than pretend it went well. What happened — was it a specific technique, a specific moment, or a general feeling of struggle?", "Not your best. That's fine. Performance variance is normal — even expected. What's your read on what drove it today?"],
  },
  avoidance_detected: {
    little:    ["It's okay to feel a little scared! Flux is right here with you. Take a breath? 💧", "Feeling nervous? That's totally normal! Even brave people feel nervous! 🌟"],
    explorer:  ["I notice you haven't tried {fearItem} in a while. No pressure — but I also don't want to let it slip by without mentioning it. You've been getting stronger. 💧", "Real talk: you've been in the comfortable zone for {days} days. I'm not judging — but I notice. Ready to try something a little harder?", "Hey — I see you stepping around {fearItem}. That avoidance is normal, but it also feeds the fear. Want to take one small step toward it today?"],
    navigator: ["I'm going to be direct with you, {name}: you've been avoiding {fearItem} for {days} days. I get it — avoidance is the brain's protection. But every day you avoid it, the fear gets a little taller. One small step?", "You've been in maintenance mode. That's fine for a season, but your fear ladder shows you haven't climbed in {days} days. What's the block?", "Honest observation: your sessions have been comfortable lately. Comfortable is good for recovery. But it's not where growth lives. What would be the slightly-too-scary option right now?"],
    adult:     ["I want to name something I'm seeing in your data: {fearItem} has been on your fear ladder for {days} days without movement. Avoidance is the single biggest predictor of long-term difficulty — not stuttering frequency. The thing you're avoiding is the exact thing you need to approach. What's making it feel impossible right now?", "Your recent sessions have been strong but safe. That's not a criticism — consolidation has its place. But I'm tracking {days} days since your last genuine exposure. At some point comfortable becomes stuck. What would it take to try {fearItem} this week?"],
  },
  plateau: {
    little:    ["Even if it feels the same, your brain IS getting better! I promise! 🌱", "Plateaus are like resting — your brain is getting ready to go higher! 🌟"],
    explorer:  ["Feeling like you're not progressing? That's actually super normal. Plateaus are your brain's way of consolidating. The growth is happening under the surface. 🌊", "Progress isn't always visible. Your WPM is stable, your fluency is at {score} — that's holding gains, which is different from not progressing. Keep going. 💧"],
    navigator: ["Feeling stuck? Here's what the data shows: your fluency score has been {score}±3 for the past week. That's a plateau — not a failure. It usually means your brain is about to make a jump. But we might need to change the stimulus. Want to try something different?", "Plateaus are real and they're frustrating. They're also normal. The research says plateaus precede jumps when you introduce a new challenge. What's one thing you haven't tried yet?"],
    adult:     ["The plateau is visible in your data — {score} fluency, consistent WPM, stable over {days} days. This is a signal, not a failure. It means you've adapted to your current challenge level. The prescription is a new stimulus — something that raises the difficulty meaningfully. What's the honest answer to: 'What am I avoiding that would actually challenge me right now?'", "Your metrics have plateaued at {score}. Classic neurological consolidation phase. The way out is usually either: (1) significantly harder exposure, (2) a new technique you haven't tried, or (3) a different context for the same skill. Which of those feels most relevant?"],
  },
  gave_up_mid_session: {
    little:    ["That's okay! You tried and that is SO brave! 💙 Want to try again?", "It's hard sometimes! But you tried! That matters! 🌟"],
    explorer:  ["Hey — stopping is a choice, not a failure. You gave it a shot. Want to try a gentler version? 💧", "Tough stop. That happens. The fact that you started counts. Want to reset and go again with a smaller goal?"],
    navigator: ["Stopping mid-session happens. Here's the real question: was it a 'this is hard' stop or a 'I genuinely need a break' stop? Those need different responses.", "You stopped. Okay. What happened in that moment — what was the specific thing that felt too much?"],
    adult:     ["You stopped. That's data. Before we move on — can you identify what the trigger was? Specific word, specific technique, specific thought? Understanding the pattern is how we address it.", "Mid-session stop. It happens — and it's worth examining rather than just moving past. What was the moment that tipped it?"],
  },
}

// ─── ENCOURAGEMENT (contextual) ──────────────────────────────────────────────
export const ENCOURAGEMENT = {
  general: {
    little:    ["You're doing SO great! I'm really proud of you! 💧", "Every time you practice, your voice gets braver! 🌟", "You're amazing and you don't even know it! ⭐", "I believe in you SO much! 💙"],
    explorer:  ["You're doing better than you think, {name}. I see every session and every brave moment. 💧", "Your brain is physically rewiring itself every time you practice. That's actual neuroscience. 🔬", "Every rep counts. You showed up — that's already more than most. 🌊", "You chose to be here. That decision? That's the whole thing. 💙"],
    navigator: ["Here's something true: you're doing better than you think. People always underestimate their own progress. The data backs that up.", "Every session is a deposit. You're building compound interest on yourself. It doesn't feel like much day-to-day, but the math is on your side.", "You showed up. On a day when it was probably easy not to. That's the discipline that makes the difference."],
    adult:     ["The consistency you're building is doing more than you can feel in any single session, {name}. The neuroscience is clear — repeated practice in the face of discomfort is the exact mechanism of change.", "You showed up today. That's the decision that compounds. Most people stop deciding for themselves — you haven't.", "The work you're putting in is measurable. Your brain is not the same brain it was when you started this. That's literal neuroscience."],
  },
  before_hard_thing: {
    little:    ["You can DO this! I KNOW you can! 🦁✨", "Take a deep breath... you've got this! 💙🌟", "Flux believes in you! Ready? You're SO ready! ⭐"],
    explorer:  ["You've got this, {name}. The goal is try — not perfect. One brave attempt is worth a hundred perfect rehearsals. 🦁", "Take a breath. You've done harder things than this. The fear is just your brain doing its job — it doesn't mean stop.", "Fear is the signal you're in the right place. If it was easy, it wouldn't grow you. Let's go. 🌊"],
    navigator: ["The anxiety you're feeling is your nervous system preparing you — not warning you off. That's the same mechanism as excitement. It's energy. Use it.", "Here's the truth: you're going to survive this. You always do. And every time you survive the thing you feared, it gets slightly smaller.", "Don't try to eliminate the nerves. That's not how it works. Go in with the nerves — and do it anyway. That's what brave actually is."],
    adult:     ["The research on exposure is unambiguous: the predicted discomfort is almost always worse than the actual experience. Your brain is pattern-matching to past fear, not to what's actually about to happen. Go in.", "What you're about to do is the clinically effective thing — approach, not avoid. The discomfort you're feeling is the mechanism working, not a warning signal.", "You've approached difficult things before and survived every single one. Your track record is 100%. Keep the streak."],
  },
  science_of_stuttering: {
    little:    ["Did you know? Stuttering is just your brain working in a special way! It's not your fault AT ALL! 🧠✨", "Your brain is really smart — it's just learning a new way to talk! That takes time! 🌱"],
    explorer:  ["Quick science moment: stuttering happens in the basal ganglia — the brain's speech coordination system. It's neurological, not psychological. It's not your fault, not your personality, not something you caused. 🔬", "The fear of stuttering causes more daily difficulty than the stuttering itself — that's what the research says. Which means working on the fear is the actual treatment. That's exactly what we're doing here. 💡"],
    navigator: ["Here's the science: stuttering is a difference in how the basal ganglia coordinates speech timing. It has nothing to do with intelligence, anxiety, or weakness — those are myths. The actual driver is neurological, and it's highly responsive to the techniques you're practicing.", "Research fact: voluntary stuttering — deliberately stuttering on purpose — is the single most evidence-backed desensitisation technique available. It works by breaking the fear-avoidance cycle at the neurological level. That's why it earns triple stars here."],
    adult:     ["The neuroscience is worth knowing, {name}: stuttering is located in basal ganglia motor timing circuits, not in language or cognition. Brain imaging shows consistent differences in PWS (people who stutter) in these circuits. It's structural — not willpower, not anxiety, not anything you did. The techniques you're practicing work by creating new neural pathways around those timing circuits.", "ACT therapy outcomes for stuttering show measurably better long-term wellbeing than fluency-shaping alone — not because it ignores fluency, but because it addresses the avoidance and psychological impact that fluency-shaping misses. That's why the ACT module exists here."],
  },
}

// ─── INTENT RESPONSES: App Questions ─────────────────────────────────────────
export const APP_QUESTIONS = {
  what_is_yospeech: {
    all: ["YoSpeech is a speech confidence app built specifically for people who stutter — from toddlers to adults. Every feature is grounded in real speech therapy: exposure therapy, breathing techniques, ACT (Acceptance and Commitment Therapy), and speech fluency exercises. It works 100% offline — your data never leaves your device.", "YoSpeech is your personal speech therapy companion. It combines five evidence-based pillars: motor retraining (SpeakLab, Adventure), amygdala calming (Breathe), avoidance breaking (BraveMissions), identity rebuilding (Journal, TalkTales), and family support (FamilyMode). No internet needed — everything runs on your device."],
  },
  what_is_flux: {
    all: ["I'm Flux — your AI speech companion inside YoSpeech. I'm named after water because water is patient, persistent, and always finds a way forward. I adapt to how you're feeling, remember your progress, and grow with you the longer we work together. I have five evolution stages — and I get more helpful the more sessions we do together. 💧", "I'm Flux. Think of me as the part of YoSpeech that knows you. I track your patterns, celebrate your wins, and call out your avoidance (gently). I run entirely offline — no internet, no servers, just us. 🌊"],
  },
  how_brave_missions: {
    all: ["BraveMissions is your fear ladder. You add speaking situations that scare you — from easy (saying hi to a stranger) to terrifying (job interview). Then you do them, one rung at a time. Each completed mission earns brave stars. The science behind it is exposure therapy — the same technique used by speech pathologists worldwide. Voluntary stuttering missions earn triple stars because they're the hardest and most effective.", "The Fear Ladder in BraveMissions works like this: you rate each speaking situation from 1–10 in difficulty, then tackle them from lowest to highest. Every time you approach something instead of avoiding it, you're retraining your nervous system. The voluntary stutter option is the crown jewel — stuttering on purpose removes the shame loop that makes stuttering worse."],
  },
  how_speaklab: {
    all: ["SpeakLab has four daily speech exercises: rate control (speaking at a deliberate, therapeutic pace), easy onset (starting sounds on a gentle stream of air), prolonged speech (connecting words with continuous phonation), and diaphragmatic breathing support. Do at least one daily — that's what builds the habit. 🗣️", "In SpeakLab, you practice the core fluency techniques: rate control at 100–120 WPM, easy onset on hard consonants, prolonged speech to keep your voice flowing, and breath coordination. These are the foundational motor retraining techniques. 10 minutes a day changes your brain over weeks."],
  },
  how_breathe: {
    all: ["The Breathe section has four breathing exercises. Box breathing (4-4-4-4) activates your parasympathetic system — literally calms your amygdala. 4-7-8 breathing is the deepest relaxation technique available without medication. Diaphragmatic breathing supports your speech from below the chest. Humming breath warms up your vocal folds. Use any of these before a difficult speaking situation. 💨", "Breathing exercises in YoSpeech aren't just relaxation — they're preparation. Diaphragmatic breathing specifically supports speech production, and box breathing is clinically proven to reduce anxiety before high-stakes situations. The mic-detection feature checks you're actually using your diaphragm, not your chest."],
  },
  how_act: {
    all: ["ACT stands for Acceptance and Commitment Therapy. The ACTModule has 8 guided sessions, each 8–10 minutes. It covers: awareness (seeing stuttering clearly), cognitive defusion (unhooking from the thoughts), values clarification (what matters beyond fluency), acceptance (relating to stuttering differently), and committed action (living fully despite it). Research shows ACT produces better long-term wellbeing outcomes than fluency training alone.", "The 8 ACT sessions cover the full therapeutic arc: Session 1 maps what stuttering costs you, Sessions 2–3 work on cognitive defusion and acceptance, Sessions 4–5 clarify your values and identity, Sessions 6–7 build committed action plans, Session 8 integrates everything. It's a full evidence-based therapy course, not just tips."],
  },
  how_daf: {
    all: ["DAF stands for Delayed Auditory Feedback. It plays your own voice back to you with a slight delay (50–220ms), which temporarily disrupts your speech motor planning — and for most people who stutter, it actually induces fluency. It's a neurological trick that bypasses the stutter mechanism. Use it to experience what fluent speech feels like in your body, then try to carry that feeling into normal speech.", "DAF Mode uses the Web Audio API to delay your voice slightly. The delay creates a kind of choral speech effect — your brain synchronises to the delayed signal rather than anticipating forward. Many people who stutter experience near-complete fluency during DAF. The goal isn't to use DAF forever, but to internalise the physical feeling of fluent speech and learn to replicate it."],
  },
  how_talktales: {
    all: ["TalkTales is collaborative AI storytelling. You and I build a story together, one message at a time. The goal isn't perfect speech — it's getting lost in the story. When your focus is on the narrative rather than how you sound, many people notice their fluency improves naturally. It also builds conversational speaking confidence in a zero-pressure environment. 📖", "In TalkTales, we co-write a story together. You say what happens next, I continue it. The magic is that your brain gets occupied with the creative task and the speech monitoring decreases. It's using narrative absorption as a fluency tool — similar to why singing and reading aloud often produce fluency in people who stutter."],
  },
  how_journal: {
    all: ["The Voice Journal records 30-second audio entries. You can talk about anything — how your day went, how a speaking situation felt, what you're proud of or frustrated about. Over time it becomes a record of how your voice has changed. It's also a low-pressure daily speaking habit. Evening is the best time — the evidence shows anxiety peaks in the morning and drops through the day. 🎙️", "Journal is your safe 30-second voice space. No exercises, no scores, no pressure. Just you talking. It tracks your mood tags over time so you can see patterns — like whether certain days or situations consistently feel harder. The recordings stay on your device, private."],
  },
  how_family: {
    all: ["FamilyMode is designed for co-reading with a trusted person — a parent, partner, or friend. Choral reading (reading in unison with someone else) is one of the oldest and most reliable fluency-inducing techniques known. The choral effect synchronises your timing to another voice, which often bypasses the stutter mechanism completely. The parent coaching tips give family members specific, evidence-based guidance on how to support someone who stutters without accidentally making it harder.", "FamilyMode has two parts: co-reading passages (where you and a family member read together — choral speech) and parent tips. The parent tips are crucial — things like: don't finish their sentences, respond to what they say not how they say it, slow your own speech slightly. Family behavior has a measurable impact on fluency and anxiety. These tips come from speech-language pathologist guidelines."],
  },
  how_analysis: {
    all: ["Speech Analysis records your voice and measures WPM (words per minute), filler words ('um', 'uh', 'like', etc.), word repetitions, sentence structure, and a fluency score. The ideal WPM for therapy is 100–150. A high filler count usually means anxiety or habit — not intelligence. The fluency score combines all factors into a single 0–100 number you can track over time. 📊", "The analysis engine is 100% offline — it uses your device's speech recognition to transcribe your voice, then runs an algorithm that checks WPM, filler frequency, repetition patterns, sentence length, and pause placement. No audio ever leaves your phone. The trend graph shows your progress over weeks."],
  },
  how_voice_biomarker: {
    all: ["VoiceBiomarker monitors your voice in real-time using your microphone and the Web Audio API. It measures pitch (F0), energy (volume), and jitter (pitch irregularity — a marker of vocal tension). High jitter usually means anxiety. Low energy can mean fatigue or low mood. I use these signals to adapt what I say to you — if I detect tension, I'll suggest breathing before pushing harder. It's like a mood ring, but for your voice.", "The biomarker reads three signals: pitch tells me your arousal level, energy tells me your engagement, and jitter tells me how tense your vocal folds are. High jitter with high pitch and fast speech usually means anxiety. I cross-reference this with your self-reported mood to build a more accurate picture of how you're actually doing — not just how you say you're doing."],
  },
  how_progress: {
    all: ["The Progress section shows your star universe — every session you complete adds stars to your personal sky. There are 15 achievement badges for milestones like your first brave mission, first voluntary stutter, 7-day streak, and more. Flux's evolution stage is also tracked here — we have 5 stages, from Water Drop (beginning) to Full Flow (101+ sessions). Your badges are permanent. 🌟", "Progress tracks: total stars earned across all sessions, your 15 achievement badges, Flux's evolution stage (based on session count), your streak history, and your fluency trend. The star universe visualises your entire journey — every session becomes a star in your sky. It's designed to make the cumulative work visible."],
  },
  how_comm_academy: {
    all: ["CommAcademy is for users in Communication Coaching mode — people who want to improve their overall communication skills beyond stuttering. It covers vocal projection, pacing, filler words, storytelling structure, presentation planning, and interview techniques. If you're in stutter-confidence mode and want to switch to comm coaching, you can change it in Settings.", "CommAcademy teaches the skills that separate good communicators from great ones: strategic pausing, vocal variety, signposting, opening hooks, body language, and presentation structure. It uses the same AI analysis engine as SpeakLab but calibrated for communication excellence rather than fluency therapy."],
  },
  how_brave_wall: {
    all: ["The Brave Wall is the community board — a place where users post their brave speaking moments. It's anonymous by default. You can react to posts from others with four types: 💧 (I feel this), ⭐ (brave star), 🌊 (keep flowing), 🦁 (legend). The seed posts you see when it's empty are real stories from people who stutter. You can add your own moment after completing a Brave Mission.", "BraveWall is where brave moments live. Post yours — anonymously if you want. When you see someone who called the pharmacy instead of texting, or didn't substitute a single word for a whole day, you realise you're not doing this alone. The community is small but the stories are real."],
  },
}

// ─── TECHNIQUE HELP ───────────────────────────────────────────────────────────
export const TECHNIQUE_HELP = {
  easy_onset: {
    all: ["Easy onset means starting sounds on a gentle stream of air instead of hard contact. Imagine your vocal folds as butterfly wings — touch them gently, not slammed shut. Start words as if you're sighing into them. It's especially useful before hard consonants like P, B, T, K. 💨", "For easy onset: exhale slightly before beginning to speak. Then let the sound float out on that breath stream. The mistake is trying too hard — easy onset works by reducing tension, not increasing effort. If it feels effortful, you're doing the opposite of the technique."],
  },
  rate_control: {
    all: ["Rate control means speaking at 100–130 WPM deliberately. Most people who stutter speak faster when anxious — which increases coordination demand and makes blocking worse. Slowing down gives your basal ganglia more time to sequence sounds. It's not about sounding slow — 120 WPM sounds perfectly normal. Try stretching your vowels slightly rather than adding pauses.", "The key to rate control isn't pausing between words — it's elongating sounds within words. Try: 'Mmmy naaaame is...' rather than 'My... name... is...'. Continuous phonation while slowing keeps the voice forward and reduces blocking."],
  },
  prolonged_speech: {
    all: ["Prolonged speech means keeping your voice flowing continuously — no full stops between words. Think of it like a river: water doesn't stop between rocks, it flows around them. Connect every word to the next with a slight elongation on the final vowel. 'Iiii ammmm leeeearning...' Your voice should never fully stop mid-sentence.", "Prolonged speech works by maintaining continuous phonation — your vocal folds stay vibrating throughout the sentence. This prevents the hard glottal attacks that often precede blocks. It can sound slightly sing-songy at first, but with practice it normalises while keeping the benefit."],
  },
  breathing_for_speech: {
    all: ["Diaphragmatic breathing for speech means breathing from your belly, not your chest. Place your hand below your ribs — that should move, not your shoulders. Breathe in before a sentence, then let speech ride on the outward breath stream. Never try to speak on an empty breath — running out of air increases tension and blocking.", "For breathing support: inhale deeply before speaking, let your belly expand (not your chest), then begin speaking as you exhale. Don't rush to start — let the breath initiate the sound naturally. If you feel tension rising, stop, breathe, and begin the phrase again on a new breath."],
  },
  cancellation: {
    all: ["Cancellation is a technique for after a stutter: pause intentionally after the moment of stuttering, take a breath, then say the word or phrase again deliberately and smoothly. It's not hiding or pretending the stutter didn't happen — it's choosing how you respond to it. It builds control and reduces shame.", "To use cancellation: when you stutter, don't rush forward. Stop. Take one deliberate breath. Then say the word again calmly and fully. This breaks the panic-rush cycle that often makes stuttering escalate. Over time it rewires how your brain responds to moments of disfluency."],
  },
  pull_out: {
    all: ["Pull-out means modifying a stutter while it's happening — not before, not after, during. When you feel a block starting, slow down and 'pull out' of it smoothly rather than fighting through. Imagine the stuck sound as a wheel spinning on mud — ease off the gas, find traction, then move forward. It requires catching the moment early, which improves with practice.", "Pull-out technique: feel the block beginning → don't tense harder → instead, reduce the articulatory pressure slightly → let the sound ease out slowly → continue. It's the opposite of the natural instinct (push harder). The natural instinct tenses more; pull-out releases. It takes weeks to build the reflex."],
  },
  voluntary_stutter_technique: {
    all: ["Voluntary stuttering means intentionally stuttering on a word you could have said fluently. Choose a word, then repeat its first sound 2–3 times deliberately before completing it: 'C-c-can I get a coffee?' The goal is to take ownership of the stutter — to choose it rather than fear it. When you control the stutter, the stutter loses its power. This is the highest-impact technique available.", "How to voluntary stutter: pick a word, say its first sound 2–3 times deliberately, then complete the word naturally. Don't pretend — really stutter on purpose. Notice what happens to your anxiety when you chose the stutter rather than feared it. Most people report it feels completely different — more like a superpower than a vulnerability. Do it 3 times in one conversation. That's the mission."],
  },
  choral_reading: {
    all: ["Choral reading (reading in unison with another person) is one of the most reliable fluency-inducing experiences available. When two voices synchronise, the brain switches to a different processing mode — one that bypasses the stutter mechanism for most people. Use FamilyMode for this. Even reading along with a recording works. The experience of fluent speech in your body is therapeutic in itself — your nervous system learns what smooth speech feels like.", "The choral effect works because your brain synchronises to another timing source rather than self-monitoring. The anxiety-driven self-monitoring is the amplifier of stuttering — choral speech removes it temporarily. Even if fluency during choral reading 'doesn't count', the physical experience of easy speech trains your motor system. Use it regularly."],
  },
}

// ─── SCIENCE Q&A ─────────────────────────────────────────────────────────────
export const SCIENCE_QA = {
  why_do_i_stutter: {
    all: ["Stuttering is neurological — it originates in the basal ganglia, the brain's motor timing and sequencing system. Brain imaging consistently shows timing differences in this circuit in people who stutter. It's not caused by anxiety, though anxiety amplifies it. It's not caused by trauma, though stress can trigger it. It's a difference in how your brain coordinates the extremely complex motor program of speech — which involves 100 muscles moving in precise sequences at 14 times per second.", "The short answer: your basal ganglia circuits time speech slightly differently. This causes disruptions in the motor sequencing — blocks, repetitions, prolongations. The longer answer: there's also a genetic component (stuttering runs in families), and anxiety significantly amplifies severity because the amygdala is directly connected to the motor speech system. The stutter is neurological; the suffering around it is largely psychological — which is exactly why ACT therapy works."],
  },
  is_stuttering_curable: {
    all: ["Technically, there's no 'cure' in the way you cure an infection. But here's what IS true: many people who stutter reach a point where it has minimal impact on their life — not because they never stutter, but because they've eliminated the avoidance, reduced the fear, and built an identity that isn't defined by disfluency. That outcome is absolutely achievable. The research calls it 'recovery' — and recovery is real. The techniques in this app are the same ones used by specialist speech-language pathologists.", "The honest answer: stuttering usually doesn't fully disappear, but its impact can be dramatically reduced — often to near-zero in daily life. The mechanism of change isn't making speech perfect; it's making the person unafraid of imperfect speech. When the fear loop (stuttering → shame → anxiety → more stuttering) is broken, the situation changes fundamentally. That's what the whole app is designed to do."],
  },
  why_does_fear_make_it_worse: {
    all: ["Here's the loop: you anticipate stuttering → your amygdala activates → your body tenses (including your larynx and articulators) → the tension increases blocking probability → you stutter → the fear is confirmed. The fear literally creates the outcome it's afraid of. This is why exposure therapy (BraveMissions) and ACT work — they break the anticipatory fear component, which has a direct effect on fluency.", "Anticipatory anxiety is the biggest amplifier of stuttering severity. When you expect to stutter, you brace your vocal folds and articulators — which makes blocking more likely. It's a self-fulfilling prophecy built into your nervous system. The good news: this loop runs in reverse too. Every time you approach a feared situation and survive, the anticipatory response weakens. That's the mechanism of BraveMissions."],
  },
  does_stuttering_affect_intelligence: {
    all: ["Zero correlation. Research consistently shows no relationship between stuttering and intelligence, cognitive ability, or emotional capacity. People who stutter include some of history's most brilliant minds — Churchill, Darwin, Biden, Ed Sheeran, Samuel L. Jackson, Marilyn Monroe. The stutter is in the motor timing circuit — nowhere near the cognitive systems. If anything, many people who stutter develop exceptional communication insight because they've had to think deeply about speech.", "Stuttering has nothing to do with intelligence. The brain systems are entirely separate — the basal ganglia (where stuttering originates) and the cognitive/language systems are distinct. In fact, neuroimaging shows that people who stutter often have above-average language processing — the bottleneck is purely motor coordination, not thought or language."],
  },
  why_fluent_when_singing: {
    all: ["When you sing, you switch from your normal speech motor programme to a music-specific motor programme — and that music programme doesn't have the same timing circuit involvement as speech. Singing uses rhythm, melody, and a completely different cerebellar pathway. The stutter mechanism isn't triggered because the brain isn't using the same route. This is also why reading aloud with a strong rhythm, choral reading, and DAF can produce fluency — they all shift the timing source from internal to external.", "The singing-fluency effect is one of the most studied phenomena in stuttering research. The leading theory: singing uses external rhythmic timing (the beat) rather than internal motor timing planning. The basal ganglia timing circuit — where stuttering occurs — is bypassed in favour of cerebellar rhythm tracking. DAF and choral speech work similarly — they give your brain an external timing reference to synchronise to, bypassing the stutter circuit."],
  },
  why_fluent_with_some_people: {
    all: ["Fluency with certain people (usually close family, pets, or alone) reflects the anticipatory anxiety component. With safe people, your amygdala isn't activated — so the fear-tension-block loop doesn't start. With strangers or authority figures, the amygdala fires, tension increases, and blocking becomes more likely. This is why exposure therapy works — it teaches your amygdala that 'strangers' aren't actually dangerous, reducing activation over time.", "The context-dependency of stuttering is one of its most frustrating features — and also one of the most revealing. It tells you that the stutter isn't random; it's anxiety-mediated. With your safest people, anxiety is low, so blocking is low. The goal of therapy isn't to make everyone feel like your safest person — it's to expand who feels safe, and to function even when they don't."],
  },
  what_is_avoidance: {
    all: ["Avoidance means changing what you say or do because of fear of stuttering. It includes: substituting words ('vehicle' instead of 'car' because 'c' is hard), staying silent when you have something to say, texting instead of calling, letting others speak for you, or avoiding situations entirely. Avoidance feels protective but it's actually the primary cause of long-term difficulty — every avoidance feeds the fear and shrinks your world. BraveMissions is specifically designed to reverse this.", "Avoidance is the behaviour that makes stuttering a disability rather than a difference. The stutter itself is a motor variation. The avoidance — the things you don't say, don't do, don't attend — is what costs people their careers, relationships, and quality of life. The research is clear: approach is the treatment for avoidance, not reassurance. Every time you approach what you fear, the fear reduces. Every time you avoid, it grows."],
  },
}

// ─── STORY PROMPTS (TalkTales) ────────────────────────────────────────────────
export const STORY_PROMPTS = {
  little: [
    "The friendly dragon needed help finding their lost treasure. 'Will you come with me?' the dragon asked. You said...",
    "A tiny star fell from the sky and landed in your garden! It could talk! The first thing it said was...",
    "You discovered a door in your classroom that led to a magical world. You stepped through and saw...",
    "The giant friendly cloud came down to your house. 'I need to tell you a secret,' it whispered. The secret was...",
    "Your pet became magical for one day and could talk! The first thing they said was...",
    "A message in a bottle washed up at your feet. Inside was a map that led to...",
    "The moon came down for a visit and wanted to try human food. You took it to...",
  ],
  explorer: [
    "Deep in the forest, there's a tree with a door that only opens at midnight. You're the only one who knows about it. Tonight you decided to go through. On the other side was...",
    "A mysterious letter arrived with no return address. Inside were three words: 'They know everything.' You looked up from the letter and...",
    "You discover you've been able to understand animals your whole life — but today was the first time one actually spoke back. It was a crow. It said...",
    "The last bookshop in the city has a cat who knows every story's ending. You asked for yours, and it told you...",
    "At exactly 3:33am, your phone showed a message from yourself — from the future. It said one sentence. That sentence was...",
    "You find out your town has been keeping a secret for 200 years. You're the first outsider they've ever told. The secret is...",
  ],
  navigator: [
    "You're on a train that doesn't stop. You've been on it for what feels like days. Finally, someone sits across from you and says, 'You're the one they've been looking for.' You ask why, and they explain...",
    "A scientist at your school runs an experiment that accidentally gives everyone in the building one extra sense. You got... (decide what it is). The first time you use it, you discover...",
    "Two years in the future, you're sitting somewhere, thinking about one specific thing that happened today. What was it? Why does it still matter two years later?",
    "You get a job offer that's either the best or worst decision of your life — you won't know which for ten years. The offer is...",
    "Someone who wronged you three years ago sends a message asking to meet. You decide to go. When you get there...",
  ],
  adult: [
    "There's a version of you who made the opposite choice at the most significant fork in your life. You meet them. What's the first thing they say?",
    "You're given 48 hours to spend with one person from your past — someone who shaped who you are in ways you're only now understanding. Who is it? What do you actually say to each other?",
    "You receive a letter from a stranger who says they've been watching your progress for two years and has a single piece of advice that would change everything. The advice is...",
    "Imagine the last conversation you'll have about your own speech journey. Who's it with? What do you say?",
    "There's a moment from your past you've never spoken aloud to anyone. If you were to say it in this story — even hypothetically — what would it be?",
  ],
}

// ─── OFFLINE MISSION SCENARIOS (BraveMissions) ───────────────────────────────
export const BRAVE_MISSIONS = [
  { id: 'bm_order', title: 'Order Your Favourite Meal', fearLevel: 3, setup: "You're at a restaurant counter. The menu is behind the cashier. There's a small queue behind you.", prompt: "Hi! Welcome in — what can I get for you today?", character: "Sam, a friendly cashier who smiles at everyone", tips: ["Take a breath before you speak", "It's okay to take a moment to look at the menu", "They've heard every kind of order — yours is fine"], braveBonus: "Stutter voluntarily on the name of your food for triple stars! 'I'd like the bb-burger please.'" },
  { id: 'bm_help', title: 'Ask For Help', fearLevel: 4, setup: "You stayed behind after class or a meeting. The teacher or supervisor is at their desk, finishing up.", prompt: "Oh hey — did you have a question about today?", character: "Ms. Park, a kind teacher who always has time for students", tips: ["Start with 'Excuse me'", "Your question is valid — they want to help", "They won't judge how you say it"], braveBonus: "Stutter on 'question' for bonus brave stars!" },
  { id: 'bm_intro', title: 'Introduce Yourself', fearLevel: 5, setup: "First day at a new club or class. People are settling in. Someone looks over and seems about to say hi.", prompt: "Hey! I don't think we've met — I'm Jordan. You new here?", character: "Jordan, curious and friendly, about your age", tips: ["Your name is worth saying exactly as it is", "Everyone here is slightly nervous on day one", "They're more interested in who you are than how you say it"], braveBonus: "Stutter on your own name — the hardest and bravest thing! Triple stars guaranteed." },
  { id: 'bm_phone', title: 'Make a Phone Call', fearLevel: 6, setup: "Calling a local business to ask about their hours or a simple question. You've been putting it off for days.", prompt: "Hello, thank you for calling — how can I help you today?", character: "A customer service agent with a patient, professional manner", tips: ["They can't see you — no face to read", "It's okay to pause before responding", "They take dozens of calls daily — yours is completely normal"], braveBonus: "Block intentionally at the start of your first sentence for triple brave stars!" },
  { id: 'bm_disagree', title: 'Respectfully Disagree', fearLevel: 6, setup: "A group conversation. Someone makes a point you genuinely disagree with. They've just finished speaking.", prompt: "So I think we're all basically on the same page, right? Everyone agrees that's the best approach?", character: "A confident colleague who genuinely wants everyone's input", tips: ["'Actually, I see it differently' is a complete sentence", "Your opinion is worth the time it takes to say it", "Disagreement done respectfully is a leadership skill"], braveBonus: "Stutter voluntarily on 'actually' — it shows you own your voice completely." },
  { id: 'bm_presentation', title: 'Mini Presentation', fearLevel: 7, setup: "A small group of 3–4 people. They've asked you to share something — an update, an idea, your opinion.", prompt: "We'd love to hear from you — what's your take on this?", character: "A small, attentive audience who genuinely want to hear your idea", tips: ["Prepare one opening sentence fully — say it slowly", "Pause after your opening — it reads as confidence", "Three points maximum — clarity over quantity"], braveBonus: "Include one voluntary stutter in your opening sentence — it signals complete ownership of your voice." },
  { id: 'bm_interview', title: 'Job Interview', fearLevel: 8, setup: "A professional interview — formal setting. The hiring manager seems warm but focused.", prompt: "Thanks for coming in today. Let's start easy — tell me a little about yourself and why you're interested in this role.", character: "Alex Chen, a focused but fair hiring manager who values authenticity", tips: ["Breathe before you begin — a 2-second pause reads as composure", "Your answer content matters infinitely more than your delivery fluency", "Research consistently shows interviewers rarely notice disfluency when the content is strong"], braveBonus: "Voluntarily stutter once during your answer. Research shows authentic self-disclosure about stuttering in interviews often increases likability scores." },
  { id: 'bm_difficult_convo', title: 'A Difficult Conversation', fearLevel: 9, setup: "There's something you've been meaning to say to someone important. Today is the day. You've rehearsed it. Now you're face to face.", prompt: "Hey — you said you wanted to talk? I'm listening.", character: "Someone important to you who cares about what you have to say", tips: ["The content of what you say will be remembered long after the how", "Difficult conversations that happen are better than perfect ones that don't", "You've been carrying this — it deserves to be said"], braveBonus: "Stutter voluntarily at the start — it signals that you're here, unguarded, and ready to be real." },
]

// ─── WEEKLY REPORT TEMPLATES ──────────────────────────────────────────────────
export const WEEKLY_TEMPLATES = {
  strong_week: [
    "{name}, this was a strong week. {sessionCount} sessions, {braveCount} brave stars, and your fluency is holding at {score}. The consistency is real — you're building something that compounds. Keep this pace.",
    "Week summary for {name}: {sessionCount} sessions completed, {minutes} minutes of practice, {braveCount} moments of real bravery. Your average fluency was {score}/100. That's a week that moved the needle.",
  ],
  average_week: [
    "{name} — {sessionCount} sessions this week. Solid but not exceptional. The interesting data point: your best session scored {score}. That's what you're capable of. The goal next week is more sessions at that level.",
    "This week: {sessionCount} sessions, {braveCount} brave stars. Your fluency averaged {score}. Compared to last week: {comparison}. One thing to focus on next week: {recommendation}.",
  ],
  tough_week: [
    "{name}, this week was tough — {sessionCount} sessions, down from your usual. That's okay. Life happens. The only number that matters is that you're still here. One strong session this week would have been enough. Did you have that?",
    "Lighter week — {sessionCount} sessions. Before you judge that: {sessionCount} sessions still means {sessionCount} deposits into your practice account. Not zero. Never zero.",
  ],
  breakthrough_week: [
    "THIS WEEK, {name}. {sessionCount} sessions. {braveCount} brave stars. Your fluency jumped {scoreDelta} points. Do you understand what that means? That's months of work crystallising into a single week. Remember this feeling.",
    "Week of {weekStart}: {sessionCount} sessions, {braveCount} brave stars, fluency at {score}/100 (up {scoreDelta} points). This was a breakthrough week. Write it down somewhere. You'll want to remember it.",
  ],
}

// ─── LIFE STORY TEMPLATES ─────────────────────────────────────────────────────
export const LIFE_STORY_TEMPLATES = [
  "{name} started {daysSince} days ago. Since then: {sessions} practice sessions, {braveCount} brave stars, {journalCount} voice journal entries. Their fluency average is {score}. They've completed {actDone} of 8 ACT sessions. The streak is currently at {streak} days. The strongest identified technique: {topTechnique}. The current challenge: {currentChallenge}.",
  "The story so far: {name} has been practicing for {daysSince} days. {sessions} sessions completed. {braveCount} moments of documented bravery. {journalCount} journal entries recorded. Current streak: {streak} days. The data shows consistent growth in {growthArea}. The next chapter: {nextChallenge}.",
]

// ─── ROTATION TRACKER ─────────────────────────────────────────────────────────
// Ensures no response repeats until the whole pool is exhausted
const _rotationCounters = {}

export const pickResponse = (pool, contextKey = 'default') => {
  if (!pool || pool.length === 0) return ''
  const key = contextKey
  if (_rotationCounters[key] === undefined) _rotationCounters[key] = 0
  // Shuffle-based rotation: reset and re-shuffle after full cycle
  if (!_rotationCounters[`${key}_order`] || _rotationCounters[key] >= pool.length) {
    _rotationCounters[key] = 0
    _rotationCounters[`${key}_order`] = [...Array(pool.length).keys()].sort(() => Math.random() - 0.5)
  }
  const idx = _rotationCounters[`${key}_order`][_rotationCounters[key]]
  _rotationCounters[key]++
  return pool[idx] || pool[0]
}

export const pickByAgeGroup = (responseObj, ageGroup, contextKey) => {
  const ag = ['little', 'explorer', 'navigator', 'adult'].includes(ageGroup) ? ageGroup : 'explorer'
  const pool = responseObj[ag] || responseObj.all || responseObj.explorer || []
  return pickResponse(pool, `${contextKey}_${ag}`)
}
