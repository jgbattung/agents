---
name: gh-pr-template
description: Defines the standard Pull Request description format for personal projects. Used by the Integrator agent when drafting PR descriptions.
user-invocable: false
---

# GitHub Pull Request Template

When drafting a Pull Request description, use the exact structure below. Be specific — pull details directly from the `.gsd/[feature]-spec.md` and `.gsd/[feature]-log.md` files. Do not use generic filler.

## PR Title
The PR title must follow the same conventional commit format as commit messages:

```
<type>(<optional scope>): <short description>
```

Examples:
- `feat(auth): add Google OAuth login`
- `fix(dashboard): resolve chart overflow on mobile`
- `chore(deps): upgrade Prisma to v6`

## PR Description Template

```markdown
## What
[1-3 bullet points describing what changed. Be specific — name the files, components, or APIs involved.]

## Why
[1-2 sentences on the motivation. What problem does this solve or what does it enable?]

## How to Test
- [ ] [Step 1]
- [ ] [Step 2]
- [ ] [Step 3]

## Notes
[Optional. Include any of the following if applicable:]
- Breaking changes and what needs to be updated
- Follow-up TODOs that are out of scope for this PR
- Tradeoffs or decisions made and why
- Migration steps (e.g., run `npx prisma migrate dev`)
```

## Output Instructions
Save the full draft (title + description) to `.gsd/[feature]-pr-draft.md`. Present the draft to the user in the chat so they can copy-paste it directly into GitHub when creating the PR.
