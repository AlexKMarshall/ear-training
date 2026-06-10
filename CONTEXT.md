# Ear Training

Browser-based ear training for singers: a guided curriculum of lessons, each made of exercises, with progress from attempt history. No accounts yet — attempt history is device-local only; breaking schema or unlock changes are acceptable pre-launch (history can be wiped). Legacy **`chord-middle`** / **`chord-1a`** attempts are **excluded** from unlock, planner, and stats after the chord-sing rework — not migrated.

## Language

### UI layer

**Presentation**:
DOM structure, styling, and user-visible copy only — including which controls are shown, hidden, or disabled for a given view. Does not decide scoring, unlock, lesson progression, or which question to draw.
_Avoid_: UI (when meaning the whole mount module), view layer

**Business logic**:
Rules that determine outcomes: scoring, curriculum and unlock checks, session planner draws, lesson progression (exercise index, attempts per exercise, lesson summary), and attempt persistence. Must not live in presentation code; the UI receives outcomes and maps them to presentation.
_Avoid_: Domain (without scope), backend (this app has no server)

**Exercise screen state**:
The phase machine for one exercise attempt inside a practice-mode mount (e.g. idle → playing → ready → recording → result → lesson summary on sing **response mode** exercises). Lives **outside** the presentation component tree: imperative TypeScript updates a snapshot exposed to Solid via signals or a store; components render the snapshot and invoke callbacks — not `querySelector` or `innerHTML`. One shared, testable module owns the phase machine and produces an **exercise chrome snapshot** on each update; **response mode**-specific answer and scoring mechanics plug in at a seam; the page mount adapter wires ports, maps snapshots to presentation, and handles **attempt scored** persistence. Distinct from **lesson run** (ten-exercise lesson rules).
_Avoid_: Test state, UI state (when meaning curriculum or unlock state), exercise controller (when meaning the shared module name in code)

**Exercise chrome snapshot**:
The shared header and action-bar presentation contract for an exercise screen — lesson progress visibility and which primary actions appear (play, record on sing **response mode**, retry, next, lesson-summary CTAs). Derived from exercise screen phase and lesson run rules; carried on the exercise screen state snapshot. Uses discriminated modes (attempting with step, result action, lesson summary) rather than independent show/hide or enabled flags — each mode implies which controls exist. Presentation maps it to DOM; it does not decide scoring or lesson progression.
_Avoid_: Chrome props, *Hidden booleans, action bar state (without “exercise” scope)

**Lesson run**:
The unified, rules-only controller for one ten-exercise lesson: exercise index, attempts on the current exercise, when retry and advance are allowed, lesson results, and lesson summary. Shared by sing and identify; mounts map its snapshot to presentation. Does not own exercise screen state (playback, recording, choice UI).
_Avoid_: Lesson (when meaning the controller module), test state machine

**Attempt scored** (callback):
Hook fired when the learner completes a scored try on the current exercise. The lesson run updates lesson rules; the **exercise orchestrator** builds and persists the history record from the definition’s score payload — not the lesson run or the definition itself.
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

**Exercise screen state extraction**:
Refactor that introduces the shared **exercise screen state** module (phase machine, shared chrome snapshot, injected playback/scoring hooks) and rewires practice-mode mounts to use it while leaving presentation authoring unchanged. Delivered as separate pull requests: module with unit tests first, then one PR per mount (identify, then sing) for reviewability. Does not ship new exercise types (e.g. **phrase response** dictation) — only removes duplication and keeps future playback/scoring variants behind the injected seam.
_Avoid_: UI rewrite, framework migration, phrase response (as in-scope work for this extract)

**Exercise definition**:
Per-**practice mode** behaviour behind one interface: draw (`prepareExercise`), reference playback (`playReference`), scoring (`scoreAnswer`), and presentation copy (status strings, lesson banner, prompts). A discriminated union on **response mode** — sing branch (recording, pitch scoring, exercise prompt) vs select branch (choice pool, correct answer id) — with shared fields for ids, titles, and voice-picker visibility. Co-located with family builders (e.g. interval behaviour stays in `interval-tests.ts`). The practice-mode **registry** holds one definition per mode; it does not duplicate orchestration.
_Avoid_: SingTestConfig / IdentifyTestConfig (legacy parallel configs), exercise config blob (without “definition”)

