# Mocking — agent guide

Dependency injection and test doubles for **Node unit tests** and **browser UI tests**. Prefer ports and parameters over module mocks.

See also: [`testing.md`](testing.md) (hub), [`ui-testing.md`](ui-testing.md) (browser locators).

## Forbidden

- **`vi.mock()` / `vi.spyOn()` on third-party modules** — including `smplr`, `pitchy`, and any npm dependency.
- **Mocking or spying on browser built-ins** — e.g. `indexedDB`, `navigator.mediaDevices`, `AudioContext`, `localStorage` (use injectable ports or in-memory fakes passed as parameters instead).
- **`vi.mock()` on application modules** to replace internals — if a module is hard to test, **refactor first** so the subject under test accepts dependencies as parameters (interfaces / ports).

## Allowed

- **`vi.fn()` (and similar) on arguments** passed into the function under test — only when the parameter has a **defined interface** (e.g. `HistoryPort`, `prepareExercise`, `playReference`).
- **Concrete fakes** that implement those interfaces (e.g. `createMemoryHistoryPort()`, config hooks with deterministic `prepareExercise` in tests).
- **Direct use of real domain code** in Node tests (scoring, unlock math) — no mocks needed when logic is pure.

## Refactor-first rule

If effective tests would require mocking a global, vendor, or private module import:

1. Introduce an interface at the boundary (port or config callback).
2. Production default wires the real implementation once (entrypoint or `createDefault*()`).
3. Tests pass a fake via `vi.fn()` or a small in-memory implementation.

**T0 example:** `HistoryPort` + `deps.history` on `mountHome` / `mountPracticeModePage` / `mountStats` — the canonical pattern; **not** `vi.mock("../history/store")`.

**T1 example:** `IdentifyMountDeps` on `mountIdentifyTest` — `history` from `createMemoryHistoryPort()`, `audio` from `createTestAudioPort()`; override `prepareExercise` / `playReference` in test config (noop playback, fixed interval question). **Not** `vi.mock` on `smplr` or `context.ts`.

**T2 example:** `SingMountDeps` on `mountSingTest` — `history` from `createMemoryHistoryPort()`, `audio` from `createTestAudioPort()`, `recording` from `createTestRecordingPort({ samplesHz })` (delivers samples on session `stop()` / **Done**); optional `exercisesPerLesson` for shortened lesson browser tests; fixed `prepareExercise` + noop `playReference` in test config. Real `scoreFromSamples`; **not** mocked `getUserMedia` or `pitchy` / `smplr`.

## Node vs browser

| Layer | Mocking approach |
|-------|------------------|
| Node unit | Inject ports/config; use real algorithms |
| Browser UI | Inject ports at `mount*`; use Vitest locators for DOM ([`ui-testing.md`](ui-testing.md)); fake recording via `RecordingPort` in T2, not mocked `getUserMedia` |

## Related

- [`testing.md`](testing.md) — hub and commands
- [`testing.md`](testing.md) — ports, registry smokes, shortened-lesson mount deps
