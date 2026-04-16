# Local AI Agent Workflow

A globally accessible, highly adaptable AI agent toolset designed to automate the software development lifecycle (SDLC).

These agents live in a centralized directory (e.g., `~/.agents/`) but execute locally within any project. They maintain strict interconnectivity and prevent LLM hallucination by passing context through a local, git-ignored state machine folder (`.gsd/`).

---

## The 5-Agent Lifecycle

This workflow mimics a real-world engineering team, compartmentalizing tasks to preserve context windows and maintain strict quality control.

| Agent | Role | Responsibility |
|---|---|---|
| **@Architect** | The Planner | Analyzes Jira requirements, deduces branch strategies, researches approaches, and outputs a strict XML execution plan and feature spec. |
| **@Builder** | The Executor | Implements the Architect's XML plan phase-by-phase. Enforces manual git commits at every checkpoint and strictly logs all code changes and deviations. |
| **@QAEngineer** | The Tester | Reads the Builder's logs, pattern-matches existing repository test styles, writes comprehensive tests, and self-heals minor implementation bugs until the suite is green. |
| **@Integrator** | The Tech Lead | Verifies the plan was completed, scrubs the branch of debug artifacts (`console.log`, `.skip`), and drafts a standardized Pull Request. |
| **@Guide** | The Senior Mentor | Analyzes the finished code and artifacts to generate an educational walkthrough, highlighting architectural "Aha!" moments and explaining complex snippets to the user. |

---

## The State Machine (`.gsd/`)

To allow agents to pause, hand off tasks, and recover from failures, all state is saved locally in the project root inside a `.gsd/` directory.

| File | Purpose |
|---|---|
| `.gsd/project-context.md` | Repo framework, stack, and test commands. |
| `.gsd/[feature]-spec.md` | Jira requirements and architectural decisions. |
| `.gsd/[feature]-plan.xml` | The atomic, phase-by-phase task list. |
| `.gsd/[feature]-log.md` | The Builder & QA's running ledger of changes. |
| `.gsd/[feature]-pr-draft.md` | The Integrator's final GitHub PR copy. |
| `.gsd/[feature]-walkthrough.md` | The Guide's code explanation. |

---

## Workflow Skills (`skills/`)

Workflow skills are agent-internal knowledge files that define standards and protocols followed across all projects. Unlike domain skills, these are always active — agents load them explicitly as part of their defined phases.

| Skill | Description |
|---|---|
| `gh-pr-template` | Standard format for GitHub Pull Request descriptions, used by the Integrator. |
| `git-standards` | Standardized multi-line git commit message format, used at agent handoff points. |
| `state-machine` | Protocols for reading/writing the `.gsd/` state directory, used by all agents. |

---

## Domain Skills (`domain-skills/`)

Domain skills are project-specific knowledge files that agents load automatically when relevant. They encode conventions, patterns, and rules for specific technologies or frameworks used in your project.

The **Architect** scans this folder during its context-gathering phase, reads each skill's frontmatter `description` field, and selects the ones relevant to the current work item. Selected skills are recorded in `.gsd/project-context.md` under `## Active Domain Skills` so that all downstream agents (Builder, QA Engineer, Integrator, Guide) can load and apply them without re-discovering them.

| Skill | Description |
|---|---|
| `cet-ant-tasks` | Writing and updating CET/ANT task XML files for HCL WebSphere Portal / DX Theme. |
| `dx-auth-simple` | Simple authentication mechanism for connecting to HCL DX API endpoints. |
| `dx-base-url` | Reference for HCL DX server base URL shapes across on-premises, Kubernetes, and REST API patterns. |
| `wcm-library-structure` | HCL DX WCM library organization, item types, and folder structure conventions. |

> To add a new domain skill, create a `SKILL.md` inside a new subfolder under `domain-skills/`. The YAML frontmatter must include a `name` and a `description` written as `"Use this skill when..."` — the Architect uses this description to decide relevance.

---

## Quick Start

1. Clone this repository into your global agents directory:
   ```bash
   git clone https://git.cwp.pnp-hcl.com/jirehjohn-battung/agents.git ~/.agents/
   ```

2. Navigate to your target project repository.

3. Open a chat session and invoke the Architect to begin planning a feature:
   ```
   @Architect I need to build [Feature Name]. Here are the Jira details: ...
   ```

4. Follow the agent handoff instructions as you move through the lifecycle.
