# Contributing

Thanks for helping improve Ear Training. This is a static TypeScript site (Vite + SolidJS + Vitest).

## Setup

```bash
git clone https://github.com/AlexKMarshall/ear-training.git
cd ear-training
npm ci
npm run dev
```

Open the URL Vite prints (localhost). Microphone exercises need **localhost** in dev or **HTTPS** in production.

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local dev server |
| `npm test` | Unit tests (Vitest, Node) |
| `npm run test:browser` | Browser/UI tests (Playwright) — run when changing `src/ui/` |
| `npm run lint` | Biome lint + format check (same as CI) |
| `npm run lint:fix` | Apply safe Biome fixes and organize imports |
| `npm run format` | Format in-scope files (`src/`, `tests/`, `vite.config.ts`) |
| `npm run typecheck` | TypeScript — `src/`, `tests/`, `vite.config.ts` |
| `npm run build` | Production build |

**Formatting:** JS/TS/JSX uses Biome with **semicolon-free** style (`semicolons: "asNeeded"`). CI enforces lint and format — there are **no pre-commit hooks**. Optional: install the [Biome VS Code extension](https://biomejs.dev/reference/vscode/) and enable format-on-save.

## Editing UI

Presentation lives under `src/ui/` (Solid JSX). Before opening a PR that touches UI:

1. [`docs/agents/solid-pitfalls.md`](docs/agents/solid-pitfalls.md) — React→Solid footguns (reactivity, props, effects)
2. [`docs/agents/jsx.md`](docs/agents/jsx.md) — repo conventions (extract components; no JSX locals)

Agents and deeper guides: [`AGENTS.md`](AGENTS.md).

## Pull requests

- One logical change per PR; keep diffs focused.
- Run `npm run lint`, `npm run typecheck`, and `npm test` before pushing. Add `npm run test:browser` for UI changes.
- CI must be green before merge — see [`.github/workflows/ci.yml`](.github/workflows/ci.yml).
- PR description and test plan: [`docs/agents/pull-requests.md`](docs/agents/pull-requests.md).

Product direction: [`docs/roadmap.md`](docs/roadmap.md). Known architecture debt: [`docs/tech-debt.md`](docs/tech-debt.md).
