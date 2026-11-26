---
description: Spawn the Integrator subagent directly, outside the coordinator, to draft and ship the PR
argument-hint: [optional context]
---
Spawn the **Integrator** subagent via the Agent tool now. Do not run gates, draft the PR,
push, or open the PR inline yourself.

This command is for running the Integrator by hand. `/coordinator` runs the whole pipeline.

Rules:
- Never spawn with `isolation: "worktree"`. The Integrator pushes the feature branch from
  the current working directory.
- **No editorializing:** the spawn prompt contains only the feature slug, the branch, the
  state folder `.gsd/<slug>/`, and the user's request verbatim.
- The Integrator works in two runs. Its first run ends on a ship-approval stop: show the
  PR draft verbatim and wait. Send the user's answer verbatim to the same Integrator.
  Never approve on the user's behalf - nothing is pushed until the user says so.
- When it reports back, relay the PR URL (or the manual fallback) and every warning.

The user's request: $ARGUMENTS
