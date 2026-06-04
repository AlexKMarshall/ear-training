# Ear Training

Browser-based ear training for singers: a guided curriculum of lessons, each made of exercises, with progress from attempt history. No accounts yet — attempt history is device-local only; breaking schema or unlock changes are acceptable pre-launch (history can be wiped).

## Language

### UI layer

**Presentation**:
DOM structure, styling, and user-visible copy only — including which controls are shown, hidden, or disabled for a given view. Does not decide scoring, unlock, lesson progression, or which question to draw.
_Avoid_: UI (when meaning the whole mount module), view layer

**Business logic**:
Rules that determine outcomes: scoring, curriculum and unlock checks, session planner draws, lesson progression (exercise index, attempts per exercise, lesson summary), and attempt persistence. Must not live in presentation code; the UI receives outcomes and maps them to presentation.
_Avoid_: Domain (without scope), backend (this app has no server)

**Exercise screen state**:
The phase machine for one exercise attempt inside a practice-mode mount (e.g. idle → playing → ready → recording → result → lesson summary on sing exercises). Lives **outside** the presentation component tree: imperative TypeScript updates a snapshot exposed to Solid via signals or a store; components render the snapshot and invoke callbacks — not `querySelector` or `innerHTML`. Duplicated across sing and identify mounts; should move toward a shared, testable exercise controller separate from markup. Distinct from **lesson run** (ten-exercise lesson rules).
_Avoid_: Test state, UI state (when meaning curriculum or unlock state)

**Lesson run**:
The unified, rules-only controller for one ten-exercise lesson: exercise index, attempts on the current exercise, when retry and advance are allowed, lesson results, and lesson summary. Shared by sing and identify; mounts map its snapshot to presentation. Does not own exercise screen state (playback, recording, choice UI).
_Avoid_: Lesson (when meaning the controller module), test state machine

**Attempt scored** (callback):
Hook fired when the learner completes a scored try on the current exercise. The lesson run updates lesson rules; the adapter (mount or session wiring) builds and persists the history record — not the lesson run itself.
_Avoid_: Save attempt (when meaning the callback event), score event

**Presentation implementation**:
How the presentation layer is built and assembled in code — distinct from lesson run and business rules. Shipped site stays a **multi-page static app** (one URL per practice mode); a single SPA or framework router is optional later. Near-term direction: **component-based presentation** (JSX) inside **page mounts**; exercise playback/recording orchestration stays imperative TypeScript outside the view tree, with the UI reading snapshots rather than owning audio lifecycle in view effects. **Home** ships as **Solid JSX** inside `mountHome`; further mounts migrate incrementally. A **migrated mount** has no string-built markup in that file — only Solid JSX for presentation; partial `innerHTML` in the same file is not left behind. Not blocked on exercise-definition or shared exercise-controller debt. Interval, chord, and degree **content pickers** are removed as **sing** and **identify** migrate (session planner is the sole draw path); **voice picker** stays until a shared settings surface exists. **Home** and simple mounts may stay one file; **sing** and **identify** share exercise chrome (nav, header, lesson progress, actions) extracted when **identify** migrates, then reused for **sing**. Mode-specific regions (choice grid, recording, live pitch) stay in each mount’s presentation. Styling stays in the **shared global stylesheet** with existing class names until a later pass.
_Avoid_: UI framework (when naming a library), front-end stack, SPA (as the near-term default), component library (until a later pass)

**Page mount**:
The entry adapter each HTML page uses: receives a root element and optional deps (e.g. history port), wires business logic to presentation, and is what browser tests invoke. Stays the public integration boundary when presentation moves from template strings to components; a future router can call the same mounts or replace them in one place. Migrated exercise mounts split **orchestrator** (`.ts` — signals, exercise screen state, ports, `render`) from **view** (`.tsx` — Solid tree only).
_Avoid_: Bootstrap (without “page”), init (when meaning mount)

**Lesson run extraction**:
Refactor that introduces the unified lesson run and rewires practice-mode mounts to use it while leaving presentation authoring unchanged. Delivered as separate pull requests: lesson run with unit tests first, then one PR per mount (identify, then sing) for reviewability.
_Avoid_: UI rewrite, framework migration

