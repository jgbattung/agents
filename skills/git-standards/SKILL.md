---
name: git-standards
description: Defines the standard format for git commit messages using conventional commits. Used to generate standardized, multi-line commit command suggestions for the user to execute manually.
user-invocable: false
---

# Git Commit Standards

When generating `git commit` command suggestions for the user at phase checkpoints or handoffs, you must strictly follow the conventional commits format.

## Commit Message Format
Do not generate single-line `-m` commits for complex changes. You must provide the user with a multi-line commit command using the `EOF` heredoc format.

The message itself must follow this structure:

<type>(<optional scope>): <short subject — imperative mood, ≤ 72 chars>
<blank line>
<body — what changed and why, wrapped at 72 chars>

### 1. Type
Use one of the following types:

| Type | When to use |
|---|---|
| `feat` | A new feature or capability |
| `fix` | A bug fix |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test` | Adding or updating tests |
| `chore` | Maintenance tasks (deps, config, tooling) |
| `docs` | Documentation only changes |
| `style` | Formatting, whitespace — no logic change |

### 2. Subject Line Rules
* **Imperative mood:** `Add`, `Fix`, `Update`, `Remove`, `Refactor` — not `Added`, `Fixed`.
* **Length:** ≤ 72 characters including the type prefix.
* **Punctuation:** No period at the end.

### 3. Body Rules
* Separate from the subject line with a single blank line.
* Explain **what** changed and **why** (pull this directly from your `.gsd/[feature]-log.md` file).
* Wrap text at 72 characters per line.
* Use bullet points for multiple distinct changes.

## Output Example for the User
When prompting the user to commit, output the command in a bash block exactly like this:

```bash
git commit -F - << 'EOF'
feat(dashboard): add net worth summary component

Adds a new net worth component to the dashboard that aggregates
account balances across all linked accounts. Includes:
- NetWorthSummary component with configurable date range
- Unit tests covering empty state and balance aggregation
- Barrel export registration in src/components/index.ts
EOF
```
