# Ear Training — Tech debt registry

Tracks **structural and tooling debt** that makes the codebase harder to change: unclear module boundaries, duplicated responsibilities, leaky contracts, and missing static analysis. This file should shrink as debt is paid down.

**Not in scope here:**

- **Product direction** — [`docs/roadmap.md`](roadmap.md)
- **Testing gaps on shipped behavior** — [`docs/testing-roadmap.md`](testing-roadmap.md)
- **Forward plans for unbuilt features** — add debt rows only when the problem exists on `main` today, or when a feature PR discovers new debt worth tracking

Agent workflow: [`docs/agents/tech-debt.md`](agents/tech-debt.md). PR conventions: [`docs/agents/pull-requests.md`](agents/pull-requests.md).

---

## How this relates to the product roadmap

| Document | Role |
|----------|------|
| [`docs/roadmap.md`](roadmap.md) | What to build (product) |
| **This file** | What makes building it **harder or riskier** on today's architecture |
| [`docs/testing-roadmap.md`](testing-roadmap.md) | Shipped behavior lacking automated tests |

Prioritize debt that blocks or complicates **near-term roadmap work** — especially the session planner, content tiers, curriculum steps, and new exercise families (Phase 0 → Phase 1 in the roadmap).

---

## Priority key

| Priority | Meaning |
|----------|---------|
| **P0** | Likely to block or significantly slow the next roadmap milestones (planner/tiers, unified exercises, Level 4+). Pay down when touching related code. |
| **P1** | Adds friction and bug risk; workarounds exist today. Bring into scope when the PR already touches the area. |
| **P2** | Quality, consistency, or ops; lower direct roadmap impact. Good standalone cleanup PRs. |

---

## Open tech debt