**Exercise orchestrator** (`mountExercise`):
Single lesson-screen mount module wired by the **page mount**: owns **exercise screen state**, response-mode internal adapters (sing recording vs select choices), Solid presentation wiring, and **attempt scored** persistence (`buildAttemptRecord` + history port). Definitions supply behaviour; the orchestrator does not branch on practice mode for persistence. Replaces parallel `mountSingTest` / `mountIdentifyTest` entry points.
_Avoid_: Per-mode mount functions in the registry, mountSingTest / mountIdentifyTest (legacy)

**Exercise definition extraction**:
Refactor that introduces **exercise definition** and **exercise orchestrator**, then rewires practice-mode registry entries while leaving presentation components unchanged. Delivered incrementally: type + orchestrator with unit tests, migrate `single-note` first, then remaining sing modes, then select modes, then delete legacy mount/config types. Closes **TD-001**.
_Avoid_: UI rewrite, framework migration, big-bang registry swap

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
The end-of-lesson score screen listing how many exercises were correct and a breakdown (first try, after retry, wrong). Canonical term is *lesson summary*;
_Avoid_: Round summary (as product term)

**Exercise type**:
The kind of work each exercise in a lesson asks for, with a **main** part (task plus presentation — e.g. sing melodic intervals, identify harmonic intervals, sing scale degrees) and a **sub** part (content tier pool — e.g. perfect 4th / 5th / octave, diatonic within one octave). Homogeneous lessons repeat one exercise type; mixed lessons combine several types. On the guided path today, one curriculum lesson maps to one exercise type and one practice mode.
_Avoid_: Exercise alone (when meaning the per-lesson prompt), practice mode (when meaning type)

**Practice mode**:
The shipped implementation of one exercise type on a dedicated route — scoring UI, playback, and mount wiring (e.g. melodic interval sing vs harmonic interval identification). Not a Duolingo concept; one exercise type may map to one practice mode today, but mixed-type lessons would draw from more than one practice mode behind one lesson flow.
_Avoid_: Exercise (when meaning route/registry id), exercise type (when meaning the route)

**Response mode**:
How the learner answers on an exercise screen — **sing** (record pitch and score against a target) or **select** (choose from options after hearing the reference). Orthogonal to **presentation mode** (how the interval is heard) and to **exercise type** family; several practice modes can share one response mode. The shared **exercise screen state** module stays response-mode-agnostic at its core; family-specific choice pools and scoring details are supplied at the seam, not hard-coded per practice mode route.
_Avoid_: Presentation mode (when meaning melodic vs harmonic), practice mode (when meaning the route), identify (as a synonym for select)

**Phrase response** (sing):
Answering by singing multiple pitches as one uninterrupted musical phrase — one recording, scored once after the phrase ends, with no feedback between constituent notes. Preserves internal pitch memory across the response (e.g. singing back both notes of a melodic interval, or the upper note of a **named-interval reproduction** prompt).
_Avoid_: Per-note feedback, multi-segment retry, step-by-step sing-back

**Named-interval reproduction**:
An interval **presentation mode** (sing **response mode**): hear one reference pitch, read the named interval (e.g. *Major 3rd*), then sing the corresponding upper note of an ascending interval (e.g. D3 + major 3rd → F♯3). The interval label is shown from exercise draw through recording (idle, playback, and sing phases — not only after Play). The interval is not played — only the reference pitch is (heard, not named on screen). Scored against the target upper note, like melodic reproduction.
_Avoid_: Interval construction (without “named”), sing from reference (as product term), melodic reproduction (when meaning hear-both-notes-then-sing-top)

### Curriculum

**Curriculum**:
The ordered route through which difficulty increases — which lesson slots exist, in what sequence, and what unlocks the next slot. The home guided path is the visible curriculum; **targeted practice** sits outside unlock progression on this sequence.
_Avoid_: Curriculum path, main track

**Curriculum lesson**:
One slot on the curriculum — a fixed place in the sequence with its own exercise type and unlock requirement. Completing the slot may take several lesson runs (many ten-exercise lessons) until progress thresholds are met. Maps to a path node on home.
_Avoid_: Curriculum step (legacy), level step, exercise card

