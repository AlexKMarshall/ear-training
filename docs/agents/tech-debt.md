# Tech debt — agent guide

How to track, pay down, and document **structural and tooling debt** in this repo.

## Tech debt vs other docs

| Question | Where to look |
|----------|----------------|
| What should we build next? | [`docs/roadmap.md`](../roadmap.md) |
| How to write tests? | [`testing.md`](testing.md) |
| What makes the codebase hard to change? | [`docs/tech-debt.md`](../tech-debt.md) — **open debt table** |
| How do I open a PR? | [`pull-requests.md`](pull-requests.md) |

**Rule:** Do not duplicate product plans or testing debt rows here. Tech debt is about **architecture, module boundaries, contracts, and tooling** — not missing test cases (unless the missing tests are a symptom of an untestable boundary; then file both).

---

## When to add a row

Add or update [`docs/tech-debt.md`](../tech-debt.md) when:

1. **Implementing a feature (single or multi-PR)** — you hit a boundary problem (duplicate logic, leaky type, two sources of truth) that is **out of scope** for the current PR but should be tracked.
2. **Reviewing or exploring** — you find debt on `main` that would affect roadmap work and is not already listed.
3. **Closing debt** — see [When to remove or mark done](#when-to-remove-or-mark-done).

Do **not** add speculative rows for code that does not exist yet. If a feature PR introduces new debt (e.g. a third copy of history-cache), add the row in that PR or a immediate follow-up docs PR.

Each row needs: **ID** (`TD-###`), **priority** (P0–P2), **problem**, **roadmap impact**, and **suggested direction**.

---

## Bringing debt into scope

When a feature PR touches an area with open debt:

1. Check the [open table](../tech-debt.md#open-tech-debt) for related **P0** / **P1** items (same module or roadmap milestone).
2. If paying down the debt **reduces risk or diff size** for the feature, include it in the PR scope and say so in the PR summary.
3. If it would **expand scope unsafely**, leave the row open and link to the TD ID in **Downstream** (see [`pull-requests.md`](pull-requests.md)).

Examples:

- **Session planner work** — consider TD-003, TD-005, TD-007, TD-008 in scope.
- **New identify exercise** — TD-001, TD-002, TD-006 are likely blockers; do not add another one-off identify mount without a plan.
- **Tooling PR** — TD-013 / TD-014 / TD-015 can be one focused PR series.

---

## When to remove or mark done

On every PR that **closes** tech debt:

1. Update [`docs/tech-debt.md`](../tech-debt.md): remove the row from **Open tech debt** or move it to **Closed tech debt** with PR link and brief note.
2. Mention the closed **TD-###** ID(s) in the PR summary.
3. If the fix changes architectural direction on the product roadmap, also update [`docs/roadmap.md`](../roadmap.md) (e.g. "Unified ExerciseDefinition — still TODO" → done).

Multi-PR plans: sync the tech debt table in the **last** PR that closes debt for that plan, same as [testing debt sync](multi-pr-plans.md#final-step-roadmap-sync-required). See [`multi-pr-plans.md`](multi-pr-plans.md).

---

## PR checklist (copy as needed)

```markdown
### Tech debt

- [ ] Checked [`docs/tech-debt.md`](../tech-debt.md) for related open items
- [ ] Added new TD row(s) if this PR discovered debt out of scope
- [ ] Closed TD row(s): TD-___ (if applicable)
- [ ] Brought related debt into scope: TD-___ (if applicable)
```

---

## Related

- Registry: [`docs/tech-debt.md`](../tech-debt.md)
- Pull requests: [`pull-requests.md`](pull-requests.md)
- Multi-PR plans: [`multi-pr-plans.md`](multi-pr-plans.md)
- Testing: [`testing.md`](testing.md)
- Product roadmap: [`docs/roadmap.md`](../roadmap.md)
