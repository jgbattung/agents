---
description: Spawn the Integrator subagent to review, clean up, and open the PR
argument-hint: [feature branch to integrate]
---
Spawn the **Integrator** subagent via the Agent tool now (`subagent_type: "Integrator"`).
Do not review, clean up, or open the PR inline yourself.

Rules:
- NEVER spawn with `isolation: "worktree"` - the Integrator commits cleanup and pushes
  the branch to the remote, and worktree isolation silently discards its work.
- If an Integrator from this session is still running or recently completed, continue it
  via `SendMessage` instead of spawning a fresh one.
- The spawn prompt must name the feature branch and the `.gsd/[feature]-spec.md`,
  `.gsd/[feature]-plan.xml`, and `.gsd/[feature]-log.md` files to load.
- **No editorializing:** the spawn prompt must contain ONLY the branch name, the
  `.gsd/` file names, and the user's request verbatim. Do NOT add your own summary,
  assessment, or characterization of the implementation - the Integrator must form
  its judgment from the `.gsd/` files and the code alone.
- When the Integrator reports back, relay its summary to the user faithfully, including
  the PR URL (or manual-creation fallback) and any verification gaps it flagged.

The user's request: $ARGUMENTS
