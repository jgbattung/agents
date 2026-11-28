# Orca Checklist

This is Phase 7 of `plan.xml`. Do it on a machine where Orca is installed, after Phases 1 to 6 are done. Record every answer in this file, under the item, so the result travels with the branch.

Read `orca-notes.md` first. It lists what the documentation says and what it leaves open.

## Before you start

- [x] Orca is allowed on this machine. On a work laptop, confirm with whoever owns that decision, and check Orca's telemetry page (`orca.dev/docs/telemetry`) and that artifact publishing is off (it is off by default).
  - 2026-11-28, Windows 11, Orca 1.4.281. A personal machine. Telemetry ("Share anonymous usage data", Settings -> Privacy) is on, by the user's choice: per the telemetry page it sends version, OS, random install and session IDs, feature events, and token counts to PostHog, and is designed to exclude file contents, prompts, responses, terminal output, and paths. Artifact publishing (Settings -> Artifacts) was found **on**. The user chose to turn it off; at the end of Part B the profile still read `artifactSharingEnabled: true`, so this box stayed open until it read false. The user then switched it off, and the profile read `artifactSharingEnabled: false` on 2026-11-28.
- [x] Orca installed. Windows build at `%LOCALAPPDATA%\Programs\orca`.
- [x] Orca CLI enabled in Settings, and `orca status --json` succeeds.
- [x] `git`, Node 22+, and the GitHub CLI (`gh auth login`) are present. Git 2.46, Node 22.22, `gh` 2.106 logged in.
- [x] This repository is cloned, on branch `feature/workflow-v2` (or `main` once merged).
- [x] A scratch repository exists with a test command and a lint command (reuse the one from task 6.1 if it is on this machine). `jgbattung/v2-dryrun` at `C:\Users\LENOVO\v2-dryrun`.
- [x] Both repositories are registered in Orca: this one (where the checklist is recorded and the coordinator is edited) and the scratch one (where the trial creates workspaces). Orca only creates workspaces in repositories it knows about. Register each from a terminal with `orca repo add --path <folder>`, then confirm with `orca repo list`. The command is in Orca's CLI reference but was not run during planning; if it differs, add the repository from the Orca app instead and note the difference here.
  - Both were already registered; `orca repo list --json` shows them. `orca repo add --path <path> [--kind git|folder] [--json]` matches the reference.
- [x] Run this checklist from a Claude Code session started inside Orca, in this repository. The `orca` commands only work while the Orca app is running. Approve each `orca` command individually until item B16 is answered.
  - Run from a Claude Code session inside Orca in this repository. The session was in bypass permissions mode, so commands were not approved one by one; no destructive `orca` command was run apart from removing the two trial workspaces this checklist creates.

## Part A: Install without surprises

- [x] **A1.** Run `orca skills install --skill orca-cli --dry-run`. Record where it would write.
  - If it targets `~/.claude/skills` and that path is a symlink into another repository, install with `--local` in the scratch project instead, or switch that link to per-skill links first with `scripts/install.mjs`.
  - Answer: `orca-cli` and `orchestration` were already installed (by the Orca app, 2026-11-28 18:01 and 18:03). The dry run reports "No change" for `~/.agents/skills/orca-cli` and `~/.claude/skills/orca-cli`. Each is a per-skill link `~/.claude/skills/<name> -> ~/.agents/skills/<name>`. `~/.claude/skills` is a real folder (per-skill links from `install.mjs`), so nothing lands in this repository.
- [x] **A2.** Run `orca agent hooks status --json`, then turn hooks on. Record which files changed (`git status` in any dotfiles repo, and the modified time of `~/.claude/settings.json`).
  - Answer: Hooks were already on (`enabled: true`, claude `state: installed`, `configPath: ~/.claude/settings.json`). Orca wrote into `~/.claude/settings.json` (modified 17:57) one hook per event, each running `~/.orca/agent-hooks/orca-agent-hook.exe claude`: SessionStart, SessionEnd, UserPromptSubmit, PreToolUse, PostToolUse, PostToolUseFailure, PostToolBatch, PermissionRequest, Stop, StopFailure, SubagentStart, SubagentStop, TeammateIdle, PostCompact, Elicitation, ElicitationResult. It also wrote `~/.claude/keybindings.json` (ctrl+alt+g -> `command:orca-agent-view`) and `~/.claude/orca-agent-view.json` (17:28), and starts Claude with `--plugin-dir` for its agent-view plugin. `~/.claude` is not a git repository, and no repository changed. `AGENTS.md` and the `CLAUDE.md` link were not touched.
