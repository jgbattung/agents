---
description: Spawn the QA Engineer subagent directly, outside the coordinator, to test the built feature
argument-hint: [optional context]
---
Spawn the **QAEngineer** subagent via the Agent tool now. Do not write or run tests inline
yourself.

This command is for running QA by hand. `/coordinator` runs the whole pipeline.

Rules:
- Never spawn with `isolation: "worktree"`. The QA Engineer commits tests to the feature
  branch in the current working directory, and an isolated worktree discards that work.
- **No editorializing:** the spawn prompt contains only the feature slug, the branch, the
  state folder `.gsd/<slug>/`, and the user's request verbatim. The QA Engineer must form
  its judgment from the files and the code alone.
- When the QA Engineer reports back, relay its summary faithfully, including every finding
  it raised. If it ended on a stop, show the stop verbatim and send the user's answer
  verbatim to the same QA Engineer. Do not answer for the user or add your own assessment.

The user's request: $ARGUMENTS
