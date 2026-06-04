---
name: write-jsx
description: Solid JSX conventions for this repo — extract reused markup as function components, never assign JSX to local variables. Use when editing or adding files under src/ui/, writing Solid components, refactoring JSX, or reviewing UI presentation code.
---

# Write JSX

Authoritative detail: [`docs/agents/jsx.md`](../../../docs/agents/jsx.md).

## Rule (one line)

**Never** `const x = <…>…</…>` (or `let`) inside a component; **always** extract `function X(props) { return <…>; }` and render `<X … />`.

## Quick check

Before finishing a JSX change:

- [ ] No local variable holds a JSX tree for reuse or interpolation
- [ ] Shared markup across branches → named function component with `props`
- [ ] Non-JSX locals (`stateClass`, `href`, labels) may stay as `const`

## Bad → good (minimal)

**Bad:**

```tsx
const inner = (
  <>
    <span class="path-node-title">{title}</span>
    <span class="path-node-status">{status}</span>
  </>
);
return <div>{inner}</div>;
```

**Good:**

```tsx
function PathNodeContent(props: { title: string; status: string }) {
  return (
    <>
      <span class="path-node-title">{props.title}</span>
      <span class="path-node-status">{props.status}</span>
    </>
  );
}
return <div><PathNodeContent title={title} status={status} /></div>;
```

Full before/after from `PathNode` / `PathNodeContent`: see [`docs/agents/jsx.md`](../../../docs/agents/jsx.md).

## When refactoring

1. Find `const … = (` or `const … = <` holding JSX.
2. Move tree to `function …(props)`; pass data via `props`, not closures.
3. Replace `{variable}` with `<Component … />` at each use site.