**Presentation migration**:
Moving remaining **page mounts** from string-built markup to Solid JSX inside each mount. Rewires presentation only — not shared exercise screen state (TD-002), exercise-definition unification (TD-001), or a SPA router. Delivers **migrated mount** criteria and retires interval/chord/degree content pickers on sing/identify as those files convert. Each PR is verified by existing **browser tests** (plus typecheck/unit/build as today), not a new JSX test harness.
_Avoid_: Framework migration (when meaning TD-002 controller extract), UI rewrite (when meaning business-rule changes)

### Practice flow (Duolingo-aligned)

**Exercise**:
One scored prompt inside a lesson — hear, answer (sing or select), up to a few attempts, then advance. Persisted attempts reference which exercise in which lesson.
_Avoid_: Question, round question, item (when meaning one lesson prompt)

**Lesson**:
A fixed-length run of exercises (today: ten per lesson) ending in a summary of how each exercise was finished (first try, after retry, or failed out). Lessons are homogeneous today — every exercise in the run shares the same exercise type — but mixed-type lessons are allowed in principle (e.g. targeted practice drawing several types in one lesson).
_Avoid_: Round, session (when meaning the ten-exercise run)

**Lesson summary**:
The end-of-lesson score screen listing how many exercises were correct and a breakdown (first try, after retry, wrong). Canonical term is *lesson summary*; the shipped headline still reads **Round complete** — see tech debt TD-018.
_Avoid_: Round summary (as product term), lesson complete (until copy is aligned)

**Exercise type**:
The kind of work each exercise in a lesson asks for, with a **main** part (task plus presentation — e.g. sing melodic intervals, identify harmonic intervals, sing scale degrees) and a **sub** part (content tier pool — e.g. perfect 4th / 5th / octave, diatonic within one octave). Homogeneous lessons repeat one exercise type; mixed lessons combine several types. On the guided path today, one curriculum lesson maps to one exercise type and one practice mode.
_Avoid_: Exercise alone (when meaning the per-lesson prompt), practice mode (when meaning type)

**Practice mode**:
The shipped implementation of one exercise type on a dedicated route — scoring UI, playback, and mount wiring (e.g. melodic interval sing vs harmonic interval identification). Not a Duolingo concept; one exercise type may map to one practice mode today, but mixed-type lessons would draw from more than one practice mode behind one lesson flow.
_Avoid_: Exercise (when meaning route/registry id), exercise type (when meaning the route)

### Curriculum

**Curriculum**:
The ordered route through which difficulty increases — which lesson slots exist, in what sequence, and what unlocks the next slot. The home guided path is the visible curriculum; targeted practice (planned) sits outside this sequence.
_Avoid_: Curriculum path, main track

**Curriculum lesson**:
One slot on the curriculum — a fixed place in the sequence with its own exercise type and unlock requirement. Completing the slot may take several lesson runs (many ten-exercise lessons) until progress thresholds are met. Maps to a path node on home.
_Avoid_: Curriculum step (legacy), level step, exercise card

**Guided path**:
The ordered sequence of curriculum lessons from first practice through the current end of the shipped curriculum. On home, the guided path is the only practice navigation: a single flat list of path nodes — not grouped into level bands, with no separate free-practice area. Lessons not yet woven into the middle of the sequence (e.g. chord middle) sit as path nodes at the end until inserted elsewhere.
_Avoid_: Curriculum path, level grid, free practice section

**Content tier**:
A named pool of practice items (e.g. perfect 4th / 5th / octave vs full diatonic within one octave). Often aligns with the exercise type **sub** for a curriculum lesson; several curriculum lessons can share one tier across different presentation modes.
_Avoid_: Level (when meaning tier), difficulty setting, exercise type sub (when they are the same pool — pick one term in prose)

**Curriculum level**:
Coarse planning label for a stretch of the roadmap (e.g. level 2 = interval family). Used in docs and agent planning, not shown on the home path.
_Avoid_: Level on home UI, path node title

