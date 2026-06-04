# Issue tracker: Linear

Issues and PRDs for this repo live in **Linear**, not GitHub Issues. Code and pull requests stay on GitHub (`AlexKMarshall/ear-training`).

## Where work lives

- **Workspace:** alexkmarshall
- **Project:** [Ear training](https://linear.app/alexkmarshall/project/ear-training-8cc2326d7302/overview)
- **Issue identifiers:** `ALE-<number>` (e.g. `ALE-42`)

Create and triage issues in this project unless the maintainer says otherwise.

## Tooling

Prefer the [Linear CLI](https://developers.linear.app/docs/guides/cli) when automating from an agent session:

- Install: `npm i -g @linear/cli` (or use `npx @linear/cli`)
- Auth: set `LINEAR_API_KEY` (create at Linear → Settings → API → Personal API keys)

If the CLI is unavailable, use the Linear web UI at the project link above and report what you did in the chat.

## Conventions

- **Create an issue:** `linear issue create --title "..." --description "..."` and assign it to the Ear training project when the CLI prompts or flags allow. Use a heredoc or quoted multi-line string for descriptions.
- **Read an issue:** Open by identifier (e.g. `ALE-42`) via `linear issue view <id>` or the issue URL from the project board.
- **List issues:** Filter by project in the Linear UI, or use CLI list/search scoped to this project.
- **Comment:** Add comments on the Linear issue (CLI or UI).
- **Labels:** Apply/remove triage labels per `docs/agents/triage-labels.md` (Linear **Labels**).
- **State:** Use the team’s normal workflow states (e.g. Todo → In Progress → Done); triage **roles** are expressed via labels, not necessarily workflow state.
- **Close / cancel:** Mark Done or Canceled in Linear with a short closing comment.

## When a skill says "publish to the issue tracker"

Create a Linear issue in the Ear training project with the approved title and body. Apply `ready-for-agent` (or the label the maintainer specified) unless told otherwise.

## When a skill says "fetch the relevant ticket"

Load the full Linear issue: description, comments, labels, and state. Accept issue URLs (`linear.app/...`) or identifiers (`ALE-123`) from the user.
