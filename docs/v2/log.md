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
- [x] 3.5 Rewrite the Integrator as the shipping role
- [x] 3.6 Slim the Architect and move the opt-in flows out

### Phase 4: Coordinator and commands
- [x] 4.1 Create the coordinator
- [x] 4.2 Add the coordinator command and update the others

### Phase 5: Documentation
- [x] 5.1 Rewrite the README and update AGENTS.md

### Phase 6: Dry run in Claude Code
- [x] 6.1 Run one small ticket end to end on a scratch repository

### Phase 7: Orca runtime (needs a machine with Orca)
- [x] 7.1 Run the Orca trial
- [x] 7.2 Write the Orca runtime sections of the coordinator
- [ ] 7.3 Dry run in Orca

### Phase 8: Cleanup before merging
- [ ] 8.1 Remove the overhaul's working documents
- [ ] 8.2 Open the pull request into main

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

### Task 3.5 - Notion sync script moved (deviation)
- `scripts/notion-sync/` moved to `skills/backlog-protocol/scripts/notion-sync/`, contents unchanged apart from the paths in its README. The spec said not to touch it, but the `backlog-protocol` skill called it through a hardcoded `~/agents` path, and a script inside the skill folder can be reached through `${CLAUDE_SKILL_DIR}`.
- After cloning on a new machine, run `npm install` in that folder before using the Notion mirror.

### Task 3.6 - Architect
- Per the task 1.3 decision, the definition is `skills/architect/SKILL.md` and `agents/architect.md` is a stub that preloads it.
- Findings gained `source: user`, for review feedback from people (PR comments, diff annotations) that the Architect records.
- A remediation task names the finding it resolves, and the Builder marks that finding resolved when it commits the task.

### Tasks 4.1 and 4.2 - Coordinator and commands
- The coordinator is `skills/coordinator/SKILL.md` (task 1.3 decision). It sets `disable-model-invocation`, so only the user starts it.
- The coordinator may also write the `stage` line after it runs the gates, and the `status` or `route` line of a `route: user` finding to record the user's decision. The spec's role table was updated to say so.
- The PM moved from `agents/pm.md` to `skills/pm/SKILL.md`, with its skill references changed from paths to names. Its other content is unchanged.
- Task 4.2's verify ("all seven commands appear in Claude Code") could not be run on the planning machine and is part of the Phase 6 dry run. The slash commands are now `/architect`, `/pm`, `/coordinator` (skills) and `/builder`, `/qa`, `/integrator`, `/reviewer` (command files).

### 2026-11-27 - End of the first build session
- Phases 1 to 5 are complete and pushed. Phase 6 has not been started.
- The lint gate's finding names its locations in the command output, so the first `direct` condition now reads "names the exact location or locations to change".
- Nothing was installed on the planning machine. No role or skill file has been run yet.
- Open items for Phase 6 are listed in `RESUME.md` under "What to watch for".

### Task 6.1 - Partial dry run on the planning machine (task NOT complete)
Run headless (`claude -p`) in a scratch project with a project-scope install, with the agent answering as the user. Claude Code 2.1.332.

Confirmed:
- Individually symlinked agent files and command files are discovered. All five v2 agents and the four spawn commands appeared with their v2 descriptions.
- Agent type names are case-sensitive. `Architect`, `Builder`, `QAEngineer`, `Reviewer`, `Integrator` were listed next to older lowercase agents of the same names.
- `/coordinator` loads although it is hidden from the model's own skill list (`disable-model-invocation`). On a branch with no state folder it asked for planning through `/architect` and changed nothing.
- `/architect` loads from the skill. It investigated, stopped at the alignment check with a ranked proposal, the Protected Behaviors, and the PR strategy, and wrote only `project-context.md` before approval.
- After approval it wrote `spec.md`, `plan.xml` (with task IDs), `status.md`, and `notes.md` (five headings) in the `state-machine` formats, used the existing fresh branch, and excluded `.gsd/` from git.

Found and fixed:
- A project-scope install left `.claude/` showing as untracked, which would fail the Integrator's clean-tree check. `install.mjs` now adds the links it creates to `.git/info/exclude`.

Found and not fixable on that machine:
- A skill installed at user level shadows a project-level skill of the same name. The planning machine had an older `state-machine` and `git-standards` at user level, so roles loading those by name could get the old versions. The run was stopped there, because results past that point would not be trustworthy. A clean config folder could not be used because it is not logged in.
- Consequence for the dry run: do it on a machine with no older copies of these skills at user level, or with v2 installed globally.

Not yet exercised: the Builder, the QA Engineer, the gates inside the pipeline, the Reviewer, the Integrator, every stop except plan approval, the coordinator's loop, and the Architect stub's skill preload.

