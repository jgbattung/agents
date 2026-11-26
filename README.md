# Local AI Agent Workflow

A set of AI agent roles, skills, and scripts that take a ticket from plan to pull request, with you deciding at the points that matter and nowhere else.

The workflow is built on three rules:

1. **Every role works in its own session.** No single context holds the whole feature.
2. **Roles hand off through files, never through a summary.** The files in `.gsd/` are the shared source of truth.
3. **You own the decisions.** You approve the plan, you rule on exceptions, and nothing leaves your machine until you approve it.

The repository can live at any path. It is installed into the tools that use it by a script (see **Setup**).

> **Status:** version 2. It runs in Claude Code today. The Orca ADE runtime is pending the trial in `docs/v2/orca-checklist.md`. The previous sequential workflow is the `v1` tag.

---

## The Roles

| Role | Invoke | What it does | Edits |
|---|---|---|---|
| **Architect** | `/architect` | Researches the codebase, proposes an approach, and after you approve, writes the spec and the plan. Also plans every fix that needs a design decision. | `.gsd/` only |
| **Coordinator** | `/coordinator` | Runs the plan through the roles below and brings you in only at a stop. It routes; it never writes content or answers for you. | Status lines only |
| **Builder** | run by the coordinator | Implements the plan's tasks, one atomic commit each. Builds only what was planned. | Source code |
| **QA Engineer** | run by the coordinator | Writes the smallest set of tests that protects what the feature changed. Never edits source. | Tests only |
| **Reviewer** | run by the coordinator, or `/reviewer` | Reviews the finished branch against its spec. Also reviews another developer's PR against its ticket. | Review files only |
| **Integrator** | run by the coordinator | Runs the gates, drafts the PR, and after you approve, pushes and opens it. | The PR draft only |
| **PM** (optional) | `/pm` | Turns a PRD or rough idea into prioritized backlog items. Only for projects that use the local backlog. | `backlog/` |

`/builder`, `/qa`, and `/integrator` also exist for running a single role by hand.

---

## How a Ticket Flows

```
you ── ticket ──> Architect ── proposal ──> you approve          (gate 1)
                      │
                      └─ spec + plan
                             │
Coordinator ──> Builder ──> QA ──> gates ──> Reviewer ──> Integrator ── PR draft ──> you approve   (gate 3)
                   ^                             │                                        │
                   └──── fixes, routed by rule ──┘                                   push + PR

                    any role may stop on an exception ──> you decide                 (gate 2)
```

### The three gates

| Gate | When | What you decide |
|---|---|---|
| **1. Plan approval** | Before anything is written | The approach, and the **Protected Behaviors**: the list of behaviors that must not break. That list is the test budget |
| **2. Exceptions** | Only when something departs from what you approved | A build deviation or blocker, a change to the test budget, a remediation phase, a finding that came back after its fix |
| **3. Ship approval** | Before anything is pushed | The PR title and description, and the commits going out |

Roles do not stop to report progress or to re-confirm approved work.

### How fixes are routed

Every problem a role raises is a **finding** with a route. The first rule that matches wins:

| Route | When | Who fixes it |
|---|---|---|
| `user` | AI attribution in commit history, or a finding that came back after its fix | You decide |
| `qa` | The finding concerns test code only | QA Engineer |
| `direct` | It names the exact location to change, changes no protected behavior, and a failing test or gate check already proves it | Builder, with no re-planning |
| `architect` | Everything else | Architect plans a phase, you approve it, Builder builds it |

When the spec's Protected Behaviors read `None - this work changes no behavior`, QA is skipped.

---

## State (`.gsd/`)

All state lives in a `.gsd/` folder in the project, excluded from git. Each feature has its own folder, named after its branch, so several features can be in progress at once.

```
.gsd/
  project-context.md        stack, conventions, commands, workflow options
  <slug>/
    spec.md                 what you approved
    plan.xml                the tasks
    status.md               where the pipeline is, and any open stop
    notes.md                decisions, deviations, findings, test ledger
    review.md               the Reviewer's last review
    pr.md                   the PR draft awaiting your approval
  peer-reviews/<slug>.md    reviews of other developers' PRs
```

Git records what changed. These files record only what git cannot: what was approved, where things stand, and what went differently. The full protocol is the `state-machine` skill.

---

## Skills (`skills/`)

### Roles

| Skill | Description |
|---|---|
| `architect` | The Architect's definition. Invoked as `/architect`. |
| `coordinator` | The coordinator's definition. Invoked as `/coordinator`. |
| `pm` | The PM's definition. Invoked as `/pm`. |

### Workflow

| Skill | Description |
|---|---|
| `state-machine` | The `.gsd/` layout, the status and notes files, finding routes, and the stop protocol. Loaded by every role. |
| `gates` | The mechanical checks as a script: test and lint commands, skip markers and debug leftovers on added lines, AI attribution in commits, protected files, branch freshness. |
| `testing-standards` | What earns a test, what never does, how strong a test must be, and how tests are pruned and judged. |
| `review` | The code quality review the Reviewer applies. Also usable on demand. |
| `git-standards` | Commit message format and the no-AI-attribution rule. |

