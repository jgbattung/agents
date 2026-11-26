---
description: Spawn the Builder subagent directly, outside the coordinator, to build the approved plan
argument-hint: [optional scope, e.g. a phase or task ID]
---
Spawn the **Builder** subagent via the Agent tool now. Do not implement anything inline
yourself, and do not re-plan work the Architect already planned.

This command is for running the Builder by hand. `/coordinator` runs the whole pipeline.

Rules:
- Never spawn with `isolation: "worktree"`. The Builder commits to the feature branch in
  the current working directory, and an isolated worktree discards that work.
- The spawn prompt contains only the feature slug, the branch, the state folder
  `.gsd/<slug>/`, and the user's request verbatim. Add no summary or assessment.
- When the Builder reports back, relay its summary faithfully, including every deviation.
  If it ended on a stop, show the stop verbatim and send the user's answer verbatim to the
  same Builder. Do not answer for the user.
- A requested change that is not in the plan is unplanned work: point the user to
  `/architect` instead of relaying it.

The user's request: $ARGUMENTS