**Guided path**:
The ordered sequence of curriculum lessons from first practice through the current end of the shipped curriculum. On home, a **targeted practice** entry sits above a single flat list of path nodes — not grouped into level bands, with no separate free-practice area. Lessons not yet woven into the middle of the sequence (e.g. chord middle) sit as path nodes at the end until inserted elsewhere. Another exercise-type family may appear between tiers of the same family (e.g. scale degrees between interval tiers **2a** and **2b**; easy chord tiers may interleave similarly later).
_Avoid_: Curriculum path, level grid, free practice section

**Content tier**:
A named pool of practice items (e.g. perfect 4th / 5th / octave vs full diatonic intervals within one octave). Often aligns with the exercise type **sub** for a curriculum lesson; several curriculum lessons can share one tier across different presentation modes. **Interval** content tiers scope which interval labels the session planner may draw; they do **not** use **key quality** — prompts name the interval directly, with no scale collection to establish. Scale-degree tier ids follow `{family}-{keyQuality}-{poolScope}` (e.g. `degree-major-intro`, `degree-major-diatonic`, `degree-minor-diatonic`; later `degree-major-chromatic`, …). Interval tier ids follow `{family}-{poolScope}` (e.g. `interval-2a`, `interval-2b`). New pool scopes add new path tiers rather than silently widening an existing one.
_Avoid_: Level (when meaning tier), difficulty setting, exercise type sub (when they are the same pool — pick one term in prose)

**Key quality**:
Whether scale-degree exercises anchor on a major or natural minor collection of pitches. Same ordinal degree labels (e.g. *3rd*, *7th*) can map to different pitches depending on key quality. The learner sees key quality on the path node subtitle and in a **persistent lesson banner** on the exercise screen; no cadence or harmonic context playback is required to establish it.
_Avoid_: Mode (without “key”), scale type, minor key (when meaning natural minor specifically)

**Curriculum level** (legacy):
Numbered planning label grouping practice modes by exercise-type family (e.g. intervals, scale degrees). Not learner-facing; prefer **path node title** (exercise-type family name) in new docs and code over “level N”.
_Avoid_: Level on home UI, path node title, level 2 (as shorthand for interval family)

**Path node**:
One curriculum lesson as it appears on the home guided path: passed (practicable again), current (first unlocked lesson not yet meeting the unlock requirement), or locked (future). The full guided path is visible; locked nodes are shown but not enterable (greyed out, no lesson run). Only the next locked node after the current one carries unlock copy naming its predecessor lesson. Home has no separate Continue section — **targeted practice** (when visible) is the primary entry above the path; the **current node** is the entry for guided practice on the sequence.
_Avoid_: Level card, exercise card, Continue card, hidden future lessons

**Path node title**:
The exercise-type family on a path node (e.g. Intervals, Chords, Scale degrees, Single note) — stable across presentation modes and content tiers in that family.
_Avoid_: Mode as primary label, level number

**Path node subtitle**:
How this curriculum lesson differs within the family: presentation mode, content tier, and key quality where relevant (e.g. “Melodic reproduction · major key · 4th, 5th, octave”, “Melodic reproduction · natural minor scale degrees”).
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
A path node is complete when its curriculum lesson meets the unlock requirement (minimum exercises attempted across lesson runs and pass rate). Complete nodes stay marked complete on the path; further practice on that slot does not revert the node to in-progress. Only the current (first incomplete unlocked) node shows full progress detail toward the threshold. Curriculum reordering or new tiers may invalidate prior attempts for affected lessons; pre-launch, affected history may be wiped rather than migrated.
_Avoid_: Re-locking on bad replay, per-node stats on every passed lesson

**Path complete**:
Every curriculum lesson on the shipped guided path meets the unlock requirement. Home shows a short completion line above the path; all nodes remain visible and enterable for guided replay. **Targeted practice** remains available (all nodes passed). There is no current node until new curriculum lessons are added to the path.
_Avoid_: Hiding the path after completion, hiding targeted practice after path complete

