# Log: Workflow v2

Tick a task when its verify step has passed and its commit exists. Add notes only for decisions, deviations from the plan, and open problems.

## Tasks

### Phase 1: Foundations
- [x] 1.1 Rewrite the state-machine skill for the v2 state layout
- [x] 1.2 Create the install script with tests
- [x] 1.3 Decide how persona commands import agent definitions without a hardcoded path

### Phase 2: Gates script
- [x] 2.1 Create the gates script with tests
- [x] 2.2 Write the gates skill file

### Phase 3: Roles
- [x] 3.1 Rewrite the Builder
- [x] 3.2 Rewrite the QA Engineer
- [x] 3.3 Update the review, testing-standards, and git-standards skills
- [x] 3.4 Rewrite the Reviewer with self and peer modes
- [ ] 3.5 Rewrite the Integrator as the shipping role
- [ ] 3.6 Slim the Architect and move the opt-in flows out

### Phase 4: Coordinator and commands
- [ ] 4.1 Create the coordinator
- [ ] 4.2 Add the coordinator command and update the others

### Phase 5: Documentation
- [ ] 5.1 Rewrite the README and update AGENTS.md

### Phase 6: Dry run in Claude Code
- [ ] 6.1 Run one small ticket end to end on a scratch repository

### Phase 7: Orca runtime (needs a machine with Orca)
- [ ] 7.1 Run the Orca trial
- [ ] 7.2 Write the Orca runtime sections of the coordinator
- [ ] 7.3 Dry run in Orca

## Notes

### Task 1.3 - How persona commands load a role without a hardcoded path

**What the Claude Code documentation says** (pages read 2026-11-27):
- `@path` references inside a command or skill body are not documented: not their resolution, not `~`, not symlinks. Only CLAUDE.md imports are documented. (https://code.claude.com/docs/en/slash-commands.md, https://code.claude.com/docs/en/memory.md)
- A skill invoked as `/name` has its content injected into the main conversation. A skill overrides a file in `.claude/commands/` of the same name. `$ARGUMENTS` works in skills. (https://code.claude.com/docs/en/skills.md)
- A skill folder may be a symlink to a directory elsewhere. This is the only symlink case the docs cover for skills, agents, and commands. (same page, "Symlinked folders")
- `${CLAUDE_SKILL_DIR}` expands to the folder containing the skill's `SKILL.md`, for user and project skills too. (same page, "String substitutions")
- A subagent definition can preload skills by name with a `skills:` frontmatter field. A skill with `disable-model-invocation: true` cannot be preloaded. (https://code.claude.com/docs/en/sub-agents.md)
- Not documented: whether individually symlinked agent and command files are followed, and whether `subagent_type` matching is case-sensitive. Both must be confirmed in the Phase 6 dry run.

**Decision (deviation from the plan's file locations):**
- A role the user talks to directly is a skill, and its `SKILL.md` is the single source of its definition. That is three roles: `skills/architect`, `skills/pm`, `skills/coordinator`. `/architect`, `/pm`, and `/coordinator` invoke them with no path involved.
- `commands/architect.md` and `commands/pm.md` are deleted. No `commands/coordinator.md` is created.
- `agents/architect.md` stays as a short stub for one-shot use under the coordinator. It preloads the `architect` skill and adds only the one-shot rules.
- `agents/pm.md` is deleted. The PM is never run as a subagent.
- The coordinator therefore lives at `skills/coordinator/SKILL.md`, not `agents/coordinator.md`. Tasks 3.6, 4.1, and 4.2 are carried out against these locations.
- Builder, QA Engineer, Reviewer, and Integrator stay as `agents/*.md` plus a spawn command each. Spawning by name needs no path.
- The gates script is called through `${CLAUDE_SKILL_DIR}` from the `gates` skill.

### 2026-11-26 - Planning
- Planned in one session on a machine that is being returned. Nothing outside this branch needs to be recovered from it.
- `main` was tagged `v1` before this branch was created.
- The planning files live in `docs/v2/` and are tracked in git, not in `.gsd/`. Reason: `.gsd/` is git-ignored, and this work has to continue on another machine.
- On the planning machine, `~/.claude/agents` and `~/.claude/skills` pointed at a different repository and `~/agents` did not exist. v2 was therefore never installed globally there.
- Orca was not installed on the planning machine. Everything in `orca-notes.md` comes from the documentation.
- The GitHub CLI (`gh`) was not installed on the planning machine. The Integrator and Reviewer need it.
- Decisions the user approved: three gates including the new ship approval, a slim Integrator kept separate from the coordinator, the fast-path rules, exception-only stops, per-item install links, Orca runtime sections deferred, within-feature parallelism deferred.

### Task 3.4 - Route rules tightened while writing the Reviewer
- "A finding is routed once" needed a mechanism. A finding that repeats an earlier resolved or answered one is now raised with `route: user`. Updated in the spec, the `state-machine` skill, and the QA Engineer.
- Removing a `[Debug Leftover]` counts as `direct` without a failing test or gate check, because the Reviewer can find leftovers the script cannot (for example commented-out code).
- The coordinator may read the `route` and `status` lines of findings in `notes.md` as well as `status.md`. It still writes neither.
