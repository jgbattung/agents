# Global AI Workflow Instructions

This is the single source of truth for global AI agent instructions. It is loaded
globally by every provider via symlinks (e.g., `~/.claude/CLAUDE.md` points here).
Everything in this file applies in every project, every session.

## 1. General Guidelines

**Style, git, and decision-making rules that apply to everything.**

- Never use the em dash ("—" or "--"). Use a plain dash "-" instead.
- When writing commit messages, NEVER add your agent/model name as a co-author. No "Co-Authored-By" or "Generated with" trailers.
- When making technical decisions, do not give much weight to development cost. Prefer quality, simplicity, robustness, scalability, and long-term maintainability.

## 2. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 3. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 4. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 5. Agent Workflow: Continuing and Resuming Agents

Subagents spawned via the `Agent` tool run autonomously and report back. To follow up
with an agent from the **current session**, use the `SendMessage` tool with the agent's
ID or name - it continues with its full context intact. Prefer this over re-spawning.

When the original agent is gone (new session, compacted context, or a crashed run),
"resume" by **spawning a fresh agent of the same type** whose prompt reloads state from
disk. All persistent state lives in `.gsd/` (see `~/agents/README.md`), so a new agent
picks up exactly where the last one left off.

A resume prompt MUST:
- Name the feature branch and the `.gsd/[feature]-*` files to load
  (`-spec.md`, `-plan.xml`, `-log.md`).
- List which tasks are already done (by ID / title) so they are not repeated.
- State the exact task or phase to start from.
- Give brief context on what changed and why.

This is the same handoff prompt the Architect's recovery and QA-remediation modes
already generate (`~/agents/agents/architect.md`).

## 6. Delegation: The gsd Agent Workflow

**Planning and build work is routed to the specialized agents, not hand-rolled inline.**

- The canonical entry points are the slash commands defined in `~/agents/commands/`:
  - `/pm`, `/architect`, `/guide` - load that agent's full persona into the main
    conversation (interactive; the agent can ask the user questions directly).
  - `/builder`, `/qa`, `/integrator` - deterministically spawn that subagent via the
    `Agent` tool (isolated context; follow up via `SendMessage`).
- When a request is about **planning a feature, researching an approach, or producing a
  spec/plan**, route it to the **Architect** rather than planning inline. Do not
  hand-roll a plan when the Architect exists.
- Same routing for the rest of the lifecycle: **Builder** (implement an approved plan),
  **QAEngineer** (test/heal), **Integrator** (review + PR), **PM** (backlog/PRD),
  **Guide** (walkthrough).
- Every one of these agents drives its work through the `.gsd/` state machine. If a
  planning/build request is handled *without* producing or updating the relevant `.gsd/`
  artifacts, the workflow was not followed - correct it.
- `@AgentName` in a message is a soft alias for the same routing; treat it as an
  explicit instruction to invoke that agent exactly as its slash command would.
