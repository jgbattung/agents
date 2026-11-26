# Orca Checklist

This is Phase 7 of `plan.xml`. Do it on a machine where Orca is installed, after Phases 1 to 6 are done. Record every answer in this file, under the item, so the result travels with the branch.

Read `orca-notes.md` first. It lists what the documentation says and what it leaves open.

## Before you start

- [ ] Orca is allowed on this machine. On a work laptop, confirm with whoever owns that decision, and check Orca's telemetry page (`orca.dev/docs/telemetry`) and that artifact publishing is off (it is off by default).
- [ ] Orca installed. macOS: `brew install --cask stablyai/orca/orca`.
- [ ] Orca CLI enabled in Settings, and `orca status --json` succeeds.
- [ ] `git`, Node 22+, and the GitHub CLI (`gh auth login`) are present.
- [ ] This repository is cloned, on branch `feature/workflow-v2` (or `main` once merged).
- [ ] A scratch repository exists with a test command and a lint command (reuse the one from task 6.1 if it is on this machine).

## Part A: Install without surprises

- [ ] **A1.** Run `orca skills install --skill orca-cli --dry-run`. Record where it would write.
  - If it targets `~/.claude/skills` and that path is a symlink into another repository, install with `--local` in the scratch project instead, or switch that link to per-skill links first with `scripts/install.mjs`.
  - Answer:
- [ ] **A2.** Run `orca agent hooks status --json`, then turn hooks on. Record which files changed (`git status` in any dotfiles repo, and the modified time of `~/.claude/settings.json`).
  - Answer:
- [ ] **A3.** Install v2 into the scratch project: `node scripts/install.mjs --project <scratch>`. Open the scratch project in Orca and confirm the slash commands appear in a Claude Code terminal.
  - Answer:

## Part B: Trial (answer the open questions)

Use the scratch repository. Each item maps to an unknown in `orca-notes.md`.

### State sharing
- [ ] **B1.** In the scratch repo's primary checkout, create `.gsd/project-context.md` and exclude `.gsd/` through `.git/info/exclude`. Add `.gsd` to `worktree.sharedDirectories` in `orca.yaml`. Create a workspace. Is `.gsd/` present in the new worktree, and is it a symlink or a copy?
  - Answer:
- [ ] **B2.** If B1 failed or gave a copy: try a repository hook (Settings -> Repository -> Hooks) that symlinks the primary checkout's `.gsd` into the new worktree. Record the exact command that works.
  - Answer:
- [ ] **B3.** Delete the workspace. Confirm `.gsd/<slug>/` still exists in the primary checkout.
  - Answer:

### Launching and waiting (stable commands)
- [ ] **B4.** From a terminal in the worktree, run `orca agent launch --agent claude --worktree current --prompt "Reply with the word ready and stop."` Does a new tab open in the same worktree?
  - Answer:
- [ ] **B5.** Run `orca terminal wait --terminal <handle> --for tui-idle --timeout-ms 60000 --json` on that tab. Record the JSON, the exit code on idle, and the exit code on timeout. Does it return while the agent is waiting on a permission prompt?
  - Answer:
- [ ] **B6.** Launch with `--prompt "/builder"`. Does the slash command run as a command?
  - Answer:
- [ ] **B7.** Run `orca worktree set --worktree active --comment "ship approval needed" --unread`. What does the user see? Is there any system notification?
  - Answer:

### Orchestration (experimental)
- [ ] **B8.** Enable orchestration in Settings -> Experimental. Run `orca skills get orchestration --full` and save the output next to this file as `orchestration-guide.txt`. Note any command that differs from `orca-notes.md`.
  - Answer:
- [ ] **B9.** `run-create`, then `task-create --spec "Read .gsd/<slug>/status.md and report the stage." --task-title "probe"`, then `worker-start --task <id> --worktree current --agent claude`. Does the worker run in the current worktree?
  - Answer:
- [ ] **B10.** Start a second worker in the same worktree while the first is alive. Allowed?
  - Answer:
- [ ] **B11.** Run `orca orchestration dispatch-show --task <id> --preamble --json`. Save the preamble text. Does it conflict with any v2 role instruction?
  - Answer:
- [ ] **B12.** Run `orca orchestration check --wait --types worker_done,escalation,question --timeout-ms 120000 --json`. Record the JSON shape.
  - Answer:
- [ ] **B13.** Have a worker call `orca orchestration ask` with two options. How is the user notified, on desktop and on the phone? Do the same for `gate-create`.
  - Answer:
- [ ] **B14.** How are task dependencies declared? Check `orca orchestration task-create --help` and the saved guide.
  - Answer:
- [ ] **B15.** Kill the coordinator terminal mid-run. Start a new one. Can it pick up the Run and its unacknowledged messages?
  - Answer:

### Safety
- [ ] **B16.** Is there any setting that restricts which `orca` commands an agent may run? In particular `orca worktree rm --force`, `orca workspace cleanup run`, `orca orchestration reset --all`. If not, the coordinator's Orca section must forbid them explicitly.
  - Answer:

## Part C: Write the Orca runtime sections

Fill the two placeholder sections in `skills/coordinator/SKILL.md`. Use only commands that worked in Part B.

- [ ] **C1. Choose the transport.**
  - Use **orchestration** when B9, B12, B13, and B15 all worked: it gives explicit completion and structured questions.
  - Otherwise use the **stable commands** (B4, B5, B7).
  - Write the section for the chosen transport fully. For the other, write one line saying why it was not chosen and the date.
- [ ] **C2.** The section must cover, with exact commands:
  - How the coordinator opens the Architect in a new tab for the user to talk to.
  - How it starts each role in the ticket's worktree with a prompt that contains only the slug and file paths.
  - How it learns a role finished. With stable commands, the wait returning is not success: read `status.md`.
  - How it surfaces a stop to the user (B7 or B13).
  - How it passes the user's answer back to the role that stopped. In Claude Code a role did not act on an answer relayed by message from another agent, so the rule there is a fresh instance with the `Resume` instruction. Test whether a role in its own Orca terminal accepts the answer typed or sent into that terminal; if not, use a fresh instance here too.
  - The commands it must never run (B16).
- [ ] **C3.** The core routing table in `skills/coordinator/SKILL.md` does not change. If the trial shows it must, record why in `log.md` first.
- [ ] **C4.** Add the `.gsd/` sharing setup that worked in B1 or B2 to the README's Orca section.
- [ ] **C5.** Note in the README how the Orca UI fits the three gates: review the diff and annotate before ship approval, and use Design Mode for UI adjustments after the build.

## Part D: Dry run in Orca

- [ ] **D1.** One behavior-changing ticket from workspace creation to `ship-approval`. The user is stopped only at the three gates.
- [ ] **D2.** One ticket whose Protected Behaviors are `None`. QA is skipped.
- [ ] **D3.** Two tickets in two workspaces at once. Neither touches the other's `.gsd/<slug>/` folder, and `project-context.md` is intact afterwards.
- [ ] **D4.** Annotate a diff line and send it to an agent. Confirm the change request is treated as unplanned work and routed, not applied directly by the Builder.
- [ ] **D5.** Record every correction made to a prompt file in `log.md`.

## Done when

- Every box above is ticked and every answer is filled in.
- `skills/coordinator/SKILL.md` has no placeholder section.
- `log.md` marks tasks 7.1, 7.2, and 7.3 complete.
