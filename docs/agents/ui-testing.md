# UI testing — agent guide

Rules for **browser/UI tests** (`tests/browser/**/*.browser.test.ts`) and for markup in `src/ui/` that tests must assert against.

See also: [`testing.md`](testing.md) (hub), [`mocking.md`](mocking.md) (inject ports at `mount*` boundaries).

## Query priority (required)

Use Vitest Browser Mode locators from `@vitest/browser/context` (`page.getBy*` — same priority as Testing Library). See [Vitest locators](https://vitest.dev/api/browser/locators).

1. **`getByRole`** — preferred (e.g. `page.getByRole('link', { name: /Sing melodic intervals/i })`, `page.getByRole('heading', { name: 'Locked' })`).
2. **`getByLabel`** — when a control has an associated label.
3. **`getByText`** — visible copy when role/label are insufficient.
4. **Chaining** — narrow a region, then query inside (e.g. `page.getByRole('region', { name: /Level 2/i }).getByRole('link', { name: /Sing melodic intervals/i })` when the page has duplicate titles).
5. **`data-testid` / `getByTestId`** — **last resort only**; requires **explicit user approval** each time before adding to product or tests.

## Forbidden in browser tests

- Selecting by **CSS class** (`.test-card`, `.exercise-locked`, etc.).
- Selecting by **tag + class** combinations used as implementation detail.
- `document.querySelector` / `#id` unless the id is the stable accessibility contract (prefer role/name instead).

## Assertions and interactions

- Use **`await expect.element(locator)`** for retriable checks (not one-shot DOM reads).
- Interact via locators: `await locator.click()`, not manual element clicks after `querySelector`.
- Prefer asserting **user-visible outcomes** (link exists / absent, heading visible, copy) over DOM structure.

## Product code responsibility

If a behavior cannot be asserted with role/label/text without brittle hacks, **improve accessibility in `src/ui/`** (e.g. ensure locked items are not links, headings have clear names, sections use `aria-labelledby`) rather than adding `data-testid`.

## Examples for T0 surfaces

Exercise **titles** in assertions must match [`src/exercises/registry.ts`](../../src/exercises/registry.ts) (`title` field), which drives visible card text.

| Behavior | Accessible approach |
|----------|---------------------|
| Unlocked exercise on home | `getByRole('link', { name: /Sing a single note/i })` visible |
| Locked exercise on home | **No** `getByRole('link', { name: /Sing melodic intervals/i })`; optional `getByText(/Locked · complete/i)` for status copy |
| Locked exercise page | `getByRole('heading', { name: 'Locked' })`; CTA `getByRole('link', { name: /Go to Sing a single note/i })` |
| Stats empty state | `getByText(/No practice history yet/i)` |
| Unlocked guard (no locked UI) | `expect.element(page.getByRole('heading', { name: 'Locked' })).not.toBeInTheDocument()` (or equivalent not-visible assertion) |
| Identify exercise — play + answer | `getByRole('button', { name: /Play interval/i })` then `getByRole('button', { name: /Perfect 5th/i })` (label from active interval set) |
| Identify — correct result | `getByText('Correct', { exact: true })` (avoids matching status line “Correct — tap Next…”) |
| Identify — round progress | `getByText(/question 1 of 10/i)`; after Next question, `question 2 of 10` |
| Identify — interval picker idle | `getByText(/Select at least one interval to begin/i)`; Play button `toBeDisabled()` |
| Sing — play + record | `getByRole('button', { name: /Play note/i })` → `Start singing` → `Done` |
| Sing — correct result | `getByText('Correct', { exact: true })` |
| Sing — fail + retry | `getByText('Not quite', { exact: true })`; `getByRole('button', { name: /Try again/i })` |
| Sing — round progress | `getByText(/question 1 of 10/i)`; after Next question, `question 2 of 10` |
| Sing — not enough pitch | `getByText(/Not enough clear pitch detected/i)` |

## Related

- [`testing.md`](testing.md) — hub and commands
- [`mocking.md`](mocking.md) — inject `HistoryPort` etc. at mount boundaries
- [`docs/testing-roadmap.md`](../testing-roadmap.md) — T0 curriculum guard scenarios
