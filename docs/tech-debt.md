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
| TD-001 | P0 | Exercise model | Parallel **`SingTestConfig`** / **`IdentifyTestConfig`** and separate **`mountSingTest`** / **`mountIdentifyTest`** paths. Registry lists `responseMode` but there is no unified **`ExerciseDefinition`** with shared `prepareExercise`, `playReference`, `score(response)`. | Every new practice mode duplicates mount wiring (chord ID, degree ID, Level 4+). | Introduce `ExerciseDefinition` incrementally: shared question/score types, single lesson orchestrator, thin per-exercise config. |
| TD-003 | P0 | Session vs preferences | **Session planner** drives interval, scale-degree, and chord-middle question draw (`*-session.ts`). **Identify** and **sing** practice mounts no longer embed interval/degree/chord **content pickers**; **voice picker** remains in mounts when `showVoicePicker` is true. Preference modules (`getActive*()` helpers) still exist for legacy/tests. | Retiring user item pickers ([Session model](roadmap.md#session-model-target-behavior)) still needs voice-range picker on a shared settings surface and narrowing preference modules. | Move voice-range picker to a shared settings surface; delete or narrow preference modules to test-only helpers until pickers are fully gone. |
| TD-006 | P1 | Question types | **`LessonExercise`** is the shared question shape for identify exercises too — optional chord/interval/degree fields with no discriminated union or exercise-scoped types. | Harder to add select-only scoring fields (distractors, selected answer) without widening the bag-of-fields type. | Split or narrow types: e.g. `ExerciseQuestion` union, or `Question` + exercise-specific extensions; keep identify scoring fields off sing-only paths. |
| TD-007 | P1 | Tag taxonomy | Eligible tags for planning live in **`curriculum/curriculum-lessons.ts`** (`getEligibleTagIds`); stats weakness uses a separate **`TAG_CONFIG`** map in **`history/tag-stats.ts`**. | New tiers/tags must be updated in two places; drift breaks planner weighting vs dashboard breakdown. | One tag registry keyed by `(practiceModeId, contentTierId)` consumed by planner, stats, and unlock. |
| TD-009 | P1 | History schema | Older attempts may omit **`contentTierId`**; **`filterRecordsForCurriculumLesson`** falls back to the exercise's first tier. | Tier-aware stats and unlock can mis-attribute pre-migration history. | Backfill strategy or explicit "legacy attempt" handling; document in migration PR when tier rollout completes. |
| TD-010 | P1 | Exercise wiring | Each exercise adds a **page entry**, **Vite `rollupOptions` input**, **`*-tests.ts` config blob**, and registry row. **`tests/browser/helpers/mount.ts`** duplicates config factories. | Level 4+ (triads, inversions, dictation) scales linearly in boilerplate files. | Reduce per-exercise surface: route table drives pages/build inputs; registry holds behavior; test helpers import registry configs. |
| TD-012 | P2 | Module boundaries | **`history/tag-stats.ts`** imports **`practice-modes/registry.ts`** to filter sing attempts for median ¢ — stats layer depends on UI registry for **`responseMode`**. | Circular-import risk as registry grows; stats should not know about mount metadata. | Move `responseMode` (or `scoringKind`) to a domain constant on `PracticeModeId` in `history/types.ts` or a small `exercises/meta.ts` without UI imports. |
| TD-016 | P2 | TypeScript | **`strict`** mode not enabled (`tsconfig.json` uses selective flags only). | Weaker guarantees at module boundaries; nullable fields on attempts/questions easier to misuse. | Enable `strict` incrementally (or `strictNullChecks` first) with a tracked burn-down. |
| TD-017 | P1 | Exercise UI | Exercise Actions component has boolean configuration props | Boolean props allow combinatorial explosion of states and make testing more difficult. | Refactor component to use a discriminating union of states. This may require the exercise state model to be turned into an explicit finite state machine

---

## Related code seams (for agents)

Where boundary debt concentrates today:

| Seam | Files |
|------|--------|
| Exercise registry + mount | [`src/practice-modes/registry.ts`](../src/practice-modes/registry.ts), [`src/ui/sing-test.ts`](../src/ui/sing-test.ts), [`src/ui/identify-test.ts`](../src/ui/identify-test.ts), [`src/ui/*-tests.ts`](../src/ui/) |
| Session planner + question draw | [`src/session/planner.ts`](../src/session/planner.ts), [`src/history/session-cache.ts`](../src/history/session-cache.ts), [`src/ui/*-session.ts`](../src/ui/) |
| Curriculum lessons + unlock | [`src/curriculum/curriculum-lessons.ts`](../src/curriculum/curriculum-lessons.ts), [`src/curriculum/unlock.ts`](../src/curriculum/unlock.ts), [`src/curriculum/session-curriculum-lesson.ts`](../src/curriculum/session-curriculum-lesson.ts) |
| User content preferences (target: retire) | [`src/scale-degree-preference.ts`](../src/scale-degree-preference.ts), [`src/chord-type-preference.ts`](../src/chord-type-preference.ts) |
| Tag stats vs tier eligibility | [`src/history/tag-stats.ts`](../src/history/tag-stats.ts), [`src/curriculum/curriculum-lessons.ts`](../src/curriculum/curriculum-lessons.ts) |
