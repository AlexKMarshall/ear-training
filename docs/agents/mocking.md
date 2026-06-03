# Mocking — agent guide

Dependency injection and test doubles for **Node unit tests** and **browser UI tests**. Prefer ports and parameters over module mocks.

See also: [`testing.md`](testing.md) (hub), [`ui-testing.md`](ui-testing.md) (browser locators).

## Forbidden

- **`vi.mock()` / `vi.spyOn()` on third-party modules** — including `smplr`, `pitchy`, and any npm dependency.
- **Mocking or spying on browser built-ins** — e.g. `indexedDB`, `navigator.mediaDevices`, `AudioContext`, `localStorage` (use injectable ports or in-memory fakes passed as parameters instead).
- **`vi.mock()` on application modules** to replace internals — if a module is hard to test, **refactor first** so the subject under test accepts dependencies as parameters (interfaces / ports).

## Allowed

- **`vi.fn()` (and similar) on arguments** passed into the function under test — only when the parameter has a **defined interface** (e.g. `HistoryPort`, `prepareQuestion`, `playReference`).
- **Concrete fakes** that implement those interfaces (e.g. `createMemoryHistoryPort()`, config hooks with deterministic `prepareQuestion` in tests).
- **Direct use of real domain code** in Node tests (scoring, unlock math) — no mocks needed when logic is pure.

## Refactor-first rule

If effective tests would require mocking a global, vendor, or private module import:

1. Introduce an interface at the boundary (port or config callback).
2. Production default wires the real implementation once (entrypoint or `createDefault*()`).
3. Tests pass a fake via `vi.fn()` or a small in-memory implementation.

**T0 example (PR 2):** `HistoryPort` + `deps.history` on `mountHome` / `mountExercisePage` / `mountStats` — the canonical pattern; **not** `vi.mock("../history/store")`.

**Later (T1/T2):** `AudioPort`, `RecordingPort` on sing/identify mounts — same rules; no mocking `pitchy` / `smplr`.

## Node vs browser

| Layer | Mocking approach |
|-------|------------------|
| Node unit | Inject ports/config; use real algorithms |
| Browser UI | Inject ports at `mount*`; use Vitest locators for DOM ([`ui-testing.md`](ui-testing.md)); fake recording via `RecordingPort` in T2, not mocked `getUserMedia` |

## Related

- [`testing.md`](testing.md) — hub and commands
- [`docs/testing-roadmap.md`](../testing-roadmap.md) — port definitions and phased rollout
