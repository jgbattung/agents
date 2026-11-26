# Resume: Workflow v2

Everything needed to continue this work is in this folder. No re-planning is required.

## Where things stand

| Phase | Status |
|---|---|
| 1. Foundations (state protocol, install script) | Done |
| 2. Gates script | Done |
| 3. Roles (Builder, QA, Reviewer, Integrator, Architect) | Done |
| 4. Coordinator and commands | Done |
| 5. Documentation | Done |
| **6. Dry run in Claude Code** | **Next. Mostly done: the main path and the direct-fix path work. The remaining checks are listed below** |
| 7. Orca runtime | Waiting for a machine with Orca |
| 8. Cleanup and PR into `main` | After 6 and 7. Removes this `docs/v2/` folder |

The two scripts are tested (`node --test scripts/install.test.mjs skills/gates/scripts/gates.test.mjs`). Two dry run sessions took a small ticket from `/architect` through the coordinator, Builder, QA Engineer, gates, Reviewer, and Integrator to the ship-approval stop, and through one direct fix. They found and fixed three bugs. The details, and the list of what is still not exercised, are in `log.md` under the two "Task 6.1" notes. Read those before continuing.

`log.md` has the task checklist and every decision and deviation made during the build. Read its notes before changing a role file.

## Files in this folder

| File | What it is |
|---|---|
| `spec.md` | The approved design. Read this first. |
| `plan.xml` | The tasks, in order, each with a verify step. |
| `log.md` | Which tasks are done, plus decisions, deviations, and open problems. |
| `orca-notes.md` | What Orca's documentation says, and what it leaves open. |
| `orca-checklist.md` | Phase 7: the Orca trial, the coordinator's Orca sections, and the Orca dry run. |

## Set up a new machine

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
4. Confirm the scripts work here:
   ```bash
   node --test scripts/install.test.mjs skills/gates/scripts/gates.test.mjs
   ```
5. Decide how to install v2 for the dry run:
   - **A machine with no existing `~/.claude` agents or skills:** `node scripts/install.mjs --dry-run`, then `node scripts/install.mjs`.
   - **A machine that already has them** (the script reports what it would skip): install into the scratch project only, in step 1 of Phase 6 below.
   - **Warning:** a skill at user level (`~/.claude/skills`) shadows a project skill of the same name. If the machine has older copies of `state-machine`, `git-standards`, `review`, or `testing-standards` at user level, the dry run is not trustworthy until they are removed or replaced by this repository's versions.

## Phase 6: the dry run (finish this next)

This is task 6.1 in `plan.xml`. The main path already works. What remains is to exercise the paths below, in a scratch repository, with you at the keyboard so the stops are answered by a person in a live session.

Set up: create a scratch repository with a tiny Node project that has a real test command and a real lint command, one commit on `main`, and a GitHub remote you can push to (a throwaway private repository). Install v2 into it with `node scripts/install.mjs --project /path/to/scratch`, or globally on a machine with a clean `~/.claude`.

| # | Do this | Expect |
|---|---|---|
| 1 | `/architect` a small behavior-changing ticket, approve, then `/coordinator` in a fresh session | The pipeline reaches `ship-approval`, stopping nowhere else. The gates print `Gates: PASSED` |
| 2 | At `ship-approval`, approve | The Integrator pushes and opens the PR with `gh`, and `status.md` ends at `stage: done` with the URL |
| 3 | On a new ticket, after QA has run, break the source so a QA test fails, commit, set `stage: gates`, run `/coordinator` | The gates record a test failure with `route: architect`. The Architect plans a remediation phase and stops for `remediation-approval`. After approval the Builder fixes it and the QA Engineer runs in Re-Verification Mode |
| 4 | Plant a debug print, commit, run `/coordinator` | A `direct` finding, fixed by the Builder, then QA re-verification, gates, Reviewer |
| 5 | Put an AI attribution trailer on a commit, run `/coordinator` | A `route: user` finding. The coordinator shows it and waits. No role rewrites history |
| 6 | Plan a ticket whose approach forces the QA Engineer to leave a listed behavior untested, or ask it to prune a test | A `budget` stop |
| 7 | Give the Builder a plan task that cannot be done as written | A `deviation` or `blocker` stop with options and a recommendation |
| 8 | A ticket that changes no behavior (a README edit) | Protected Behaviors read `None`, and QA is skipped |
| 9 | Answer one stop in the same session it was raised in | The coordinator continues the same subagent instead of starting a new one |

**What to watch for in every run:**

| Check | Why it is uncertain |
|---|---|
| The Architect stub loads the `architect` skill when the coordinator runs it as a subagent | Skill preloading through the `skills:` field is documented but has not been run |
| `${CLAUDE_SKILL_DIR}` resolves when the `gates` skill calls its script | Its behavior for a symlinked skill folder is not documented. The script itself now works through a symlink |
| The coordinator's prompts to roles contain no summary of the work | The no-characterization rule is easy for a model to drift from |
| A recorded gates pass was actually printed | An earlier bug produced silent passes. The skill now says no output means it did not run |

Record every correction in `log.md` under a "Task 6.1" note. Tick task 6.1 when rows 1 to 9 have all been seen to work.

## Resume prompt

Paste this into Claude Code, opened in this repository:

```
Continue the Workflow v2 overhaul in this repository.

Load: docs/v2/RESUME.md, docs/v2/spec.md, docs/v2/plan.xml, docs/v2/log.md

Already completed (do not repeat): every task ticked in docs/v2/log.md (Phases 1 to 5).
Start from: task 6.1, the dry run, following the "Phase 6" section of docs/v2/RESUME.md.

Rules:
- Walk me through the dry run one step at a time. I run the slash commands in the
  scratch project and tell you what happened; you diagnose and fix the role files here.
- Change only what the dry run shows is wrong. If something needs a design change,
  stop and tell me first.
- One atomic commit per fix, conventional commit format, no AI attribution, no em dashes.
- Record each correction in docs/v2/log.md, and push after each session.
- Do not start Phase 7 unless Orca is installed on this machine (check with
  `command -v orca`). When it is, follow docs/v2/orca-checklist.md from the top.
```

## Phase 8: cleanup

The files in `docs/v2/` exist only to carry this overhaul between machines. Task 8.1 deletes the folder before the branch is merged, and task 8.2 opens the PR into `main` after you approve. If Orca is still not available by then, the two Orca files move to `docs/orca/` so that work is not lost.

## Phase 7: Orca

Phases 1 to 6 do not need Orca. When Phase 6 is done and Orca is installed, open `orca-checklist.md` and work through it top to bottom. It is written to be followed without the original planning conversation.

## When everything is done

Phase 8 opens the PR from `feature/workflow-v2` into `main`. To turn the branch into a new repository instead, create an empty repository and run `git push <new-remote-url> feature/workflow-v2:main`.

If the Notion backlog mirror is wanted on the new machine, run `npm install` in `skills/backlog-protocol/scripts/notion-sync/` first.