- [x] **A3.** Install v2 into the scratch project: `node scripts/install.mjs --project <scratch>`. Open the scratch project in Orca and confirm the slash commands appear in a Claude Code terminal.
  - Answer: Not installed per project: v2 is installed globally on this machine (task 6.1 note in `log.md`), and a project install would only duplicate the same links. In a Claude Code terminal Orca opened in the scratch repository (`orca agent launch --agent claude --surface terminal --worktree path:<scratch>`), the slash menu lists all seven: `/coordinator`, `/architect`, `/pm`, `/builder`, `/qa`, `/integrator`, `/reviewer`, with their v2 descriptions. Orca starts Claude with `--dangerously-skip-permissions` (see B16).

## Part B: Trial (answer the open questions)

Use the scratch repository. Each item maps to an unknown in `orca-notes.md`.

### State sharing
- [x] **B1.** In the scratch repo's primary checkout, create `.gsd/project-context.md` and exclude `.gsd/` through `.git/info/exclude`. Add `.gsd` to `worktree.sharedDirectories` in `orca.yaml`. Create a workspace. Is `.gsd/` present in the new worktree, and is it a symlink or a copy?
  - Answer: Yes, and it is a link, not a copy. With `.gsd/` excluded only through `.git/info/exclude` (not `.gitignore`) and an untracked `orca.yaml` in the primary checkout containing `worktree:` / `sharedDirectories:` / `- .gsd`, `orca worktree create --repo path:<scratch> --name <n> --base-branch main --no-parent` gave `<worktree>/.gsd` as a directory junction to `<primary>/.gsd` (Windows; `dir /AL` shows `<JUNCTION>`). A file written through the worktree's `.gsd` appeared in the primary checkout. `git status` in the worktree stayed clean, because `.git/info/exclude` is shared by all worktrees. Orca read `orca.yaml` from the primary checkout although it is untracked. Worktrees go to `~/orca/workspaces/<repo>/<name>`, on branch `<git user>/<name>` unless `--branch` is given.
- [x] **B2.** If B1 failed or gave a copy: try a repository hook (Settings -> Repository -> Hooks) that symlinks the primary checkout's `.gsd` into the new worktree. Record the exact command that works.
  - Answer: Not needed, B1 gave a link.
- [x] **B3.** Delete the workspace. Confirm `.gsd/<slug>/` still exists in the primary checkout.
  - Answer: `orca worktree rm --worktree path:<worktree> --delete-branch` removed the worktree. The primary `.gsd/` and `.gsd/reject-invalid-duration/` were intact (all files present, including the one written through the junction). Differs from `orca-notes.md`: removal now **keeps** the branch by default; `--delete-branch` deletes it only when Orca can prove it is merged.

### Launching and waiting (stable commands)
- [x] **B4.** From a terminal in the worktree, run `orca agent launch --agent claude --worktree current --prompt "Reply with the word ready and stop."` Does a new tab open in the same worktree?
  - Answer: Yes. A new tab in the same worktree, running `claude --plugin-dir <orca agent view> --dangerously-skip-permissions -- "<prompt>"`. It replied "ready". The JSON result has `outcome.kind: "terminal"` and `outcome.handle`. Pass `--surface terminal`: without it Orca may open a chat instead of a terminal, per the user's Chat | CLI setting. On Windows from Git Bash, set `MSYS_NO_PATHCONV=1` (see B6).
- [x] **B5.** Run `orca terminal wait --terminal <handle> --for tui-idle --timeout-ms 60000 --json` on that tab. Record the JSON, the exit code on idle, and the exit code on timeout. Does it return while the agent is waiting on a permission prompt?
  - Answer: Idle: exit 0, `{"ok":true,"result":{"wait":{"handle":"term_...","condition":"tui-idle","satisfied":true,"status":"running","exitCode":null}}}`. Timeout: exit 1, `{"ok":false,"error":{"code":"timeout","message":"timeout"}}`. Right after a launch with no prompt it is satisfied at once (the TUI is already idle). While the agent waits on a question (AskUserQuestion) it does **not** return: it ran to the timeout. Permission prompts do not occur, because Orca starts Claude with bypass permissions. The waiting state is visible in `orca worktree ps --agent-wait --json`: the agent row has `state: "waiting"` and `programStatus: {state: "blocked", kind: "question", message: "..."}`, and the workspace `status: "permission"`.
