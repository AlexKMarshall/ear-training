# Ear Training — Tech debt

**Outstanding structural and tooling debt only.** Unclear module boundaries, duplicated responsibilities, leaky contracts, and missing static analysis.

When debt is paid down, **remove its row** from this file and cite the closed **TD-###** in the PR summary. Do not maintain a changelog of closed items here — use git history and merged PRs.

**Not in scope here:**

- **Product direction** — [`docs/roadmap.md`](roadmap.md)
- **Testing conventions** — [`docs/agents/testing.md`](agents/testing.md)
- **Forward plans for unbuilt features** — add a row only when the problem exists on `main` today, or when a feature PR discovers debt worth tracking

Agent workflow: [`docs/agents/tech-debt.md`](agents/tech-debt.md). PR conventions: [`docs/agents/pull-requests.md`](agents/pull-requests.md).

---

## How this relates to the product roadmap

| Document | Role |
|----------|------|
| [`docs/roadmap.md`](roadmap.md) | What to build (product) |
| **This file** | What makes building it **harder or riskier** on today's architecture |
| [`docs/agents/testing.md`](agents/testing.md) | How to write tests; tests ship with the feature PR |

Prioritize debt that blocks or complicates **near-term roadmap work** — especially content tiers, curriculum lessons, new practice-mode families, and recognition modes (see [`docs/roadmap.md`](roadmap.md)).

---

## Priority key

| Priority | Meaning |
|----------|---------|
| **P0** | Likely to block or significantly slow the next roadmap milestones. Pay down when touching related code. |
| **P1** | Adds friction and bug risk; workarounds exist today. Bring into scope when the PR already touches the area. |
| **P2** | Quality, consistency, or ops; lower direct roadmap impact. Good standalone cleanup PRs. |

---

## Outstanding tech debt

| ID | Priority | Area | Problem | Roadmap impact | Suggested direction |
|----|----------|------|---------|----------------|---------------------|
| TD-003 | P0 | Session vs preferences | **Session planner** drives interval, scale-degree, and chord-sing question draw (`*-session.ts`). **Identify** and **sing** practice mounts no longer embed interval/degree/chord **content pickers**; **voice picker** remains in mounts when `showVoicePicker` is true. Preference modules (`getActive*()` helpers) still exist for legacy/tests. | Retiring user item pickers ([Session model](roadmap.md#session-model-target-behavior)) still needs voice-range picker on a shared settings surface and narrowing preference modules. | Move voice-range picker to a shared settings surface; delete or narrow preference modules to test-only helpers until pickers are fully gone. |
 TD-007 | P1 | Tag taxonomy | Eligible tags for planning live in **`curriculum/curriculum-lessons.ts`** (`getEligibleTagIds`); stats weakness uses a separate **`TAG_CONFIG`** map in **`history/tag-stats.ts`**. | New tiers/tags must be updated in two places; drift breaks planner weighting vs dashboard breakdown. | One tag registry keyed by `(practiceModeId, contentTierId)` consumed by planner, stats, and unlock. |
| TD-009 | P1 | History schema | Older attempts may omit **`contentTierId`**; **`filterRecordsForCurriculumLesson`** falls back to the exercise's first tier. | Tier-aware stats and unlock can mis-attribute pre-migration history. | Backfill strategy or explicit "legacy attempt" handling; document in migration PR when tier rollout completes. |
| TD-010 | P1 | Exercise wiring | Each exercise adds a **page entry**, **Vite `rollupOptions` input**, **`*-tests.ts` config blob**, and registry row. **`tests/browser/helpers/mount.ts`** duplicates config factories. | Level 4+ (triads, inversions, dictation) scales linearly in boilerplate files. | Reduce per-exercise surface: route table drives pages/build inputs; registry holds behavior; test helpers import registry configs. |
| TD-012 | P2 | Module boundaries | **`history/tag-stats.ts`** imports **`practice-modes/registry.ts`** to filter sing attempts for median ¢ — stats layer depends on UI registry for **`responseMode`**. | Circular-import risk as registry grows; stats should not know about mount metadata. | Move `responseMode` (or `scoringKind`) to a domain constant on `PracticeModeId` in `history/types.ts` or a small `exercises/meta.ts` without UI imports. |
| TD-013 | P1 | Curriculum model | Interval **pool** / **content tier** ids (`interval-2a`, `interval-2b`) and helpers (`getEligibleIntervalIds`, `TIER_POOL_LABEL`, tier-keyed tag eligibility) duplicate what each **linear path node** already expresses — "tier" and "pool" language clashes with the learner-facing guided path. | Every new interval path node repeats pool boilerplate; named-interval and future interval lessons inherit the confusion. | Declare eligible interval tags on each **`CurriculumLesson`** (or path node) directly; retire `interval-2x` ids and pool helpers; per-node subtitles replace a parallel tier layer. Overlaps **TD-007** (tag registry). |

---

## Related code seams (for agents)

Where boundary debt concentrates today:

| Seam | Files |
|------|--------|
| Exercise registry + mount | [`src/practice-modes/registry.ts`](../src/practice-modes/registry.ts), [`src/ui/mount-exercise.ts`](../src/ui/mount-exercise.ts), [`src/ui/*-tests.ts`](../src/ui/) |
| Session planner + question draw | [`src/session/planner.ts`](../src/session/planner.ts), [`src/history/session-cache.ts`](../src/history/session-cache.ts), [`src/ui/*-session.ts`](../src/ui/) |
| Curriculum lessons + unlock | [`src/curriculum/curriculum-lessons.ts`](../src/curriculum/curriculum-lessons.ts), [`src/curriculum/unlock.ts`](../src/curriculum/unlock.ts), [`src/curriculum/session-curriculum-lesson.ts`](../src/curriculum/session-curriculum-lesson.ts), [`src/curriculum/path-node.ts`](../src/curriculum/path-node.ts) (interval pool labels — **TD-013**) |
| User content preferences (target: retire) | [`src/scale-degree-preference.ts`](../src/scale-degree-preference.ts), [`src/chord-type-preference.ts`](../src/chord-type-preference.ts) |
| Tag stats vs tier eligibility | [`src/history/tag-stats.ts`](../src/history/tag-stats.ts), [`src/curriculum/curriculum-lessons.ts`](../src/curriculum/curriculum-lessons.ts) |
