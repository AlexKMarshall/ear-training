# Pull requests — agent guide

How to open and describe PRs in this repo. Intended for Cursor, Copilot, Claude Code, and other coding agents.

For work split across several merge-gated PRs (status table, merge gates, final roadmap-sync step), see [`multi-pr-plans.md`](multi-pr-plans.md).

## Before you open a PR

1. **Sync `main`** — `git fetch origin main && git checkout main && git pull origin main`, then branch.
2. **Scope** — One logical change per PR. Do not bundle unrelated refactors or sneak ahead on a multi-step plan unless the user asks to combine.
3. **Verify** — Run `npm test` (and `npm run build` if the change touches build, routes, or static assets). When browser tests exist, run `npm run test:browser` for PRs that touch `src/ui/` or mount/orchestration code — see [`docs/agents/testing.md`](testing.md) and [`docs/testing-roadmap.md`](../testing-roadmap.md). Confirm GitHub Actions **CI** is green on the PR. Do not claim tests pass without running them locally and without a green CI check.
4. **Commits** — Only commit when the user asks. Use clear messages focused on *why* (1–2 sentences).
5. **Roadmaps** — When the PR finishes a milestone or changes what roadmaps claim about current state, update **all** applicable roadmaps in that PR (see [Roadmap updates](#roadmap-updates)).

## Roadmap updates

This repo has two status roadmaps agents must keep aligned:

| Roadmap | Path |
|---------|------|
| Product | [`docs/roadmap.md`](../roadmap.md) |
| Testing | [`docs/testing-roadmap.md`](../testing-roadmap.md) |

| Situation | When to update |
|-----------|----------------|
| **Single PR** | Update every applicable roadmap in the **same** PR before merge. If the change touches tests, CI, or ports, update **both** roadmaps unless only one domain changed. |
| **Multi-PR plan** | The **last** PR in the sequence (implementation or docs-only) must sync **all** roadmaps named in the plan—default: **both** files. Do not mark the plan complete if [`docs/roadmap.md`](../roadmap.md) still says “next” while [`docs/testing-roadmap.md`](../testing-roadmap.md) says “Done”. See [`multi-pr-plans.md`](multi-pr-plans.md). |

Checklist: mark completed phases **Done**, fix obsolete “today / next” wording, align CI commands with [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml), and note what phase is **next**.

## Branch naming

Use a short prefix and slug, for example:

- `feat/short-description`
- `fix/short-description`
- `docs/short-description`
- `curriculum/2-4-home-ui` (for planned multi-PR work)

## PR title

- One line, imperative mood: what the PR *does*.
- Examples: `Add curriculum unlock rules from attempt history`, `Update roadmap for curriculum v1 shell`.

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
- Human README: [`README.md`](../../README.md)
