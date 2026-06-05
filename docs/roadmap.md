# Ear Training — Product Roadmap

**Forward-looking backlog only.** What is already shipped is defined by the code, [`CONTEXT.md`](../CONTEXT.md) (domain language), and GitHub issues. Structural and tooling debt: [`docs/tech-debt.md`](tech-debt.md). Testing conventions: [`docs/agents/testing.md`](agents/testing.md).

When a roadmap item ships, **remove it from this file** (or open a follow-up issue and link it). Do not maintain a changelog of completed work here.

---

## Product goals

- **Regular practice** — short, repeatable sessions with clear daily targets
- **Measurable improvement** — history, trends, and weak-area visibility
- **Progressive difficulty** — a **guided path** of **curriculum lessons**; each lesson has an **exercise type** (main + sub / **content tier**). Advance through **tier blocks** and **presentation modes** per [`CONTEXT.md`](../CONTEXT.md) — not a separate “2D progress” model in the UI
- **Hear and do** — identification exercises alongside singing

## Naming & labeling

- **No solfege** (no movable-do syllables such as do, re, mi).
- **Scale degrees first** (e.g. *2nd*, *5th*, *minor 7th*, *raised 4th*) tied to an established key or tonal center.
- **Note names later** (e.g. *C*, *E♭*) as a harder answer mode on the same exercises after degree-based recognition is solid.

## Session model (target behavior)

Learners choose **where** to practice (current or passed **path node** on the guided path; **targeted practice** when built). The app chooses **which items** each lesson draws from the eligible **content tier** pool.

| Learner configures | App configures per question |
|--------------------|-------------------------------|
| Voice type / range (site-wide setting) | Items from tier pool + **session planner** (weak-area + maintenance mix) |
| Session focus (path node / targeted practice) | Scoring params (¢ tolerance, repeats, range) — when exposed |
| | Playback and presentation rules for the active exercise type |

**Not** user-facing interval / degree / chord checklists — tier presets and planner own item selection.

**Configurable difficulty** means session/scoring parameters (¢, range width, playback repeats), not manual content pickers.

---

## Pedagogy (for new curriculum)

Use vocabulary from [`CONTEXT.md`](../CONTEXT.md): **tier block**, **cross-mode sequencing**, **curriculum lesson**, **presentation mode**.

**Interval tier blocks (example ladder — extend on the guided path):**

| Tier | Interval content (degree labels) | Other axes (examples) |
|------|----------------------------------|------------------------|
| 2c | Any interval within one octave | Chromatic included |
| 2d | Compound intervals (> octave) | |
| 2e+ | Same pools with **descending** prompts, sing-lower, both directions | Per tier, per presentation mode |

Same tier-block pattern applies to scale degrees, chords, and later families (wider degree pools → chromatic alterations → inversions → extensions).

**Within an interval tier block:** melodic reproduction → melodic identification → harmonic reproduction → harmonic identification. Do not open the next tier block until all four modes pass at the current tier.

**Unlock:** minimum exercises and pass rate on the **predecessor curriculum lesson**; prefer **per-tag** evidence where tier gates need item mastery. Dev `?unlock=all` is access-only — does not fake mastery for copy.

---

## Planned work

Grouped by theme; order is indicative, not a commitment. Prefer tracer-bullet issues for grab work.

### Habits & stats

| Item | Notes |
|------|--------|
| Practice goals & streaks | Daily question count or minutes; notifications optional later |
| Time trends on `/stats/` | Pass rates / weakness over time |
| Configurable scoring & session params | ¢ tolerance, range width, playback repeats — not content pickers |
| Richer home copy from planner | e.g. surfacing what weak tags are being drilled |
| Filter stats by `contentTierId` | Optional lesson-level aggregates |

### Guided path & curriculum

| Item | Notes |
|------|--------|
| Interval tiers **2c+** | Chromatic within octave, compound, descending / sing-lower / both directions |
| Per-tag tier gates | Advance tier when specific tags meet thresholds, not only step aggregates |
| Scale degree tiers beyond **degree-minor-diatonic** | Chromatic degree labels, then altered/extended degree pools |
| **Targeted practice** | Home area outside guided sequence — mixed-type lessons likely; see `CONTEXT.md` |
| Mixed-type lessons | One lesson run drawing multiple exercise types |
| Configurable unlock thresholds in UI | Constants in `unlock.ts` today |
| Insert Level 4+ lessons mid-path | Chord / triad family currently at path tail only |

### Interval & reproduction depth

| Item | Notes |
|------|--------|
| Sing lower / both directions | Beyond “sing upper note” scoring |
| Richer interval reproduction tasks | “Reproduce the interval” beyond single upper-target |
| Confusion-pair drills | e.g. M6 vs m7 |

### Recognition (hear → answer, no mic)

| Item | Notes |
|------|--------|
| Scale degree identification | When answer pool diverges from interval ID |
| Chord quality identification | Major / minor / dim / aug |
| Chord inversion identification | Root / 1st / 2nd |
| Tonic / key exercises | Establish key → identify degree or function |
| Note-name answer mode | Harder variant on existing exercise types |
| Keyboard / MIDI input | For recognition exercises |

### Chord & harmony family (curriculum levels 4–6)

| Item | Notes |
|------|--------|
| Sing root / 3rd / 5th (beyond middle only) | Reproduction |
| Triad quality ID | Recognition |
| Triads + inversions — sing and ID | Levels 5–6 |
| Seventh chords — sing tone + quality/inversion ID | Level 6 |

### Melody & advanced pitch (levels 7–9)

| Item | Notes |
|------|--------|
| Short diatonic melodies (3–5 notes) | Sing + degree-based dictation |
| Chromatic / altered degrees in context | *flat 5*, *sharp 4*, etc. |
| Dense / atonal clusters | Cluster ID |

### Context & musicianship (no rhythm)

| Item | Notes |
|------|--------|
| Tonal center | Drone, cadence, or I–V–I before degree questions |
| Functional harmony | Hear IV or V; identify or sing a tone |
| Tendency tones | 7→1, 4→3 |
| Live intonation feedback | Continuous ¢ while holding a note |
| Phrase scoring | Per-note pass on short patterns |
| Timbral variety | Beyond piano reference |
| A cappella mode | Limited replays |

### Platform (optional / later)

| Item | Notes |
|------|--------|
| Sync / accounts | Only if multi-device matters; local-first is fine for v1 |
| Export | Session CSV for teachers |
| Sight connection | Notation after successful ID |
| Two-part hearing | Harmony against reference |

### Technical enablers (see tech debt)

New practice-mode families land faster after:

- Unified **`ExerciseDefinition`** / shared lesson orchestration — **TD-001**, **TD-002**
- Planner vs stats **tag registry** single source — **TD-007**
- History cache ready before first draw — **TD-011**
- Delete dead **content picker** paths in mounts — **TD-003**

Full table: [`docs/tech-debt.md`](tech-debt.md).

---

## Explicitly out of scope

- Rhythm, meter, tempo, rhythmic dictation
- Solfege (movable-do syllables)
- Full sight-reading curriculum
- AI accompaniment or automatic part extraction
- Polyphonic scoring (multiple simultaneous sung pitches)
