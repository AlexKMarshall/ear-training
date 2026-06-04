# Multi-PR plans — agent guide

How to execute work that is split across several merge-gated pull requests. Use with [`pull-requests.md`](pull-requests.md) for per-PR titles, bodies, and test plans.

## When to use

Use a multi-PR plan when work is intentionally split across multiple PRs—for example features, infrastructure (CI, deploy), curriculum milestones, or roadmap/status updates that should land after implementation is on `main`.

Single logical changes still belong in one PR; see [`pull-requests.md`](pull-requests.md).

## Plan shape

Every multi-PR plan should include a **PR status table** with one row per PR:

| Column | Meaning |
|--------|---------|
| **PR** | Number or label (1, 2, 3, …) |
| **Branch** | Suggested branch name |
| **Status** | `pending` \| `in review` \| `merged` \| `blocked` |
| **Contents** | What that PR includes (files, scope); what it must *not* include |

Keep the table accurate. Update status only after the user confirms a PR is **merged** on GitHub.

## Typical PR sequence

0. **Glossary documentation PR (when planning updated `CONTEXT.md`)** — Merge `CONTEXT.md` (and any new ADRs) on `main` **before** the first implementation PR. See [`domain.md`](domain.md#glossary-pr-before-implementation). Implementation agents assume the committed glossary.
1. **Implementation PR(s)** — Code, config, tests, or agent docs that enable later steps. Order dependencies explicitly (e.g. process guide before CI workflow). **Tests for new behavior ship in the same PR as that behavior** — not as forward entries in the testing debt doc.
2. **Roadmap sync (required)** — Before the plan is complete, sync docs to `main`:
   - [`docs/roadmap.md`](../roadmap.md) — remove shipped backlog items; add or reprioritize remaining planned work
   - [`docs/tech-debt.md`](../tech-debt.md) — **only if** the plan added or paid down debt (remove rows when closed; add new TD rows)
   - Any additional `*roadmap*` files named in the plan

   Do this in the **last** PR of the sequence (implementation or docs-only), **after** the behavior is on `main`. A dedicated final docs-only PR is fine when implementation PRs already merged without a full sync.

The user may fold roadmap updates into the last implementation PR; if so, still run the **Final step: roadmap sync** checklist before calling the plan complete.

## Agent rules (per PR)

- **One PR per user instruction** — e.g. “make PR 2” means implement and open PR 2 only.
- **Merge gate** — Do not start PR N+1 until the user says PR N is **merged**.
- **After “merged”** — `git fetch origin main && git checkout main && git pull origin main`, update the plan’s PR table, report ready — **stop** until the user asks for the next PR.
- **No scope creep** — Do not pull in files or tasks from later PRs unless the user asks to combine.
- **Commits** — Only commit when the user asks; opening a PR for an approved slice implies permission to commit that slice’s files.
- **Per-PR mechanics** — Branch naming, title, body, test plan: [`pull-requests.md`](pull-requests.md).

## User responsibilities

- Review each PR and merge when satisfied.
- Verify checks when they exist (e.g. GitHub Actions after CI is added).
- Tell the agent which PR merged and when to continue (“PR 1 merged”, “make PR 2”).
- Optionally enable branch protection (e.g. require `ci` on `main`)—often manual, not in every plan.

## Where plans live

Plans may live in Cursor plan files, `docs/plans/`, or the chat thread. The PR status table should stay in sync with reality regardless of location.

## Per-PR mechanics

For each PR:

1. Sync `main` and branch from the suggested name (or a clear variant).
2. Implement **only** that row’s contents.
3. Verify per [`pull-requests.md`](pull-requests.md) (local commands; CI when it exists).
4. Push and open the PR; return the URL.
5. Do not push or merge unless the user asks.

Docs-only PRs: summary + “No runtime changes”; omit CI checkboxes until a workflow exists.

### GitHub issues (epic + slices)

When the plan maps to a **parent epic** and **child slice issues** from `/to-issues`, each PR `Closes` its slice issue; the **last PR in the sequence must also `Closes` the parent epic**. See [Closing GitHub issues from a PR](pull-requests.md#closing-github-issues-from-a-pr).

## Final step: roadmap sync (required)

After the **last** PR in the plan is merged:

| Check | Action |
|-------|--------|
| **Product roadmap** | [`docs/roadmap.md`](../roadmap.md) — shipped items removed from backlog; no stale “current state” prose |
| **Tech debt** | [`docs/tech-debt.md`](../tech-debt.md) — paid-down rows removed; new rows added if needed; omit if unchanged. |
| **Obsolete** | Remove wording that is no longer true (e.g. “no browser tests”). |
| **Plan table** | Mark all PR rows `merged`; archive or close the plan if appropriate. |

## Related

- Single PRs: [`pull-requests.md`](pull-requests.md)
- Product roadmap: [`docs/roadmap.md`](../roadmap.md)
- Testing: [`testing.md`](testing.md)
- Tech debt: [`docs/tech-debt.md`](../tech-debt.md)
- Agent entry point: [`AGENTS.md`](../../AGENTS.md)
