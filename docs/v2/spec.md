# Spec: Workflow v2

## Requirements

**Title:** Overhaul the agent workflow for exception-only stops, a coordinator, and Orca ADE.

**Description:** v1 is a strictly sequential pipeline (Architect -> Builder -> QA -> Integrator) in which the user relays every handoff. v2 keeps the three values v1 was built for and removes the manual relay:

1. **Context isolation** - every role runs in its own session.
2. **Shared source of truth** - roles hand off through files, never through a paraphrase.
3. **Human ownership** - the user decides at decision points, not at procedural ones.

The target runtime is Orca ADE (`orca.dev`, `github.com/stablyai/orca`). The workflow must also run in plain Claude Code. The core must not depend on either.

**Acceptance Criteria:**

1. A coordinator runs Builder, QA, the gates, the Reviewer, and the Integrator in order without the user relaying between them.
2. The user is stopped at exactly three kinds of gate: plan and test budget approval, exceptions, and ship approval before anything is pushed.
3. The Builder and QA Engineer stop only on exceptions, never to re-confirm approved work.
4. State is one folder per feature, so several features can be in progress at once and nothing is archived.
5. No file refers to `~/agents`. The repository can live at any path, and an install script creates the links.
6. The mechanical quality gates are a tested script, not agent judgment.
7. One Reviewer covers both the workflow's own branch and another developer's PR.
8. Lavish, the PM agent, and the backlog skills are per-project opt-ins. With an option off, no agent reads those files.
9. The whole pipeline completes a small ticket on a scratch repository in plain Claude Code.
10. The Orca runtime section of the coordinator is written and verified on a machine that has Orca (see `orca-checklist.md`).

## Backlog ID

none

## Branch Name

`feature/workflow-v2`

## Base Branch

`main` (tagged `v1` at the commit this branch started from)

## Project Context & Tech Stack

- The repository is prompt files (Markdown with YAML frontmatter) plus one TypeScript script (`scripts/notion-sync/sync.ts`, run directly by Node 22+).
- `agents/` holds agent definitions, `commands/` holds Claude Code slash commands, `skills/` holds skills.
- There is no test suite today. New scripts in this work use `node --test` with no dependencies.
- Commit format: conventional commits per `skills/git-standards`. No AI attribution anywhere (Rule Zero).
- House style: never use the em dash. Use a plain dash.
- GitHub remote: `github.com/jgbattung/agents`. Commits use the personal identity already present in the history.

## Executive Summary

v2 separates three things v1 mixed together:

- **Methodology** (stays in files, runtime-agnostic): the roles, their edit limits, the spec, the test budget, the review standards.
- **State** (stays in files, much smaller): what was approved and what went differently.
- **Runtime** (new, isolated in the coordinator): who runs next and how they are started.

The Integrator's judgment work moves to the Reviewer, and its mechanical work moves to a script. The Integrator keeps only shipping.

## Background & Research

### What v1 does that v2 removes

| v1 mechanism | Why it existed | v2 replacement |
|---|---|---|
| User copies prompts between agents | Subagents cannot talk to the user | Coordinator routes on the status file |
| Builder stops after every phase | Human checkpoint | Stop on deviation or blocker only |
| QA stops for ledger approval | Human checkpoint | Stop only on a departure from the approved test budget |
| Log entry after every action | Save state | Git commits record changes; notes record only what git cannot |
| One active feature, archive rule | Single `.gsd/` root | One folder per feature |
| "No worktree isolation" banners | Claude Code subagent worktrees discard work | Removed. A ticket's roles share one worktree and one branch |
| Integrator self-review | Quality gate | Reviewer in self mode |
| Integrator mechanical gates | Quality gate | `gates` script |
| Hardcoded `~/agents` | Simplicity | Skills referenced by name, install script |

### Orca facts this design relies on

See `orca-notes.md` for the verified facts, the open unknowns, and the source pages. The design relies only on these:

- Every Orca workspace is a real `git worktree` with its own branch.
- Agents can be launched in separate terminals of an existing worktree.
- Orca cannot open a PR from its CLI. PR creation stays with `gh`.
- Orchestration (`orca orchestration ...`) is experimental. The design must work without it.

## Technical Design

### 1. State layout

```
.gsd/
  project-context.md          shared, never per-feature
  <slug>/
    spec.md                   what was approved
    plan.xml                  the tasks
    status.md                 where the pipeline is, and any open stop
    notes.md                  decisions, deviations, findings, test ledger
    review.md                 the Reviewer's last self review
    pr.md                     the PR draft awaiting ship approval
  peer-reviews/<slug>.md      Reviewer output for someone else's PR
```