### Task 6.1 - Second dry run session on the planning machine (task still NOT complete)
The user removed the older user-level skills link on that machine, so the shadowing problem no longer applied. Three headless coordinator runs followed on the ticket planned earlier, with the agent answering as the user.

Run 1, happy path. Confirmed:
- The coordinator started Builder, QAEngineer, Reviewer, and Integrator by name, ran the gates itself, and stopped only at `ship-approval`. Nothing was pushed.
- The Builder built the task in one atomic commit and ticked it. The QA Engineer wrote one test per approved behavior without asking for the budget again, and recorded the ledger with failure statements. The Reviewer wrote `review.md`. The Integrator wrote `pr.md` and carried the suggestion into "Known Improvements".
- Commits were in the conventional format with no AI attribution. The coordinator wrote only the stage line and its own history lines.

Run 2, a debug print planted in the source and the stage reset to `gates`. Confirmed:
- The gates recorded the leftover as a `direct` finding, the Builder removed it in one commit and marked it resolved, with no re-planning.
- The Builder refused a finding that failed the direct re-check and raised a `blocker` stop with a reason and a recommendation. The coordinator relayed it verbatim and did not answer it.

Found and fixed:
- **The gates script did nothing when called through the installed symlink.** Its entry-point guard compared the invoked path with the module's resolved path, so it exited 0 with no output. The two "gates passed" history lines of run 1 were false. Fixed by comparing real paths in both scripts, with a test that calls the script through a symlinked folder. The `gates` skill now states that no output means the script did not run.
- **A suggestion was handed to the Builder.** The QA Engineer gave a suggestion `route: direct`, and the coordinator's instruction did not exclude suggestions. A suggestion now takes `route: none`, the instruction names blocker and important findings only, and the Builder leaves suggestions alone.

Run 3, after the fixes, from the `gates` stage. Confirmed: gates passed for real, the Reviewer re-reviewed, the Integrator updated the draft and stopped at `ship-approval`.

Still not exercised (this is what remains of task 6.1):
- QA Re-Verification Mode after a fix. In run 2 the Builder stopped before setting the stage, and the stop was cleared by hand.
- The Architect's Remediation Mode under the coordinator, the `remediation-approval` stop, and the Architect stub's skill preload.
- The QA Engineer's `budget` stop and the Builder's `deviation` stop.
- A `route: user` finding (AI attribution in a commit, or a repeated finding).
- The Integrator's run 2: push and `gh pr create`. The planning machine had no `gh` and the scratch repository had no remote.
- A ticket whose Protected Behaviors are `None`, to confirm QA is skipped.
- Resuming a stop in the same session with SendMessage. Every headless run was a new session, so each stop was resumed from the files, which worked.
- The roles reached the gates script by its real path in runs 2 and 3 because the history line told them to. The symlinked path was verified directly from a shell after the fix, not through a role.

### Task 6.1 - Third dry run session on the planning machine (one check left)
Five scratch copies, run headless in parallel with the agent answering as the user. Each stop was answered by continuing the same headless session.

Confirmed, each run ending at `ship-approval` with nothing pushed:
- **Remediation.** A source change broke an approved behavior. The gates recorded the test failure with `route: architect`. The Architect, started as a subagent through its stub, loaded its skill, found the commit and line at fault, appended phase "2: QA Remediation", and raised `remediation-approval`. After approval the Builder built the task and marked the finding resolved, and the QA Engineer ran Re-Verification Mode: suite green, test integrity checked, no tests rewritten.
- **AI attribution.** The gates recorded a `route: user` finding. The coordinator showed it and waited. After the user rewrote the commit, the coordinator re-ran the gates, saw them pass, and recorded the finding as resolved. No role rewrote history.
- **No behavior change.** For a README ticket the Architect set Protected Behaviors to `None - this work changes no behavior`, and the pipeline went Builder, gates, Reviewer, Integrator with no QA run.
- **Deviation stop.** On a hand-written plan with a task that named a file that does not exist, the Builder committed the task it could do, then raised `deviation` with options and a recommendation. On the answer it recorded the dropped task under `## Deviations` and did not edit the plan.
- **Budget stop.** For an approved behavior with nothing to test it against, the QA Engineer raised `budget` with three options. On the answer it wrote only the approved test and recorded the behavior under `## Not Tested` as a manual check by the user's decision.
- The Integrator left out the attribution footer that Claude Code's own session reminder suggests, citing Rule Zero.
- State files written by hand were followed the same as ones the Architect wrote.

