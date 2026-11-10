# Local AI Agent Workflow

A globally accessible, highly adaptable AI agent toolset designed to automate the software development lifecycle (SDLC).

These agents live in one centralized directory, `~/agents/` (the path is hardcoded in the agent files), but execute locally within any project. They maintain strict interconnectivity and prevent LLM hallucination by passing context through a local, git-ignored state machine folder (`.gsd/`).

---

## The 6-Agent Lifecycle

This workflow mimics a real-world engineering team, compartmentalizing tasks to preserve context windows and maintain strict quality control.

| Agent | Invoke | Role | Responsibility |
|---|---|---|---|
| **PM** | `/pm` | The Product Manager | Parses external PRDs or generates stories from rough ideas, breaks them into backlog items with acceptance criteria, and prioritizes work. |
| **Architect** | `/architect` | The Planner | Analyzes feature requirements, records the team's conventions, researches approaches, and outputs a strict XML execution plan and feature spec. Also plans every remediation: QA findings, Integrator findings, and PR review feedback all come back here. |
| **Builder** | `/builder` | The Executor | Implements the Architect's XML plan phase-by-phase, with one atomic commit per task and a checkpoint stop per phase. Strictly logs all code changes and deviations. Only ever builds tasks that are in the plan. |
| **QAEngineer** | `/qa` | The Tester | Reads the Builder's logs, pattern-matches existing repository test styles, writes comprehensive tests, and self-heals its own test code. Never edits source code: every implementation bug it finds is logged and routed to the Architect for a remediation phase. Re-verifies instead of starting over when run again after remediation. |
| **Integrator** | `/integrator` | The Tech Lead | Verifies the plan was completed, runs a self-review quality gate, scrubs the branch of debug artifacts, runs the mechanical gates, and opens the Pull Request using the repo's PR template and conventions. Findings that need a code change go to the Architect, never straight to the Builder. |
| **Reviewer** | `/reviewer` | The Peer Reviewer | Standalone and off-cycle. Reviews another developer's Pull Request against the ticket's Acceptance Criteria and the relevant skills, runs the PR's executable "How to test" steps, and writes a review file only when it finds issues. |

### Invoking Agents (Claude Code)

Each agent has a slash command (defined in `commands/`) - type `/` in the CLI to get a
tab-completable picker. The commands come in two flavors:

- **Main-chat persona** (`/pm`, `/architect`): the command inlines the agent's
  full definition into the conversation, so the agent *becomes* the session and can ask
  clarifying questions interactively. Use one session per phase.
- **Subagent spawn** (`/builder`, `/qa`, `/integrator`, `/reviewer`): the command deterministically
  spawns the agent in an isolated context window via the `Agent` tool. Follow-ups
  continue the same agent via `SendMessage`.

`@AgentName` mentions still work as a soft alias, but the slash commands are the
canonical, deterministic entry points.

---

## The State Machine (`.gsd/`)

To allow agents to pause, hand off tasks, and recover from failures, all state is saved locally in the project root inside a `.gsd/` directory.

| File | Purpose |
|---|---|
| `.gsd/project-context.md` | Repo framework, stack, test commands, and the team's `## Conventions` (base branch, branch naming, commit format, PR template). |
| `.gsd/[feature]-spec.md` | Feature requirements and architectural decisions. |
| `.gsd/[feature]-plan.xml` | The atomic, phase-by-phase task list. |
| `.gsd/[feature]-log.md` | The Builder & QA's running ledger of changes. |
| `.gsd/[feature]-review.md` | Code quality review findings. |
| `.gsd/[ticket]-peer-review.md` | The Reviewer's findings on another developer's PR (only written when issues are found). |

---

## Skills (`skills/`)

Skills are knowledge files that define standards, protocols, and domain expertise followed across all projects. Agents load them explicitly as part of their defined phases.

### Workflow Skills

| Skill | Description |
|---|---|
| `state-machine` | Protocols for reading/writing the `.gsd/` state directory, used by all agents. |
| `git-standards` | Standardized multi-line git commit message format, used at agent handoff points. |
| `review` | Code quality review that checks correctness, security, readability, DRY/YAGNI/SOLID compliance, and more. Used by the Integrator and available on-demand. |
| `lavish` | Turns plans, comparisons, and reports into reviewable HTML artifacts via the `lavish-axi` CLI. Used by the Architect for visual alignment on UI work. |
| `back-prop` | Back-propagates reusable components from a deployed prototype into the canonical component library, with an audit-trail notes file. User-invocable. |

### Design & Copy Skills

| Skill | Description |
|---|---|
| `impeccable` | Hands-on frontend design toolkit (`/impeccable <command>`) - shape, critique, audit, polish, typeset, animate, clarify UX copy, live browser iteration, and more. User-invocable; not wired into the agents. |
| `copywriting` | Writes marketing and page copy - headlines, CTAs, value propositions, hero sections. Loaded by the Architect and Builder when a work item involves marketing or page copy. |
| `copy-editing` | Edits and refreshes existing marketing copy through structured sweeps. Loaded by the Architect and Builder when existing copy is revised, and by Builder as a final pass after `copywriting`. |

### Product & Backlog Skills