**Current node** (path):
The first unlocked path node that has not yet met the **unlock requirement** — styled distinctly on home (`path-node-current`). Home does **not** auto-scroll to it on load; the learner scrolls the path manually. **Targeted practice** and the top of the path stay visible at first paint.
_Avoid_: Current node focus (legacy — auto-scroll on load), scroll-margin jump on home load

**Targeted practice**:
A single app-generated recommended lesson (ten exercises) shown as the first entry on home, above the guided path list. The app picks **focus areas** from attempt history; the learner starts the lesson with one tap — no topic picker. Opens on a dedicated **`/targeted-practice/`** route: one mount locks in ten exercise slots at Start and swaps **exercise definition** per slot while keeping one **lesson run**. Plan and in-progress position persist device-locally so refresh resumes mid-lesson; cleared on lesson summary or explicit abandon. While a run is in progress, the home entry is a **resume card** (family, progress e.g. 4/10) — not a recomputed focus preview — until that run finishes or is abandoned. Abandon via explicit leave on the exercise screen, or implicitly when starting any **guided path** lesson (current node or **guided replay**); only one in-flight lesson at a time. Ends with the standard **lesson summary** and a return-to-home CTA; stored plan cleared; home card shows a fresh preview from updated history. Draws only from **passed** path nodes — not the current or locked slots. May combine several **exercise types** within one **path node title** in one run. Uses light **spaced repetition**: recency boosts weak-area ranking, ~70% weak / ~30% maintenance draws (same spirit as the **session planner**), and **interleaved** exercise order so the same tag is not back-to-back. Attempts persist with each slot’s real **practice mode** and **content tier** (same history as guided practice). Does not advance **unlock requirement** on the current path node. Hidden until the learner has at least one passed path node. Not the same as **guided replay** on a passed path node.
_Avoid_: Free practice (when meaning path replay), practice picker, targeted practice section (when meaning multiple links)

**Targeted practice card**:
The home entry for targeted practice. **Title:** *Targeted practice* (stable product label). **Subtitle:** focused **path node title** and tag label(s) (e.g. *Intervals · minor 2nd*). **Status:** exercise count or resume progress (e.g. *10 exercises*, *Resume · 4/10*). Before Start, subtitle is recomputed on each home visit from current history (may shift until Start locks the plan); during an in-progress run, resume copy replaces it. No pass-rate stats on the card.
_Avoid_: Path-node title as card title, stats-forward weakness percentages on home

**Targeted practice banner**:
Fixed exercise-screen context for a targeted-practice run (e.g. *Targeted practice · Intervals · minor 2nd*) shown for the whole lesson alongside the normal per-slot **persistent lesson banner** for the active curriculum lesson. Lesson progress (e.g. 3/10) is the mixed-run indicator.
_Avoid_: Replacing per-slot banners, targeted-practice-only banner with no lesson context

**Focus area** (targeted practice):
A **weak area** or **relative focus** chosen for a targeted-practice lesson — one planner tag within one passed **curriculum lesson**. The lesson’s **path node title** (exercise-type family) is whichever family contains the globally highest-priority weak pair (`weakTagWeight` × recency). One focus area by default, or two when a second pair in that family shares the same planner **tag id** on a different passed curriculum lesson (same item, different presentation mode or tier). Most exercises drill focus tags; ~30% are **maintenance** draws from other passed lessons in the same family — tags above the weak threshold only, recency-weighted like the **session planner** maintenance pool. Focus areas are not picked across families in one lesson (e.g. intervals and chords together).
_Avoid_: Weak skill (without lesson scope), topic picker choice, cross-family focus, two unrelated weak tags in one lesson

**Weak area**:
A planner tag within one **curriculum lesson** classified as weak for planning — below minimum exercise count or pass-rate threshold (same as the **session planner**), or treated as a **relative focus** in targeted practice when no pair meets that bar (weakest tags in the chosen family by pass rate and recency). Stats and targeted practice use this granularity; tags are not pooled across curriculum lessons with the same label.
_Avoid_: Weak skill (vague), whole path node weak, cross-lesson tag pool

**Relative focus** (targeted practice):
When every eligible tag in the focused family is above the weak threshold, targeted practice still picks focus area(s) from the relatively weakest *(curriculum lesson, tag)* pairs in that family — not a maintenance-only fallback. The ~70% / ~30% weak / maintenance split still applies using planner-style classification where possible.
_Avoid_: Maintenance-only review lesson, hide card when all strong

