---
name: to-issues
description: Break a plan, spec, or PRD into independently-grabbable issues on the project issue tracker using tracer-bullet vertical slices. Use when user wants to convert a plan into issues, create implementation tickets, or break down work into issues.
---

# To Issues

Break a plan into independently-grabbable issues using vertical slices (tracer bullets).

The issue tracker and triage label vocabulary should have been provided to you — run `/setup-matt-pocock-skills` if not.

## Process

### 1. Gather context

Work from whatever is already in the conversation context. If the user passes an issue reference (issue number, URL, or path) as an argument, fetch it from the issue tracker and read its full body and comments.

### 2. Explore the codebase (optional)

If you have not already explored the codebase, do so to understand the current state of the code. Issue titles and descriptions should use the project's domain glossary vocabulary, and respect ADRs in the area you're touching.

### 3. Draft vertical slices

Break the plan into **tracer bullet** issues. Each issue is a thin vertical slice that cuts through ALL integration layers end-to-end, NOT a horizontal slice of one layer.

Slices may be 'HITL' or 'AFK'. HITL slices require human interaction, such as an architectural decision, a design review, or **human onboarding** (first PRs on the codebase). AFK slices can be implemented and merged without human interaction. Prefer AFK over HITL where possible.

**Human onboarding slices** use the **`ready-for-human`** triage label and a different issue body — see [Human onboarding issues](../../docs/agents/human-issues.md). Issue bodies are **acceptance criteria + optional doc links only**; do not include file paths, code snippets, or implementation steps.

<vertical-slice-rules>
- Each slice delivers a narrow but COMPLETE path through every layer (schema, API, UI, tests)
- A completed slice is demoable or verifiable on its own
- Prefer many thin slices over few thick ones
</vertical-slice-rules>

### 4. Quiz the user

Present the proposed breakdown as a numbered list. For each slice, show:

- **Title**: short descriptive name
- **Type**: HITL / AFK
- **Suggested branch**: `<prefix>/<kebab-slug>` per [`issue-tracker.md`](../../../docs/agents/issue-tracker.md#suggested-branch-names)
- **Blocked by**: which other slices (if any) must complete first
- **User stories covered**: which user stories this addresses (if the source material has them)

Ask the user:

- Does the granularity feel right? (too coarse / too fine)
- Are the dependency relationships correct?
- Should any slices be merged or split further?
- Are the correct slices marked as HITL and AFK?

Iterate until the user approves the breakdown.

### 5. Glossary documentation PR (before implementation slices)

If planning updated **`CONTEXT.md`**, land glossary changes on **`main` in a documentation PR before** the first implementation slice issue is picked up. Either:

- Open that docs PR yourself (recommended title: `Document <initiative> glossary (CONTEXT.md)`), or
- Publish a **slice 0** issue whose only deliverable is merging `CONTEXT.md` (and any ADRs) with the agent-workflow note in `docs/agents/domain.md`.

Implementation slice issues should reference the merged glossary PR or slice 0 in **Blocked by** when glossary terms are required. See [`docs/agents/domain.md`](../../../docs/agents/domain.md#glossary-pr-before-implementation).

### 6. Publish the issues to the issue tracker

For each approved slice, publish a new issue to the issue tracker. Use the matching body template below. Publish with the correct triage label unless instructed otherwise:

| Slice type | Triage label | Body template |
|------------|--------------|---------------|
| AFK (default) | `ready-for-agent` | AFK template below |
| Human onboarding / HITL | `ready-for-human` | [Human template](../../docs/agents/human-issues.md#issue-body-template) — **no implementation detail** |

Publish issues in dependency order (blockers first) so you can reference real issue identifiers in the "Blocked by" field.

Every **slice** issue must include **Suggested branch** (epics and slice-0 glossary-only issues omit it). Naming: [`docs/agents/issue-tracker.md`](../../../docs/agents/issue-tracker.md#suggested-branch-names).

<issue-template>
## Parent

A reference to the parent issue on the issue tracker (if the source was an existing issue, otherwise omit this section).

## Suggested branch

`feat/short-descriptive-slug`

## What to build

A concise description of this vertical slice. Describe the end-to-end behavior, not layer-by-layer implementation.

Avoid specific file paths or code snippets — they go stale fast. Exception: if a prototype produced a snippet that encodes a decision more precisely than prose can (state machine, reducer, schema, type shape), inline it here and note briefly that it came from a prototype. Trim to the decision-rich parts — not a working demo, just the important bits.

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Blocked by

- A reference to the blocking ticket (if any)

Or "None - can start immediately" if no blockers.

</issue-template>

For **`ready-for-human`** slices, do **not** use the AFK template. Use the human template in [`docs/agents/human-issues.md`](../../docs/agents/human-issues.md): **Goal**, optional **Domain context** (doc links only), **Suggested branch**, **Acceptance criteria**, **Blocked by**. No **What to build**, no paths, no code.

Do NOT close or modify any parent issue.

### Linking child issues when work merges

Child issues are for **planning and grabbing**; GitHub does not know they belong to a parent unless a PR closes them explicitly. Do not rely on *Implements #46–#50* or *Parent #45* — those do not auto-close.

When publishing, add a **parent issue comment** that states:

1. **Glossary first** — merge the glossary documentation PR (or slice 0) on `main` before starting implementation slices, when `CONTEXT.md` was updated during planning.
2. **Slice table** — order, issue links, titles, and **Suggested branch** per slice (epic body does not duplicate branches).
3. **Closing rule** (copy from [`docs/agents/pull-requests.md`](../../../docs/agents/pull-requests.md#closing-github-issues-from-a-pr)):

| Delivery | PR `Closes` lines |
|----------|-------------------|
| **One PR** for the whole breakdown | Parent epic **and every** child slice issue |
| **Separate PR per slice** | Each PR: its child slice only; **final slice PR: child slice + parent epic** (required, not optional) |

Identify which child is the **final slice** (no other slice blocked only on it) when writing the parent comment so implementers know which PR must close the epic.

See [`docs/agents/pull-requests.md`](../../../docs/agents/pull-requests.md#closing-github-issues-from-a-pr).