- `<slug>` is the kebab-case short description of the branch name (`feature/add-net-worth` -> `add-net-worth`).
- The active feature is the folder matching the current branch. If none matches, the agent asks.
- `.gsd/` stays excluded from git through `.git/info/exclude`.
- Nothing is archived. Folders coexist.

**`project-context.md`** keeps `## Conventions` and gains two sections:

- `## Commands` - the exact test and lint commands, one per line, so the gates script can be called without interpretation.
- `## Workflow options` - `Visual alignment (Lavish): on|off` and `Backlog (PM, backlog folder, roadmap, Notion): on|off`. The Architect asks for these once, together with the conventions.

**`plan.xml`** keeps the `<phase>` / `<task>` / `<name>` / `<action>` / `<verify>` shape. Each task gains an `id` attribute (`<task id="2.1">`). Completion status is never written into the plan.

**`status.md`**

```markdown
# Status: <slug>

stage: planning | build | qa | gates | review | ship | done
stop: none | deviation | blocker | budget | remediation-approval | findings | ship-approval
stop_detail: <one paragraph, or empty>

## Tasks
- [x] 1.1 <task name> (<commit hash>)
- [ ] 1.2 <task name>

## History
- <date> <role>: <one-line outcome>
```

Rules:
- Every role updates `stage`, `stop`, and `## History` before it ends its run.
- The Builder ticks a task only after its verify step passed and its commit exists.
- The coordinator decides the next step from this file and from the `route` and `status` lines of the findings in `notes.md`, and from nothing else.

**`notes.md`** has fixed sections. A role appends to its own sections only.

| Section | Written by | Content |
|---|---|---|
| `## Decisions` | Architect | Approach chosen, trade-offs, findings deliberately not planned |
| `## Deviations` | Builder | Where the build departed from the plan, and why |
| `## Findings` | QA, Reviewer, gates script | One entry per finding (format below) |
| `## Test Ledger` | QA | Each test, the behavior it protects, its reason, its failure statement |
| `## Not Tested` | QA | Behaviors deliberately not tested or left as manual checks, with reasons |

**Finding format**

```markdown
### F<n> - <one-line title>
- source: qa | reviewer | gates | user
- severity: blocker | important | suggestion
- route: direct | architect | qa | user | none
- where: <file>:<line>
- proof: <failing test name, gate check name, or "none">
- status: open | resolved (<commit hash>) | accepted by user
- detail: <what is wrong, expected versus actual>
```

### 2. Routes and the fast path

A finding's `route` is set by whoever raises it, using these rules in order:

1. **`user`** - an AI attribution hit in commit history (history is never rewritten by an agent), or a finding that repeats an earlier one which was already resolved or answered.
2. **`qa`** - a finding about test code only (`[Test Quality]`, a skip this branch introduced, a missing test).
3. **`direct`** - all three hold: it names the exact location or locations to change; it adds or changes no protected behavior; a failing test or gate check already proves it, or it is the removal of a debug leftover. Lint failures fall here.
4. **`architect`** - everything else.

The Builder re-checks the three `direct` conditions before acting. If any fails, it does not fix the finding and stops with `stop: blocker`, and the finding is re-routed to the Architect.

**Skipping QA:** when the spec's Protected Behaviors section reads `None - this work changes no behavior`, the coordinator goes from build straight to gates.

A finding is routed once. If the same finding is raised again after its fix, the coordinator stops for the user.

### 3. Roles

| Role | Runs as | Edits | Stops for the user when |
|---|---|---|---|
| Architect | Interactive session. One-shot for remediation under the coordinator in Claude Code | `.gsd/` only | Always, for plan and test budget approval. For approval of an appended remediation phase |
| Builder | Autonomous | Source code. Never QA's tests unless a task says so | A deviation it cannot resolve inside the task, or a blocker after two heal attempts |
| QA Engineer | Autonomous | Tests, fixtures, test config. Never source | It wants to add a behavior to the budget, prune an existing test, or leave a budgeted behavior untested |
| Reviewer | Autonomous | `review.md`, `notes.md` findings, peer review files | Never. It reports findings |
| Integrator | Autonomous, two runs | `pr.md`, then push and PR | Always, for ship approval between its two runs |
| Coordinator | The session the user talks to | In `status.md`: the stage after gates and its own history lines. In `notes.md`: the status or route line of a `route: user` finding, to record the user's decision | It relays every stop above, verbatim |

