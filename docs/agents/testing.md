# Testing — agent guide

How to write and run tests in this repo.

## Testing debt vs product work

| Question | Where to look |
|----------|----------------|
| How do I write tests? | This page and leaf guides below |
| What shipped behavior still lacks tests? | [`docs/testing-roadmap.md`](../testing-roadmap.md) — **open debt table only** |
| What should we build next? | [`docs/roadmap.md`](../roadmap.md) |

**Rule:** Tests for new or changed behavior belong in the **same PR** as that behavior. Do not add rows to the testing roadmap for features that are not on `main` yet.

The testing roadmap is a **debt register**, not a forward plan. It should get smaller as gaps close and can be retired when the open-debt table is empty. Ongoing conventions live here and in the leaf guides.

## When to read what

| Situation | Read |
|-----------|------|
| Closing a known coverage gap | [`docs/testing-roadmap.md`](../testing-roadmap.md) — pick a debt ID, implement, mark done |
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

CI runs `npm test`, `npm run test:browser`, and `npm run build` on every PR and `main`.

## Manual QA

- **`?unlock=all`** — Append to home or any exercise URL on a fresh profile to bypass curriculum locks for access (links and exercise mount). Current-path progress and unlock copy still use real attempt history.

## Leaf guides

| Guide | Scope |
|-------|--------|
| [`ui-testing.md`](ui-testing.md) | Accessible queries, locators, assertions in browser tests |
| [`mocking.md`](mocking.md) | Ports, `vi.fn` on parameters, forbidden `vi.mock` patterns |
| [`pull-requests.md`](pull-requests.md) | PR test plan structure and when to run which suite |

## Related

- Product direction: [`docs/roadmap.md`](../roadmap.md)
- Multi-PR plans: [`multi-pr-plans.md`](multi-pr-plans.md)
