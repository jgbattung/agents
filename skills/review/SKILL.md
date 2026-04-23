---
name: review
description: 'Conduct a code quality review of changes at any point in development — mid-feature, before a commit, or before raising a PR. Analyses code for correctness, security, readability, maintainability, test coverage, DRY/YAGNI/SOLID compliance, accessibility, debug leftovers, and documentation drift. Writes findings to .gsd/[feature]-review.md. Use when asked to review changes, do a self-review, check code quality, audit recent edits, or verify implementation before committing.'
---

# Code Review

Conducts a focused code quality review of changes in the workspace. Can be run at any point during development — not only before a PR. Findings are written to `.gsd/[feature]-review.md`.

## When to Use This Skill

- "Review my changes" / "Do a self-review"
- "Check code quality before I commit"
- "Audit what I've written so far"
- "Verify this implementation looks correct"
- Automatically invoked by the Integrator agent during Phase 2

## Step 1 — Gather Context

Before reviewing, determine what has changed:

```bash
# All unstaged + staged changes
git diff HEAD

# Staged only (if reviewing a commit candidate)
git diff --staged

# Full branch diff (if reviewing before a PR)
git diff origin/<base-branch>..HEAD
```

If files are attached directly (`#file:` references), use those without running git commands.

If the diff is empty, ask the user:
- Did you mean staged-only (`git diff --staged`)?
- Or a branch comparison against the base branch?

> Do not guess what changed from workspace browsing alone. Only review code that has been explicitly provided or retrieved.

## Step 2 — Clarify Scope (if needed)

If the nature of the changes is not obvious from the diff, ask:

1. What is the nature of these changes? (new feature, bug fix, refactor, test improvement, docs)
2. What motivated them?
3. Are there acceptance criteria or a ticket to validate against?

## Step 3 — Review

Analyse the diff against each dimension below. Collect every finding before writing the report.

### Correctness
- Does the implementation match the stated intent or acceptance criteria?
- Are there logic errors, off-by-ones, or incorrect conditionals?
- Are edge cases (empty arrays, null/undefined, zero values) handled?

### Security
- Are there XSS vectors (unsanitized HTML, missing sanitization on rich text)?
- Are sensitive values (tokens, credentials) hardcoded or logged?
- Are user-controlled inputs validated at the boundary?
- Does the change introduce any OWASP Top 10 risks?

### Code Quality & Readability
- Are names (variables, props, functions) clear and consistent with project conventions?
- Is intent obvious from reading the code, or does it need a comment to explain *why*?
- Are there unnecessarily complex constructs that could be simplified?

### Maintainability
- Does the change introduce tight coupling that will be hard to change later?
- Are magic numbers or strings used without constants?
- Will future developers understand this code without the author present?

### Testing
- Are new or changed code paths covered by tests?
- Are happy-path, edge-case, and error-state scenarios tested?
- Are tests asserting meaningful behaviour (not just render-without-crash)?
- Are mocks and spies scoped correctly (not leaking between tests)?

### Accessibility
- Are interactive elements reachable by keyboard?
- Are ARIA roles and labels present where needed?
- Does focus management behave correctly (e.g., modals, drawers)?
- Is colour/contrast the sole differentiator for any state?

### DRY
- Is logic duplicated across components or utilities that could be shared?
- Are there repeated structures that could be extracted into a sub-component or helper?

### YAGNI
- Is there code, props, or exports added "for future use" that nothing currently uses?
- Are there over-engineered abstractions solving a problem that doesn't yet exist?

### SOLID
- Does a component or function do more than one thing (SRP)?
- Are new interfaces closed for modification but open for extension where relevant?

### Debug Leftovers
- Are there `console.log`, `debugger`, commented-out code blocks, or unresolved `TODO`/`FIXME` markers introduced by this change?

### Documentation Drift
Check whether the changes contradict or invalidate anything documented in existing project docs (e.g., README, ARCHITECTURE.md, CONTRIBUTING.md, inline doc pages).

For each doc, ask:
- Does the change introduce a new pattern, file, dependency, or convention that contradicts what is documented?
- Does any existing documented behaviour no longer hold after this change?
- Should any section be updated to reflect the new reality?

Report contradictions as IMPORTANT findings. Report sections that need updating but are not yet wrong as SUGGESTION findings.

## Step 4 — Write the Report

Write findings to `.gsd/[feature]-review.md`. Create the file if it does not exist; overwrite it if it does.

If no `.gsd/` directory or feature context exists (e.g., standalone review outside the agent workflow), write to `tmp/self-review.md` instead.

### Severity Classification

| Severity | Meaning |
|----------|---------|
| **BLOCKER** | Must be resolved before committing or raising a PR. Examples: security vulnerability, broken functionality, acceptance criteria not met. |
| **IMPORTANT** | Should be resolved before raising a PR. Examples: missing test coverage for a new code path, significant DRY violation, accessibility gap. |
| **SUGGESTION** | Nice to have. Can be deferred or noted in the PR description. Examples: naming improvements, minor readability, optional documentation. |

### Report Structure

```markdown
# Self-Review — <date>

## Summary
<2-3 sentences: what the changes do and the overall quality signal>

## Findings

### BLOCKER
- **[file:line]** <what the problem is> — <recommended fix>

### IMPORTANT
- **[file:line]** <what the problem is> — <recommended fix>

### SUGGESTION
- **[file:line]** <what the problem is> — <recommended fix>

## Documentation Updates Required
- **[doc file]** <section or claim that needs updating> — <what to change>

## Open Questions
- <anything requiring developer clarification before proceeding>
```

Omit any severity section that has no findings. Omit `## Documentation Updates Required` if no docs need updating. Omit `## Open Questions` if there are none.

If there are **no findings at any severity level**, write:

```markdown
# Self-Review — <date>

## Summary
<what the changes do>

## Result
No findings. Changes meet all quality standards reviewed.
```

## Rules

- Do not autonomously edit source files. Describe the fix; the developer decides whether to apply it.
- Do not run the test suite, make commits, or push changes.
- Do not read credential files, `.env` files, or files listed in `.gitignore`.
- Do not flag test pass/fail, lint status, or build status — those are mechanical gates owned by the Integrator's pre-flight phase.
- One finding per bullet. No paragraphs per finding.