- [x] **B6.** Launch with `--prompt "/builder"`. Does the slash command run as a command?
  - Answer: Yes. The command file ran (it found no planned feature for that branch, changed nothing, and asked what to do). **Windows trap:** from Git Bash, MSYS path conversion rewrites an argument starting with `/` (here `--text "/coordinator"` became `C:/Program Files/Git/coordinator`). Run `orca` from PowerShell, or set `MSYS_NO_PATHCONV=1` first.
- [x] **B7.** Run `orca worktree set --worktree active --comment "ship approval needed" --unread`. What does the user see? Is there any system notification?
  - Answer: Run with `--worktree path:<worktree>` (`active` is whichever workspace the UI shows, not necessarily the ticket's). The user saw the unread dot and the comment on the workspace, and a Windows system notification fired. Repeated with no agent running in that workspace to rule out an agent-idle notification: the toast fired again. Clear with `--read --comment ""`.

### Orchestration (experimental)
- [x] **B8.** Enable orchestration in Settings -> Experimental. Run `orca skills get orchestration --full` and save the output next to this file as `orchestration-guide.txt`. Note any command that differs from `orca-notes.md`.
  - Answer: The orchestration commands worked without a Settings change (`experimentalOrchestrationPanel` is still false; that setting is only the UI panel). Saved as `orchestration-guide.txt`, verbatim apart from three em dashes replaced with plain dashes (house style). Differences from `orca-notes.md`:
    - `worker-start` takes `--spec` or `--spec-file` directly; `task-create` is needed only for DAGs. It also takes `--deps`, `--keep-open`, `--run`, `--name`, `--base-branch`, and `--worktree new-top-level`.
    - The coordinator is not meant to poll. Orca **wakes the coordinator by typing into its terminal** ("You have 1 orchestration message. Run `orca orchestration check --run <id> --terminal <handle>`"), which Claude Code shows as a user message. The guide says never to run a polling `check` loop.
    - `check` without `--wait` returns and consumes the waiting messages; no separate `--ack` was needed.
    - `dispatch-show` takes no `--run`.
    - A worker that ends its turn without `worker_done` produces an `escalation` ("Worker stopped without reporting") with its last output.
    - Use `--environment local` on starts and listings.
- [x] **B9.** `run-create`, then `task-create --spec "Read .gsd/<slug>/status.md and report the stage." --task-title "probe"`, then `worker-start --task <id> --worktree current --agent claude`. Does the worker run in the current worktree?
  - Answer: Yes, but `current` means the **calling terminal's** workspace (from `ORCA_WORKTREE_ID`), not the shell's working directory. From this repository's session it started the worker in this repository although the shell had `cd`'d into the scratch worktree. With `--worktree path:<worktree>` it ran in the scratch worktree (confirmed by `pwd`). A coordinator running inside the ticket's workspace gets the right one from `current`.
- [x] **B10.** Start a second worker in the same worktree while the first is alive. Allowed?
  - Answer: Yes. Two workers started 1 second apart with the same `--worktree` were both `liveness: live` in `worker-list` and both reported.
- [x] **B11.** Run `orca orchestration dispatch-show --task <id> --preamble --json`. Save the preamble text. Does it conflict with any v2 role instruction?
  - Answer: Saved as `orca-preamble.txt`. Conflicts with v2:
    - "Do only this task, yourself: no subagents or helper workers unless the task asks." The v2 spawn commands (`/builder`, `/qa`, `/reviewer`, `/integrator`) start the role as a subagent, so a worker spec would have to ask for that subagent explicitly.
    - "Never use a local question prompt such as AskUserQuestion." This is fine for the autonomous roles, which stop through `status.md`. It rules out the Architect as a worker, which is interactive by design.
    - The worker must send `worker_done` exactly once. A v2 role that stops would report `succeeded`, and the coordinator still has to read `status.md`.
- [x] **B12.** Run `orca orchestration check --wait --types worker_done,escalation,question --timeout-ms 120000 --json`. Record the JSON shape.
  - Answer: Every 15 seconds while waiting it prints a keepalive line `{"_keepalive":true,"_heartbeat":true,"elapsedMs":...,"deadlineMs":...}`, then exits 0 with `{"ok":true,"result":{"messages":[{"id":"msg_...","type":"worker_done","from":"term_...","subject":"...","body":"...","followUp":"orca orchestration send --to dispatch:<id> ...","payload":{"taskId":"task_...","dispatchId":"ctx_...","outcome":"succeeded"}}]}}`. A question has `type: "question"` and `payload.options`. An escalation has `type: "escalation"`, the subject "Worker stopped without reporting", and the last output in `body`.
- [x] **B13.** Have a worker call `orca orchestration ask` with two options. How is the user notified, on desktop and on the phone? Do the same for `gate-create`.
  - Answer: **The user is not notified.** Tried twice: the question reached only the coordinator's mailbox. The user saw no toast, no badge, and nowhere in the UI to answer. Phone untested: the mobile app is not installed. Worse for v2: while the coordinator was blocked waiting on the user, Orca told the worker "Your coordinator stopped without answering your question and has no worker running for it. Decide it yourself and say what you chose when you report." Both times the worker answered its own question ("no") and reported `succeeded`. `gate-create` cannot be called by a worker (`run_required`), and the coordinator cannot gate a task that has an active Dispatch (`task_not_startable`). It can gate only an unstarted task, which then waits for `gate-resolve --id <gate> --resolution <text>`. The user saw nothing for a pending gate either.
- [x] **B14.** How are task dependencies declared? Check `orca orchestration task-create --help` and the saved guide.
  - Answer: `--deps <json_array>` of task IDs on `task-create` (and on `worker-start --spec`). `--parent <task_id>` nests a task. `task-list --ready` lists what can start.
- [x] **B15.** Kill the coordinator terminal mid-run. Start a new one. Can it pick up the Run and its unacknowledged messages?
  - Answer: Yes. Terminal A ran `run-create` and `worker-start` with a 60-second task, then A's tab was closed. The worker finished and reported. A new terminal B ran `orca orchestration run-use --id <run>` and `check --run <run>`, and received the `worker_done` that had arrived after A was gone.

### Safety
- [x] **B16.** Is there any setting that restricts which `orca` commands an agent may run? In particular `orca worktree rm --force`, `orca workspace cleanup run`, `orca orchestration reset --all`. If not, the coordinator's Orca section must forbid them explicitly.
  - Answer: No. The profile has `agentPermissionDefault: "full-access"` with per-agent `agentPermissionOverrides`, which is why Orca starts Claude with `--dangerously-skip-permissions`. That setting covers the agent's own tools, not individual `orca` commands. `skipDeleteWorktreeConfirm` is a UI confirmation only: `orca worktree rm` from the CLI ran with no prompt. The coordinator's Orca section must forbid explicitly: `orca worktree rm` (any flags), `orca workspace cleanup run`, `orca orchestration reset`, `orca orchestration worker-abandon`, and `orca artifacts share|update`.

## Part C: Write the Orca runtime sections

Fill the two placeholder sections in `skills/coordinator/SKILL.md`. Use only commands that worked in Part B.

- [x] **C1. Choose the transport.**
  - Use **orchestration** when B9, B12, B13, and B15 all worked: it gives explicit completion and structured questions.
  - Otherwise use the **stable commands** (B4, B5, B7).
  - Write the section for the chosen transport fully. For the other, write one line saying why it was not chosen and the date.
  - Answer: Stable commands, because B13 failed (2026-11-28). The user chose to run each role in its own tab (`orca agent launch --prompt "/<command> <fixed prompt>"`) over running roles as subagents of the coordinator.
- [ ] **C2.** The section must cover, with exact commands:
  - How the coordinator opens the Architect in a new tab for the user to talk to.
  - How it starts each role in the ticket's worktree with a prompt that contains only the slug and file paths.
  - How it learns a role finished. With stable commands, the wait returning is not success: read `status.md`.
  - How it surfaces a stop to the user (B7 or B13).
  - How it passes the user's answer back to the role that stopped. In Claude Code a role did not act on an answer relayed by message from another agent, so the rule there is a fresh instance with the `Resume` instruction. Test whether a role in its own Orca terminal accepts the answer typed or sent into that terminal; if not, use a fresh instance here too.
  - The commands it must never run (B16).
  - Answer: Written in `skills/coordinator/SKILL.md`, using only commands run during the trial (`agent launch --focus` and `worktree set --worktree current` were run separately to confirm those forms). Open: the typed-answer test. The section uses a fresh instance, because in its tab the role is a subagent of that tab's session. It is tested at D1's ship-approval stop, and this box is ticked then.
- [x] **C3.** The core routing table in `skills/coordinator/SKILL.md` does not change. If the trial shows it must, record why in `log.md` first.
  - Answer: Unchanged.
- [x] **C4.** Add the `.gsd/` sharing setup that worked in B1 or B2 to the README's Orca section.
  - Answer: Added as a new "Orca" subsection under Runtimes. Also confirmed that `orca.yaml` can itself be excluded through `.git/info/exclude` and still shares `.gsd`.
- [x] **C5.** Note in the README how the Orca UI fits the three gates: review the diff and annotate before ship approval, and use Design Mode for UI adjustments after the build.

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
