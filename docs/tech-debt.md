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
| TD-002 | P0 | UI orchestration | **`sing-test.ts`** (~860 lines) and **`identify-test.ts`** (~550 lines) each own DOM, state machine, lesson flow, history persistence, and preference UI. Large overlap between sing and identify lesson flow logic. | Adding practice modes (triads, degree ID, chord ID) multiplies copy-paste and divergent bug fixes. | Extract shared lesson controller (progress, attempts, summary, history writes); keep mount functions as thin shells. |
| TD-003 | P0 | Session vs preferences | **Session planner** drives interval, scale-degree, and chord-middle question draw (`*-session.ts`), but **`sing-test.ts`** / **`identify-test.ts`** still embed user **content pickers** (interval / degree / chord type / inversion) and call **`getActive*()`** preference helpers. Intervals/degrees/chords in production use `show*Picker: false`; pickers are dead UI paths for those exercises but still coupled. | Retiring user item pickers ([Session model](roadmap.md#session-model-target-behavior)) requires untangling preference UI from the generic mount layer. | Move voice-range picker to a shared settings surface; remove content picker branches once planner is sole draw path; delete or narrow preference modules to test-only helpers until pickers are fully gone. |
| TD-005 | P1 | Session modules | **`createIntervalHistoryCache`**, **`createScaleDegreeHistoryCache`**, **`createChordHistoryCache`** are near-identical wrappers (async load + in-memory mirror + save hook). | Every new planner-backed exercise copies the pattern; easy to introduce subtle cache bugs. | Single `createSessionHistoryCache(port)` in `src/session/` (or `src/history/`); typed aliases if needed per exercise-type family. |
| TD-006 | P1 | Question types | **`LessonExercise`** is the shared question shape for identify exercises too — optional chord/interval/degree fields with no discriminated union or exercise-scoped types. | Harder to add select-only scoring fields (distractors, selected answer) without widening the bag-of-fields type. | Split or narrow types: e.g. `ExerciseQuestion` union, or `Question` + exercise-specific extensions; keep identify scoring fields off sing-only paths. |
| TD-007 | P1 | Tag taxonomy | Eligible tags for planning live in **`curriculum/curriculum-lessons.ts`** (`getEligibleTagIds`); stats weakness uses a separate **`TAG_CONFIG`** map in **`history/tag-stats.ts`**. | New tiers/tags must be updated in two places; drift breaks planner weighting vs dashboard breakdown. | One tag registry keyed by `(practiceModeId, contentTierId)` consumed by planner, stats, and unlock. |
| TD-009 | P1 | History schema | Older attempts may omit **`contentTierId`**; **`filterRecordsForCurriculumLesson`** falls back to the exercise's first tier. | Tier-aware stats and unlock can mis-attribute pre-migration history. | Backfill strategy or explicit "legacy attempt" handling; document in migration PR when tier rollout completes. |
| TD-010 | P1 | Exercise wiring | Each exercise adds a **page entry**, **Vite `rollupOptions` input**, **`*-tests.ts` config blob**, and registry row. **`tests/browser/helpers/mount.ts`** duplicates config factories. | Level 4+ (triads, inversions, dictation) scales linearly in boilerplate files. | Reduce per-exercise surface: route table drives pages/build inputs; registry holds behavior; test helpers import registry configs. |
| TD-011 | P1 | Async cache | History caches load via **`void port.getAllAttempts().then(...)`** — first **`prepareExercise`** may run before records load, so planner sees empty history. | Weak-area weighting wrong on cold start / fast first Play. | Await history ready before enabling Play, or block question draw until cache is hydrated. |
| TD-012 | P2 | Module boundaries | **`history/tag-stats.ts`** imports **`practice-modes/registry.ts`** to filter sing attempts for median ¢ — stats layer depends on UI registry for **`responseMode`**. | Circular-import risk as registry grows; stats should not know about mount metadata. | Move `responseMode` (or `scoringKind`) to a domain constant on `PracticeModeId` in `history/types.ts` or a small `exercises/meta.ts` without UI imports. |
| TD-013 | P2 | Tooling | No **knip** (or equivalent) — unused exports and dead files are caught only by manual review. | Refactors leave orphan modules; pickers/planner migration will increase stale code. | Add knip config; report-only locally, fix baseline, then CI gate on PRs. |
| TD-014 | P2 | Tooling | No project **linter** or **formatter** (no ESLint, Prettier, or Biome). Style and obvious issues rely on reviewer attention and `tsc` on `src/` only. | Inconsistent formatting; latent bugs (`no-floating-promises`, unused imports) slip through. | Adopt **Biome** (single tool) or ESLint + Prettier; match existing style in an initial format pass. |
| TD-015 | P2 | CI | CI runs tests and **`npm run build`** (`tsc` + Vite) but no dedicated **`lint`** / **`typecheck`** scripts; **`tsconfig.json`** includes **`src`** only — **`tests/`** not typechecked by `tsc`. | Test helpers can drift from domain types; lint rules not enforced on PRs. | Add `npm run lint`, `npm run typecheck` (include `tests/` or solution-style config); wire into [`.github/workflows/ci.yml`](../.github/workflows/ci.yml). |
| TD-016 | P2 | TypeScript | **`strict`** mode not enabled (`tsconfig.json` uses selective flags only). | Weaker guarantees at module boundaries; nullable fields on attempts/questions easier to misuse. | Enable `strict` incrementally (or `strictNullChecks` first) with a tracked burn-down. |
| TD-017 | P2 | UI architecture | Exercise UIs built as **imperative DOM strings** inside mount functions rather than components or templates. | Harder to test presentation separately; TD-002 extraction is more painful. | Optional long-term: lightweight template helpers or component layer — only after lesson orchestration is shared (TD-002). |
| TD-018 | P2 | Copy / UX | Lesson **summary** headline says **Round complete** while glossary uses **lesson** / **lesson summary** (see `CONTEXT.md`). Browser tests assert shipped copy until aligned. | Terminology drift for learners and docs; agents may confuse round vs lesson. | Rename headline (e.g. **Lesson complete**) and progress strings if any still say *round*; update tests in same PR. |

---

## Related code seams (for agents)

Where boundary debt concentrates today:

| Seam | Files |
|------|--------|
| Exercise registry + mount | [`src/practice-modes/registry.ts`](../src/practice-modes/registry.ts), [`src/ui/sing-test.ts`](../src/ui/sing-test.ts), [`src/ui/identify-test.ts`](../src/ui/identify-test.ts), [`src/ui/*-tests.ts`](../src/ui/) |
| Session planner + question draw | [`src/session/planner.ts`](../src/session/planner.ts), [`src/ui/*-session.ts`](../src/ui/) |
| Curriculum lessons + unlock | [`src/curriculum/curriculum-lessons.ts`](../src/curriculum/curriculum-lessons.ts), [`src/curriculum/unlock.ts`](../src/curriculum/unlock.ts), [`src/curriculum/session-curriculum-lesson.ts`](../src/curriculum/session-curriculum-lesson.ts) |
| User content preferences (target: retire) | [`src/interval-preference.ts`](../src/interval-preference.ts), [`src/scale-degree-preference.ts`](../src/scale-degree-preference.ts), [`src/chord-type-preference.ts`](../src/chord-type-preference.ts) |
| Tag stats vs tier eligibility | [`src/history/tag-stats.ts`](../src/history/tag-stats.ts), [`src/curriculum/curriculum-lessons.ts`](../src/curriculum/curriculum-lessons.ts) |
