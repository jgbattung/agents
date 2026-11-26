---
name: gates
description: Runs the mechanical quality gates on a feature branch - test and lint commands, skip markers and debug leftovers on added lines, AI attribution in commit messages, protected files, and branch freshness. Used by the coordinator after the build and by the Integrator before shipping.
user-invocable: false
---

# Gates

The gates are a script, not a judgment call. Run it, read its result, and do not re-check by hand what it already checked.

## When to Run

- After the build (and after QA, when QA ran), before the Reviewer.
- Again after any fix, before the Reviewer looks at the branch again.
- By the Integrator, immediately before drafting the PR.

## How to Run

Run from the root of the project being checked, on the feature branch:

```bash
node "${CLAUDE_SKILL_DIR}/scripts/gates.mjs" \
  --base <base-branch> \
  --test "<test command>" \
  --lint "<lint command>" \
  --protected <path,path> \
  --notes .gsd/<slug>/notes.md
```

If `${CLAUDE_SKILL_DIR}` is not substituted in your environment, the script is at `scripts/gates.mjs` inside this skill's folder.

Where the values come from:

| Flag | Source |
|---|---|
| `--base` | The **Base Branch** in `.gsd/<slug>/spec.md` |
| `--test`, `--lint` | The `## Commands` section of `.gsd/project-context.md`. Omit the flag when the entry is `none` |
| `--protected` | The **Protected files** entry of `## Conventions` in `.gsd/project-context.md`, comma-separated. Omit when there are none |
| `--notes` | Always pass it. The script records its own findings, so no role has to restate them |

Add `--json` for a machine-readable result.

## What It Checks

| Check | Result | Finding route |
|---|---|---|
| `test` - the test command exits non-zero | Fails | architect |
| `lint` - the lint command exits non-zero | Fails | direct |
| `skip-marker` - a skipped, focused, or pending test on a line this branch added, in a test file | Fails | qa |
| `debug-leftover` - console output, a debugger statement, or an unresolved marker comment on a line this branch added, outside prose and data files | Fails | direct |
| `ai-attribution` - AI attribution in a commit message on the branch (Rule Zero of the `git-standards` skill) | Fails | user |
| `protected-file` - CI or deploy configuration, a dependency manifest or lockfile, build configuration, or a path given with `--protected` was changed | Warning | none |
| `branch-freshness` - the base branch has commits this branch does not | Warning | none |

"A line this branch added" means a `+` line of `git diff <base>...HEAD`. Anything that was already there is not the branch's doing and is not flagged.

## Reading the Result

- **Exit 0:** nothing failed. Warnings may still be listed.
- **Exit 1:** at least one check failed. Each failure is already written to `## Findings` in `notes.md` with its route. Re-running does not record the same open finding twice.
- **Exit 2:** the script was called wrongly (missing `--base`, or a base branch that does not exist). Fix the call.

Warnings never block. A protected-file warning for a file the plan explicitly called for needs no action. Every other warning is listed in the PR description under "Sensitive Files Changed" or mentioned to the user.

The script does not fix anything, and neither do you on its behalf. Findings are resolved by the role their route names.
