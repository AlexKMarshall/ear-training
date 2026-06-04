# Triage Labels

The skills speak in terms of canonical triage roles. This file maps those roles to label strings in **Linear**.

## State roles

| Label in mattpocock/skills | Label in our tracker | Meaning                                  |
| -------------------------- | -------------------- | ---------------------------------------- |
| `needs-triage`             | `needs-triage`       | Maintainer needs to evaluate this issue  |
| `needs-info`               | `needs-info`         | Waiting on reporter for more information |
| `ready-for-agent`          | `ready-for-agent`    | Fully specified, ready for an AFK agent  |
| `ready-for-human`          | `ready-for-human`    | Requires human implementation            |
| `wontfix`                  | `wontfix`            | Will not be actioned                     |

When a skill mentions a state role (e.g. "apply the AFK-ready triage label"), use the corresponding label string from this table.

Every triaged issue should carry **exactly one** state role label. Create these labels in the Linear workspace if they do not exist yet.

## Category roles

| Role in mattpocock/skills | Label in our tracker | Meaning                    |
| ------------------------- | -------------------- | -------------------------- |
| `bug`                     | `bug`                | Something is broken        |
| `enhancement`             | `enhancement`        | New feature or improvement |

Every triaged issue should carry **exactly one** category role label in addition to its state role.

Edit the right-hand column if you rename labels in Linear; keep the left column as the skill vocabulary.
