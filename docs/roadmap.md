# Ear Training — Product Roadmap

Browser-based ear training for singers: harmony, pitch recognition, and vocal reproduction. **Rhythm is out of scope.** All other aspects of harmony and note work are potentially in scope.

## Goals

- **Regular practice** — short, repeatable sessions with clear daily targets
- **Measurable improvement** — history, trends, and weak-area visibility
- **Progressive difficulty** — two axes: **which exercise/mode** (e.g. melodic sing vs harmonic ID) and **which content tier** within it (e.g. P4/P5/8ve → diatonic major scale intervals → wider pools); see [Progressive difficulty model](#progressive-difficulty-model)
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
| **Exercises** | **Sing:** single note; chord middle (major / minor / diminished); melodic & harmonic intervals (sing upper note); **scale degrees in key** (tonic → sing 4th / 5th / octave). **Identify:** melodic & harmonic intervals (multiple choice, degree-style interval names). Seven routes; metadata in [`src/practice-modes/registry.ts`](../src/practice-modes/registry.ts). Interval sing/ID unlock **tier 2b** (all diatonic major intervals within one octave) on all four presentation modes after the guided path reaches harmonic 2b. |
| **Scoring** | **Sing:** mic → median pitch → cents vs target (40¢ tolerance), harmonic correction, octave hints. **Identify:** pass/fail on selected interval label (no mic); `centsOff` stored as 0. |
| **Session shape** | 10-exercise lessons, up to 3 attempts per question, in-lesson summary (`firstTry` / `retry` / `wrong`) — sing and identify flows |
| **Personalization** | Voice type range only (user-configurable). **Session planner** draws each exercise from curriculum tier pools — no user-facing interval / scale-degree / chord-type / inversion pickers ([session model](#session-model--settings)). |
| **Persistence** | Voice type in `localStorage`; **attempt history** in IndexedDB (`src/history/`) — per attempt: `practiceModeId`, target, `centsOff`, pass/fail, chord meta, **`intervalId`** / presentation / selected answer for ID exercises, **`degreeId`** / `tonicMidi` for scale-degree sing, **`contentTierId`** / **`eligibleTagIds`** for planner sessions, `lessonId` + `exerciseIndex` |
| **Stats / dashboard** | [`/stats/`](stats/index.html) — overall + per-exercise for all seven `practiceModeId`s; **weakness breakdown** by `intervalId`, `degreeId`, and chord type (weakest first). Overall / sing sections use median ¢; identify sections omit median. **No** time trends yet. |
| **Recognition / naming** | **Partial** — interval identification (2a: P4 / P5 / 8ve; **2b:** full diatonic-within-octave set on melodic and harmonic); scale-degree **sing** in key (4th / 5th / octave); no scale-degree ID, triad quality, or note names |
| **Curriculum (v1 shell)** | **Done** — home at `/` is a flat **guided path**: one **path node** per entry in **`CURRICULUM_LESSONS`** (passed / current / locked), with **lesson links** (`?step=`) on enterable nodes; stats entry unchanged. Labels in [`src/curriculum/path-node.ts`](../src/curriculum/path-node.ts). **Cross-mode sequencing** at interval tiers (melodic reproduction → melodic identification → harmonic reproduction → harmonic identification). **Step-level unlock** from IndexedDB via [`src/curriculum/unlock.ts`](../src/curriculum/unlock.ts) (≥10 questions, ≥70% on predecessor **step**). Locked nodes are non-links on home; direct URLs show a locked page via [`src/ui/exercise-page.ts`](../src/ui/exercise-page.ts). Thresholds are constants, not user-configurable. |
| **Testing** | **Strong domain + browser baseline** — CI runs `npm test`, `npm run test:browser`, `npm run build`; seven practice modes covered by unit tests, lesson/orchestration tests, and registry smokes. **Remaining gaps** (lesson summary UI, sing fail/retry on more exercises, etc.): [testing debt](testing-roadmap.md#open-testing-debt). New product work ships tests in the same PR — see [`docs/agents/testing.md`](agents/testing.md). |

Relevant code seams: practice-mode registry + `mountPracticeModePage` guard; `CURRICULUM_LESSONS` / tier presets in [`src/curriculum/curriculum-lessons.ts`](../src/curriculum/curriculum-lessons.ts); step unlock + `getContinueCurriculumLesson` in [`src/curriculum/unlock.ts`](../src/curriculum/unlock.ts); path node UI in [`src/curriculum/path-node.ts`](../src/curriculum/path-node.ts) + [`src/ui/home.ts`](../src/ui/home.ts); **session planner** in [`src/session/planner.ts`](../src/session/planner.ts); per-exercise session wiring (`interval-session`, `scale-degree-session`, `chord-session`); step resolution in [`src/curriculum/session-curriculum-lesson.ts`](../src/curriculum/session-curriculum-lesson.ts) + [`src/curriculum/lesson-link.ts`](../src/curriculum/lesson-link.ts); `computePracticeModeProgress` / tag stats in [`src/history/stats.ts`](../src/history/stats.ts); `SingTestConfig`, `IdentifyTestConfig`, `LessonSummary`, `voice-ranges`; interval domain in `src/interval-config.ts`, `src/interval-exercises.ts`, `src/ui/interval-tests.ts`; scale-degree domain in `src/scale-degree-config.ts`, `src/scale-degree-exercises.ts`, `src/ui/scale-degree-tests.ts`. Legacy preference modules remain in tree but are **not** used for question draw on shipped exercises.

## Testing (summary)

Conventions: [`docs/agents/testing.md`](agents/testing.md). **Open debt** on shipped behavior: [`docs/testing-roadmap.md`](testing-roadmap.md) (not a forward plan for unbuilt features). **Structural / tooling debt:** [`docs/tech-debt.md`](tech-debt.md).

- **Today:** Vitest Node (scoring, generation, unlock, stats) + Vitest **browser** (curriculum guards, identify/sing lessons, registry smokes, ports). **CI** on every PR and `main`.
- **Debt:** e.g. lesson-completion UI, broader sing fail/retry coverage — see [open debt table](testing-roadmap.md#open-testing-debt).
- **New features:** tests ship with the feature PR; do not add speculative cases to the testing debt doc.
- **Manual QA:** mic, permissions, timbre — [`testing-roadmap.md` § Manual QA](testing-roadmap.md#manual-qa-always-required).

## Product pillars

Four skills (rhythm excluded):

| Pillar | Description | Today |
|--------|-------------|--------|
| **Discrimination** | Hear differences (wider vs narrower interval, maj vs min) | Partial (chord types via planner; interval ID with tier pools — 2a + 2b) |
| **Recognition / naming** | Hear → label (degree or note name) | **Partial** — interval names (P4 / P5 / octave); no key context or chord-quality ID |
| **Reproduction** | Hear → sing back accurately | Core strength (single note, chord middle, interval upper note, **scale degrees from tonic**) |
| **Contextual intonation** | Phrases, tendency tones, chord tones in key | **Partial** — Level 3 establishes tonic before singing a degree; no phrases or functional harmony yet |

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

## Progressive difficulty model

Progress is **not** only linear through exercise types (single note → melodic intervals → …). Each exercise also advances through **content tiers** — which items can appear in questions (intervals, degrees, chord qualities, direction, register, etc.). The curriculum, session planner, and stats share one taxonomy of **tags** (e.g. `intervalId`, `degreeId`, chord type).

### Two axes

| Axis | What advances | Example (intervals) | Unlock / measurement today |
|------|----------------|----------------------|----------------------------|
| **Exercise / mode** | Which route and response type | `interval-melodic-sing` → `interval-harmonic-sing` → `interval-melodic-id` | **Done (v1)** — predecessor exercise on `CURRICULUM_PATH` |
| **Content tier** | Which items are eligible in a lesson | P4 / P5 / 8ve → diatonic major scale intervals → any interval within an octave → compound (>8ve) → descending variants per tier | **Partial** — tiers **2a** + **2b** shipped on all four interval modes; planner enforces pool per curriculum lesson; tier 2c+ still TODO |

A **curriculum lesson** in the target model is `(practiceModeId, contentTierId)` (or equivalent preset), not only `practiceModeId`.

### Cross-mode sequencing (pedagogy)

Within a content tier, advance **presentation mode** before jumping to the next tier on the same mode. Example for intervals at tier A (e.g. perfect 4th, 5th, octave):

1. Melodic sing (tier A)
2. Harmonic sing (tier A)
3. Melodic identification (tier A)
4. Harmonic identification (tier A)
5. Then tier B: melodic sing → melodic identification → harmonic sing → harmonic identification (shipped at interval-2b; harmonic modes follow melodic identification at that tier)

Avoid unlocking Level 3 until all four interval presentation modes pass interval-2b on the guided path.

### Content tiers (example: interval exercises)

Illustrative ladder for Level 2; exact tier IDs and thresholds are product constants to define in curriculum config.

| Tier | Interval content (degree labels) | Other axes (examples) |
|------|----------------------------------|------------------------|
| 2a | Perfect 4th, 5th, octave | Ascending / melodic motion default |
| 2b | All diatonic intervals in major key | Still within octave |
| 2c | Any interval within one octave | Chromatic included |
| 2d | Compound intervals (> octave) | |
| 2e+ | Same pools with **descending** prompts, sing-lower, both directions | Per tier, per mode |

The same **tier pattern** applies to other families: scale degrees (4th/5th/8ve → full diatonic degrees → chromatic alterations), chords (quality set → inversions → extensions), etc. Level numbers in [Phase 1](#phase-1--curriculum-spine-progressive-difficulty) remain coarse groupings; **tiers** are the fine-grained spine inside each level.

### What unlocks a tier

- **Gate:** minimum questions and pass rate on the **predecessor step** (previous tier in same mode, or previous mode at same tier per cross-mode rules above).
- **Evidence:** use per-tag stats (`intervalId`, etc.) so unlock reflects item mastery, not only aggregate exercise score.
- **QA:** dev bypass remains access-only (`?unlock=all`); does not fake tier mastery for path-node progress copy.

---

## Session model & settings

### Principle

If the app has **progression unlocks**, **weak-area practice**, and **balanced repetition of strong areas**, the user does not need to configure which intervals (or chord types, degrees) appear in each exercise. The app selects items each lesson from the eligible pool for that session.

### User chooses (session focus)

- The **current path node** on the guided path (recommended), or
- Any **passed / unlocked path node** via its lesson link — without picking individual intervals within the tier pool.

Voice type / range stays user-configurable (singer-specific register), not curriculum-gated.

### App chooses (per question)

A **session planner** (target architecture) draws each exercise from:

| Input | Role |
|-------|------|
| **Curriculum step** | Caps the maximum content tier and eligible tag set for this session |
| **Weak-area weighting** | Over-sample tags with low pass rate or recent misses (Phase 0 targeted drills) |
| **Maintenance weighting** | Include some well-mastered tags so skills stay warm (spaced / balanced repetition) |
| **Scoring settings** | Tolerance (¢), playback repeats, range width — level- or settings-driven, not per-item pickers |

Generation always respects the active exercise’s rules (e.g. harmonic vs melodic playback, sing-upper vs MC distractors).

### User content pickers (retired on shipped exercises)

| Former v1 picker | Status |
|------------------|--------|
| `interval-preference.ts` — user toggles P4 / P5 / 8ve | **Removed from UI** — pool from curriculum tier + planner |
| `scale-degree-preference.ts` — user toggles degrees | **Removed from UI** — same |
| `chord-type-preference.ts` / inversion preference — maj / min / dim + inversions | **Removed from UI** — chord-middle uses `chord-1a` tier + planner |
| Unlock only by `practiceModeId` | **Done** — unlock by **curriculum lesson** `(practiceModeId, contentTierId)` |

Free practice (`chord-middle`) uses the same planner within the selected **mode**, not ad-hoc item checklists.

### Configurable difficulty (clarified)

**Phase 0 “configurable difficulty”** means session/scoring parameters (¢ tolerance, range, repeats), **not** manual interval/chord/degree checklists. Teachers or power users are out of scope for v1; export / assignments are [Phase 4](#phase-4--platform--polish-optional--later).

---

## Phased roadmap

### Phase 0 — Measurement & habit (technical foundation)

**Goal:** Regular practice and visible improvement before adding many exercise types.

| Feature | Status | Notes |
|---------|--------|--------|
| Persist attempt history | **Done** | IndexedDB store; per attempt: `practiceModeId`, target, `centsOff`, pass/fail, attempt number, timestamp, voice type, chord notes/type/inversion, interval fields, **`contentTierId`** / **`eligibleTagIds`**, `lessonId` + `exerciseIndex`. See `src/history/`. |
| Dashboard | **Done (MVP+)** | `/stats/`: attempt pass rate, question pass rate, first-try rate; median ¢ on sing exercises only; per-exercise **by-tag** breakdown (interval / degree / chord type). Time trends not yet. |
| Skill profiles | **Done (lite)** | Separate stats per `practiceModeId` on the dashboard. |
| Practice goals & streaks | Todo | e.g. daily question count or minutes; optional notifications later. |
| Targeted drills | **Done (v1)** | **Session planner** — ~70% weak-area / ~30% maintenance tag mix from history (`src/session/planner.ts`); wired on all interval, scale-degree, and chord-middle exercises. Per-tag tier gates and richer drill copy still TODO. |
| Configurable difficulty | Todo | Scoring/session params (¢ tolerance, range width, playback repeats) — **not** user-facing interval/chord/degree pickers (those retire; see [Session model](#session-model--settings)). |
| Automated UI regression | **Partial** | Baseline in CI; [open debt](testing-roadmap.md#open-testing-debt) for lesson summary and related UI gaps |
| CI on every PR | **Done** | [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) — `npm test`, `npm run test:browser`, `npm run build` |

**Musical content:** interval exercises feed history/stats with per-tag fields; session planner + step-level tier unlock **done (v1 scope)**; goals/streaks and tier 2c+ still TODO.

---

### Phase 1 — Curriculum spine (progressive difficulty)

**Goal:** Structured path from simple → complex on **both axes** ([exercise/mode](#progressive-difficulty-model) and [content tier](#progressive-difficulty-model)); user picks **session focus**, app picks items within the session.

| Level | Reproduction (sing) | Recognition (hear → answer) |
|-------|---------------------|-----------------------------|
| 1 | Single note *(done)* | — |
| 2 | Intervals: melodic, then harmonic *(done, partial)* | Interval as degree *(done, partial)* |
| 3 | Scale degrees in one key: sing 4th, 5th, octave from established tonic *(done, partial)* | **Degree ID** — deferred until pool diverges from interval ID |
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
| `/interval-melodic-id/`, `/interval-harmonic-id/` — MC with degree-style labels (no solfege) | Chromatic / compound / descending tiers (2c+); confusion-pair drills |
| **Tier 2a:** perfect 4th, 5th, octave — all four interval modes | Per-tag tier gates before next tier |
| **Tier 2b:** all diatonic major intervals within one octave — all four interval modes | Tier 2c+ (chromatic, compound, descending) |
| **Session planner** — weak + maintenance mix; no user interval picker | Richer home copy from planner (“practicing weak minor 6ths”) |
| **Step-level unlock** + current path node; cross-mode 2a → melodic 2b gates | **Tier 2c+** (chromatic, compound, descending) |
| Voice range only (`voice-ranges.ts`) | Configurable unlock thresholds in UI |
| Guided path: cross-mode **2a** → cross-mode **2b** → scale-degree sing → chord-middle (`chord-1a`) | Mixed-type lessons across exercises |
| **Flat guided-path home** (path nodes per curriculum lesson; stats entry) + page guard on locked routes | Targeted practice picker — see parent #53 |
| **Lesson links** (`?step=`) + guided session default; replay keeps URL tier | — |
| **Step-level exercise lock page** | Route guard uses parsed/default step; locked CTAs link to predecessor step URL |

**Interval tier ladder (target):** see [content tiers example](#content-tiers-example-interval-exercises) in Progressive difficulty model.

**Technical:** [`src/practice-modes/registry.ts`](../src/practice-modes/registry.ts) wraps all seven practice modes; **curriculum lessons** + **session planner** + step unlock in `src/curriculum/` and `src/session/`. Unified `ExerciseDefinition` with shared `prepareExercise` / `score` — still TODO (parallel `SingTestConfig` / `IdentifyTestConfig` per page).

**Note-name variant (later within Phase 1+):** same exercises with answers *C*, *F♯*, etc., unlocked as harder mode after degree mode is stable.

---

### Phase 2 — Recognition-first modes (hear → answer, no mic)

**Goal:** Ear training is not only “sing it back.”

| Exercise type | Answer format (v1) | Status |
|---------------|--------------------|--------|
| Interval identification | Interval name / degree span (*Perfect 5th*, etc.) | **Done (partial)** — melodic + harmonic pages; **2a** (P4/P5/8ve) + **2b** (diatonic within octave); distractors from eligible tier pool via planner |
| Scale degree in key | *3rd*, *minor 7th*, *flat 6th*, etc. | **Sing (partial)** — `/scale-degree-sing/` with `degree-3a` pool (4th/5th/octave) via planner; **ID deferred** |
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
| Measurable improvement | History + `/stats/` with per-tag weakness (interval, degree, chord type); ID exercises omit median ¢; **time trends** still TODO | Per-tag stats drive planner mix; tier unlock uses step aggregates today |
| Progressive difficulty | **Curriculum v1 done** — step-level unlock + tiers **2a / 2b / degree-3a / chord-1a**; tier 2c+ still TODO | Cross-mode sequencing through interval-2b on guided path; per-tag tier gates still TODO |
| Naming / recognition | Select UI + interval ID exercises **done (partial)**; scale-degree **sing** in key **done (partial)**; scale-degree ID & chord ID **TODO** | Degrees-first interval labels **done (partial)**; note names **TODO** |
| Not only reproduction | Interval ID **done (partial)**; phrase scoring, multi-target lessons **TODO** | Dictation, functional hearing **TODO** |
| Singer-specific | Range by voice; phrase intonation | Register-aware sets; no rhythm track |
| Regression safety as features grow | **Partial** — CI + browser baseline; [testing debt](testing-roadmap.md#open-testing-debt) for remaining UI gaps | Manual QA for mic, permissions, timbre |

---

## Suggested build order

1. ~~**Persist results + dashboard** (Phase 0)~~ **Done** — includes per-tag weakness on `/stats/` (PR #33)
2. ~~**Interval sing + interval recognition (degree labels)** (Phase 1–2)~~ **Done (partial)** — 2a + 2b on four interval modes, history + stats. **Remaining:** tier 2c+, richer reproduction tasks.
3. ~~**Curriculum / levels (v1 shell)**~~ **Done** — registry, guided path home (path nodes + lesson links), step-level unlock, exercise guards; `chord-middle` on path at `chord-1a`.
4. ~~**Session planner + tiers (Phase 0 → 1)**~~ **Done (v1 scope)** — weak + maintenance planner; curriculum lessons through interval-2b on all interval modes; item pickers retired (voice range kept). **Remaining:** tier 2c+, per-tag tier gates, goals/streaks alignment.
5. ~~**Scale-degree sing in key** (Level 3)~~ **Done (partial)** — `/scale-degree-sing/`, planner-driven `degree-3a` pool, tonic → prompt → sing. **Remaining:** degree tiers beyond 3a + degree ID when pool diverges from interval ID.
6. **Expand chord exercises** (sing other chord tones; quality/inversion ID) with chord **tiers** same pattern.
7. **Melodic dictation & clusters** (degrees → note-name hard mode)
8. **Goals & streaks** (Phase 0) — align with current path node / daily session focus

**Testing debt (shipped behavior only):** close items in [`docs/testing-roadmap.md`](testing-roadmap.md#open-testing-debt) as small PRs; no phased rollout doc for future product features.

---

## Architectural direction

- Generalize `SingTestConfig` / `IdentifyTestConfig` → `ExerciseDefinition` with pluggable `prepareExercise`, `playReference`, `score(response)` and `responseMode`.
- ~~Persist scored attempts + question snapshots to history store.~~ **Done** — `saveAttempt` on each score (sing and identify); lesson outcomes still ephemeral in UI only.
- ~~**Curriculum spine (v1).**~~ **Done** — `PRACTICE_MODES` registry, `CURRICULUM_LESSONS`, step unlock + guided-path home, `mountPracticeModePage` guard.
- ~~Extend dashboard with weakness tags (e.g. by `intervalId`).~~ **Done** — [`src/history/tag-stats.ts`](../src/history/tag-stats.ts), `/stats/` UI. **Next:** time trends; optional lesson-level aggregates; filter stats by `contentTierId`.
- ~~**Session planner** module~~ **Done (v1)** — [`src/session/planner.ts`](../src/session/planner.ts); weak-area + maintenance mix; wired on interval, scale-degree, and chord-middle exercises. **Next:** richer home copy from planner state.
- ~~**Curriculum steps**~~ **Done (v1)** — [`src/curriculum/curriculum-lessons.ts`](../src/curriculum/curriculum-lessons.ts); `isCurriculumLessonUnlocked(step, records)`; interval-2b on all four interval modes. **Next:** per-tag tier gates; tier 2c+.
- ~~Migrate generation from user pickers to planner output~~ **Done** — tier pools via `getEligibleTagIds`; `contentTierId` / `eligibleTagIds` on attempts.
- ~~Implement **recognition** as sibling modes sharing playback and question generation.~~ **Partial** — `identify-test.ts` shares lesson flow/history with sing tests; interval playback/questions shared via `interval-exercises.ts`; registry lists `responseMode` but sing/identify mount paths remain separate.
- **Testability at UI boundaries** — **Done (baseline):** ports on mount functions; browser orchestration without mocking vendor audio libs. Remaining UI gaps: [testing debt](testing-roadmap.md#open-testing-debt). Boundary and tooling gaps: [tech debt registry](tech-debt.md).

### Curriculum v1 — intentional gaps (post–levels shell)

| Gap | Target resolution |
|-----|-------------------|
| Unified `ExerciseDefinition` with `prepareExercise` / `score` on one type | Registry wrapper is enough for now; sing/identify UI merge is high churn |
| Exercise-only unlock | ~~**Curriculum steps** with content tiers~~ **Done (v1)** — per-tag tier gates still TODO |
| User interval / degree / chord pickers | ~~**Session planner** + tier presets~~ **Done** — legacy preference modules may be deleted in a cleanup PR |
| Cross-mode sequencing per interval tier | **Done** — melodic reproduction → melodic ID → harmonic reproduction → harmonic ID at **2a** and **2b** |
| `chord-middle` on guided path | **Done (slice 1)** — last step, `chord-1a` tier, linear unlock after scale degrees |
| Level 4+ placeholders | No exercises yet |
| Mixed-type lessons | Per-practice-mode rounds unchanged; planner mixes tags within one tier |
| Goals, streaks | Phase 0; planner weak + maintenance weighting **done** |
| Weakness stats by `intervalId` | **Done** on `/stats/`; planner uses same tags for question draw |
| Configurable unlock thresholds in UI | Constants in `unlock.ts` today; step-level config later |
| Dev `?unlock=all` | **Done** — [`src/curriculum/dev-unlock.ts`](../src/curriculum/dev-unlock.ts); access-only; see [manual QA](testing-roadmap.md#manual-qa-always-required) |

---

## Explicitly out of scope

- Rhythm, meter, tempo, rhythmic dictation
- Solfege (movable-do syllables)
- Full sight-reading curriculum
- AI accompaniment or automatic part extraction
- Polyphonic scoring (multiple simultaneous sung pitches)