**Architect changes**
- Branching: on a feature branch with no `.gsd/<slug>/` folder (a fresh worktree), it uses that branch. On the base branch, it creates the branch after approval, as in v1.
- No archiving steps.
- Asks for `## Workflow options` and `## Commands` when `project-context.md` lacks them.
- Writes task IDs, a `PR strategy: single | stacked (<reason>)` line, and seeds `status.md` and `notes.md`.
- The Lavish alignment flow moves to `skills/lavish/architect-alignment.md`, read only when the option is on and the work is UI work.
- Backlog intake (`next`, backlog IDs, status flips, Notion sync) moves to `skills/backlog-protocol`, read only when the option is on.
- Remediation mode handles only `route: architect` findings.

**Builder changes**
- Runs every remaining phase in one run unless told otherwise.
- No per-action logging. It ticks tasks in `status.md` and writes to `## Deviations` only when it departs from the plan.
- Accepts `route: direct` findings as work, under the re-check above.
- Atomic commit per task, no push, as in v1.

**QA Engineer changes**
- The Protected Behaviors list is the approved budget. It builds the ledger and proceeds without a stop when the ledger stays inside the budget.
- Stops with `stop: budget` only for the three departures in the table.
- Category B implementation bugs become findings. QA still never edits source, and still commits its failing tests as proof.
- Re-verification mode is kept.

**Reviewer changes**
- **Self mode** (given a slug): reads the spec, `notes.md`, and the three-dot branch diff, applies the `review` skill, writes `review.md`, and records blocker and important findings in `notes.md` with routes.
- **Peer mode** (given a PR): as v1, writing to `.gsd/peer-reviews/<slug>.md` only when it finds issues.
- The spawn prompt carries no characterization of the work, as in v1.

**Integrator changes**
- **Run 1:** run the gates script, confirm no open blocker or important finding remains, draft the PR into `pr.md` from the spec, the notes, and the repo's PR template, then stop with `stop: ship-approval`.
- **Run 2, after approval:** push, check for an existing PR, `gh pr create` with `pr.md` as the body, record the URL. Close the backlog item only when the backlog option is on.
- No self-review, no debug cleanup edits, no kickback routing.

### 4. Gates script

`skills/gates/scripts/gates.mjs`, Node 22+, no dependencies. `skills/gates/SKILL.md` documents how to call it.

```
node gates.mjs --base <branch> [--test "<cmd>"] [--lint "<cmd>"]
               [--protected <path,path>] [--notes <path to notes.md>] [--json]
```

| Check | Fails the run | Route of the finding |
|---|---|---|
| Test command exits non-zero | Yes | architect |
| Lint command exits non-zero | Yes | direct |
| Skip marker on an added line (`.skip`, `.only`, `xit`, `it.todo`, `pytest.skip`, `@pytest.mark.skip`) | Yes | qa |
| Debug leftover on an added line (`console.log`, `debugger`, `TODO`, `FIXME`) | Yes | direct |
| AI attribution in a commit message on the branch | Yes | user |
| Protected file changed (CI config, dependency manifests, lockfiles, build config, plus `--protected`) | No, warning | none |
| Base branch has moved ahead | No, warning | none |

- "Added line" means a `+` line of `git diff <base>...HEAD`.
- With `--notes`, each failure is appended to `## Findings` in the finding format. This keeps the coordinator from writing content.
- Exit code 0 when nothing failed, 1 otherwise. `--json` prints the machine-readable result.

### 5. Coordinator

`skills/coordinator/SKILL.md`, entered through `/coordinator [ticket]` (see the task 1.3 decision in `log.md`). It has a runtime-agnostic core and one section per runtime.

