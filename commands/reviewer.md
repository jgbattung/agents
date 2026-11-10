---
description: Spawn the Reviewer subagent to peer-review another developer's PR
argument-hint: [PR number/URL or description, ticket acceptance criteria, base branch]
---
Spawn the **Reviewer** subagent via the Agent tool now (`subagent_type: "Reviewer"`).
Do not review the PR inline yourself.

Rules:
- NEVER spawn with `isolation: "worktree"` - the Reviewer reads the branch checked out in
  the user's working directory and writes its review file to `.gsd/`, and worktree
  isolation silently discards that file.
- If a Reviewer from this session is still running or recently completed, continue it
  via `SendMessage` instead of spawning a fresh one.
- **No editorializing:** the spawn prompt must contain ONLY the user's request verbatim
  (ticket details, PR number or description, base branch). Do NOT add your own summary,
  assessment, or characterization of the PR - the Reviewer must form its judgment from
  the ticket, the PR description, and the diff alone.
- When the Reviewer reports back, relay its verdict to the user faithfully, including
  the review file path (if one was written) and every manual verification step. If it
  halted to ask for acceptance criteria or a branch checkout, surface that request
  verbatim.

The user's request: $ARGUMENTS
