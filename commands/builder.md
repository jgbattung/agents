---
description: Spawn the Builder subagent to implement the approved .gsd plan
argument-hint: [feature branch or plan to execute, plus any resume context]
---
Spawn the **Builder** subagent via the Agent tool now (`subagent_type: "Builder"`). Do
not implement anything inline yourself, and do not re-plan work the Architect already
planned.

Rules:
- NEVER spawn with `isolation: "worktree"` - the Builder commits directly to the user's
  feature branch, and worktree isolation silently discards its work.
- If a Builder from this session is still running or recently completed, continue it
  via `SendMessage` instead of spawning a fresh one.
- The spawn prompt must name the feature branch and the `.gsd/[feature]-spec.md`,
  `.gsd/[feature]-plan.xml`, and `.gsd/[feature]-log.md` files to load. If this is a
  resume, also list the tasks already completed (by phase/task name) and the exact task or
  phase to start from.
- Every spawn or continue message must assign the phase scope: the next unfinished phase
  only, unless the user asked to run several phases straight through.
- **You hold the phase checkpoint.** The Builder ends its run after its assigned phases
  and does not ask for approval. When it reports back, relay its summary to the user
  faithfully, including any deviations or blockers it logged, then ask the user whether
  to continue with the next phase, run all remaining phases, or change something.
  - On continue, send the same Builder its next phase scope via `SendMessage`. Spawn a
    fresh Builder with a resume prompt only if the original is gone.
  - A requested change is unplanned work: give the user the
    `/architect <the requested change, verbatim>` prompt instead of relaying it.

The user's request: $ARGUMENTS
