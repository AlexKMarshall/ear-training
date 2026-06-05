# Hydrate attempt history once at the practice-mode page mount

Planner-backed practice modes need synchronous reads of **attempt history** for session planner draws, while persistence stays async via `HistoryPort`. Today each `*-session.ts` module wraps the port in an identical in-memory cache that fire-and-forgets `getAllAttempts()`, even though `mountPracticeModePage` already awaits history for unlock checks. That double-load lets the first `prepareExercise` run on an empty cache (TD-011).

We will introduce one `SessionHistoryCache` in `src/history/session-cache.ts`. **`mountPracticeModePage`** is the single hydration point: load once (or trust a caller-supplied cache), seed with `initialRecords`, and pass `sessionHistory` downstream via `MountDeps`. Interval, scale-degree, and chord session modules keep their `prepare*Exercise` draw logic and thin `resolve*Session` helpers, but **require** `deps.sessionHistory` — no fallback cache creation. Persistence for **attempt scored** continues through `sessionHistory.historyPort`.

## Considered options

- **Per-family caches with `ready: Promise<void>`** — fixes the race but keeps a redundant second fetch on every page load; unlock and planner still see different hydration contracts.
- **Fallback `createSessionHistoryCache(deps.history)` inside `resolve*Session`** — preserves old test call sites but leaves fire-and-forget on any path that bypasses the page mount.
- **`src/session/` for the cache module** — rejected; the seam wraps `HistoryPort` and serves unlock, persistence, and planner alike — a history concern, not planner logic.

## Consequences

- Production practice modes must hydrate through `mountPracticeModePage` (or equivalent wiring that sets `sessionHistory` before registry mounts run).
- Direct mount tests pass `sessionHistory` explicitly, e.g. via `createTestSessionHistory` in `tests/browser/helpers/mount.ts` (test-only sugar over `createSessionHistoryCache` with `initialRecords`).
- Implementation PR should add Node unit tests for the cache interface and remove TD-005 / TD-011 from `docs/tech-debt.md`.
