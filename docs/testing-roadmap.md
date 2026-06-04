# Ear Training — Testing debt

Tracks **gaps between shipped product behavior and automated tests**. This file should shrink over time and can be **removed or folded into** [`docs/agents/testing.md`](agents/testing.md) once the open-debt table is empty.

**Not in scope here:** test plans for [product roadmap](roadmap.md) features that do not exist yet. Add or extend tests in the **same PR** as the feature (see [How this relates to the product roadmap](#how-this-relates-to-the-product-roadmap)).

How to write tests: [`docs/agents/testing.md`](agents/testing.md), [`ui-testing.md`](agents/ui-testing.md), [`mocking.md`](agents/mocking.md). PR workflow: [`agents/pull-requests.md`](agents/pull-requests.md).

---

## How this relates to the product roadmap

| Document | Role |
|----------|------|
| [`docs/roadmap.md`](roadmap.md) | What to build (product) |
| **This file** | What is **built today** but still lacks adequate automated coverage |
| Feature PRs | Tests for new/changed behavior ship **with** the feature; do not add speculative rows here |

Update this file when you **close** or **discover** testing debt on `main`. You do **not** need to update it for every product PR unless that PR changes debt (adds coverage or ships untested behavior).

---

## Principles (summary)

Authoritative detail: [`docs/agents/testing.md`](agents/testing.md) and leaf guides.

| Principle | Rationale |
|-----------|-----------|
| **Node Vitest for domain** | Scoring, generation, unlock, stats, preferences — fast, deterministic (`tests/**/*.test.ts`). |
| **Real browser for UI** | Vitest browser + Playwright; **no** jsdom/happy-dom for UI. |
| **Ports at mount boundaries** | `HistoryPort`, `AudioPort`, `RecordingPort`; no `vi.mock` on vendor audio libs. |
| **No real mic in CI** | Fake `RecordingPort` + real `scoreFromSamples`; manual QA for permissions and timbre. |

---

## Automated baseline (done)

These are **not** open debt; they define what “covered” builds on.

| Area | Status | Where |
|------|--------|--------|
| CI on PRs and `main` | **Done** | [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) — `npm test`, `npm run test:browser`, `npm run build` (Node 22, Chromium) |
| Domain unit tests | **Done** | Scoring, chords, intervals, scale degrees, rounds, history stats + tag breakdown, curriculum unlock/levels/steps, **session planner** (incl. large 2b pool weak-tag overweighting), **session-step resolution**, interval/scale-degree/chord session wiring, registry contract |
| Ports + browser project | **Done** | `HistoryPort`, `AudioPort`, `RecordingPort`; `tests/browser/**/*.browser.test.ts` |
| Curriculum guards | **Done** | Home unlock states, locked exercise page, `?unlock=all` (access only), step-level Continue |
| Identify orchestration | **Done** | Melodic interval ID — pass, Q2 progress, no interval picker; tier pool drives MC |
| Sing orchestration | **Done** | Single note + scale-degree sing — pass, fail/retry, short recording error |
| Per-exercise smokes | **Done** | `registry-exercises.browser.test.ts` — one pass path for chord-middle, interval melodic/harmonic sing, interval harmonic ID |
| Registry contract | **Done** | `tests/exercises-registry.test.ts` |

**Optional ops (not blocking debt):** GitHub branch protection requiring `ci`; parallel CI jobs if browser runtime grows; preview-deploy smoke.

---

## Coverage map (shipped behavior today)

Seven registry exercises; curriculum path + free practice. Use this table to see **where** debt sits.

| Shipped surface | Node unit | Browser orchestration | Notes |
|-----------------|-----------|------------------------|--------|
| Pitch / scoring / harmonics | Yes | — | |
| Notes, chords, voice range | Yes | — | |
| Interval + scale-degree **generation** | Yes | — | Tier pools via `getEligibleTagIds`; session modules tested with planner doubles |
| **Session planner** (weak + maintenance) | Yes | — | `tests/session-planner.test.ts` — includes 12-tag melodic 2b pool |
| Chord / interval / inversion preference modules | Yes | — | Logic only; **not** wired to question draw on shipped exercises (pickers removed) |
| Round scoring math (`summarizeRound`) | Yes | — | |
| History stats + unlock + tag breakdown | Yes | — | Step unlock + `getContinueStep` in Node; `tag-stats` + dashboard weakness |
| Exercise registry + configs | Yes | — | |
| Home curriculum cards + Continue | Partial | Yes | Step-level unlock progression, Continue link, melodic 2b hint, `?unlock=all` |
| Locked exercise page | — | Yes | |
| Stats dashboard `/stats/` | Yes | Partial | Tag weakness + identify copy in browser ([`stats.browser.test.ts`](../tests/browser/stats.browser.test.ts)); optional deeper exercise-summary assertions |
| **single-note** sing | — | Yes | Dedicated round test; not in registry smoke list |
| **interval-melodic-id** | — | Yes | Dedicated round test; not in registry smoke list |
| **interval-melodic-sing** | — | Smoke only | Pass path; no fail/retry browser test |
| **interval-harmonic-sing** | — | Smoke only | Pass path; no fail/retry browser test |
| **interval-harmonic-id** | — | Smoke + round-style in identify file | No interval picker; tier pool drives choices |
| **scale-degree-sing** | Yes | Yes | Session module + pass/fail browser; no full-round browser test |
| **chord-middle** (free practice) | Yes | Smoke only | Session module + pass path; no fail/retry browser test |
| 10-question round **completion / summary UI** | — | No | Browser tests stop at Q1→Q2 or single question |
| Free practice section on home | — | No | Chord-middle always available; home region not asserted |
| Real IndexedDB in browser tests | — | N/A | Intentional: `createMemoryHistoryPort()` |
| Mic, timbre, Safari audio unlock | — | Manual | See [Manual QA](#manual-qa-always-required) |

---

## Open testing debt

Prioritized gaps for **current** functionality. Close a row by merging tests on `main`, then delete or mark the row **Done** here.

| ID | Gap | Shipped behavior | Plan to close |
|----|-----|------------------|---------------|
| D1 | **Round completion UI** | After question 10, round summary (`firstTry` / `retry` / `wrong`) | Browser test on one sing + one identify exercise: advance through mocked/fixed questions or inject config to shorten round; assert summary region copy. |
| D2 | **Sing fail/retry beyond single-note** | Interval sing + chord-middle share 3-attempt flow with single-note | Reuse `sing-round` patterns: wrong `samplesHz`, “Not quite”, attempt cap — at least one interval sing + chord-middle. |
| D3 | **Registry smoke parity** | All seven `exerciseId`s should stay guarded against mount/regression breaks | Add **single-note** and **interval-melodic-id** one-question smokes to `registry-exercises.browser.test.ts` *or* document in [`testing.md`](agents/testing.md) that dedicated round files satisfy the contract (prefer smokes for uniformity). |
| D5 | **Home — free practice** | “Free practice” region links to chord-middle on fresh profile | Browser test: region visible + link to chord-middle exercise. |

**Closed on `main`**

| ID | Resolution |
|----|------------|
| D4 | **Done (obsolete)** — interval / scale-degree / chord-type / inversion pickers removed from UI; only voice type persists. No reload round-trip needed for retired pickers. Optional follow-up: voice-type `localStorage` browser test only. |
| D6 | **Done (obsolete)** — `scale-degree-preference.ts` no longer drives question draw; dedicated unit file not needed unless module is kept for cleanup. |

**Closed on `main` (PR #33):** stats with history — browser tests for weakness breakdown and identify median copy; tag stats in Node (`tests/history-stats.test.ts`).

**Low priority / optional**

| ID | Gap | Plan |
|----|-----|------|
| O1 | Branch protection on `main` | Repo setting: require `ci` check |
| O2 | Split CI jobs | Separate Node vs browser job if wall-clock becomes painful |
| O3 | Preview deploy smoke | Only if preview URLs become part of release process |

---

## Manual QA (always required)

Automation does not replace:

- **`?unlock=all`** — Access-only bypass; Continue/progress still use real history ([`dev-unlock.ts`](../src/curriculum/dev-unlock.ts)).
- Microphone permission and hardware variation
- Headphone vs speaker bleed, piano sample feel  
- iOS Safari audio unlock (gesture timing)  
- Full cross-browser matrix (CI uses Chromium only)

Use the manual checklist in [`docs/agents/pull-requests.md`](agents/pull-requests.md) when touching `src/ui/`, `src/audio/`, or curriculum.

---

## Commands

```bash
npm test              # Vitest Node — domain
npm run test:browser  # Vitest browser — UI orchestration
npm run build         # production build; run when routes/assets change
```

CI runs all three on every PR and `main` ([workflow](../.github/workflows/ci.yml)).

---

## Explicitly out of scope (automation)

- Real microphone capture in CI  
- Mocking `pitchy` / `smplr` in UI tests  
- jsdom/happy-dom UI tests  
- Replacing domain unit tests with browser tests  
- Tests for **unshipped** product roadmap items (harmonic 2b, tier 2c+, per-tag tier gates, new exercise types, goals/streaks, etc.)

---

## Archive: foundation rollout (2025–2026)

Phased rollout (T-CI → T0 → T3) is **complete**. Kept for history only; do not revive phase planning in this file.

| Phase | Outcome |
|-------|---------|
| T-CI | GitHub Actions: `npm test` + `npm run build` |
| T0 | Browser project, `HistoryPort`, home/locked browser tests, Playwright in CI |
| T1 | Identify orchestration + interval ID browser tests |
| T2 | `RecordingPort`, single-note sing round browser tests |
| T3 | Registry smokes, helpers, `?unlock=all`, registry contract |

**Session planner rollout (PRs #35–#40):** curriculum steps, planner core, interval/degree/chord wiring, step unlock + melodic 2b — tests shipped in feature PRs; product/testing roadmaps synced in the final docs PR of that sequence.
