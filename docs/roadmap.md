# Ear Training — Product Roadmap

Browser-based ear training for singers: harmony, pitch recognition, and vocal reproduction. **Rhythm is out of scope.** All other aspects of harmony and note work are potentially in scope.

## Goals

- **Regular practice** — short, repeatable sessions with clear daily targets
- **Measurable improvement** — history, trends, and weak-area visibility
- **Progressive difficulty** — simple intervals → diatonic context → richer harmony → atonal clusters
- **Hear and do** — not only singing back pitches, but identifying what was heard

## Naming & labeling (product decision)

- **No solfege** (no movable-do syllables such as do, re, mi).
- Support two answer vocabularies over time:
  1. **Scale degrees** (primary) — e.g. *2nd*, *5th*, *minor 7th*, *raised 4th*, *flat 6th*. Tied to an established key or tonal center.
  2. **Note names** (secondary, harder) — e.g. *C*, *D*, *E♭*. Requires absolute or key-relative pitch class naming; introduce after degree-based recognition is solid.
- **Rollout order:** build recognition and curriculum around **scale degrees first**; add **note-name** variants as an optional harder mode on the same exercises (not a separate product path).

## Current state (baseline)

| Area | Status |
|------|--------|
| **Exercises** | **Sing:** single note; chord middle (major / minor / diminished); melodic & harmonic intervals (sing upper note). **Identify:** melodic & harmonic intervals (multiple choice, degree-style interval names). Six routes; metadata in [`src/exercises/registry.ts`](../src/exercises/registry.ts). |
| **Scoring** | **Sing:** mic → median pitch → cents vs target (40¢ tolerance), harmonic correction, octave hints. **Identify:** pass/fail on selected interval label (no mic); `centsOff` stored as 0. |
| **Session shape** | 10-question rounds, up to 3 attempts per question, in-round summary (`firstTry` / `retry` / `wrong`) — sing and identify flows |
| **Personalization** | Voice type range; chord type & inversion filters; **interval set** filter (P4 / P5 / octave in v1 registry) — all `localStorage` |
| **Persistence** | Preferences in `localStorage`; **attempt history** in IndexedDB (`src/history/`) — per attempt: `exerciseId`, target, `centsOff`, pass/fail, chord meta, **`intervalId`** / presentation / selected answer for ID exercises, `roundId` + `questionIndex` |
| **Stats / dashboard** | [`/stats/`](stats/index.html) — overall + per-exercise for all six `exerciseId`s (IDs from registry). Median ¢ is meaningful for sing exercises only (ID attempts always record 0¢). **No** breakdown by `intervalId`, chord type, or time trends yet. |
| **Recognition / naming** | **Partial** — interval identification only (perfect 4th / 5th / octave labels); not scale-degree-in-key, triad quality, or note names |
| **Curriculum (v1 shell)** | **Done** — home at `/` shows **Continue**, **Level 1** (single note) → **Level 2** (intervals in path order), and **Free practice** (`chord-middle`). Unlock from IndexedDB via [`src/curriculum/unlock.ts`](../src/curriculum/unlock.ts) (≥10 questions, ≥70% question pass rate on predecessor). Locked path exercises are non-links on home; direct URLs show a locked page via [`src/ui/exercise-page.ts`](../src/ui/exercise-page.ts). Thresholds are constants, not user-configurable. |

