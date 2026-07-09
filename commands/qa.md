---
description: Spawn the QA Engineer subagent to test and self-heal the built feature
argument-hint: [feature branch to QA, plus any resume context]
---
Spawn the **QAEngineer** subagent via the Agent tool now (`subagent_type: "QAEngineer"`).
Do not write or run tests inline yourself.

Rules:
- NEVER spawn with `isolation: "worktree"` - the QA Engineer commits test files directly
  to the user's feature branch, and worktree isolation silently discards its work.
- If a QAEngineer from this session is still running or recently completed, continue it
  via `SendMessage` instead of spawning a fresh one.
- The spawn prompt must name the feature branch and the `.gsd/[feature]-spec.md`,
  `.gsd/[feature]-plan.xml`, and `.gsd/[feature]-log.md` files to load.
- When the QA Engineer reports back, relay its summary to the user faithfully. If it
  halted with a kickback for the Architect, surface that copy-pasteable prompt verbatim.

The user's request: $ARGUMENTS
