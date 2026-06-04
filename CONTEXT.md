# Ear Training

Browser-based ear training for singers: guided curriculum, session practice, and progress from attempt history. No accounts yet — attempt history is device-local only; breaking schema or unlock changes are acceptable pre-launch (history can be wiped).

## Language

**Content tier**:
A named pool of practice items (e.g. perfect 4th / 5th / octave vs full diatonic within one octave) shared across exercises at that difficulty.
_Avoid_: Level (when meaning tier), difficulty setting

**Curriculum level**:
Coarse planning label for a stretch of the roadmap (e.g. level 2 = interval family). Used in docs and agent planning, not shown on the home path.
_Avoid_: Level on home UI, path node title

**Curriculum step**:
One exercise mode at one content tier — the smallest unit of guided progression, unlock, and path nodes. Mid-path additions (e.g. triad quality before the next interval tier) are new steps: a distinct exercise id and content tier id inserted in the guided path order, with the same unlock rule as any other step.
_Avoid_: Exercise alone (when tier matters), level step, reusing a tier id for a different pool

**Guided path**:
The ordered sequence of curriculum steps from first practice through the current end of the shipped curriculum. Order is an explicit product decision (which modes at which tier, in what sequence) and may change while the curriculum is still growing. On home, the guided path is the only practice navigation: a single flat list of path nodes — not grouped into level bands, with no separate free-practice area. Exercises that are not yet woven into the middle of the sequence (e.g. chord middle) sit as path nodes at the end until inserted elsewhere.
_Avoid_: Curriculum path, main track, level grid, free practice section

**Path node**:
One curriculum step as it appears on the home guided path: passed (practicable again), current (first unlocked step not yet meeting the unlock requirement), or locked (future). The full guided path is visible; locked nodes are shown but not enterable (greyed out, no session). Only the next locked node after the current one carries unlock copy naming its predecessor step. Home has no separate Continue section — the current node on the path is the entry point for resuming guided practice.
_Avoid_: Level card, exercise card, Continue card, hidden future steps

**Path node title**:
The exercise family on a path node (e.g. Intervals, Chords, Scale degrees, Single note) — stable across presentation modes and content tiers in that family.
_Avoid_: Mode as primary label, level number

**Path node subtitle**:
How this step differs within the family: presentation mode and content tier (e.g. “Melodic reproduction · perfect 4th, 5th, octave”, “Major vs minor · root position”).
_Avoid_: Tier hint alone (home cards), exercise route title

**Path node labels**:
Title and subtitle shown on the path. Derived from exercise family, presentation mode, and content tier when the step follows a standard pattern; optional per-step overrides for one-offs (mid-path inserts, tail exercises) without changing the global exercise title in the registry.
_Avoid_: Unlock copy only, single-line labels

**Guided replay**:
Opening a passed path node starts a session for that exact curriculum step (its presentation mode and content tier), not the highest unlocked tier for the same exercise.
_Avoid_: Highest-tier session, implicit tier bump on replay

**Step link**:
How a path node opens practice: the exercise route plus a step identifier in the URL (exercise id and content tier id) so refresh and bookmarks resolve to that curriculum step. Locked steps reject direct URLs the same way locked nodes on the path do.
_Avoid_: Exercise-only URL for guided steps, session state without URL

**Step completion**:
A path node is complete when its curriculum step meets the unlock requirement (minimum questions and pass rate). Complete nodes stay marked complete on the path; further practice on that step does not revert the node to in-progress. Only the current (first incomplete unlocked) node shows full progress detail (e.g. question count and pass rate toward the threshold).
_Avoid_: Re-locking on bad replay, per-node stats on every passed step

**Path complete**:
Every curriculum step on the shipped guided path meets the unlock requirement. Home shows a short completion line above the path; all nodes remain visible and enterable for guided replay. There is no current node until new steps are added to the path.
_Avoid_: Hiding the path after completion, auto-suggested next step

**Current node focus**:
On home load, the path scrolls the current node into view so the learner always sees where they are on a long path. CSS `scroll-margin` on the current node keeps it off the viewport edge; motion respects `prefers-reduced-motion`.
_Avoid_: Manual scroll only, scroll on pass only, JS scroll offsets

**Targeted practice** (planned):
A separate home area for choosing what to work on outside the guided path sequence — not the same as tapping a passed path node to repeat that step.
_Avoid_: Free practice (when meaning path replay), practice picker

**Tier block**:
The consecutive steps on the guided path that share one content tier — all presentation modes at that tier before the path advances to the next tier.
_Avoid_: Tier group, difficulty band

**Presentation mode**:
How an interval is heard and answered — melodic sing, harmonic sing, melodic identification, or harmonic identification.
_Avoid_: Exercise type (ambiguous with route), mode alone

**Cross-mode sequencing**:
Within an interval tier block, presentation modes advance in this order: melodic reproduction → melodic identification → harmonic reproduction → harmonic identification. The path does not enter the next interval tier block until all four modes pass at the current tier. Other exercise families may define their own within-block mode order when they gain multiple presentation modes.
_Avoid_: Cross-exercise unlock, tier hopping, mode-first across tiers

**Unlock requirement**:
The curriculum step a learner must complete (minimum questions and pass rate) before the next step or exercise becomes available.
_Avoid_: Unlock rule, gate (without “curriculum”)

**Tier hint**:
Short home-card copy that reflects the active content tier (e.g. diatonic interval pool), not only the exercise title.
_Avoid_: Tier label, pool subtitle
