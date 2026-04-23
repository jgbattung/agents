# Local AI Agent Workflow

A globally accessible, highly adaptable AI agent toolset designed to automate the software development lifecycle (SDLC).

These agents live in a centralized directory (e.g., `~/agents/`) but execute locally within any project. They maintain strict interconnectivity and prevent LLM hallucination by passing context through a local, git-ignored state machine folder (`.gsd/`).

---

## The 6-Agent Lifecycle

This workflow mimics a real-world engineering team, compartmentalizing tasks to preserve context windows and maintain strict quality control.

| Agent | Role | Responsibility |
|---|---|---|
| **@PM** | The Product Manager | Parses external PRDs or generates stories from rough ideas, breaks them into backlog items with acceptance criteria, and prioritizes work. |
| **@Architect** | The Planner | Analyzes feature requirements, deduces branch strategies, researches approaches, and outputs a strict XML execution plan and feature spec. |
| **@Builder** | The Executor | Implements the Architect's XML plan phase-by-phase. Enforces manual git commits at every checkpoint and strictly logs all code changes and deviations. |
| **@QAEngineer** | The Tester | Reads the Builder's logs, pattern-matches existing repository test styles, writes comprehensive tests, and self-heals minor implementation bugs until the suite is green. |
| **@Integrator** | The Tech Lead | Verifies the plan was completed, runs a self-review quality gate, scrubs the branch of debug artifacts, and drafts a standardized Pull Request. |
| **@Guide** | The Senior Mentor | Analyzes the finished code and artifacts to generate an educational walkthrough, highlighting architectural "Aha!" moments and explaining complex snippets to the user. |

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

## Quick Start

1. Clone this repository into your global agents directory:
   ```bash
   git clone https://github.com/jgbattung/agents.git ~/agents/
   ```

2. Navigate to your target project repository.

3. **(Optional)** Invoke the PM to break down a PRD or idea into backlog items:
   ```
   @PM Here's our PRD: docs/prd-v1.md
   ```

4. Invoke the Architect to begin planning a feature:
   ```
   @Architect I need to build [Feature Name]. Here's the description: ...
   ```

5. Follow the agent handoff instructions as you move through the lifecycle.
