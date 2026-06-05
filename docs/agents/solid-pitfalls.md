# Solid pitfalls — agent guide

React→Solid mental model for contributors editing **`src/ui/`**. This repo uses **Biome** for lint/format — not `eslint-plugin-solid` — so these guardrails are documented here instead of enforced by a Solid-specific linter.

**Repo JSX conventions** (extract components, no JSX locals) live in [`jsx.md`](jsx.md). This doc covers **framework footguns** that trip up React developers.

Official depth: [Solid docs — introduction](https://docs.solidjs.com/), [reactivity](https://docs.solidjs.com/concepts/intro-to-reactivity), [components](https://docs.solidjs.com/concepts/components).

---

## Components run once

In React, the function body re-runs on every render. In Solid, the component function runs **once** to set up reactive subscriptions; JSX and effects re-run only where their dependencies change.

| React habit | Solid reality |
|-------------|---------------|
| `if (loading) return <Spinner />` re-evaluates every render | Early return runs **once** at mount — fine for static structure, wrong if `loading` should stay reactive |
| Put hooks before any `return` | `createEffect` / `createMemo` must run unconditionally on every component setup — no hook-after-return |
| Derive UI from props inline | Props and signals read in JSX stay reactive; values computed once at top level do not update |

**Bad** — `visible` is read once; toggling the parent prop does not hide the panel:

```tsx
function Panel(props: { visible: boolean; title: string }) {
  if (!props.visible) return null

  return (
    <section class="card">
      <h2>{props.title}</h2>
    </section>
  )
}
```

**Good** — condition stays inside reactive JSX (or use `<Show>`):

```tsx
import { Show } from "solid-js"

function Panel(props: { visible: boolean; title: string }) {
  return (
    <Show when={props.visible}>
      <section class="card">
        <h2>{props.title}</h2>
      </section>
    </Show>
  )
}
```

---

## Do not destructure props (or signals)

Destructuring `props` or a signal's return value **breaks reactivity** — you capture a snapshot at setup time.

**Bad:**

```tsx
function Greeting(props: { name: string }) {
  const { name } = props
  return <p>Hello, {name}</p>
}
```

**Good** — read through `props` (or wrap in a function that reads `props.name` inside JSX):

```tsx
function Greeting(props: { name: string }) {
  return <p>Hello, {props.name}</p>
}
```

Same rule for `const [count, setCount] = createSignal(0)` — use `count()` in JSX, not `const c = count()` at the top level.

---

## Read reactive values inside tracked scopes

Signals, props, and memos only **track** when read inside:

- JSX expressions (`{props.x}`, `{signal()}`)
- `createEffect`, `createMemo`, and other reactive primitives
- Callbacks passed to reactive helpers (`on(...)`)

**Bad** — `label` is computed once; it never updates when `props.status` changes:

```tsx
function StatusLine(props: { status: string }) {
  const label = formatStatus(props.status)
  return <p class="status">{label}</p>
}
```

**Good** — read the prop where Solid can subscribe:

```tsx
function StatusLine(props: { status: string }) {
  return <p class="status">{formatStatus(props.status)}</p>
}
```

If formatting is expensive, use `createMemo(() => formatStatus(props.status))` and render `{memo()}` in JSX.

---

## `createEffect` has no dependency array

Solid auto-tracks every reactive read inside the effect. Do **not** pass a React-style dependency list.

**Bad** (React):

```tsx
createEffect(() => {
  console.log(props.id)
}, [props.id])
```

**Good** (Solid):

```tsx
createEffect(() => {
  console.log(props.id)
})
```

Re-run only what you intend: any reactive read in the effect body becomes a dependency.

---

## JSX attributes: `class`, not `className`

Solid uses DOM property names. This repo formats with Biome **`semicolons: "asNeeded"`** (semicolon-free).

| React | Solid (this repo) |
|-------|-------------------|
| `className="card"` | `class="card"` |
| `htmlFor="id"` | `for="id"` |
| `onClick={handler}` | `onClick={handler}` (camelCase events are fine) |

---

## Prefer `<For>` over `.map()` for reactive lists

`.map()` in JSX works but creates a new array of elements every update and loses keyed fine-grained updates. Prefer `<For each={…}>` when the list or its items are reactive.

**OK** — static curriculum list, items rarely change (see `src/ui/home.tsx`):

```tsx
{CURRICULUM_LESSONS.map((step) => (
  <PathNode step={step} records={props.records} />
))}
```

**Better** — list or row state updates independently:

```tsx
import { For } from "solid-js"

<For each={props.items}>
  {(item) => <Row item={item()} />}
</For>
```

Use a **keyed** callback form when rows need stable identity across reordering — see [Solid `<For>`](https://docs.solidjs.com/reference/components/for).

---

## Conditionals: `<Show>` / `<Switch>`, not one-shot `if`

For reactive visibility, prefer control-flow components over branching that runs only at setup.

```tsx
import { Match, Switch } from "solid-js"

<Switch>
  <Match when={props.phase === "question"}>
    <QuestionPanel ui={props.ui} />
  </Match>
  <Match when={props.phase === "summary"}>
    <SummaryPanel summary={props.summary} />
  </Match>
</Switch>
```

`<Show when={…} keyed>` remounts children when the `when` value changes — useful when child state must reset (see `src/ui/identify-test-view.tsx`).

---

## No React hooks or patterns

| React | Solid |
|-------|-------|
| `useState` | `createSignal` |
| `useEffect` | `createEffect` / `onMount` / `onCleanup` |
| `useMemo` | `createMemo` |
| `useRef` | plain variable or `let` in component scope |
| `useContext` | `createContext` / `useContext` |
| `{condition && <X />}` | prefer `<Show when={condition}>` for reactive conditions |

Do not install or assume `eslint-plugin-react-hooks` rules — they do not apply.

---

## How this repo uses Solid today

Exercise pages are mostly **presentational components**: imperative mount code (`src/ui/*-test.ts`, `stats.ts`, `home.tsx` `mountHome`) owns state and passes plain props into JSX views. When adding interactivity:

1. Keep reactive state in signals/effects at the mount layer **or** inside the component with correct tracking.
2. Follow [`jsx.md`](jsx.md) for shared markup — extract function components, never assign JSX to locals.
3. Run `npm run test:browser` when changing `src/ui/` — see [`testing.md`](testing.md).

---

## Related

- Repo JSX conventions: [`jsx.md`](jsx.md)
- Human onboarding: [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md)
- Skill: [`.agents/skills/write-jsx/SKILL.md`](../../.agents/skills/write-jsx/SKILL.md)
