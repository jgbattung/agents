---
name: state-machine
description: Defines the .gsd state directory - the per-feature folder layout, the status and notes files, the finding format and routes, and the stop protocol every role follows.
user-invocable: false
---

# State Machine Protocol (.gsd)

Roles never hand work to each other in conversation. They hand it off through the files below. Every role reads its inputs from these files and writes its results to them, so a role can be stopped, replaced, or restarted at any point without losing anything.

Git already records what changed. These files record only what git cannot: what was approved, where the pipeline is, and what went differently.

## 1. Layout

```
.gsd/
  project-context.md          shared by every feature
  <slug>/
    spec.md                   what was approved
    plan.xml                  the tasks
    status.md                 where the pipeline is, and any open stop
    notes.md                  decisions, deviations, findings, test ledger
    review.md                 the Reviewer's last self review
    pr.md                     the PR draft awaiting ship approval
  peer-reviews/<slug>.md      Reviewer output for another developer's PR
```

Each feature has its own folder. Folders coexist, so several features can be in progress at once. Finished features stay where they are.

## 2. Git Exclusion Rule

Every time you create the `.gsd/` directory, immediately exclude it from git without touching `.gitignore`:

```bash
grep -qxF '.gsd/' .git/info/exclude 2>/dev/null || echo '.gsd/' >> .git/info/exclude
```

The command is idempotent. Never stage or commit anything under `.gsd/`.

## 3. Slug and Active Feature

- **Slug:** the kebab-case short description of the branch name. Branch `feature/add-net-worth-component` gives the slug `add-net-worth-component`.
- **Active feature:** the folder whose name matches the slug of the current branch (`git branch --show-current`).
- If no folder matches the current branch, do not pick another one. Say which folders exist and ask.
- Read and write only the active feature's folder and `project-context.md`. Other features' folders belong to other work.

## 4. Project Context

`.gsd/project-context.md` is the repository's memory across features.

- **Merge-only:** add new patterns, stack details, and discoveries. Never delete or overwrite what is there.
- **Three sections reflect the present, not history, and are updated in place** when the user gives new or corrected information:
  - `## Conventions` - base branch, branch naming, commit format, PR template, ticket reference, protected files, other team rules.
  - `## Commands` - the exact commands the gates use, one per line:
    ```markdown
    ## Commands
    - test: <command>
    - lint: <command>
    ```
    Write `none` for a command the project does not have.
  - `## Workflow options` - which optional parts of the workflow this project uses:
    ```markdown
    ## Workflow options
    - Visual alignment (Lavish): on | off
    - Backlog (PM, backlog folder, roadmap, Notion): on | off
    ```
    When an option is `off` or the section is missing, do not read the skills or files that option covers.

## 5. The Plan

`plan.xml` keeps the `<phase>` and `<task>` structure. Every task has an `id` (`<task id="2.1">`), a `<name>`, an `<action>`, and a `<verify>`.

- Never write completion status into the plan. Progress lives in `status.md`.
- Only the Architect edits the plan. Fixes are appended as a new phase, never by rewriting earlier phases.

## 6. The Status File

`status.md` says where the pipeline is. The coordinator decides what happens next from this file and from the `route` and `status` lines of the findings in `notes.md`, and from nothing else.

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

- Before a role ends its run, it sets `stage` and `stop`, and appends one line to `## History`.
- The Builder ticks a task only after its `<verify>` passed and its commit exists.
- When the Architect appends a phase to the plan, it adds that phase's tasks to `## Tasks` unticked.
- `stage` names the step that should run next, not the one that just finished.

## 7. The Notes File

`notes.md` has fixed sections. A role appends to its own sections and never edits another role's entries, with one exception: the role that resolves a finding updates that finding's `status` line.

| Section | Written by | Content |
|---|---|---|
| `## Decisions` | Architect | The approach chosen, trade-offs, and findings deliberately not planned |
| `## Deviations` | Builder | Where the build departed from the plan, and why |
| `## Findings` | QA Engineer, Reviewer, gates script, and the Architect for review feedback from people | One entry per finding, in the format of Section 8 |
| `## Test Ledger` | QA Engineer | Each test, the behavior it protects, its reason, and its failure statement |
| `## Not Tested` | QA Engineer | Behaviors deliberately not tested or left as manual checks, with reasons |

Write an entry only when there is something to record. A build that followed the plan leaves `## Deviations` empty.

## 8. Findings

Every problem one role raises for another is a finding in `notes.md`:

```markdown
### F<n> - <one-line title>
- source: qa | reviewer | gates | user
- severity: blocker | important | suggestion
- route: direct | architect | qa | user
- where: <file>:<line>
- proof: <failing test name, gate check name, or none>
- status: open | resolved (<commit hash>) | accepted by user
- detail: <what is wrong, expected versus actual>
```

`<n>` is the next unused number in the file. A finding must be locatable from `where` without re-scanning the code.

### Routes

Whoever raises a finding sets its `route`. Apply these rules in order and take the first that matches:

1. **`user`** - AI attribution in the branch's commit history (no role rewrites history), or a finding that repeats an earlier one which was already resolved or answered.
2. **`qa`** - the finding concerns test code only: a `[Test Quality]` finding, a skip this branch introduced, or a protected behavior with no test.
3. **`direct`** - all three of these hold:
   - it names the exact location or locations to change (a lint failure names them in its output);
   - fixing it adds or changes no protected behavior;
   - a failing test or a gate check already proves it, or it is the removal of a `[Debug Leftover]`.
4. **`architect`** - everything else.

The Builder re-checks the three `direct` conditions before acting on such a finding. If any does not hold, it leaves the finding unfixed and stops with `stop: blocker`, and the finding goes to the Architect.

A finding is routed once. If the same finding is raised again after its fix or its answer, it is raised with `route: user` and names the earlier finding, and the user decides.

Suggestions are not routed. They are listed in the PR description.

## 9. The Stop Protocol

A stop is the only time a role waits for the user. Each role's definition lists the stops it may raise. It may raise no others.

To stop:

1. Write `stop: <type>` and a `stop_detail` paragraph in `status.md`. The detail must let the user decide without opening other files: what happened, the options, and what you recommend.
2. Append the `## History` line.
3. End your run with the stop detail as your final message. Do not continue past the stop in the same run.

To resume, you are given the user's answer. Treat it as the user's decision, set `stop: none` and clear `stop_detail`, and continue from where you stopped.

Do not ask for confirmation of work that was already approved. Approved work proceeds without a stop.