### Per-project options

The Architect asks about these once per project and records the answer under `## Workflow options` in `.gsd/project-context.md`. With an option off, no role reads the files it covers.

| Option | What it turns on |
|---|---|
| **Visual alignment** | For UI work, the Architect presents its proposal as a `lavish` review page instead of text. |
| **Backlog** | The `/pm` role, the `backlog/` folder (`backlog-protocol`, `backlog-list`), `roadmap-generator`, and the Notion mirror. The Architect accepts a backlog ID or `next` as the ticket, and the Integrator closes the item when its PR opens. |

### On demand

| Skill | Description |
|---|---|
| `impeccable` | Frontend design toolkit (`/impeccable <command>`). You invoke it; no role calls it. |
| `copywriting`, `copy-editing` | Marketing and page copy. Selected per ticket by the Architect when the work involves copy. |
| `lavish` | Turns plans, comparisons, and reports into reviewable HTML pages. |
| `back-prop` | Back-propagates reusable components from a deployed prototype into the canonical component library. |

> To add a skill, create `skills/<name>/SKILL.md` with a `name` and a `description` in its frontmatter, then run the install script again. The Architect uses the description to decide relevance and records the skills it selects on the spec's `Skills:` line, so the Builder and QA Engineer load exactly those.

---

## Setup

### 1. Prerequisites

| Tool | Needed for |
|---|---|
| Claude Code | Everything |
| `git` | Everything |
| Node.js 22+ | The install script, the gates script, and the optional Lavish and Notion pieces |
| GitHub CLI (`gh`), authenticated with `gh auth login` | The Integrator (opening PRs), the Reviewer (reading PRs), and tickets given as GitHub issues |

### 2. Clone anywhere

```bash
git clone https://github.com/jgbattung/agents.git
cd agents
```

### 3. Install

The install script links each agent, skill, and command individually into the tool's folders. It never overwrites anything: an existing path is reported and skipped.

```bash
# See what it would do
node scripts/install.mjs --dry-run

# All projects (links into ~/.claude, and AGENTS.md as ~/.claude/CLAUDE.md)
node scripts/install.mjs

# One project only (links into <project>/.claude)
node scripts/install.mjs --project /path/to/project
```

- If a target folder such as `~/.claude/skills` is itself a symlink to somewhere else, the script refuses to link into it and says so. Remove that link first, or use a project install.
- On Windows, creating symlinks needs Developer Mode or an elevated shell.
- After pulling new agents or skills, run the script again. Existing links are left alone.

`AGENTS.md` is the global instructions file. It carries the provider-neutral name; the script links it to the name each tool expects.

### 4. Turn off Claude Code's own attribution

The roles never add AI attribution to commits or PRs (Rule Zero of the `git-standards` skill), and the gates fail a branch that has any. Also switch off the tool default so nothing appends it behind their back. Add this to `~/.claude/settings.json`:

```json
{
  "attribution": { "commit": "", "pr": "" }
}
```

### 5. Verify

Start a new Claude Code session in any project and type `/`. You should see `/architect`, `/coordinator`, `/pm`, `/builder`, `/qa`, `/integrator`, and `/reviewer`. If they are missing, run the install script with `--dry-run` and read what it reports.

### 6. Optional: Notion backlog mirror

Only for allowlisted personal projects. Setup is in `skills/backlog-protocol/scripts/notion-sync/README.md`. A failed sync never blocks anything.

---

## Quick Start

1. Complete **Setup**.
2. In your project, start on a branch for the ticket, or on the base branch and let the Architect create one.
3. Plan the ticket. The first run in a project also asks for the team's conventions, the test and lint commands, and the workflow options.
   ```
   /architect <ticket text, or a GitHub issue number or URL>
   ```
4. Approve the proposal. The Architect writes the spec and plan to `.gsd/<slug>/`.
5. In a fresh session on the same branch, run the pipeline:
   ```
   /coordinator
   ```
6. Answer the stops as they come. The last one is the PR draft.

To review someone else's PR, check out their branch and run `/reviewer <PR number> <acceptance criteria>`.

---

## Runtimes

| Runtime | Status | How roles run |
|---|---|---|
| **Claude Code** | Built | The Architect in its own session. Every other role as a subagent of the coordinator's session. |
| **Orca ADE** | Pending | Each role in its own terminal tab of the ticket's worktree, with one worktree per ticket. To be written and verified by following `docs/v2/orca-checklist.md`. |

The roles, the state files, and the scripts are the same in both. Only the coordinator's runtime section differs.

---

## Tests

The two scripts have tests. The role and skill files are verified by running a ticket through the pipeline.

```bash
node --test scripts/install.test.mjs skills/gates/scripts/gates.test.mjs
```
