# Issue tracker: GitHub

Issues and PRDs for this repo live as [GitHub issues](https://github.com/AlexKMarshall/ear-training/issues) on `AlexKMarshall/ear-training`. Use the `gh` CLI for all operations.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read an issue**: `gh issue view <number> --comments`, filtering comments by `jq` and also fetching labels.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Comment on an issue**: `gh issue comment <number> --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> --comment "..."`

Infer the repo from `git remote -v` — `gh` does this automatically when run inside a clone.

Apply triage labels per `docs/agents/triage-labels.md`. Create missing labels in the repo (Settings → Labels) before agents rely on them.

## Suggested branch names

Every **slice** issue from `/to-issues` (and standalone `ready-for-agent` / `ready-for-human` grab work) should include a **Suggested branch** section in the issue body. **Epics omit this** — only child slices and one-off issues get a branch.

| Prefix | Use for |
|--------|---------|
| `feat/` | New learner-visible behavior or enhancement |
| `fix/` | Bug fix |
| `test/` | Tests-only or tests-primary PR |
| `docs/` | Documentation only |
| `refactor/` | Internal restructure; no intended behavior change |
| `tooling/` | CI, lint, format, build, dev dependencies |

**Slug:** lowercase ASCII, words separated by hyphens, 2–5 words derived from the slice title. No issue numbers. Example: `feat/guided-path-back-nav`.

Implementers run `git checkout -b <name>` from an up-to-date `main`. If the name collides on the remote, append a short suffix (e.g. `-2`) or use a clear variant — the issue name is a default, not a lock.

When publishing an epic, add a **parent comment** table with a **Branch** column for each slice. See [`.agents/skills/to-issues/SKILL.md`](../../.agents/skills/to-issues/SKILL.md).

## When a skill says "publish to the issue tracker"

Create a GitHub issue with the approved title and body. Apply `ready-for-agent` (or the label the maintainer specified) unless told otherwise.

If the planning session updated **`CONTEXT.md`**, publish (or remind the user to merge) a **glossary documentation PR** on `main` **before** implementation slices start — see [`domain.md`](domain.md#glossary-pr-before-implementation). When using `/to-issues`, add a parent-epic comment that names the glossary PR or slice-0 issue and tells implementers to merge it first.

## Closing issues from merged PRs

Only `Closes` / `Fixes` / `Resolves` (etc.) in the **PR body or commit message** auto-close linked issues. Closing a parent epic does **not** close child slice issues (and the reverse). See [Closing GitHub issues from a PR](pull-requests.md#closing-github-issues-from-a-pr).

**Epic + slice issues** (from `/to-issues`): the **final slice PR must `Closes` the parent epic** as well as its slice issue. Earlier slice PRs close only their slice.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --comments`. Accept issue URLs (`github.com/.../issues/<n>`) or numbers from the user.
