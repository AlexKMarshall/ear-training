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

1. **Implementation PR(s)** — Code, config, tests, or agent docs that enable later steps. Order dependencies explicitly (e.g. process guide before CI workflow). Middle PRs may update the roadmap that matches their scope (e.g. testing-roadmap when only infra lands), but must not leave the other roadmap claiming the old world.
2. **Roadmap sync (required)** — Before the plan is complete, **every** status roadmap must reflect shipped reality:
   - [`docs/roadmap.md`](../roadmap.md) — product / current-state table, testing summary, gap matrix, build order
   - [`docs/testing-roadmap.md`](../testing-roadmap.md) — test phases, CI, coverage tables
   - Any additional `*roadmap*` files named in the plan

   Do this in the **last** PR of the sequence (implementation or docs-only), **after** the behavior is on `main` (e.g. do not mark CI “Done” until CI has run green on `main`). A dedicated final docs-only PR is fine when implementation PRs already merged without a full sync.

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

## Final step: roadmap sync (required)

After the **last** PR in the plan is merged, confirm **all** applicable roadmaps were updated (default: both [`docs/roadmap.md`](../roadmap.md) and [`docs/testing-roadmap.md`](../testing-roadmap.md)):

| Check | Action |
|-------|--------|
| **All roadmaps** | Product and testing roadmaps stay consistent with each other and with `main` (no “T0 next” in one file and “T0 Done” in another). |
| **New status** | Mark completed items (e.g. Todo → Done). |
| **Obsolete** | Remove or revise wording that is no longer true (e.g. “no browser tests” after T0 ships). |
| **Changed** | Align descriptions with shipped behavior (commands, CI steps, file paths). |
| **Unlocked** | Note what work is unblocked next (e.g. T1 after T0). |
| **Plan table** | Mark all PR rows `merged`; archive or close the plan if appropriate. |

If an earlier PR updated only one roadmap, the last PR (or a follow-up docs PR) must bring the rest in line before calling the plan done.

## Related

- Single PRs: [`pull-requests.md`](pull-requests.md)
- Product roadmap: [`docs/roadmap.md`](../roadmap.md)
- Testing phases: [`docs/testing-roadmap.md`](../testing-roadmap.md)
- Agent entry point: [`AGENTS.md`](../../AGENTS.md)