Relevant code seams: exercise registry + `mountExercisePage` guard; `CURRICULUM_LEVELS` / `CURRICULUM_PATH` in [`src/curriculum/levels.ts`](../src/curriculum/levels.ts); `computeExerciseProgress` in [`src/history/stats.ts`](../src/history/stats.ts); `SingTestConfig`, `IdentifyTestConfig`, `RoundSummary`, chord/voice/**interval** preferences; interval domain in `src/interval-config.ts`, `src/interval-questions.ts`, `src/ui/interval-tests.ts`.

## Product pillars

Four skills (rhythm excluded):

| Pillar | Description | Today |
|--------|-------------|--------|
| **Discrimination** | Hear differences (wider vs narrower interval, maj vs min) | Partial (chord types; interval ID exercises with user-selected interval pool) |
| **Recognition / naming** | Hear → label (degree or note name) | **Partial** — interval names (P4 / P5 / octave); no key context or chord-quality ID |
| **Reproduction** | Hear → sing back accurately | Core strength (single note, chord middle, interval upper note) |
| **Contextual intonation** | Phrases, tendency tones, chord tones in key | Missing |

```mermaid
flowchart LR
  subgraph hear["Hear"]
    A[Discrimination]
    B[Recognition / naming]
  end
  subgraph do["Do"]
    C[Reproduction / singing]
    D[Intonation under context]
  end
  A --> B
  A --> C
  C --> D
```

## Phased roadmap

### Phase 0 — Measurement & habit (technical foundation)

**Goal:** Regular practice and visible improvement before adding many exercise types.

| Feature | Status | Notes |
|---------|--------|--------|
| Persist attempt history | **Done** | IndexedDB store; per attempt: `exerciseId`, target, `centsOff`, pass/fail, attempt number, timestamp, voice type, chord notes/type/inversion, interval fields, active filter snapshot, `roundId` + `questionIndex`. See `src/history/`. |
| Dashboard | **Done (MVP)** | `/stats/`: attempt pass rate, question pass rate, first-try rate, median abs cents error; overall + per exercise (all six types). Weakness-tag breakdown and time trends not yet. |
| Skill profiles | **Done (lite)** | Separate stats per `exerciseId` on the dashboard. |
| Practice goals & streaks | Todo | e.g. daily question count or minutes; optional notifications later. |
| Targeted drills | Todo | Weight generation toward missed tags (chord type, **interval id**, register, degree, etc.) — interval id is already persisted but not used for drill weighting. |
| Configurable difficulty | Todo | Tolerance (¢), range width, playback repeats — driven by level/settings, not only `config.ts`. |

**Musical content:** interval exercises now feed the same history/stats pipeline as earlier sing tests; habit features (goals, adaptive drills) still TODO.

---

### Phase 1 — Curriculum spine (progressive difficulty)

**Goal:** Structured path from simple → complex; user follows levels instead of only picking a test card.

| Level | Reproduction (sing) | Recognition (hear → answer) |
|-------|---------------------|-----------------------------|
| 1 | Single note *(done)* | — |
| 2 | Intervals: melodic, then harmonic *(done, partial)* | Interval as degree *(done, partial)* |
| 3 | Scale degrees in one key: sing 2nd, 5th, etc. from established tonic | **Degree ID** — hear note in key → choose degree (and quality where needed, e.g. *minor 7th*) |
| 4 | Diatonic triads: sing root / 3rd / 5th (extend beyond middle only) | Triad quality: major / minor / diminished |
| 5 | Triads + inversions | Inversion: root / 1st / 2nd |
| 6 | Seventh chords; sing requested chord tone | Quality + inversion ID |
| 7 | Short diatonic melodies (3–5 notes) | Melodic dictation via **degrees** |
| 8 | Chromatic / non-diatonic tones in context | “Which degree?” with altered labels (*flat 5*, *sharp 4*, etc.) |
| 9 | Dense / atonal clusters | Cluster: which pitch class or degree was added? |

**Level 2 — what shipped vs gaps**

| Shipped | Still open |
|---------|------------|
| `/interval-melodic-sing/`, `/interval-harmonic-sing/` — hear interval, sing **upper** note | Sing lower note or both directions; “reproduce the interval” beyond upper-target scoring |
| `/interval-melodic-id/`, `/interval-harmonic-id/` — MC with degree-style labels (no solfege) | Broader interval registry (2nds, 3rds, 6ths, 7ths, chromatic); confusion-pair drills |
| v1 pool: perfect 4th, 5th, octave (`src/interval-config.ts`) | **Session-enforced** interval pool per level (unlock only gates *which exercise*, not which intervals appear in a round) |
| User interval picker + voice range (`interval-preference`) | — |
| Guided path order: melodic sing → harmonic sing → melodic ID → harmonic ID | Merging sing/identify UIs; mixed-level rounds |
| Unlock from history (10 questions, 70% question pass rate on predecessor) | Configurable thresholds in UI; dev `?unlock=all` for QA |
| Home curriculum UI + page guard on locked routes | `chord-middle` on main path (stays **free practice** until triad level) |

**Technical:** [`src/exercises/registry.ts`](../src/exercises/registry.ts) wraps all six exercises; unlock + levels in `src/curriculum/`. Unified `ExerciseDefinition` with shared `prepareQuestion` / `score` — still TODO (parallel `SingTestConfig` / `IdentifyTestConfig` per page).

**Note-name variant (later within Phase 1+):** same exercises with answers *C*, *F♯*, etc., unlocked as harder mode after degree mode is stable.

---

### Phase 2 — Recognition-first modes (hear → answer, no mic)

**Goal:** Ear training is not only “sing it back.”

| Exercise type | Answer format (v1) | Status |
|---------------|--------------------|--------|
| Interval identification | Interval name / degree span (*Perfect 5th*, etc.) | **Done (partial)** — melodic + harmonic pages; limited interval set; distractors from active picker (min 2 intervals) |
| Scale degree in key | *3rd*, *minor 7th*, *flat 6th*, etc. | Todo |
| Chord quality | Major / minor / dim / aug | Todo |
| Chord inversion | Root / 1st / 2nd | Todo |
| Tonic / key | Establish key → identify degree of a note or chord function | Todo |
| Confusion pairs | Extra drills for commonly confused pairs (e.g. M6 vs m7) | Todo |

**Harder variants (later):** note name in key for scale-degree exercises; note-name key labels optional for tonic/key.

**Technical:** `IdentifyTestConfig` + `mountIdentifyTest` implement select-based scoring and shared round/history with sing tests. Still TODO: unify under `responseMode: "sing" \| "select"` on a single `ExerciseDefinition`; keyboard/MIDI input.

---

### Phase 3 — Context & musicianship (still no rhythm)

| Feature | Notes |
|---------|--------|
| Tonal center | Drone, cadence, or I–V–I before degree-based questions |
| Functional harmony | Hear IV or V; identify or sing a requested tone |
| Tendency tones | 7→1, 4→3 — sing resolution |
| Live intonation feedback | Continuous cents display while holding a note |
| Phrase scoring | Per-note pass on short patterns |
| Timbral variety | Additional reference sounds beyond piano |
| A cappella mode | Limited replays to stress memory |

---

### Phase 4 — Platform & polish (optional / later)

| Area | Ideas |
|------|--------|
| Sync / accounts | Only if multi-device matters; local-first is fine for v1 |
| Export | Session CSV for teachers |
| MIDI keyboard | Answer recognition exercises without mouse |
| Sight connection | Show notation after successful ID (ear ↔ score) |
| Two-part hearing | Hold harmony against reference (harder technically) |

---

## Gap matrix

| Need | Technical | Musical |
|------|-----------|---------|
| Regular practice | Goals, streaks, reminders | Short daily mixed drill |
| Measurable improvement | History + `/stats/` MVP for all exercises; **weakness map by `intervalId` / chord type still TODO**; ID exercises don’t use cents meaningfully in dashboard | Per-skill benchmarks *(lite: per exercise id)* |
| Progressive difficulty | **Curriculum v1 done** — levels 1–2 path, history unlock, home + guards; levels 3+ not started | Level 2 content partial (P4/P5/8ve only); per-level interval enforcement still TODO |
| Naming / recognition | Select UI + interval ID exercises **done (partial)**; scale-degree & chord ID **TODO** | Degrees-first interval labels **done (partial)**; note names **TODO** |
| Not only reproduction | Interval ID **done (partial)**; phrase scoring, multi-target rounds **TODO** | Dictation, functional hearing **TODO** |
| Singer-specific | Range by voice; phrase intonation | Register-aware sets; no rhythm track |

---

## Suggested build order

1. ~~**Persist results + dashboard** (Phase 0)~~ **Done**
2. ~~**Interval sing + interval recognition (degree labels)** (Phase 1–2)~~ **Done (partial)** — P4/P5/octave, four routes, history + stats. **Remaining:** expand intervals, per-tag stats/drills, richer reproduction tasks.
3. ~~**Curriculum / levels (v1 shell)**~~ **Done** — registry, levels 1–2 path, history unlock, curriculum home, page guards, free practice for `chord-middle`.
4. **Scale-degree sing + degree ID** (primary naming track in key) ← *next*
5. **Expand chord exercises** (sing other chord tones; quality/inversion ID)
6. **Melodic dictation & clusters** (degrees → note-name hard mode)
7. **Adaptive / spaced drills** once item taxonomy is rich enough

---

## Architectural direction

- Generalize `SingTestConfig` / `IdentifyTestConfig` → `ExerciseDefinition` with pluggable `prepareQuestion`, `playReference`, `score(response)` and `responseMode`.
- ~~Persist scored attempts + question snapshots to history store.~~ **Done** — `saveAttempt` on each score (sing and identify); round outcomes still ephemeral in UI only.
- ~~**Curriculum spine (v1).**~~ **Done** — `EXERCISES` registry, `CURRICULUM_PATH` / unlock from `computeExerciseProgress`, async home + `mountExercisePage` guard.
- Extend dashboard with weakness tags (e.g. by `intervalId`) and trends; optional round-level aggregates in history; ID-appropriate metrics (not median ¢).
- Reuse preference patterns (`voice-ranges`, `chord-type-preference`, `interval-preference`) for **per-level interval pools** and **enabled skills** (v1 unlock does not override session interval picker).
- ~~Implement **recognition** as sibling modes sharing playback and question generation.~~ **Partial** — `identify-test.ts` shares rounds/history with sing tests; interval playback/questions shared via `interval-questions.ts`; registry lists `responseMode` but sing/identify mount paths remain separate.

### Curriculum v1 — intentional gaps (post–levels shell)

| Gap | Why deferred |
|-----|----------------|
| Unified `ExerciseDefinition` with `prepareQuestion` / `score` on one type | Registry wrapper is enough; sing/identify UI merge is high churn |
| Enforced interval pool per level | Would need session-scoped override of `interval-preference.ts`; v1 only gates which exercise |
| Melodic-before-harmonic beyond unlock order | Path order only; user can still pick intervals freely inside an unlocked exercise |
| `chord-middle` in main path | Free practice until level 4 triads |
| Level 3+ placeholders | No exercises yet |
| Mixed-level rounds | Per-exercise rounds unchanged |
| Goals, streaks, adaptive drills | Phase 0 |
| Weakness stats by `intervalId` | Exercise-level unlock only |
| Configurable unlock thresholds in UI | Constants in `unlock.ts` |
| Dev `?unlock=all` | Add when QA needs it |

---

## Explicitly out of scope

- Rhythm, meter, tempo, rhythmic dictation
- Solfege (movable-do syllables)
- Full sight-reading curriculum
- AI accompaniment or automatic part extraction
- Polyphonic scoring (multiple simultaneous sung pitches)
