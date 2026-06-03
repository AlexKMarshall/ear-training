# Testing — agent guide

How to write and run tests in this repo. For **phased rollout** (T0–T3, CI, ports), see [`docs/testing-roadmap.md`](../testing-roadmap.md).

## When to read what

| Situation | Read |
|-----------|------|
| Planning test work or CI phases | [`docs/testing-roadmap.md`](../testing-roadmap.md) |
| Browser/UI tests (`*.browser.test.ts`, `src/ui/`) | [`ui-testing.md`](ui-testing.md) |
| Mocking, ports, dependency injection | [`mocking.md`](mocking.md) |
| Opening a PR with test changes | [`pull-requests.md`](pull-requests.md) — cite relevant leaf guide(s) in the test plan |

More leaf guides may be added later (e.g. fixtures, manual QA). This page stays the index.

## Quick commands

```bash
npm test              # Vitest Node — domain unit tests
npm run test:browser  # Vitest browser — UI orchestration (after T0 PR 1 lands)
npm run build         # production build; run when routes or static assets change
```

CI runs `npm test` and `npm run build` on every PR and `main`. Browser tests join CI when [T0](../testing-roadmap.md#phase-t0---foundation-tooling--first-ports) lands.

## Leaf guides

| Guide | Scope |
|-------|--------|
| [`ui-testing.md`](ui-testing.md) | Accessible queries, locators, assertions in browser tests |
| [`mocking.md`](mocking.md) | Ports, `vi.fn` on parameters, forbidden `vi.mock` patterns |
| [`pull-requests.md`](pull-requests.md) | PR test plan structure and when to run which suite |

## Related

- Product direction: [`docs/roadmap.md`](../roadmap.md)
- Multi-PR plans: [`multi-pr-plans.md`](multi-pr-plans.md)