**Tier block**:
The curriculum lessons on the guided path that share one content tier — all presentation modes at that tier must pass before the path advances to the next tier **within the same exercise-type family**. Tier blocks need not be contiguous on the path; another family (e.g. scale degrees) may sit between interval tiers.
_Avoid_: Tier group, difficulty band, level block

**Presentation mode**:
How an interval task is presented and answered — melodic reproduction, harmonic reproduction, melodic identification, harmonic identification, or **named-interval reproduction**. Part of the exercise type **main** for interval work; today each presentation mode is its own practice mode and curriculum lesson on the path.
_Avoid_: Mode alone, exercise type (when meaning the whole type — use main/sub instead)

### Chords

**Voicing position**:
Which of the three simultaneous sounding pitches in a closed-voiced triad the learner must sing — **bottom** (lowest), **middle**, or **top** (highest). Drawn per exercise within a curriculum lesson via the **session planner** (one tag per position, weak-area weighted like intervals and scale degrees); persisted on attempts as **`voicingPositionId`** (`bottom` | `middle` | `top`). Scoring compares the sung pitch to that position in the played voicing. Not the same as naming a **chord member** (root / third / fifth): in an inversion, the bottom note may be the third or fifth, not the root. Chord exercises **anchor range** on the drawn voicing position so the pitch to sing always falls within the learner’s voice range.
_Avoid_: Root note (when meaning voicing position), voice (without “voicing”), chord tone (without position)

**Chord member**:
Root, third, or fifth of the triad — the harmonic role of a pitch regardless of which **voicing position** it occupies. Chord-sing exercises on the guided path target voicing position, not chord-member labels on screen.
_Avoid_: Bottom / middle / top (when meaning harmonic role), scale degree

**Inversion**:
Which chord member is in the **bottom** voicing position: root position (root on bottom), 1st inversion (third on bottom), or 2nd inversion (fifth on bottom). On **chord sing**, per-inversion curriculum **content tiers** fix inversion and **triad quality** for every exercise; **pooled-inversion chord sing** fixes quality only and draws inversion per exercise. Voicing position to sing varies per draw in both cases. On **chord identify**, inversion is either fixed (quality identification) or drawn from the eligible pool (inversion identification).
_Avoid_: Voicing (alone), chord position, inversion number without ordinal (prefer *1st inversion*, *2nd inversion*)

**Chord tier block**:
The six **chord sing** curriculum lessons that establish major and minor triads in root position, 1st inversion, and 2nd inversion (one path node per quality × inversion). Learners pass each node before the next unlocks on the guided path; **diminished** and later chord work sit outside this block. Nodes are **interleaved** by approximate difficulty (other families sit between chord steps): **major root** after interval **2a** harmonic sing; **minor root** after **2a** harmonic identification; **major 1st** and **minor 1st** inside the interval **2b** block; **major 2nd** after major diatonic scale degrees; **minor 2nd** last among sing steps. Quality × inversion order within the block is always major → minor at each inversion step. Sing chord tier ids follow `{family}-{triadQuality}-{inversion}` (e.g. `chord-major-root`, `chord-minor-first`). **Pooled-inversion chord sing** capstones are additive path nodes after each quality’s three steps — not part of this six-lesson count. **Chord identify** lessons are separate path nodes inserted when their sing prerequisites are met.
_Avoid_: chord-1a (legacy monolithic pool), chord middle (as tier name)