**Path node**:
One curriculum lesson as it appears on the home guided path: passed (practicable again), current (first unlocked lesson not yet meeting the unlock requirement), or locked (future). The full guided path is visible; locked nodes are shown but not enterable (greyed out, no lesson run). Only the next locked node after the current one carries unlock copy naming its predecessor lesson. Home has no separate Continue section — the current node on the path is the entry point for resuming guided practice.
_Avoid_: Level card, exercise card, Continue card, hidden future lessons

**Path node title**:
The exercise-type family on a path node (e.g. Intervals, Chords, Scale degrees, Single note) — stable across presentation modes and content tiers in that family.
_Avoid_: Mode as primary label, level number

**Path node subtitle**:
How this curriculum lesson differs within the family: presentation mode and content tier (e.g. “Melodic reproduction · perfect 4th, 5th, octave”, “Major vs minor · root position”).
_Avoid_: Tier hint alone (home cards), practice mode route title

**Path node labels**:
Title and subtitle shown on the path. Derived from exercise-type family, presentation mode, and content tier when the lesson follows a standard pattern; optional per-lesson overrides for one-offs (mid-path inserts, tail lessons) without changing the global practice-mode title in the registry.
_Avoid_: Unlock copy only, single-line labels

**Guided replay**:
Opening a passed path node starts lesson runs for that exact curriculum lesson (its exercise type), not the highest unlocked tier for the same practice mode.
_Avoid_: Highest-tier bump on replay, implicit tier promotion

**Lesson link**:
How a path node opens practice: the practice-mode route plus a curriculum-lesson identifier in the URL (practice mode id and content tier id) so refresh and bookmarks resolve to that curriculum lesson. Locked lessons reject direct URLs the same way locked nodes on the path do.
_Avoid_: Practice-mode-only URL for guided lessons, lesson state without URL

**Lesson slot completion**:
A path node is complete when its curriculum lesson meets the unlock requirement (minimum exercises attempted across lesson runs and pass rate). Complete nodes stay marked complete on the path; further practice on that slot does not revert the node to in-progress. Only the current (first incomplete unlocked) node shows full progress detail toward the threshold.
_Avoid_: Re-locking on bad replay, per-node stats on every passed lesson

**Path complete**:
Every curriculum lesson on the shipped guided path meets the unlock requirement. Home shows a short completion line above the path; all nodes remain visible and enterable for guided replay. There is no current node until new curriculum lessons are added to the path.
_Avoid_: Hiding the path after completion, auto-suggested next lesson

**Current node focus**:
On home load, the path scrolls the current node into view so the learner always sees where they are on a long path. CSS `scroll-margin` on the current node keeps it off the viewport edge; motion respects `prefers-reduced-motion`.
_Avoid_: Manual scroll only, scroll on pass only, JS scroll offsets

**Targeted practice** (planned):
A separate home area for choosing what to work on outside the guided path sequence — likely mixed-type lessons — not the same as tapping a passed path node to repeat that curriculum lesson.
_Avoid_: Free practice (when meaning path replay), practice picker

**Tier block**:
The consecutive curriculum lessons on the guided path that share one content tier — all presentation modes at that tier before the path advances to the next tier.
_Avoid_: Tier group, difficulty band

**Presentation mode**:
How an interval is heard and answered — melodic sing, harmonic sing, melodic identification, or harmonic identification. Part of the exercise type **main** for interval work; today each presentation mode is its own practice mode and curriculum lesson on the path.
_Avoid_: Mode alone, exercise type (when meaning the whole type — use main/sub instead)

**Cross-mode sequencing**:
Within an interval tier block, presentation modes advance in this order: melodic reproduction → melodic identification → harmonic reproduction → harmonic identification. The path does not enter the next interval tier block until all four modes pass at the current tier. Other exercise-type families may define their own within-block mode order when they gain multiple presentation modes.
_Avoid_: Cross-practice-mode unlock, tier hopping, mode-first across tiers

**Unlock requirement**:
What a learner must achieve on a curriculum lesson (minimum exercises across lesson runs and pass rate) before the next curriculum lesson unlocks.
_Avoid_: Unlock rule, gate (without “curriculum”)

**Tier hint**:
Short home-card copy that reflects the active content tier (e.g. diatonic interval pool), not only the practice-mode title.
_Avoid_: Tier label, pool subtitle
