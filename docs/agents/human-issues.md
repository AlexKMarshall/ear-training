# Human onboarding issues — agent guide

How to publish **`ready-for-human`** issues from `/to-issues` (or triage) for contributors ramping up on the codebase.

Agent workflow: [`.agents/skills/to-issues/SKILL.md`](../../.agents/skills/to-issues/SKILL.md). Triage labels: [`triage-labels.md`](triage-labels.md).

## When to use

Use **`ready-for-human`** (not `ready-for-agent`) when the work is a good **first contributor PR**:

- Presentation or copy aligned with product language
- Small, verifiable UI changes with clear manual checks
- Exercises that teach repo conventions (`CONTEXT.md`, JSX rules, browser tests) without deep architecture

Reserve **`ready-for-agent`** for fully specified AFK work (refactors, new behavior with many seams, bugs needing repro).

## What goes in the issue body

Human issues are **outcome contracts**, not implementation plans.

| Include | Omit |
|---------|------|
| Goal — one short paragraph on learner-visible or product outcome | File paths, module names, function names |
| **Acceptance criteria** — concrete, testable checkboxes | Step-by-step how to implement |
| **Domain context** (optional) — links to glossary / agent docs | Code snippets (they go stale) |
| **Blocked by** — slice dependencies | “Open X and edit Y” |
| **Out of scope** (optional) — adjacent work to leave alone | Agent briefs with type signatures |

Contributors explore the codebase and choose their own approach. Criteria define **done**; docs hint **where to learn vocabulary and conventions**.

## Issue body template

```markdown
## Parent

#NNN (slice issues only)

## Goal

One short paragraph: what should be true for the learner or product after this ships. Behavioral, not procedural.

## Domain context

Optional links only — e.g. [`CONTEXT.md`](../../CONTEXT.md) terms, [`docs/agents/jsx.md`](jsx.md), [`CONTRIBUTING.md`](../../CONTRIBUTING.md).

## Acceptance criteria

- [ ] …
- [ ] …

## Blocked by

None — can start immediately.

Or: #NNN — reason in one line.

## Out of scope

- … (optional)
```

Do **not** use the AFK **`What to build`** section for human slices — it invites implementation detail. If you need a heading, **Goal** is enough.

## Epics and closing

Same closing rules as AFK epics — see [`pull-requests.md`](pull-requests.md#closing-github-issues-from-a-pr):

- One PR per slice: each PR `Closes` its slice; the **final slice PR also `Closes` the parent epic**.
- One PR for everything: `Closes` parent and all children.

Add a **parent epic comment** with slice links, suggested onboarding order, and the closing rule (mirror [`to-issues` step 6](../../.agents/skills/to-issues/SKILL.md)).

## Labels

Apply **`enhancement`** (or **`bug`**) plus **`ready-for-human`**. Never both `ready-for-agent` and `ready-for-human`.
