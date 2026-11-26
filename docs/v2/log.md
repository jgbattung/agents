# Log: Workflow v2

Tick a task when its verify step has passed and its commit exists. Add notes only for decisions, deviations from the plan, and open problems.

## Tasks

### Phase 1: Foundations
- [x] 1.1 Rewrite the state-machine skill for the v2 state layout
- [ ] 1.2 Create the install script with tests
- [ ] 1.3 Decide how persona commands import agent definitions without a hardcoded path

### Phase 2: Gates script
- [ ] 2.1 Create the gates script with tests
- [ ] 2.2 Write the gates skill file

### Phase 3: Roles
- [ ] 3.1 Rewrite the Builder
- [ ] 3.2 Rewrite the QA Engineer
- [ ] 3.3 Update the review, testing-standards, and git-standards skills
- [ ] 3.4 Rewrite the Reviewer with self and peer modes
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

### 2026-11-26 - Planning
- Planned in one session on a machine that is being returned. Nothing outside this branch needs to be recovered from it.
- `main` was tagged `v1` before this branch was created.
- The planning files live in `docs/v2/` and are tracked in git, not in `.gsd/`. Reason: `.gsd/` is git-ignored, and this work has to continue on another machine.
- On the planning machine, `~/.claude/agents` and `~/.claude/skills` pointed at a different repository and `~/agents` did not exist. v2 was therefore never installed globally there.
- Orca was not installed on the planning machine. Everything in `orca-notes.md` comes from the documentation.
- The GitHub CLI (`gh`) was not installed on the planning machine. The Integrator and Reviewer need it.
- Decisions the user approved: three gates including the new ship approval, a slim Integrator kept separate from the coordinator, the fast-path rules, exception-only stops, per-item install links, Orca runtime sections deferred, within-feature parallelism deferred.
