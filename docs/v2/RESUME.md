# Resume: Workflow v2

Everything needed to continue this work is in this folder. No re-planning is required.

| File | What it is |
|---|---|
| `spec.md` | The approved design. Read this first. |
| `plan.xml` | The tasks, in order, each with a verify step. |
| `log.md` | Which tasks are done, plus decisions and open problems. |
| `orca-notes.md` | What Orca's documentation says, and what it leaves open. |
| `orca-checklist.md` | Phase 7: the Orca trial, the coordinator's Orca sections, and the Orca dry run. |

## On a new machine

1. Install `git`, Node 22+, Claude Code, and the GitHub CLI. Run `gh auth login` with the personal GitHub account.
2. Clone and switch to the branch:
   ```bash
   git clone https://github.com/jgbattung/agents.git
   cd agents
   git checkout feature/workflow-v2
   ```
3. Set the commit identity for this repository to the personal one already used in its history (check with `git log -3 --format='%an <%ae>'`):
   ```bash
   git config --local user.name "<name>"
   git config --local user.email "<personal email>"
   ```
4. Open Claude Code in the repository folder and paste the prompt below.

## Resume prompt

```
Continue the Workflow v2 overhaul in this repository.

Load: docs/v2/spec.md, docs/v2/plan.xml, docs/v2/log.md

Already completed (do not repeat): every task ticked in docs/v2/log.md.
Start from: the first unticked task in docs/v2/log.md, in plan order.

Rules:
- Implement only tasks that are in docs/v2/plan.xml. If something needs to change in the design, stop and tell me.
- One atomic commit per task, conventional commit format, no AI attribution, no em dashes.
- Tick the task in docs/v2/log.md in the same commit.
- Push the branch after each phase.
- Stop and ask me before Phase 6 (the dry run), and do not start Phase 7 unless Orca is installed on this machine (check with `command -v orca`).
```

## If Orca is installed on the machine

Phases 1 to 6 do not need Orca. When they are done, open `orca-checklist.md` and work through it top to bottom. It is written to be followed without this conversation.

## When everything is done

Open a PR from `feature/workflow-v2` into `main`. To turn the branch into a new repository instead, create an empty repository and run `git push <new-remote-url> feature/workflow-v2:main`.
