---
name: backlog-protocol
description: Defines strict protocols for CRUD operations on backlog items — file creation, status transitions, ID management, and archive moves. Use this skill when creating, updating, or managing backlog items in the backlog/ folder.
user-invocable: false
---

# Backlog Protocol

All agents that interact with the `backlog/` folder must follow these rules to ensure consistent formatting, naming, and state transitions.

## 1. Folder Structure

```
project-root/
└── backlog/
    ├── {ID}-{slug}.md          # Active items (draft, ready, in-progress)
    ├── archive/                # Completed items
    │   └── {ID}-{slug}.md      # status: done
    ├── ROADMAP.md              # Auto-generated (see roadmap-generator skill)
    └── ROADMAP.html            # Optional visual board
```

- The `backlog/` folder lives at the project root.
- It is git-excluded via `.git/info/exclude` (not `.gitignore`).
- If `backlog/` does not exist, create it and `backlog/archive/`, then run `echo "backlog/" >> .git/info/exclude`.

## 2. Backlog Item File Format

Every backlog item is a single markdown file with YAML frontmatter:

```markdown
---
id: {PREFIX}-{NUMBER}
title: {Short descriptive title}
type: {feature|fix|chore|refactor}
priority: {P0|P1|P2|P3}
status: {draft|ready|in-progress|done}
epic: {epic-slug}
size: {S|M|L}
created: {YYYY-MM-DD}
---

## Description
{Detailed description of the work item.}

## Acceptance Criteria
- [ ] {Criterion 1}
- [ ] {Criterion 2}
- [ ] {Criterion 3}

## Notes
{Optional. Dependencies, PRD references, context, links.}
```

### Field Rules

| Field | Required | Rules |
|---|---|---|
| `id` | Yes | Project prefix + auto-incremented number. E.g., `MM-001`, `MM-002`. Prefix is derived from the project name. Always zero-pad to 3 digits. |
| `title` | Yes | Short, imperative. E.g., "Add recurring transactions" |
| `type` | Yes | One of: `feature`, `fix`, `chore`, `refactor` |
| `priority` | No | One of: `P0` (critical), `P1` (high), `P2` (medium), `P3` (low). Omit if not yet prioritized. |
| `status` | Yes | One of: `draft`, `ready`, `in-progress`, `done` |
| `epic` | Yes | Kebab-case epic slug. E.g., `transaction-management`, `user-auth` |
| `size` | No | Effort estimate: `S` (single session), `M` (one to a few sessions), `L` (multi-phase). Omit if not yet sized. |
| `created` | Yes | ISO date (YYYY-MM-DD) |

### File Naming Convention

`{ID}-{slug}.md` where slug is derived from the title in kebab-case.

Examples:
- `MM-001-base-transaction-model.md`
- `MM-012-budget-alerts.md`

## 3. ID Management

- **Project prefix**: Derive from the project name. Use 2-3 uppercase letters. E.g., `money-map` → `MM`, `dev-portfolio` → `DP`.
- **Auto-increment**: Scan all files in `backlog/` AND `backlog/archive/` to find the highest existing ID number, then increment by 1.
- **IDs are permanent**: Never reuse or renumber IDs, even if items are deleted.

### How to determine the next ID

1. Read all `.md` filenames in `backlog/` and `backlog/archive/` (excluding ROADMAP files).
2. Extract the numeric portion from each ID (e.g., `MM-014` → `14`).
3. Take the maximum and add 1.
4. If no items exist, start at `001`.

## 4. Status Transitions

```
draft → ready → in-progress → done
```

| Transition | Who | When |
|---|---|---|
| `draft` → `ready` | PM Agent | Item is fully specified with AC, ready for development |
| `ready` → `in-progress` | Architect Agent | Architect picks up the item and starts planning |
| `in-progress` → `done` | Integrator Agent | PR is created/merged, work is complete |

- Status changes are made by editing the YAML frontmatter `status` field in place.
- When transitioning to `done`, also move the file from `backlog/` to `backlog/archive/`.

## 5. Creating a Backlog Item

1. Determine the project prefix (or read it from existing items).
2. Determine the next ID number (see ID Management above).
3. Create the file at `backlog/{ID}-{slug}.md` using the template above.
4. Set `status: draft` if AC is incomplete, `status: ready` if fully specified.

## 6. Archiving a Completed Item

1. Update the item's `status` field to `done` in the frontmatter.
2. Move the file: `backlog/{ID}-{slug}.md` → `backlog/archive/{ID}-{slug}.md`.
3. Trigger the roadmap-generator skill to update ROADMAP.md.

## 7. Notion Mirror

The Notion `Tasks` database is a one-way mirror of `backlog/`. The files stay the source of truth.

After any operation in sections 4-6 (creating an item, changing a status, or archiving), run once from the project root:

```
node "$HOME/agents/scripts/notion-sync/sync.ts" .
```

- Run it once at the end of a batch, not once per item. It syncs the whole project in one pass.
- It only mirrors allowlisted projects. For any other project it prints a skip message and exits 0.
- **Failure is non-fatal.** If the command exits non-zero, report the error line to the user as a warning and carry on. Never retry in a loop, and never let it block a status transition, a build, or a PR. The next successful run catches up.
- Never edit the Notion database directly. Notion edits are overwritten.