| Skill | Description |
|---|---|
| `backlog-protocol` | Strict protocols for CRUD operations on backlog items — file creation, status transitions, ID management, and archive moves. Used by the PM. |
| `backlog-list` | Reads the `backlog/` folder and displays items grouped or filtered by status, priority, or epic. User-invocable. |
| `roadmap-generator` | Generates `ROADMAP.md` and an optional `ROADMAP.html` visual board from backlog items, grouped by epic with progress bars. Used by the PM. |

> To add a new skill, create a `SKILL.md` inside a new subfolder under `skills/`. The YAML frontmatter must include a `name` and a `description` — the Architect uses this description to decide relevance, and records the skills it selects on a `Skills:` line in the spec so the Builder and QA Engineer load exactly those.

---

## Machine Setup

This repo is the **source of truth** for the entire AI workflow. Nothing works until
it is projected into the locations Claude Code reads, via symlinks. Follow these steps
in order on a new machine.

### 1. Prerequisites

| Tool | Needed for |
|---|---|
| Claude Code | Everything |
| `git` | Everything |
| GitHub CLI (`gh`), authenticated with `gh auth login` | The Integrator (opening PRs) and the Reviewer (reading PRs) |
| Node.js 22+ | Optional: the Lavish visual alignment step (`npx`) and the Notion backlog mirror |

### 2. Clone to exactly `~/agents`

```bash
git clone https://github.com/jgbattung/agents.git ~/agents
```

The path is not configurable: the agent files reference `~/agents/skills/...` and
`~/agents/agents/...` directly. If the repo must live elsewhere, symlink `~/agents` to it.

### 3. Create the symlinks

| Link (what the tool reads) | Target (in this repo) | Purpose |
|---|---|---|
| `~/.claude/agents` | `~/agents/agents` | Claude Code agent definitions |
| `~/.claude/skills` | `~/agents/skills` | Claude Code skills |
| `~/.claude/commands` | `~/agents/commands` | Claude Code slash commands (agent invocation) |
| `~/.claude/CLAUDE.md` | `~/agents/AGENTS.md` | Global instructions (all projects) |

**Before linking:** if any of those four link paths already exists as a real file or
folder, a symlink cannot be created over it. Move its contents somewhere safe (or into
this repo, if you want to keep them) and remove the original first. Never delete an
existing `~/.claude/CLAUDE.md` or skills folder without checking what is in it.

On macOS / Linux this fails silently: `ln -s` onto an existing folder succeeds but puts
the link *inside* it (e.g., `~/.claude/agents/agents`), so nothing loads and no error is
shown. On Windows the command errors with "item already exists" and creates nothing.

**Windows** (elevated PowerShell, or any shell with Developer Mode enabled):
```powershell
New-Item -ItemType SymbolicLink -Path "$HOME.claudeagents" -Target "$HOMEagentsagents"
New-Item -ItemType SymbolicLink -Path "$HOME.claudeskills" -Target "$HOMEagentsskills"
New-Item -ItemType SymbolicLink -Path "$HOME.claudecommands" -Target "$HOMEagentscommands"
New-Item -ItemType SymbolicLink -Path "$HOME.claudeCLAUDE.md" -Target "$HOMEagentsAGENTS.md"
```
> No admin rights? For `CLAUDE.md` only, a plain file at `~/.claude/CLAUDE.md`
> containing the single line `@C:Users<you>agentsAGENTS.md` works identically
> (Claude Code resolves `@` imports natively).

**macOS / Linux:**
```bash
ln -s ~/agents/agents ~/.claude/agents
ln -s ~/agents/skills ~/.claude/skills
ln -s ~/agents/commands ~/.claude/commands
ln -s ~/agents/AGENTS.md ~/.claude/CLAUDE.md
```

`AGENTS.md` is the single global instructions file. It carries the provider-neutral
standard name; each provider gets a symlink at whatever location/name it expects. When
adopting another AI provider, add one more symlink pointing at `AGENTS.md` from that
provider's global config location (e.g., `~/.codex/AGENTS.md` for Codex).

### 4. Turn off Claude Code's own attribution

The agents never add AI attribution to commits or PRs (Rule Zero in the `git-standards`
skill). Also switch off the harness default so nothing appends it behind their back. Add
this to `~/.claude/settings.json` (this file is per machine and is not part of this repo):

```json
{
  "attribution": { "commit": "", "pr": "" }
}
```

### 5. Verify

Start a new Claude Code session in any project and type `/`. You should see `/pm`,
`/architect`, `/builder`, `/qa`, `/integrator`, and `/reviewer`. If they are missing,
the symlinks are wrong: list `~/.claude` and check that all four links point into `~/agents`.

### 6. Optional pieces

- **Notion backlog mirror:** only for allowlisted personal projects. Skip it on a machine
  that does not need it; every other project is skipped automatically and a failed sync
  never blocks anything. Setup is in `scripts/notion-sync/README.md`.
- **Per-project setup:** none. The first `/architect` run in a repository creates
  `.gsd/`, excludes it from git, and asks you for the team's conventions.

---

## Quick Start

1. Complete **Machine Setup** above (clone to `~/agents`, create the symlinks, verify).

2. Navigate to your target project repository.

3. **(Optional)** Invoke the PM to break down a PRD or idea into backlog items:
   ```
   /pm Here's our PRD: docs/prd-v1.md
   ```

4. Invoke the Architect to begin planning a feature:
   ```
   /architect I need to build [Feature Name]. Here's the description: ...
   ```

5. Follow the agent handoff instructions as you move through the lifecycle.
