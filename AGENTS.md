# Agent guide — Ear Training

Browser-based ear training (static site, TypeScript, Vite, Vitest). Product direction: [`docs/roadmap.md`](docs/roadmap.md). Open **testing debt** (shipped behavior only): [`docs/testing-roadmap.md`](docs/testing-roadmap.md). How to write tests: [`docs/agents/testing.md`](docs/agents/testing.md).

## Documentation for agents

| Topic | Doc |
|-------|-----|
| **Opening pull requests** | [`docs/agents/pull-requests.md`](docs/agents/pull-requests.md) |
| **Multi-PR plans** | [`docs/agents/multi-pr-plans.md`](docs/agents/multi-pr-plans.md) |
| **Testing (agent guides)** | [`docs/agents/testing.md`](docs/agents/testing.md) |
| **Testing debt (gaps on `main`)** | [`docs/testing-roadmap.md`](docs/testing-roadmap.md) |

Read the pull-request guide before creating or updating a PR description, especially the **test plan** sections and **roadmap updates** ([`docs/roadmap.md`](docs/roadmap.md) for product; [`docs/testing-roadmap.md`](docs/testing-roadmap.md) only when closing or adding testing debt).

## Quick commands

```bash
npm test              # Vitest Node — unit tests
npm run test:browser  # Vitest browser — UI orchestration (Playwright)
npm run dev           # local dev server
npm run build         # production build
```

Run `npm run test:browser` when changing `src/ui/`, mount functions, or browser tests — see [`docs/agents/testing.md`](docs/agents/testing.md).

## CI

Every push to `main` and every pull request runs [GitHub Actions](.github/workflows/ci.yml): `npm test`, `npm run test:browser`, and `npm run build` on Node 22.

Do not claim tests pass on a PR without a green **CI** check on that PR.

## Conventions

- Prefer small, focused PRs; one logical change per PR unless the user asks to combine steps.
- Match existing code style in `src/`; avoid drive-by refactors.
- Do not create git commits unless the user explicitly asks.
