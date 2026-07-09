# Local AI Agent Workflow

A globally accessible, highly adaptable AI agent toolset designed to automate the software development lifecycle (SDLC).

These agents live in a centralized directory (e.g., `~/agents/`) but execute locally within any project. They maintain strict interconnectivity and prevent LLM hallucination by passing context through a local, git-ignored state machine folder (`.gsd/`).

---

## The 6-Agent Lifecycle

This workflow mimics a real-world engineering team, compartmentalizing tasks to preserve context windows and maintain strict quality control.

| Agent | Invoke | Role | Responsibility |
|---|---|---|---|
| **PM** | `/pm` | The Product Manager | Parses external PRDs or generates stories from rough ideas, breaks them into backlog items with acceptance criteria, and prioritizes work. |
| **Architect** | `/architect` | The Planner | Analyzes feature requirements, deduces branch strategies, researches approaches, and outputs a strict XML execution plan and feature spec. |
| **Builder** | `/builder` | The Executor | Implements the Architect's XML plan phase-by-phase. Enforces manual git commits at every checkpoint and strictly logs all code changes and deviations. |
| **QAEngineer** | `/qa` | The Tester | Reads the Builder's logs, pattern-matches existing repository test styles, writes comprehensive tests, and self-heals minor implementation bugs until the suite is green. |
| **Integrator** | `/integrator` | The Tech Lead | Verifies the plan was completed, runs a self-review quality gate, scrubs the branch of debug artifacts, and drafts a standardized Pull Request. |
| **Guide** | `/guide` | The Senior Mentor | Analyzes the finished code and artifacts to generate an educational walkthrough, highlighting architectural "Aha!" moments and explaining complex snippets to the user. |

### Invoking Agents (Claude Code)

Each agent has a slash command (defined in `commands/`) - type `/` in the CLI to get a
tab-completable picker. The commands come in two flavors:

- **Main-chat persona** (`/pm`, `/architect`, `/guide`): the command inlines the agent's
  full definition into the conversation, so the agent *becomes* the session and can ask
  clarifying questions interactively. Use one session per phase.
- **Subagent spawn** (`/builder`, `/qa`, `/integrator`): the command deterministically
  spawns the agent in an isolated context window via the `Agent` tool. Follow-ups
  continue the same agent via `SendMessage`.

`@AgentName` mentions still work as a soft alias, but the slash commands are the
canonical, deterministic entry points.

---

## The State Machine (`.gsd/`)

To allow agents to pause, hand off tasks, and recover from failures, all state is saved locally in the project root inside a `.gsd/` directory.

| File | Purpose |
|---|---|
| `.gsd/project-context.md` | Repo framework, stack, and test commands. |
| `.gsd/[feature]-spec.md` | Feature requirements and architectural decisions. |
| `.gsd/[feature]-plan.xml` | The atomic, phase-by-phase task list. |
| `.gsd/[feature]-log.md` | The Builder & QA's running ledger of changes. |
| `.gsd/[feature]-review.md` | Code quality review findings. |
| `.gsd/[feature]-pr-draft.md` | The Integrator's final GitHub PR copy. |
| `.gsd/[feature]-walkthrough.md` | The Guide's code explanation. |

---

## Skills (`skills/`)

Skills are knowledge files that define standards, protocols, and domain expertise followed across all projects. Agents load them explicitly as part of their defined phases.

### Workflow Skills

| Skill | Description |
|---|---|
| `state-machine` | Protocols for reading/writing the `.gsd/` state directory, used by all agents. |
| `git-standards` | Standardized multi-line git commit message format, used at agent handoff points. |
| `gh-pr-template` | Standard format for GitHub Pull Request descriptions, used by the Integrator. |
| `review` | Code quality review that checks correctness, security, readability, DRY/YAGNI/SOLID compliance, and more. Used by the Integrator and available on-demand. |
| `ui-ux-pro-max` | Comprehensive UI/UX design intelligence — 67 styles, 96 palettes, 57 font pairings, 25 chart types across 13 technology stacks. Applied when designing or reviewing UI components. |

### Product & Backlog Skills

| Skill | Description |
|---|---|
| `backlog-protocol` | Strict protocols for CRUD operations on backlog items — file creation, status transitions, ID management, and archive moves. Used by the PM. |
| `backlog-list` | Reads the `backlog/` folder and displays items grouped or filtered by status, priority, or epic. User-invocable. |
| `roadmap-generator` | Generates `ROADMAP.md` and an optional `ROADMAP.html` visual board from backlog items, grouped by epic with progress bars. Used by the PM. |

> To add a new skill, create a `SKILL.md` inside a new subfolder under `skills/`. The YAML frontmatter must include a `name` and a `description` — the Architect uses this description to decide relevance.

---

## Machine Setup

This repo is the **source of truth** for the entire AI workflow. Nothing works until
it is projected into the locations your AI tooling reads, via symlinks:

| Link (what the tool reads) | Target (in this repo) | Purpose |
|---|---|---|
| `~/.claude/agents` | `~/agents/agents` | Claude Code agent definitions |
| `~/.claude/skills` | `~/agents/skills` | Claude Code skills |
| `~/.claude/commands` | `~/agents/commands` | Claude Code slash commands (agent invocation) |
| `~/.claude/CLAUDE.md` | `~/agents/AGENTS.md` | Global memory (all projects) |

`AGENTS.md` is the single global instructions file. It carries the provider-neutral
standard name; each provider gets a symlink at whatever location/name it expects.

**Windows** (elevated PowerShell, or any shell with Developer Mode enabled):
```powershell
New-Item -ItemType SymbolicLink -Path "$HOME\.claude\agents" -Target "$HOME\agents\agents"
New-Item -ItemType SymbolicLink -Path "$HOME\.claude\skills" -Target "$HOME\agents\skills"
New-Item -ItemType SymbolicLink -Path "$HOME\.claude\commands" -Target "$HOME\agents\commands"
New-Item -ItemType SymbolicLink -Path "$HOME\.claude\CLAUDE.md" -Target "$HOME\agents\AGENTS.md"
```
> No admin rights? For `CLAUDE.md` only, a plain file at `~/.claude/CLAUDE.md`
> containing the single line `@C:\Users\<you>\agents\AGENTS.md` works identically
> (Claude Code resolves `@` imports natively).

**macOS / Linux:**
```bash
ln -s ~/agents/agents ~/.claude/agents
ln -s ~/agents/skills ~/.claude/skills
ln -s ~/agents/commands ~/.claude/commands
ln -s ~/agents/AGENTS.md ~/.claude/CLAUDE.md
```

When adopting another AI provider, add one more symlink pointing at `AGENTS.md` from
that provider's global config location (e.g., `~/.codex/AGENTS.md` for Codex).

---

## Quick Start

1. Clone this repository into your global agents directory:
   ```bash
   git clone https://github.com/jgbattung/agents.git ~/agents/
   ```

2. Create the symlinks described in **Machine Setup** above, then navigate to your target project repository.

3. **(Optional)** Invoke the PM to break down a PRD or idea into backlog items:
   ```
   /pm Here's our PRD: docs/prd-v1.md
   ```

4. Invoke the Architect to begin planning a feature:
   ```
   /architect I need to build [Feature Name]. Here's the description: ...
   ```

5. Follow the agent handoff instructions as you move through the lifecycle.
