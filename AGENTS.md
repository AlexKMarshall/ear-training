# Agent guide — Ear Training

Browser-based ear training (static site, TypeScript, Vite, Vitest). Product direction: [`docs/roadmap.md`](docs/roadmap.md). How to write tests: [`docs/agents/testing.md`](docs/agents/testing.md). Open **tech debt** (architecture & tooling): [`docs/tech-debt.md`](docs/tech-debt.md).

## Documentation for agents

| Topic | Doc |
|-------|-----|
| **Opening pull requests** | [`docs/agents/pull-requests.md`](docs/agents/pull-requests.md) |
| **Multi-PR plans** | [`docs/agents/multi-pr-plans.md`](docs/agents/multi-pr-plans.md) |
| **Testing (agent guides)** | [`docs/agents/testing.md`](docs/agents/testing.md) |
| **JSX / Solid UI** | [`docs/agents/jsx.md`](docs/agents/jsx.md) |
| **Solid pitfalls (React→Solid)** | [`docs/agents/solid-pitfalls.md`](docs/agents/solid-pitfalls.md) |
| **Human contributing** | [`CONTRIBUTING.md`](CONTRIBUTING.md) |
| **Tech debt (architecture & tooling)** | [`docs/tech-debt.md`](docs/tech-debt.md) |
| **Tech debt (agent workflow)** | [`docs/agents/tech-debt.md`](docs/agents/tech-debt.md) |

Read the pull-request guide before creating or updating a PR description, especially the **test plan** sections and **roadmap updates** ([`docs/roadmap.md`](docs/roadmap.md) for product; [`docs/tech-debt.md`](docs/tech-debt.md) when closing or adding tech debt).

## Quick commands

```bash
npm test              # Vitest Node — unit tests
npm run test:browser  # Vitest browser — UI orchestration (Playwright)
npm run lint          # Biome — lint + format check (CI)
npm run lint:fix      # Biome — apply safe lint fixes + organize imports
npm run format        # Biome — format in-scope files
npm run typecheck     # tsc on src (same config as the IDE)
npm run knip:production  # dead shipped code (production entry points only)
npm run knip          # test helpers, devDependencies, tooling (full graph)
npm run dev           # local dev server
npm run build         # production build
```

Run `npm run test:browser` when changing `src/ui/`, mount functions, or browser tests — see [`docs/agents/testing.md`](docs/agents/testing.md).

**Dead code (knip):** Run both commands after config or import changes — same bar as typecheck before opening PRs. Do **not** use `knip --fix` — delete dead code manually and re-run tests. Cleanup order: `knip:production` first, then `knip`.

## CI

Every push to `main` and every pull request runs [GitHub Actions](.github/workflows/ci.yml): `npm run lint`, `npm run typecheck`, `npm run knip:production`, `npm run knip`, `npm test`, `npm run test:browser`, and `npm run build` on Node 22.

Do not claim tests pass on a PR without a green **CI** check on that PR.

## Conventions

- Prefer small, focused PRs; one logical change per PR unless the user asks to combine steps.
- Match existing code style in `src/`; avoid drive-by refactors.
- **JSX:** do not assign element trees to locals inside a component; extract a function component ([`docs/agents/jsx.md`](docs/agents/jsx.md)).
- Do not create git commits unless the user explicitly asks.

## Agent skills

### Issue tracker

Issues and PRDs live as [GitHub issues](https://github.com/AlexKMarshall/ear-training/issues) on this repo; use `gh` per `docs/agents/issue-tracker.md`.

### Triage labels

Five state roles use default label strings (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`); category roles `bug` and `enhancement`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md` (land glossary changes on `main` in a docs PR **before** implementation slices when planning updates `CONTEXT.md`).