| ID | Priority | Area | Problem | Roadmap impact | Suggested direction |
|----|----------|------|---------|----------------|---------------------|
| TD-001 | P0 | Exercise model | Parallel **`SingTestConfig`** / **`IdentifyTestConfig`** and separate **`mountSingTest`** / **`mountIdentifyTest`** paths. Registry lists `responseMode` but there is no unified **`ExerciseDefinition`** with shared `prepareQuestion`, `playReference`, `score(response)`. | Blocks Phase 1–2 goal of one exercise abstraction; every new exercise duplicates mount wiring. | Introduce `ExerciseDefinition` incrementally: shared question/score types, single round orchestrator, thin per-exercise config. See [Architectural direction](roadmap.md#architectural-direction). |
| TD-002 | P0 | UI orchestration | **`sing-test.ts`** (~860 lines) and **`identify-test.ts`** (~550 lines) each own DOM, state machine, round flow, history persistence, and preference UI. Large overlap between sing and identify round logic. | Adding exercises (triads, degree ID, chord ID) multiplies copy-paste and divergent bug fixes. | Extract shared round controller (progress, attempts, summary, history writes); keep mount functions as thin shells. |
| TD-003 | P0 | Session vs preferences | **Session planner** drives interval, scale-degree, and chord-middle question draw (`*-session.ts`), but **`sing-test.ts`** / **`identify-test.ts`** still embed user **content pickers** (interval / degree / chord type / inversion) and call **`getActive*()`** preference helpers. Intervals/degrees/chords in production use `show*Picker: false`; pickers are dead UI paths for those exercises but still coupled. | Retiring user item pickers ([Session model](roadmap.md#session-model--settings)) requires untangling preference UI from the generic mount layer. | Move voice-range picker to a shared settings surface; remove content picker branches once planner is sole draw path; delete or narrow preference modules to test-only helpers until pickers are fully gone. |
| TD-005 | P1 | Session modules | **`createIntervalHistoryCache`**, **`createScaleDegreeHistoryCache`**, **`createChordHistoryCache`** are near-identical wrappers (async load + in-memory mirror + save hook). | Every new planner-backed exercise copies the pattern; easy to introduce subtle cache bugs. | Single `createSessionHistoryCache(port)` in `src/session/` (or `src/history/`); typed aliases if needed per exercise family. |
| TD-006 | P1 | Question types | **`SingTestQuestion`** is the shared question shape for identify exercises too — optional chord/interval/degree fields with no discriminated union or exercise-scoped types. | Harder to add select-only scoring fields (distractors, selected answer) without widening the bag-of-fields type. | Split or narrow types: e.g. `ExerciseQuestion` union, or `Question` + exercise-specific extensions; keep identify scoring fields off sing-only paths. |
| TD-007 | P1 | Tag taxonomy | Eligible tags for planning live in **`curriculum/steps.ts`** (`getEligibleTagIds`); stats weakness uses a separate **`TAG_CONFIG`** map in **`history/tag-stats.ts`**. | New tiers/tags must be updated in two places; drift breaks planner weighting vs dashboard breakdown. | One tag registry keyed by `(exerciseId, contentTierId)` consumed by planner, stats, and unlock. |
| TD-009 | P1 | History schema | Older attempts may omit **`contentTierId`**; **`filterRecordsForStep`** falls back to the exercise's first tier. | Tier-aware stats and unlock can mis-attribute pre-migration history. | Backfill strategy or explicit "legacy attempt" handling; document in migration PR when tier rollout completes. |
| TD-010 | P1 | Exercise wiring | Each exercise adds a **page entry**, **Vite `rollupOptions` input**, **`*-tests.ts` config blob**, and registry row. **`tests/browser/helpers/mount.ts`** duplicates config factories. | Level 4+ (triads, inversions, dictation) scales linearly in boilerplate files. | Reduce per-exercise surface: route table drives pages/build inputs; registry holds behavior; test helpers import registry configs. |
| TD-011 | P1 | Async cache | History caches load via **`void port.getAllAttempts().then(...)`** — first **`prepareQuestion`** may run before records load, so planner sees empty history. | Weak-area weighting wrong on cold start / fast first Play. | Await history ready before enabling Play, or block question draw until cache is hydrated. |
| TD-012 | P2 | Module boundaries | **`history/tag-stats.ts`** imports **`exercises/registry.ts`** to filter sing attempts for median ¢ — stats layer depends on UI registry for **`responseMode`**. | Circular-import risk as registry grows; stats should not know about mount metadata. | Move `responseMode` (or `scoringKind`) to a domain constant on `ExerciseId` in `history/types.ts` or a small `exercises/meta.ts` without UI imports. |
| TD-013 | P2 | Tooling | No **knip** (or equivalent) — unused exports and dead files are caught only by manual review. | Refactors leave orphan modules; pickers/planner migration will increase stale code. | Add knip config; run in CI after baseline cleanup PR. |
| TD-014 | P2 | Tooling | No project **linter** or **formatter** (no ESLint, Prettier, or Biome). Style and obvious issues rely on reviewer attention and `tsc` on `src/` only. | Inconsistent formatting; latent bugs (`no-floating-promises`, unused imports) slip through. | Adopt **Biome** (single tool) or ESLint + Prettier; match existing style in an initial format pass. |
| TD-015 | P2 | CI | CI runs tests and **`npm run build`** (`tsc` + Vite) but no dedicated **`lint`** / **`typecheck`** scripts; **`tsconfig.json`** includes **`src`** only — **`tests/`** not typechecked by `tsc`. | Test helpers can drift from domain types; lint rules not enforced on PRs. | Add `npm run lint`, `npm run typecheck` (include `tests/` or solution-style config); wire into [`.github/workflows/ci.yml`](../.github/workflows/ci.yml). |
| TD-016 | P2 | TypeScript | **`strict`** mode not enabled (`tsconfig.json` uses selective flags only). | Weaker guarantees at module boundaries; nullable fields on attempts/questions easier to misuse. | Enable `strict` incrementally (or `strictNullChecks` first) with a tracked burn-down. |
| TD-017 | P2 | UI architecture | Exercise UIs built as **imperative DOM strings** inside mount functions rather than components or templates. | Harder to test presentation separately; TD-002 extraction is more painful. | Optional long-term: lightweight template helpers or component layer — only after round orchestration is shared (TD-002). |

---

## Tooling debt (tracked explicitly)

These rows are the user's requested infrastructure items; they can be closed individually or in one "static analysis" PR series.

| ID | Item | Notes |
|----|------|-------|
| TD-013 | **knip** — dead code detection | Start with report-only locally; fix baseline; then CI gate on PRs. |
| TD-014 | **Linter + formatter** | Biome recommended for minimal config surface; ESLint + Prettier is fine if the team prefers split tools. |
| TD-015 | **CI static analysis** | At minimum: lint + typecheck (including tests) on every PR alongside existing `npm test`, `test:browser`, `build`. |

---

## Closed tech debt

| ID | Closed | PR | Notes |
|----|--------|-----|-------|
| TD-004 | 2026-06-04 | (this PR) | Locked pages use tier-aware **unlock requirement** labels; home **tier hints** for all four interval presentation modes at interval-2b. Levels vs steps authority consolidation still open. |
| TD-008 | 2026-06-04 | (this PR) | Harmonic interval exercises use highest unlocked **curriculum step** (interval-2b when earned). Explicit predecessor graph still TODO. |

---

## Related code seams (for agents)

Quick map of where boundary debt concentrates today:

| Seam | Files |
|------|--------|
| Exercise registry + mount | [`src/exercises/registry.ts`](../src/exercises/registry.ts), [`src/ui/sing-test.ts`](../src/ui/sing-test.ts), [`src/ui/identify-test.ts`](../src/ui/identify-test.ts), [`src/ui/*-tests.ts`](../src/ui/) |
| Session planner + question draw | [`src/session/planner.ts`](../src/session/planner.ts), [`src/ui/*-session.ts`](../src/ui/) |
| Curriculum steps vs levels | [`src/curriculum/steps.ts`](../src/curriculum/steps.ts), [`src/curriculum/levels.ts`](../src/curriculum/levels.ts), [`src/curriculum/unlock.ts`](../src/curriculum/unlock.ts), [`src/curriculum/session-step.ts`](../src/curriculum/session-step.ts) |
| User content preferences (target: retire) | [`src/interval-preference.ts`](../src/interval-preference.ts), [`src/scale-degree-preference.ts`](../src/scale-degree-preference.ts), [`src/chord-type-preference.ts`](../src/chord-type-preference.ts) |
| Tag stats vs tier eligibility | [`src/history/tag-stats.ts`](../src/history/tag-stats.ts), [`src/curriculum/steps.ts`](../src/curriculum/steps.ts) |
