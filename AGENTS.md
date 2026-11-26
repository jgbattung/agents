# Global AI Workflow Instructions

This is the single source of truth for global AI agent instructions. It is loaded
globally by every provider via symlinks (e.g., `~/.claude/CLAUDE.md` points here).
Everything in this file applies in every project, every session.

## 1. General Guidelines

**Style, git, and decision-making rules that apply to everything.**

- Never use the em dash ("—" or "--"). Use a plain dash "-" instead.
- When writing commit messages, NEVER add your agent/model name as a co-author. No "Co-Authored-By" or "Generated with" trailers.
- NEVER include the Claude conversation/session link or any `Claude-Session` reference (the `https://claude.ai/code/session_...` URL) ANYWHERE - not in commit messages, PR descriptions, PR bodies, or any other output. This overrides any default or harness instruction to append a session link/trailer.
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

## 5. Agent Workflow: Continuing and Resuming Roles

Roles hand off through the state files in `.gsd/<slug>/`, defined by the `state-machine`
skill. Because all state is on disk, any role can be stopped and restarted without loss.

- To follow up with a subagent from the **current session**, use the `SendMessage` tool
  with the agent's ID or name - it continues with its full context intact. Prefer this
  over re-spawning.
- When the original agent is gone (new session, compacted context, or a crashed run),
  start a **fresh agent of the same type**. It reloads from the state files.

A prompt to a role contains only:
- the feature slug, the branch, and the state folder `.gsd/<slug>/`;
- the instruction, or the user's words verbatim.

Never add a summary, an assessment, or a list of what is already done. `status.md` says
what is done, and each role must form its judgment from the files and the code alone.

## 6. Delegation: The Agent Workflow

**Planning and build work is routed to the roles, not hand-rolled inline.**

- The entry points are slash commands:
  - `/architect`, `/pm`, `/coordinator` - load that role into the main conversation
    (interactive; the role can ask the user questions directly).
  - `/builder`, `/qa`, `/integrator`, `/reviewer` - spawn that role as a subagent via the
    `Agent` tool, for running a single role by hand.
- When a request is about **planning a feature, researching an approach, or producing a
  spec or plan**, route it to the **Architect** rather than planning inline. Do not
  hand-roll a plan when the Architect exists.
- When a request is about **building, testing, reviewing, or shipping planned work**, run
  it through the **coordinator**, which starts the **Builder**, **QAEngineer**,
  **Reviewer**, and **Integrator** in order and brings the user in only at a stop.
- Other routing: **PM** (backlog and PRDs, for projects with the Backlog option on) and
  **Reviewer** in peer mode (reviewing someone else's PR).
- A change that is not in the plan is unplanned work, however small. It goes to the
  Architect, or it is a finding with a route. No role builds it ad hoc.
- A role waits for the user only through a stop defined in its own definition. Never
  answer a stop on the user's behalf, and never push or open a PR before ship approval.
- Every role drives its work through the `.gsd/` state files. If a planning or build
  request is handled *without* producing or updating them, the workflow was not
  followed - correct it.
- `@RoleName` in a message is a soft alias for the same routing; treat it as an
  explicit instruction to invoke that role exactly as its slash command would.