**Pooled-inversion chord sing**:
A **chord sing** curriculum lesson that fixes **triad quality** for the run and draws **inversion** per exercise from root, 1st, and 2nd (same inversion tags as **inversion identification**). **Voicing position** to sing still varies per draw. One capstone per quality (major, minor), placed on the guided path after that quality’s three per-inversion **chord tier block** sing lessons. Passing a capstone is required before **inversion identification** for that quality unlocks. Same practice mode (`chord-sing`) as per-inversion lessons; content tier ids `chord-major-inversions` and `chord-minor-inversions`. **Session planner** uses two passes per draw: inversion tags (`root`, `first`, `second`) for weak-area weighting, then voicing-position tags (`bottom`, `middle`, `top`) — both axes weighted like their single-axis counterparts on per-inversion sing and inversion identification. **Weak-area history** for each pass: capstone-tier attempts when present; otherwise fall back to aggregated per-inversion **chord sing** attempts for that **triad quality** (root + 1st + 2nd tiers), keyed by `inversionId` or `voicingPositionId` respectively. **Persistent lesson banner** names quality and pool (e.g. *Major triad · all inversions*); **path node subtitle** follows per-inversion sing pattern with *any voice* suffix (e.g. *Major triad · all inversions · any voice*). **Per-exercise prompt** still names the drawn voicing position only (inversion is not shown on screen during sing).
_Avoid_: All-inversions sing (without “pooled-inversion”), mixed inversion lesson (vague)

**Chord identify path placement**:
Where **chord identify** nodes land on the guided path relative to **chord sing** (other families may sit between any adjacent rows): after **chord-minor-root** → **quality identification** (`chord-quality-root`); after **chord-minor-first** → **quality identification** (`chord-quality-first`); after **chord-major-second** → **pooled-inversion chord sing** (major capstone), then **inversion identification** (`chord-inversion-major`); after **chord-minor-second** → **quality identification** (`chord-quality-second`), then **pooled-inversion chord sing** (minor capstone), then **inversion identification** (`chord-inversion-minor`). **Inversion identification** for a quality unlocks only after that quality’s three per-inversion sing lessons **and** its pooled-inversion capstone are complete in path order — it does not wait for the other quality’s sing lessons at the same inversion step.
_Avoid_: Batched identify block after all six sing lessons, inversion ID gated on minor sing at same inversion, inversion ID after per-inversion sing only (without capstone)

**Chord sing** (practice mode):
The sing **response mode** practice mode for hearing a triad and singing one **voicing position** (`chord-sing`; route `/chord-sing/`). Replaces legacy `chord-middle`. One practice mode serves per-inversion **chord tier block** lessons and **pooled-inversion chord sing** capstones. On per-inversion tiers, quality and inversion come from the **content tier** and voicing position from the session planner; on capstone tiers, quality is fixed by tier, inversion and voicing position each from a session-planner pass. No user content pickers for triad quality, inversion, or voicing position on the guided path (legacy chord preference modules retired). Registry title describes the family; **persistent lesson banner** names the fixed axes for the run (quality and inversion, or quality and all-inversions pool on capstones); **per-exercise prompt** names the drawn voicing position (bottom / middle / top) from draw through recording.
_Avoid_: chord-middle (legacy id), sing the middle note (as fixed product copy)

**Triad quality**:
Whether the three-note chord is major, minor, or (in later tiers) diminished. On **chord sing**, major and minor are separate curriculum lessons at each **inversion** step. On **chord identify** (**quality identification**), triad quality is the answer and varies per draw within the lesson pool; **diminished** is not in the first chord tier block — it enters in a later content tier after major/minor inversions are established.
_Avoid_: Chord type (when meaning quality alone), mode (without “key”)

**Chord presentation mode** (identify):
How a chord identification exercise fixes one axis and tests the other — **quality identification** (inversion fixed by content tier; learner selects major vs minor) or **inversion identification** (triad quality fixed by content tier; learner selects root position vs 1st vs 2nd inversion). Each mode is its own practice mode and curriculum lesson on the path, like interval presentation modes. Orthogonal to **chord sing** (voicing-position reproduction).
_Avoid_: Chord type identification (without quality/inversion scope), identify quality and inversion together on one exercise

**Quality identification** (chord):
A **chord presentation mode** (select **response mode**): hear a triad, choose **triad quality**. **Inversion** is fixed for the lesson (persistent lesson banner); the session planner draws major and minor triads at that inversion. Session planner tags are **`major-triad`** and **`minor-triad`** (same ids as **`chordTypeId`** on attempts) for weak-area weighting. Unlocks after the learner has passed the corresponding major and minor **chord sing** lessons at that inversion.
_Avoid_: Chord quality ID (without “identification”), major/minor ID (without chord scope)

