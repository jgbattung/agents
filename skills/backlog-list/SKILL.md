---
name: backlog-list
description: Reads the backlog/ folder and displays items grouped or filtered by status, priority, or epic. Use this skill when any agent or user needs to view the current state of the backlog.
user-invocable: true
---

# Backlog List Skill

Reads all backlog items from the `backlog/` folder (and optionally `backlog/archive/`) and presents them in a structured view.

## How to Use

When invoked, read all `.md` files in `backlog/` (excluding `ROADMAP.md` and `ROADMAP.html`). Parse the YAML frontmatter of each file to extract: `id`, `title`, `type`, `priority`, `status`, and `epic`.

## Default View: Group by Status

Present items grouped by status in this order: `in-progress`, `ready`, `draft`. Omit `done` items (they live in `archive/`) unless the user asks to include them.

Within each status group, sort by priority (`P0` first, then `P1`, `P2`, `P3`, then items with no priority).

### Output Format

```
## Backlog — {Project Name}

### In Progress
| ID | Title | Priority | Epic |
|---|---|---|---|
| MM-005 | Export to CSV | P1 | data-export |

### Ready
| ID | Title | Priority | Epic |
|---|---|---|---|
| MM-003 | Recurring transactions | P1 | transaction-management |
| MM-006 | Budget creation | P2 | budgeting |

### Draft
| ID | Title | Priority | Epic |
|---|---|---|---|
| MM-004 | Budget alerts | P2 | budgeting |
| MM-007 | Dark mode | — | ui-polish |

---
Total: 5 active items (1 in-progress, 2 ready, 2 draft)
```

## Filtered Views

The user or agent may request filtered views:

- **By epic**: `"show backlog for epic transaction-management"` → filter to items with that epic slug
- **By priority**: `"show P0 and P1 items"` → filter to those priority levels
- **By status**: `"show ready items"` → filter to that status
- **Include archived**: `"show all items including done"` → also read `backlog/archive/*.md` and add a `### Done` section

## Edge Cases

- If `backlog/` does not exist, report: *"No backlog folder found in this project. Use the PM Agent to initialize one."*
- If `backlog/` exists but has no `.md` files, report: *"Backlog is empty. Use the PM Agent to create items from a PRD or rough idea."*
- Files without valid YAML frontmatter should be skipped with a warning.
