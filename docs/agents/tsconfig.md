# TypeScript config — agent guide

This repo extends **[Matt Pocock's bundler + DOM baseline](https://www.totaltypescript.com/tsconfig-cheat-sheet)** via the pinned devDependency `@total-typescript/tsconfig`. Upgrades to that package are **explicit PRs only** — do not bump it casually in feature work.

## Files

| File | Role |
|------|------|
| [`tsconfig.json`](../../tsconfig.json) | IDE + `npm run typecheck` — `src/`, `tests/`, `vite.config.ts` |
| [`tsconfig.build.json`](../../tsconfig.build.json) | `tsc` emit check before Vite build — `src/` only |

Both extend the same compiler baseline; build narrows `include` to shipped code.

## Base preset

```json
"extends": "@total-typescript/tsconfig/bundler/dom"
```

That preset enables (among others):

- **`strict`** — full strict type-checking
- **`noUncheckedIndexedAccess`** — index reads are `T | undefined`
- **`noImplicitOverride`** — explicit `override` on subclass members
- **`module: "preserve"`**, **`noEmit: true`** — bundler handles emit (Vite)
- **`target: "es2022"`**, **`lib`: es2022 + DOM** — runs in modern browsers
- **`verbatimModuleSyntax`**, **`isolatedModules`**, **`moduleDetection: "force"`**

Lint and format stay in **Biome** — not `tsc` (see epic #138 decisions).

## Project overrides

Each row is set in [`tsconfig.json`](../../tsconfig.json) `compilerOptions` because the Pocock base does not include it or we need a repo-specific value.

| Option | Value | Why |
|--------|-------|-----|
| `moduleResolution` | `"bundler"` | Vite resolves `.ts` extension imports the way the bundler does |
| `allowImportingTsExtensions` | `true` | Source imports use `.ts` / `.tsx` suffixes (repo convention) |
| `types` | `["vite/client", "node"]` | `vite/client` for `import.meta` and env; `node` for `vite.config.ts` (`__dirname`, `node:path`) |
| `jsx` | `"preserve"` | Solid compiles JSX via `vite-plugin-solid`, not `tsc` |
| `jsxImportSource` | `"solid-js"` | Solid JSX factory |
| `erasableSyntaxOnly` | `true` | Reject TS syntax that cannot be erased (enums, namespaces with runtime) — keeps the graph bundler-safe |

We **do not** override `strict`, `noUncheckedIndexedAccess`, or other strictness flags from the base — that is intentional (closes **TD-016**).

## When to change this doc

- Adding or removing a `compilerOptions` override in `tsconfig.json`
- Bumping `@total-typescript/tsconfig` (document any new base flags and whether we keep or override them)
- Splitting test vs production compiler settings beyond `tsconfig.build.json`

## Related

- Human onboarding: [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md)
- Agent hub: [`../../AGENTS.md`](../../AGENTS.md)
- Tech debt (closed **TD-016**): [`../tech-debt.md`](../tech-debt.md)