**Inversion identification** (chord):
A **chord presentation mode** (select **response mode**): hear a triad, choose **inversion**. **Triad quality** is fixed for the lesson (persistent lesson banner); the session planner draws root, 1st, and 2nd inversions at that quality. Session planner tags are **`root`**, **`first`**, and **`second`** (same ids as **`inversionId`** on attempts) for weak-area weighting. Unlocks after the learner has passed all three per-inversion **chord sing** lessons for that quality (root, 1st, 2nd) **and** that quality’s **pooled-inversion chord sing** capstone.
_Avoid_: Chord inversion ID (without “identification”), voicing identification (conflicts with **voicing position** on sing)

**Chord quality identification** (practice mode):
Select **response mode** practice mode for **quality identification** (`chord-quality-id`; route `/chord-quality-id/`). Content tier ids name the fixed **inversion**: `chord-quality-root`, `chord-quality-first`, `chord-quality-second`. Distinct from sing tiers (`chord-major-root`, …), which fix both quality and inversion.
_Avoid_: chord-identify (when meaning this mode only), chord-quality-id tier ids on sing lessons

**Chord inversion identification** (practice mode):
Select **response mode** practice mode for **inversion identification** (`chord-inversion-id`; route `/chord-inversion-id/`). Content tier ids name the fixed **triad quality**: `chord-inversion-major`, `chord-inversion-minor`.
_Avoid_: chord-identify (when meaning this mode only), reusing sing tier ids for identify pools

**Chord identify labels**:
**Path node subtitle** follows the interval identification pattern: `{presentation mode} · {fixed axis}` (e.g. *Quality identification · root position*, *Inversion identification · major triad*). **Path node title** stays *Chords*. **Persistent lesson banner** on the exercise screen names only the fixed axis (e.g. *Root position*, *Major triad*) — not the answer pool. No per-exercise sing-style prompt; choice buttons carry the answer labels (e.g. *Major* / *Minor*; *Root position* / *1st inversion* / *2nd inversion*).
_Avoid_: Sing-style “any voice” suffix on identify subtitles, lesson banner repeating “identification”

**Chord identify** (practice mode family):
Select **response mode** chord work — **chord quality identification** and **chord inversion identification** — distinct from **chord sing**. One practice mode per **chord presentation mode** (interval pattern); content tier and lesson banner name the fixed axis; the session planner draws the answer axis from the eligible pool. Reference playback is a simultaneous harmonic triad (same sonority as **chord sing**). Answer choices are exactly the eligible pool — two options (major / minor) for **quality identification**, three (root / 1st / 2nd) for **inversion identification** — not padded to four like interval identification. Draws **anchor range** on the bottom sounding pitch (lowest note of the voicing) within the learner’s active voice range — same voice picker as other exercises; no sung target, but register stays comfortable and bass-led for **inversion identification**. Wrong-answer **result** copy matches interval identification: no reveal of the correct quality or inversion — learner retries by listening again.
_Avoid_: chord-id (without presentation mode), identify (as a synonym for select)

**Cross-mode sequencing**:
Within an interval tier block, presentation modes advance in this order: melodic reproduction → **named-interval reproduction** → melodic identification → harmonic reproduction → harmonic identification. The path does not enter the next interval tier block until all five modes pass at the current tier (another exercise-type family may appear on the path between interval tiers). Within the chord tier block, **chord sing** precedes **quality identification** at each inversion step (major sing → minor sing → quality identification for that inversion), with other exercise-type families interleaved on the path between steps as today. **Inversion identification** for a quality follows that quality’s three per-inversion **chord sing** lessons (root, 1st, 2nd) and its **pooled-inversion chord sing** capstone, inserted on the path per **chord identify path placement** — not deferred until the whole tier block finishes. Linear **unlock requirement** on the path enforces the sing prerequisites because sing lessons precede each identification lesson in sequence.
_Avoid_: Cross-practice-mode unlock, tier hopping, mode-first across tiers

**Unlock requirement**:
What a learner must achieve on a curriculum lesson (minimum exercises across lesson runs and pass rate) before the next curriculum lesson unlocks.
_Avoid_: Unlock rule, gate (without “curriculum”)

**Tier hint**:
Short home-card copy that reflects the active content tier (e.g. diatonic interval pool), not only the practice-mode title.
_Avoid_: Tier label, pool subtitle
