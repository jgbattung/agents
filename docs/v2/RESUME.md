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
| **6. Dry run in Claude Code** | **Next. One check left: a real push and PR** |
| 7. Orca runtime | Waiting for a machine with Orca |
| 8. Cleanup and PR into `main` | After 6 and 7. Removes this `docs/v2/` folder |

The two scripts are tested (`node --test scripts/install.test.mjs skills/gates/scripts/gates.test.mjs`, 16 tests).

Three dry run sessions took tickets through the whole pipeline in headless Claude Code sessions, with an agent answering as the user. Every path below reached the ship-approval stop, and five bugs were found and fixed along the way:

- the main path: plan, build, QA, gates, review, PR draft;
- a direct fix (a debug leftover);
- a remediation planned by the Architect, with QA re-verification;
- an AI attribution finding routed to the user;
- the Builder's deviation stop and the QA Engineer's budget stop;
- a no-behavior-change ticket, which skips QA.

What has **not** been done: an actual push and PR, and a run driven by a person in a live session. The details are in `log.md` under the three "Task 6.1" notes.

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

## Phase 6: what is left

This finishes task 6.1 in `plan.xml`. It is one real ticket, run by you in a live session. It covers the one path the earlier dry runs could not (push and PR) and is also the first time a person, not an agent, answers the stops.

1. Create a throwaway private repository on GitHub with a tiny Node project that has a real test command and a real lint command, and clone it. If v2 is not installed globally, install it into the clone with `node scripts/install.mjs --project /path/to/clone`.
2. On a new branch, run `/architect` with a small behavior-changing ticket. Answer the project setup questions and approve the proposal.
3. In a fresh session on the same branch, run `/coordinator`. Answer any stop that comes up.
4. At the ship-approval stop, read the PR draft, then approve.

Expected:

| Step | Expect |
|---|---|
| 2 | The Architect stops once, with a proposal, the Protected Behaviors, and the PR strategy. After approval, `.gsd/<slug>/` holds `spec.md`, `plan.xml`, `status.md`, `notes.md` |
| 3 | You are stopped only at ship approval, unless something really departs from the plan. Every gates result is printed as `Gates: PASSED` or `Gates: FAILED` |
| 4 | The Integrator pushes the branch, opens the PR with `gh`, and `status.md` ends at `stage: done` with the PR URL. No AI attribution in the commits, the PR title, or the PR body |

Also watch that the coordinator's prompts to roles contain no summary of the work, and that after a stop it starts a fresh instance of the role instead of messaging the old one.

Record anything that needed a correction in `log.md` under a "Task 6.1" note, fix it, then tick task 6.1.

## Resume prompt

Paste this into Claude Code, opened in this repository:

```
Continue the Workflow v2 overhaul in this repository.

Load: docs/v2/RESUME.md, docs/v2/log.md, docs/v2/spec.md, docs/v2/plan.xml

Already completed (do not repeat): every task ticked in docs/v2/log.md (Phases 1 to 5),
and all of task 6.1 except a real push and PR.
Start from: the "Phase 6: what is left" section of docs/v2/RESUME.md.

Rules:
- Walk me through it one step at a time. I run the slash commands in the throwaway
  repository and tell you what happened; you diagnose and fix the role files here.
- Change only what the run shows is wrong. If something needs a design change,
  stop and tell me first.
- One atomic commit per fix, conventional commit format, no AI attribution, no em dashes.
- Record each correction in docs/v2/log.md, and push after each session.
- Do not start Phase 7 unless Orca is installed on this machine (check with
  `command -v orca`). When it is, follow docs/v2/orca-checklist.md from the top.
- Do Phase 8 (cleanup and the PR into main) only when I say so.
```

## Phase 8: cleanup

The files in `docs/v2/` exist only to carry this overhaul between machines. Task 8.1 deletes the folder before the branch is merged, and task 8.2 opens the PR into `main` after you approve. If Orca is still not available by then, the two Orca files move to `docs/orca/` so that work is not lost.

## Phase 7: Orca

Phases 1 to 6 do not need Orca. When Phase 6 is done and Orca is installed, open `orca-checklist.md` and work through it top to bottom. It is written to be followed without the original planning conversation.

## When everything is done

Phase 8 opens the PR from `feature/workflow-v2` into `main`. To turn the branch into a new repository instead, create an empty repository and run `git push <new-remote-url> feature/workflow-v2:main`.

If the Notion backlog mirror is wanted on the new machine, run `npm install` in `skills/backlog-protocol/scripts/notion-sync/` first.
