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
| **6. Dry run in Claude Code** | **Next. Partly done: planning works, the pipeline after it is untested** |
| 7. Orca runtime | Waiting for a machine with Orca |
| 8. Cleanup and PR into `main` | After 6 and 7. Removes this `docs/v2/` folder |

The two scripts are tested (`node --test scripts/install.test.mjs skills/gates/scripts/gates.test.mjs`). A partial dry run confirmed that the install is discovered by Claude Code, that `/coordinator` loads, and that `/architect` plans a ticket and writes the state files correctly. Everything after planning (Builder, QA, gates in the pipeline, Reviewer, Integrator, and every stop except plan approval) has never been run, so expect to correct those files. The details are in `log.md` under "Task 6.1".

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

## Phase 6: the dry run (do this next)

This is task 6.1 in `plan.xml`. It needs you at the keyboard, because the point is to see where the roles stop.

1. Create a scratch repository with a tiny Node project that has a real test command and a real lint command, and one commit on `main`. Install v2 into it:
   ```bash
   node scripts/install.mjs --project /path/to/scratch
   ```
2. Open Claude Code in the scratch repository and type `/`. Check that `/architect`, `/coordinator`, `/pm`, `/builder`, `/qa`, `/integrator`, and `/reviewer` all appear. This worked on the planning machine with Claude Code 2.1.332.
3. Run `/architect` with a small ticket that changes behavior (for example "add a function that formats a price, with two acceptance criteria"). Answer the project setup questions, approve the proposal, and check that `.gsd/<slug>/` holds `spec.md`, `plan.xml`, `status.md`, and `notes.md` in the formats of the `state-machine` skill.
4. In a fresh session on the same branch, run `/coordinator` and let it run to the ship-approval stop. Do not approve the push.
5. Run a second ticket whose Protected Behaviors are `None - this work changes no behavior` (for example a README change) and confirm QA is skipped.
6. Force each exception once, to see the stops work:
   - ask the Builder for something that is not in the plan;
   - add a debug print to the source and commit it, then run the gates;
   - put an AI attribution trailer on a commit, then run the gates.

**What to watch for, and fix in the role files:**

| Check | Why it is uncertain |
|---|---|
| The Architect stub loads the `architect` skill when run as a subagent | Skill preloading through the `skills:` field is documented but untested here |
| `${CLAUDE_SKILL_DIR}` resolves when the `gates` and `backlog-protocol` skills call their scripts | Its behavior for a symlinked skill folder is not documented |
| You are stopped only at the three gates | The stop rules are new |
| The coordinator's prompts to roles contain no summary of the work | The no-characterization rule is easy for a model to drift from |
| A role restarted mid-run picks up from `status.md` | Never exercised |

Record every correction in `log.md` under a "Task 6.1" note, then tick task 6.1.

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
