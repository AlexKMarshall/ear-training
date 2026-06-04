# Pull requests — agent guide

How to open and describe PRs in this repo. Intended for Cursor, Copilot, Claude Code, and other coding agents.

For work split across several merge-gated PRs (status table, merge gates, final roadmap-sync step), see [`multi-pr-plans.md`](multi-pr-plans.md).

## Before you open a PR

1. **Sync `main`** — `git fetch origin main && git checkout main && git pull origin main`, then branch.
2. **Scope** — One logical change per PR. Do not bundle unrelated refactors or sneak ahead on a multi-step plan unless the user asks to combine.
3. **Verify** — Run `npm test` (and `npm run build` if the change touches build, routes, or static assets). When browser tests exist, run `npm run test:browser` for PRs that touch `src/ui/` or mount/orchestration code — see [`docs/agents/testing.md`](testing.md). Confirm GitHub Actions **CI** is green on the PR. Do not claim tests pass without running them locally and without a green CI check.
4. **Commits** — Only commit when the user asks. Use clear messages focused on *why* (1–2 sentences).
5. **Roadmaps** — Update [`docs/roadmap.md`](../roadmap.md) when planned product work is added, removed, or reprioritized. Update [`docs/tech-debt.md`](../tech-debt.md) when the PR **adds or pays down** tech debt (see [Tech debt registry](#tech-debt-registry)). New features include their own tests in the feature PR (see [`testing.md`](testing.md)).

## Roadmap updates

| Document | Path | When to update |
|----------|------|----------------|
| **Product** | [`docs/roadmap.md`](../roadmap.md) | A shipped item should be **removed** from the backlog; new scope is added or reprioritized |
| Situation | Product roadmap |
|-----------|-----------------|
| **Feature PR** | Update when the PR completes or changes a listed roadmap item (drop shipped rows; add follow-ups if needed) |
| **Tests-only PR** | Usually omit |
| **Multi-PR plan** | Last PR syncs product roadmap to `main`; see [`multi-pr-plans.md`](multi-pr-plans.md) |

Tests for new or changed behavior ship with the feature PR ([`testing.md`](testing.md)).

## Tech debt registry

| Document | Path | When to update |
|----------|------|----------------|
| **Tech debt** | [`docs/tech-debt.md`](../tech-debt.md) | New debt row added, or an outstanding row **removed** when paid down in the PR |

Workflow detail: [`tech-debt.md`](tech-debt.md).

| Situation | Product roadmap | Tech debt doc |
|-----------|-----------------|---------------|
| **Feature PR** | Update if the PR completes or changes a listed roadmap item | Add row if the PR reveals debt out of scope; close row if paying debt in this PR; note related TD IDs in **Downstream** |
| **Refactor / tooling PR** | Usually omit | Remove paid-down TD rows; add rows if new debt found |
| **Multi-PR plan** | Last PR syncs product roadmap to `main` | Last debt-closing PR syncs tech debt table; see [`multi-pr-plans.md`](multi-pr-plans.md) |

When implementing features, check the open tech debt table for **P0** items in the same area. If clearing them reduces risk for the feature, bring them into scope; otherwise link the TD ID for a follow-up.

## Branch naming

Use a short prefix and slug, for example:

- `feat/short-description`
- `fix/short-description`
- `docs/short-description`
- `curriculum/2-4-home-ui` (for planned multi-PR work)

## PR title

- One line, imperative mood: what the PR *does*.
- Examples: `Add curriculum unlock rules from attempt history`, `Remove interval 2c from product roadmap`.

## PR body template

Use `gh pr create` with a HEREDOC body. Default structure:

```markdown
## Summary

- Bullet points: what changed and why (not a file list).

## Test plan

### Automated

- [ ] `npm test` — all pass
- [ ] (when applicable) `npm run test:browser` — changes to `src/ui/`, mount functions, or `tests/browser/`
- [ ] (optional) `npm run build` — if relevant
- [ ] GitHub Actions `CI` workflow green on the PR

PRs that add or change tests should cite the relevant guide(s) in this section or under **New behavior**: [`testing.md`](testing.md) (hub), [`ui-testing.md`](ui-testing.md) (browser queries), [`mocking.md`](mocking.md) (ports and doubles).

### New behavior

Manual checks for **what this PR adds or changes**. Be specific (routes, fresh profile, unlock thresholds, UI copy).

- [ ] …

### Existing behavior (unchanged)

Smoke checks that **features that already worked before this PR still work**. This is not a list of known bugs or regressions you found — it is a reminder to verify nothing broke adjacent behavior.

Include this section when the change touches shared paths (home, history, preferences, exercise bootstrap, stats). Omit it for docs-only PRs with no runtime risk, or when the PR is entirely new surface area with no shared seams.

- [ ] Preferences (`localStorage`) still persist and still affect sessions (voice range, chord filters, interval picker).
- [ ] Attempt history still records pass/fail for sing and identify exercises.
- [ ] (add only what applies) …

## Downstream (optional)

What later PRs or work should assume about APIs, files, or behavior.
```

### Section naming

| Use this | Not this | Meaning |
|----------|----------|---------|
| **Existing behavior (unchanged)** | Regression | Pre-existing behavior that should still work after the PR |
| **New behavior** | — | What the PR intentionally introduces or modifies |
| **Automated** | — | Commands CI/agents can run |

Avoid the word **Regression** as a test-plan heading — readers often read it as “bugs we introduced.” **Existing behavior (unchanged)** makes the intent explicit.

### When to expand the test plan

- **Feature PR** — New behavior + Existing behavior (unchanged) when shared code is touched.
- **Multi-step plan (final PR)** — Include roadmap sync in Summary; you may include a full end-to-end checklist (all steps) under **New behavior**; still use **Existing behavior (unchanged)** for cross-cutting smoke items.
- **Docs-only / roadmap sync** — Summary + note “No runtime changes”; list which roadmaps were updated; minimal or no checklists.

## Closing GitHub issues from a PR

GitHub **only** auto-closes issues when the PR description or a commit message uses a [closing keyword](https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue) (`Closes`, `Fixes`, `Resolves`, etc.) **before** the issue number. Words like *implements*, *addresses*, or *part of* do **not** close issues.

| Situation | PR summary line |
|-----------|-----------------|
| One issue | `Closes #45` |
| Parent + child slices (one PR ships all) | List every issue: `Closes #45`, `Closes #46`, … `Closes #50` |
| Child slices delivered in separate PRs | Each PR closes only its own issue(s) |

When work was broken down with `/to-issues` (see [`.agents/skills/to-issues/SKILL.md`](../../.agents/skills/to-issues/SKILL.md)) under a parent PRD issue, a **single merge PR** that delivers the full parent should close **the parent and every child issue** included in that merge, not only the parent.

Example (one vertical-slice PR for parent #45 and children #46–#50):

```markdown
## Summary

- …

Closes #45
Closes #46
Closes #47
Closes #48
Closes #49
Closes #50
```

If child issues stay open after merge, close them manually: `gh issue close 46 --comment "Delivered in #51."` (repeat per issue).

## Creating the PR

After push:

```bash
git push -u origin HEAD

gh pr create --title "Your title" --body "$(cat <<'EOF'
## Summary
…

## Test plan
…
EOF
)"
```

Return the PR URL to the user. Do not push or merge unless they ask.

## Review expectations

- PR description should stand alone: a reviewer can test without reading the agent chat.
- Prefer checkboxes `- [ ]` so reviewers can mark items in GitHub.
- Link to `docs/roadmap.md` or an implementation plan when the PR is part of a larger sequence.

## Related

- Testing hub: [`testing.md`](testing.md)
- UI testing: [`ui-testing.md`](ui-testing.md)
- Mocking: [`mocking.md`](mocking.md)
- Multi-PR plans: [`multi-pr-plans.md`](multi-pr-plans.md)
- Product roadmap: [`docs/roadmap.md`](../roadmap.md)
- Testing: [`docs/agents/testing.md`](testing.md)
- Tech debt: [`docs/tech-debt.md`](../tech-debt.md)
- Human README: [`README.md`](../../README.md)