**Core routing (reads `status.md` and the findings' `route` and `status` lines)**

| State | Next step |
|---|---|
| No `.gsd/<slug>/` for this branch | Planning is needed. Claude Code: tell the user to run `/architect`. Orca: open the Architect in a new tab |
| `stop` is not `none` | Show `stop_detail` verbatim, wait, pass the answer verbatim to the role that stopped |
| `stage: build`, tasks unticked | Builder |
| Build finished, budget is not `None` | QA Engineer |
| Build finished, budget is `None`, or QA green | Gates script with `--notes` |
| Gates passed | Reviewer, self mode |
| Open `direct` findings | Builder, then back to QA re-verification (when tests exist), gates, Reviewer |
| Open `qa` findings | QA Engineer in re-verification mode, then gates, Reviewer |
| Open `architect` findings | Architect remediation, then `stop: remediation-approval`, then Builder |
| Open `user` findings | Stop for the user |
| No open blocker or important finding | Integrator run 1, then `stop: ship-approval`, then run 2 |

**Coordinator rules**
- It never writes or edits a spec, plan, finding, or PR draft.
- Its prompt to a role contains only the slug, the file paths, and the user's words verbatim.
- It never answers a stop on the user's behalf.
- It can be killed and restarted at any time. The new one resumes from `status.md`.

**Runtime sections**
- **Claude Code** - roles are subagents. Follow-ups reuse the same subagent when it still exists, and otherwise start a fresh one that reloads from the files. Built and verified in this work.
- **Orca, stable commands** - deferred to `orca-checklist.md`.
- **Orca, orchestration** - deferred to `orca-checklist.md`.

### 6. Install script and paths

`scripts/install.mjs`, Node 22+, no dependencies.

```
node scripts/install.mjs [--provider claude] [--scope global | --project <path>] [--dry-run]
```

- Links each agent file, each skill folder, and each command file individually into the provider's folders. It does not link whole directories, so files other tools install there do not land in this repository.
- Global scope also links `AGENTS.md` as the provider's global instructions file, only when none exists.
- It never overwrites. An existing path is reported and skipped.
- Agents refer to skills by name ("load the `state-machine` skill"), never by path.
- How a command file imports an agent definition without a hardcoded path is decided in task 1.3 after checking the Claude Code documentation. It must not be assumed.

## Protected Behaviors

| Behavior | Reason | Level |
|---|---|---|
| `gates.mjs` exits 1 and names the check when the test or lint command fails | AC 6 | Integration (temp git repo) |
| `gates.mjs` flags a skip marker or debug leftover only when it is on a line the branch added | AC 6 | Integration |
| `gates.mjs` flags AI attribution in a branch commit message | AC 6 | Integration |
| `gates.mjs` reports protected-file changes and a moved base as warnings without failing | AC 6 | Integration |
| `gates.mjs --notes` appends findings in the finding format with the right route | AC 6 | Integration |
| `install.mjs` links each agent, skill, and command individually into the target | AC 5 | Integration (temp dir) |
| `install.mjs` never overwrites an existing path and reports it | AC 5 | Integration |
| `install.mjs --dry-run` changes nothing | AC 5 | Integration |

The prompt files have no automated tests. They are verified by the dry run in Phase 6 (AC 9), which is a manual check.

## What NOT To Do

- Do not write the Orca runtime sections from the documentation alone. They are written on a machine with Orca, after the trial in `orca-checklist.md`.
- Do not add parallel tasks within one feature. Task IDs exist so it can be added later.
- Do not change the content of `skills/impeccable`, `skills/lavish/SKILL.md`, `skills/copywriting`, `skills/copy-editing`, `skills/back-prop`, `skills/roadmap-generator`, `skills/backlog-list`, `agents/impeccable-*`, or `scripts/notion-sync`.
- Do not weaken a v1 edit limit: QA never edits source, the Builder never edits QA's tests without a plan task, the Architect and Reviewer never edit source.
- Do not let the coordinator author content.
- Do not use the em dash in any file.
- Do not add AI attribution to any commit, PR, or file.

## Execution Guidelines

- **Affected files:** see the plan. New: `skills/coordinator/`, `skills/architect/`, `skills/pm/`, `skills/gates/`, `scripts/install.mjs`, `skills/lavish/architect-alignment.md`. Removed: `agents/pm.md`, `commands/architect.md`, `commands/pm.md`.
- **Watch-outs:**
  - `skills/review/SKILL.md` and `skills/testing-standards/SKILL.md` refer to v1 log sections (`### QA & Testing Summary`, `### QA Re-Verification`). Every such reference must move to the `notes.md` sections.
  - Agent `name:` frontmatter values are what `subagent_type` matches. Do not rename existing agents.
  - This machine's `~/.claude` links point at a different repository. Test with a project-scope install into a scratch project, never by changing the global links.
- **Verification focus:** the two scripts by their tests. Everything else by the Phase 6 dry run.
- **Progress:** tick tasks in `docs/v2/log.md`. This folder is tracked in git on purpose, so the work can continue on another machine.
- Skills: none
- PR strategy: single
