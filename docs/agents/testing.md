# Testing — agent guide

How to write and run tests in this repo.

## Testing debt vs product work

| Question | Where to look |
|----------|----------------|
| How do I write tests? | This page and leaf guides below |
| What should we build next? | [`docs/roadmap.md`](../roadmap.md) |
| Structural / tooling gaps? | [`docs/tech-debt.md`](../tech-debt.md) |

**Rule:** Tests for new or changed behavior belong in the **same PR** as that behavior. If you discover shipped behavior on `main` without adequate coverage, add tests in that PR (or a focused follow-up)—there is no separate testing-debt register.

## Principles (summary)

Authoritative detail in leaf guides.

| Principle | Rationale |
|-----------|-----------|
| **Node Vitest for domain** | Scoring, generation, unlock, stats, lesson run — fast, deterministic (`tests/**/*.test.ts`). |
| **Real browser for UI** | Vitest browser + Playwright; **no** jsdom/happy-dom for UI. |
| **Ports at mount boundaries** | `HistoryPort`, `AudioPort`, `RecordingPort`; optional `exercisesPerLesson` on sing/identify mount deps for shortened lesson browser tests. |
| **No real mic in CI** | Fake `RecordingPort` + real `scoreFromSamples`; manual QA for permissions and timbre. |

**Solid + Vitest:** `vite-plugin-solid` injects a default `test.environment` of `jsdom` when none is set at the root of `vite.config.ts`. This repo sets `test.environment: "node"` at the root so unit tests stay in Node and UI tests use **Vitest browser mode** (Playwright Chromium) only — do not add `jsdom` for UI coverage. Unit tests that import modules pulling in Solid JSX use a minimal `window`/`document` stub in `tests/vitest-unit-setup.ts` (not UI coverage).

## Registry smoke contract

All seven shipped `practiceModeId`s have a one-question pass smoke in `registry-exercises.browser.test.ts`. Richer flows (lesson progress, fail/retry, tier pool, lesson summary) live in dedicated `*.browser.test.ts` files—extend those when adding behavior, and add a registry smoke when adding an eighth practice mode.

## When to read what

| Situation | Read |
|-----------|------|
| Browser/UI tests (`*.browser.test.ts`, `src/ui/`) | [`ui-testing.md`](ui-testing.md) |
| Mocking, ports, dependency injection | [`mocking.md`](mocking.md) |
| Opening a PR with test changes | [`pull-requests.md`](pull-requests.md) — cite relevant leaf guide(s) in the test plan |

## Quick commands

```bash
npm test              # Vitest Node — domain unit tests
npm run test:browser  # Vitest browser — UI orchestration (Playwright)
npm run build         # production build; run when routes or static assets change
```

After `npm ci`, `postinstall` runs `playwright install chromium` into the project (`PLAYWRIGHT_BROWSERS_PATH=0`, [Playwright’s hermetic install](https://playwright.dev/docs/browsers#hermetic-install--ci)). Re-run if needed:

```bash
PLAYWRIGHT_BROWSERS_PATH=0 npx playwright install chromium
```

CI runs `npm run typecheck`, `npm test`, `npm run test:browser`, and `npm run build` on every PR and `main`.

## Manual QA

Automation does not replace:

- **`?unlock=all`** — Append to home or any exercise URL on a fresh profile to bypass curriculum locks for access (links and exercise mount). Current-path progress and unlock copy still use real attempt history.
- Microphone permission and hardware variation
- Headphone vs speaker bleed, piano sample feel
- iOS Safari audio unlock (gesture timing)
- Full cross-browser matrix (CI uses Chromium only)

Use the manual checklist in [`pull-requests.md`](pull-requests.md) when touching `src/ui/`, `src/audio/`, or curriculum.

## Explicitly out of scope (automation)

- Real microphone capture in CI
- Mocking `pitchy` / `smplr` in UI tests
- jsdom/happy-dom UI tests
- Replacing domain unit tests with browser tests
- Tests for **unshipped** product roadmap items

## Leaf guides

| Guide | Scope |
|-------|--------|
| [`ui-testing.md`](ui-testing.md) | Accessible queries, locators, assertions in browser tests |
| [`mocking.md`](mocking.md) | Ports, `vi.fn` on parameters, forbidden `vi.mock` patterns |
| [`pull-requests.md`](pull-requests.md) | PR test plan structure and when to run which suite |

## Related

- Product direction: [`docs/roadmap.md`](../roadmap.md)
- Multi-PR plans: [`multi-pr-plans.md`](multi-pr-plans.md)
