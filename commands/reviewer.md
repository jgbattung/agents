---
description: Spawn the Reviewer subagent to review this feature (self mode) or another developer's PR (peer mode)
argument-hint: [nothing for this branch's feature, or a PR number/URL with the ticket's acceptance criteria]
---
Spawn the **Reviewer** subagent via the Agent tool now. Do not review inline yourself.

Rules:
- Never spawn with `isolation: "worktree"`. The Reviewer reads the branch checked out in
  the current working directory and writes its review under `.gsd/`.
- **No editorializing:** the spawn prompt contains only the user's request verbatim, plus
  the feature slug and state folder `.gsd/<slug>/` when the request is about this branch's
  own feature. Add no summary or characterization of the work.
- When the Reviewer reports back, relay its verdict faithfully, including the review file
  path (if one was written), every finding, and every manual verification step. If it
  halted to ask for acceptance criteria or a branch checkout, surface that request verbatim.

The user's request: $ARGUMENTS
