# JSX — agent guide

Conventions for **Solid JSX** in `src/ui/` (and any future JSX). Aligns with **component-based presentation** in [`CONTEXT.md`](../../CONTEXT.md).

## Rule

**Do not assign JSX to a local variable inside a component or function.** Extract a named function component instead.

| Do | Don't |
|----|-------|
| `function PathNodeContent(props) { return (<>…</>); }` then `<PathNodeContent … />` | `const inner = (<>…</>);` then `{inner}` in multiple branches |
| Return JSX directly from the parent | Store a JSX tree in `const` / `let` to reuse |

Plain values (`const stateClass = "…"`, `const href = format…()`) stay as variables. Only **element trees** (JSX) are extracted to components.

## Why

- Reused markup is a real **component** with props, not an anonymous blob in a closure.
- Easier to read diffs, name, and test presentation separately.
- Matches the direction in TD-017: incremental component-based UI inside page mounts.

## Example (from `src/ui/home.tsx`)

`PathNode` rendered the same inner markup in a locked `<div>` and an `<a>`. The fix was `PathNodeContent`, not a local `inner` variable.

**Bad** — JSX assigned to a variable, interpolated twice:

```tsx
function PathNode(props: { step: CurriculumLesson; records: readonly AttemptRecord[] }) {
  const { title, subtitle } = getPathNodeLabels(props.step);
  const state = getPathNodeState(props.step, props.records);
  const status = formatPathNodeStatus(props.step, props.records);
  const stateClass = pathNodeStateClass(state);

  const inner = (
    <>
      <span class="path-node-title">{title}</span>
      <span class="path-node-subtitle">{subtitle}</span>
      <span class="path-node-status">{status}</span>
    </>
  );

  if (state === "locked") {
    return (
      <div class={`path-node ${stateClass}`} data-path-node={state} aria-disabled="true">
        {inner}
      </div>
    );
  }

  return (
    <a href={formatPathNodeHref(props.step)} class={`path-node ${stateClass}`}>
      {inner}
    </a>
  );
}
```

**Good** — shared tree is its own component; parent only chooses wrapper:

```tsx
function PathNode(props: { step: CurriculumLesson; records: readonly AttemptRecord[] }) {
  const state = getPathNodeState(props.step, props.records);
  const stateClass = pathNodeStateClass(state);

  if (state === "locked") {
    return (
      <div class={`path-node ${stateClass}`} data-path-node={state} aria-disabled="true">
        <PathNodeContent step={props.step} records={props.records} />
      </div>
    );
  }

  return (
    <a href={formatPathNodeHref(props.step)} class={`path-node ${stateClass}`}>
      <PathNodeContent step={props.step} records={props.records} />
    </a>
  );
}

function PathNodeContent(props: {
  step: CurriculumLesson;
  records: readonly AttemptRecord[];
}) {
  const { title, subtitle } = getPathNodeLabels(props.step);
  const status = formatPathNodeStatus(props.step, props.records);

  return (
    <>
      <span class="path-node-title">{title}</span>
      <span class="path-node-subtitle">{subtitle}</span>
      <span class="path-node-status">{status}</span>
    </>
  );
}
```

## Naming and placement

- Name after **what** it renders (`PathNodeContent`, `LessonSummaryPanel`), not `Inner` / `Content` / `Markup`.
- Colocate in the same file as the parent until reuse across mounts justifies `src/ui/components/` (or similar).
- Use a `props` object; avoid closing over parent locals when props can carry the data.

## `.map()` and conditionals

- **Single-use, trivial JSX** in `return` or a one-line branch: inline is fine.
- **Reused** fragment across branches: extract a component (as above).
- **`.map()` callback** that grows beyond a trivial single element: extract `function Row(props) { … }` and use `<Row … />` in the map.

## Still allowed

- `return (<section>…</section>)` — JSX is the return value, not a stored variable.
- Imperative DOM in non-JSX mounts until migrated (see TD-017); this rule applies when writing JSX.

## Related

- Solid reactivity and React footguns: [`solid-pitfalls.md`](solid-pitfalls.md) — props, effects, `<For>` vs `.map()`; this doc is **repo JSX shape** only
- Domain: [`CONTEXT.md`](../../CONTEXT.md) — *Presentation implementation*
- Skill: [`.agents/skills/write-jsx/SKILL.md`](../../.agents/skills/write-jsx/SKILL.md)
