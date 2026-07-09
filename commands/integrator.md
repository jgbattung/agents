---
description: Spawn the Integrator subagent to review, clean up, and draft the PR
argument-hint: [feature branch to integrate]
---
Spawn the **Integrator** subagent via the Agent tool now (`subagent_type: "Integrator"`).
Do not review, clean up, or draft the PR inline yourself.

Rules:
- NEVER spawn with `isolation: "worktree"` - the Integrator commits cleanup and pushes
  the branch to the remote, and worktree isolation silently discards its work.
- If an Integrator from this session is still running or recently completed, continue it
  via `SendMessage` instead of spawning a fresh one.
- The spawn prompt must name the feature branch and the `.gsd/[feature]-spec.md`,
  `.gsd/[feature]-plan.xml`, and `.gsd/[feature]-log.md` files to load.
- When the Integrator reports back, relay its summary to the user faithfully, including
  the PR draft location and any verification gaps it flagged.

The user's request: $ARGUMENTS