Found and fixed:
- **A role did not act on a user answer relayed with SendMessage.** It treated the message as the coordinator's words. The coordinator recovered each time by starting a fresh instance. That is now the rule everywhere: a stop is resumed by a fresh instance given the `Resume` instruction, which reads the stop from `status.md`. This replaces the earlier design of continuing the same subagent, so the "same-session resume" check no longer exists.
- **A finding stayed `open` while its approved remediation task waited to be built**, so the loop's row 3 could have sent it back to the Architect. Findings gained the status `planned (<task id>)`, set by the Architect on approval. Only `open` findings are routed.
- The coordinator may record a `route: user` finding as `resolved (<commit hash>)` when the user fixed it and the gates confirm it.

A confirmation run of the remediation scenario after these fixes passed: the approval was accepted by the first fresh Architect, the finding went open, planned, resolved, and every role ran the gates through the installed symlinked skill folder with no workaround.

The only check left in task 6.1: **the Integrator's run 2**, the real `git push` and `gh pr create`. The planning machine had no `gh` and the scratch repositories had no remote. Everything else in Phase 6 has been seen to work, headless. It has not yet been driven by a person in a live interactive session.

### Task 6.1 - Live session on a Windows machine
Git for Windows 2.46, Node 22.22, `gh` 2.95 logged in. The old install was four whole-folder links in `~/.claude` (`skills`, `agents`, `commands`, `CLAUDE.md`) pointing at this repository's working tree. They were removed and v2 was installed globally with `install.mjs`: 29 linked, 0 skipped.

Found and fixed:
- **The gates tests failed on Windows (9 of 16).** The fixture set `GIT_CONFIG_GLOBAL` and `GIT_CONFIG_SYSTEM` to `os.devNull`, and Git for Windows cannot read `\.\nul` as a config file, so `git init` failed in every test repository. The fixture now points both at an empty temporary file. One test also used `echo ...; exit 3` as the failing test command, which `cmd.exe` (the shell `gates.mjs` uses on Windows) runs as one echo that exits 0. It now uses a `node -e` command that means the same in both shells. `gates.mjs` itself was not changed.

Noted, not changed:
- On this machine `skills/lavish` is a local symlink to `~/.agents/skills/lavish` (made outside this repository, content identical to HEAD). `install.mjs` links only real skill folders, so it was not linked. On a clean clone the folder is real and is linked.
- Later fixed on this machine: the symlink was replaced with the tracked folder (same content apart from line endings) and `install.mjs` linked it: 1 linked, 29 already linked. `~/.agents` is no longer used by this repository.

Live run, driven by the user in interactive sessions on a private throwaway repository (`jgbattung/v2-dryrun`: Node 22, no dependencies, `npm test` with `node --test`, `npm run lint` with a small lint script). Ticket: `formatDuration` throws a `RangeError` for negative, non-integer, and non-number input.

Confirmed:
- `/architect` in its own session excluded `.gsd/` through `.git/info/exclude` by itself, used the fresh branch, asked the project setup questions, and stopped with the proposal, the Protected Behaviors, and the PR strategy. After approval it wrote the four state files and the three `project-context.md` sections, with the tree still clean.
- `/coordinator` in a fresh session ran Builder, QAEngineer, the gates, Reviewer, and Integrator with no relay, and stopped only at `ship-approval`. The gates printed `Gates: PASSED` through the installed skill path. Every role prompt held only the feature, branch, state folder, and instruction (checked in the session transcript).
- The approval went to a fresh Integrator as `Resume. The user's answer to your ship-approval stop: "Approve. Ship it"`. It pushed the branch, opened https://github.com/jgbattung/v2-dryrun/pull/1 against `main`, and set `stage: done` with the URL. No AI attribution in the commits, the PR title, or the body.
- The second ticket of the task (Protected Behaviors `None`, QA skipped) was confirmed in the third dry run and was not repeated.

Found and fixed:
- **The ship-approval stop detail was only a pointer to `pr.md`.** `agents/integrator.md` asked for the full PR description in `stop_detail`, which the spec and the `state-machine` skill define as one paragraph. The coordinator filled the gap with details of its own, which goes past "show `stop_detail` verbatim". The Integrator now writes one self-contained paragraph (title, base, commits, freshness warning, existing PR) that points to `pr.md` for the body. The user chose this over having the coordinator print `pr.md`, which would have changed the design.

Noted, not changed:
- The Architect put the project setup questions and the alignment proposal in one message, although setup is its own hard stop that says to wait for the answers. With no UI work and no backlog ID, the answers could not change the proposal. Left as is.

### Task 7.1 - Orca trial on the Windows machine
Orca 1.4.281, run from a Claude Code session inside Orca in this repository, against `jgbattung/v2-dryrun`. Every answer is in `orca-checklist.md` under its item; the worker preamble and the version-matched guide are saved next to it as `orca-preamble.txt` and `orchestration-guide.txt`.

