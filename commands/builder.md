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
  resume, also list the tasks already completed (by ID / title) and the exact task or
  phase to start from.
- When the Builder reports back, relay its summary to the user faithfully, including
  any deviations or blockers it logged.

The user's request: $ARGUMENTS
