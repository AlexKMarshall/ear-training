# Agent guide — Ear Training

Browser-based ear training (static site, TypeScript, Vite, Vitest). Product direction: [`docs/roadmap.md`](docs/roadmap.md). Testing direction: [`docs/testing-roadmap.md`](docs/testing-roadmap.md).

## Documentation for agents

| Topic | Doc |
|-------|-----|
| **Opening pull requests** | [`docs/agents/pull-requests.md`](docs/agents/pull-requests.md) |
| **Multi-PR plans** | [`docs/agents/multi-pr-plans.md`](docs/agents/multi-pr-plans.md) |
| **Testing strategy & phases** | [`docs/testing-roadmap.md`](docs/testing-roadmap.md) |

Read the pull-request guide before creating or updating a PR description, especially the **test plan** sections and naming for unchanged-behavior checks.

## Quick commands

```bash
npm test          # unit tests
npm run dev       # local dev server
npm run build     # production build
```

## Conventions

- Prefer small, focused PRs; one logical change per PR unless the user asks to combine steps.
- Match existing code style in `src/`; avoid drive-by refactors.
- Do not create git commits unless the user explicitly asks.