Results that shape Part C:
- `.gsd/` sharing works with `worktree.sharedDirectories` in an untracked `orca.yaml` and `.gsd/` excluded only through `.git/info/exclude`. A worktree gets a junction to the primary checkout's `.gsd`, and removing the worktree leaves the primary `.gsd` intact.
- Stable commands work: `orca agent launch --surface terminal` opens a role in its own tab of the ticket's worktree, a slash command passed as `--prompt` runs as a command, and `orca worktree set --comment ... --unread` fires a Windows notification.
- `terminal wait --for tui-idle` does not return while an agent waits on a question. `orca worktree ps --agent-wait --json` shows that state (`state: "waiting"`, `programStatus.kind: "question"`).
- Orchestration works mechanically (Runs, workers in a shared worktree, `check`, takeover with `run-use`), but its question path does not reach the user. Worse, when the coordinator is blocked waiting on the user, Orca tells the asking worker to decide by itself, and the worker did, twice. Under C1's rule (orchestration only when B9, B12, B13, and B15 all work), B13 fails.
- Orca starts Claude with `--dangerously-skip-permissions` (`agentPermissionDefault: full-access`), and nothing restricts individual `orca` commands, so the coordinator's Orca section must forbid the destructive ones itself (B16).
- Windows: from Git Bash, MSYS path conversion rewrites an argument starting with `/` (`/coordinator` became `C:/Program Files/Git/coordinator`). `orca` must be run from PowerShell or with `MSYS_NO_PATHCONV=1`.
- `orca-notes.md` is out of date in places: worktree removal keeps the branch by default, `worker-start` takes `--spec` directly, and the coordinator is woken by text typed into its terminal instead of polling.

Open: artifact publishing still read as on at the end of the trial, although the user chose to turn it off. The first box of the checklist stays open until it reads off. Closed later the same day: the user switched it off, the profile read `artifactSharingEnabled: false`, and the box is ticked.

### Task 7.2 - Orca runtime sections
- Transport: stable commands, by C1's rule (B13 failed). The orchestration section is one line saying why.
- The user chose to run each role in its own terminal tab, started with its slash command (`/builder`, `/qa`, `/reviewer`, `/integrator`, or `/architect` for Remediation Mode) and the fixed prompt on one line, over running roles as subagents of the coordinator. This matches the README's Orca row.
- The coordinator marks a stop with `orca worktree set --comment ... --unread`, which fires a system notification, and passes the answer to a fresh tab with the `Resume` instruction.
- The section lists the `orca` commands the coordinator never runs, because Orca restricts none of them and starts agents with bypass permissions.
- The README gained an Orca subsection: the `.gsd/` sharing setup, how to run a ticket, and how the Orca UI fits the three gates. Diff annotations and Design Mode changes go to the Architect as unplanned work.
- Left open: checklist C2's test of whether a role accepts an answer typed into its own tab. It is run at the ship-approval stop in D1, and the task is ticked after that.

### Task 7.3 - Dry run in Orca (in progress)
- D1 passed: ticket `days-in-duration` in `v2-dryrun` ran from workspace creation to PR #2, each role in its own tab, with the user stopped only at plan approval and ship approval. No corrections.
- The C2 typed-answer test did not run, because the ship-approval stop was answered first. It moves to the next stop.
- User feedback from D1: a stop that asks for a decision should not be a block of text; it should be laid out so the user can read it, get the context, and decide quickly. The state protocol defines `stop_detail` as one paragraph, so this is a design change, raised with the user before any edit.
- Correction (approved by the user): every stop now uses a fixed stop block instead of a paragraph: the decision as one bold question, Context bullets, numbered Options with their consequence, the recommendation, and a Reply line. Defined in Section 9 of the `state-machine` skill; `stop_detail:` in `status.md` is followed by the block on the lines below. The Integrator's ship-approval stop lists what goes under Context and Options, the coordinator shows the block verbatim with nothing before it, and the Architect lays out its proposal and project setup questions the same way, with numbered questions.
- C2 closed: an answer typed into the stopped Architect's own tab was acted on. The fresh-instance rule stays, because the other roles run as subagents of their tab and their tabs are closed before a stop is shown. Task 7.2 ticked.
- D2 passed (`readme-usage`, PR #3): Protected Behaviors `None`, QA skipped.
- D3 passed (`readme-usage` and `duration-weeks` at once): no cross-touching of feature folders; `project-context.md` intact, with a `## Stacked branches` section added by the Architect.
- D4 found a gap: a "change the code" answer at ship approval was recorded by the Integrator only as a History line with `stage: review`, so the loop had no route to the Architect. The coordinator stepped outside the loop on the user's choice; the Architect then made it finding F1 and phase 2 (PR #4). Fix raised with the user.
- Noted, not changed: after phase 2 the Builder set `stage: ship` instead of `qa` or `gates`, against its own rule; the coordinator ran the gates and review anyway. The rule is already explicit.
