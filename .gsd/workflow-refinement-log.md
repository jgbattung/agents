# Workflow Refinement Log

> **Goal:** Port and adapt the work AI agent workflow into a personal AI agent workflow for SaaS and personal web dev projects.
> **Started:** 2026-04-16

---

## Session 1 — 2026-04-16

### Overview of Files Read
All 7 files were reviewed:
- `agents/architect.agent.md`
- `agents/builder.agent.md`
- `agents/qa-engineer.agent.md`
- `agents/integrator.agent.md`
- `agents/guide.agent.md`
- `skills/git-standards/SKILL.md`
- `skills/state-machine/SKILL.md`

### Work-Specific Elements Identified (Need Changing)
1. **Jira references** — Every agent is wired around Jira tickets. Ticket numbers drive branch names, commit prefixes, spec files, and PR drafts.
2. **`git-standards` skill** — Commit format uses Jira prefix (`DXP-1234: Add...`). Needs to switch to conventional commits.
3. **Missing `gh-pr-template` skill** — Referenced by the Integrator but was not copied from work. Needs to be created.
4. **Model names** — All agents list `(copilot)` suffix (e.g., `Claude Opus 4.6 (copilot)`). This is a work-environment-specific model ID. Needs to be updated to plain model names.
5. **Domain skills** — Work-specific HCL DX/WebSphere skills (`cet-ant-tasks`, `dx-auth-simple`, `dx-base-url`, `wcm-library-structure`) are not relevant and will not be ported.

### Decisions Made

| Topic | Decision |
|---|---|
| **Issue tracking** | No Jira. Solo developer with freeform/plaintext descriptions. Standards to be formalized (see Open Items). |
| **Commit message format** | **Conventional commits**: `feat:`, `fix:`, `refactor:`, `test:`, `chore:`, `docs:`, etc. |
| **Guide agent** | Keep it. Repurpose for personal learning — understanding what the AI built and why. |
| **Domain skills** | None ported from work. Will add new personal domain skills as needed per tech stack. |
| **`.gsd/` folder name** | Keep as-is. |
| **ui-ux-pro-max skill** | Installed into `skills/ui-ux-pro-max/` (version-controlled in the agents repo). Available globally via the `~\.claude\skills` symlink. |

### Repo Architecture (Established)
- `~\agents` is the Git repo — contains `agents/` and `skills/` subdirectories
- `~\.claude\agents` and `~\.claude\skills` are symlinks pointing into the repo
- Claude Code reads from `~\.claude\` as normal; Git only tracks `~\agents\`
- This keeps telemetry/app data out of the repo while keeping agent/skill files version-controlled

### Decisions Finalized & Changes Applied

| Item | Decision | Status |
|---|---|---|
| **Branch naming** | `feature/short-description`, `fix/short-description`, `chore/short-description` — slash + kebab-case | Done |
| **Commit format** | Conventional commits: `feat:`, `fix:`, `refactor:`, `test:`, `chore:`, `docs:`, `style:` | Done |
| **Standup Script (Guide)** | Removed entirely — not relevant for solo dev | Done |
| **`gh-pr-template` skill** | Created at `skills/gh-pr-template/SKILL.md` with 4-section personal template (What / Why / How to Test / Notes) | Done |

### Changes Made to Files

**`skills/git-standards/SKILL.md`** — Full rewrite
- Replaced Jira prefix format (`DXP-1234:`) with conventional commits
- Added type reference table (`feat`, `fix`, `refactor`, `test`, `chore`, `docs`, `style`)
- Updated example commit to use `feat(scope): description` format

**`skills/gh-pr-template/SKILL.md`** — New file created
- Personal PR template: What / Why / How to Test / Notes
- PR title follows conventional commit format
- Integrator saves draft to `.gsd/[feature]-pr-draft.md`

**`agents/architect.agent.md`**
- Model: `Claude Opus 4.6 (copilot)` → `claude-opus-4-6`
- Branch Strategy: `feature/[Ticket-Number]` → `feature/short-description` (kebab-case)
- Spec template: "Jira Requirements" → "Requirements", removed Ticket Number field

**`agents/builder.agent.md`**
- Model: `Claude Sonnet 4.6 (copilot)` → `claude-sonnet-4-6`

**`agents/qa-engineer.agent.md`**
- Model: `Claude Opus 4.6 (copilot)` → `claude-opus-4-6`
- Phase 6 hardcoded commit: `[test]:` → `test:`

**`agents/integrator.agent.md`**
- Model: `Claude Sonnet 4.6 (copilot)` → `claude-sonnet-4-6`
- Phase 2: "Jira Requirements (Ticket Number...)" → "Requirements"
- Phase 2: "Jira Context" → "Requirements"

**`agents/guide.agent.md`**
- Model: `Claude Sonnet 4.6 (copilot)` → `claude-sonnet-4-6`
- Removed "Standup Script" section from Phase 3 walkthrough template

### Remaining Open Items
- None currently. Workflow is ready to use on personal projects.
