# Orca ADE: Research Notes

Researched on 2026-11-26 from Orca's public documentation only. No Orca command was run. Orca changes quickly, so re-check anything here against the installed version before relying on it (`orca skills get orchestration --full` prints the version-matched guide).

This is Orca by Stably AI (`orca.dev`, `github.com/stablyai/orca`), not VirtusLab/orca.

## Documented facts

### Product
- Desktop app for macOS, Windows, Linux. MIT licensed. Runs CLI agents (Claude Code, Codex, and many others) in parallel, each in its own git worktree.
- Install on macOS: `brew install --cask stablyai/orca/orca`. A bare `orca` cask is an unrelated product.

### Worktrees
- Each workspace is a real `git worktree` with its own branch, files, and agent terminals.
- Created from the UI ("Create Workspace") or `orca worktree create`.
- A workspace can start from the repo base ref, another local branch (for stacking), a commit, or a remote branch.
- Branch name comes from the workspace name or a linked GitHub PR, Linear or Jira issue, or GitLab MR.
- Deleting a worktree removes the directory and the branch. Untracked files in it are lost.
- Sharing untracked files into new worktrees:
  - `orca.yaml` at the repo root, key `worktree.sharedDirectories`: gitignored directories to share. Entries must exist in the primary checkout and be gitignored.
  - `.worktreeinclude` at the repo root: literal gitignored paths that are copied. Globs and negation are skipped.
  - Settings -> Repository -> "Worktree Shared Paths": APFS clone-copy on macOS when possible, otherwise a symlink.
  - Settings -> Repository -> Hooks: commands that run automatically on worktree create.

### CLI
- The CLI talks to a running Orca app. Check with `command -v orca` and `orca status --json`.
- Where to enable it: one docs page says Settings -> General -> Orca CLI, another says Settings -> Experimental -> CLI.
- Commands the v2 design may use:
  - `orca worktree create --name --branch --agent --prompt --setup run|skip|inherit --parent-worktree --pr`
  - `orca worktree list|ps|current|show|set|rm`. `set` takes `--comment`, `--workspace-status in-review`, `--unread`, `--read`.
  - `orca agent launch --agent <a> [--model] [--effort] [--prompt] [--worktree] [--focus]`
  - `orca terminal list|show|read|send|wait|create|split|rename|switch|close`. `send --text ... --enter`. `wait --for tui-idle --timeout-ms <n> --json`.
  - `orca file open|diff|open-changed`
- There is no CLI command to commit, push, or create a PR.

### Orchestration (experimental)
- Enable under Settings -> Experimental. The docs say its UI panel is temporarily unavailable.
- Model: a Run (namespace and coordinator inbox, it never schedules workers), Tasks (spec, dependencies, status `pending|ready|dispatched|completed|failed|blocked`), Dispatches (one attempt of a task on a terminal), Messages, Decision gates.
- Coordinator loop:
  - `orca orchestration run-create --objective "..."`
  - `orca orchestration task-create --spec "..." --task-title "..."`
  - `orca orchestration worker-start --task <id> --worktree current|new-child --agent <a> [--name] [--setup run] [--model] [--effort]`
  - `orca orchestration check --wait --types worker_done,escalation,question --timeout-ms 900000 --json`
  - `orca orchestration check --ack <deliveryId>`
- Worker side: `orca orchestration send --type worker_done --task-id ... --dispatch-id ... --outcome succeeded|failed` exactly once, and `orca orchestration ask --to <coordinator> --question ... --options "a,b"`.
- Gates: `gate-create --task ... --question ... --options '["yes","no"]'`, `gate-resolve --id ... --resolution ...`.
- Workers receive a preamble telling them how to report. View it with `orca orchestration dispatch-show --task <id> --preamble --json`.
- Nested worker depth defaults to 4. Heartbeat defaults to 5 minutes.
- Legacy commands `orchestration run`, `run-stop`, `coordinator-start`, `coordinator-stop` do nothing.

### Review and shipping (UI)
- Diff annotations: comment on a line or range, then "Send to agent" composes one prompt with all comments, line-anchored, for an agent in that worktree.
- Commit, push, PR creation, and merge are done in the UI. Orca does not force-push silently.
- "Fix broken checks" in the PR view hands the failed check names and links to an agent.
- Design Mode: in the built-in browser, click an element to send its HTML, computed CSS, and a cropped screenshot to the active agent. An agent can read the notes with `orca tab annotations`.

### Skills, hooks, notifications
- Orca ships skills: `orca-cli`, `orchestration`, `computer-use`, `orca-linear`, `orca-emulator`, `orca-emulator-android`, `orca-per-workspace-env`.
- `orca skills install --skill <name> [--agent <name>] [--local] [--dry-run]`. Default scope is global. It shells out to `npx skills`.
- `orca agent hooks status|on|off` installs hooks that report working, waiting, and done into the UI.
- Orca reads a repo's `.claude/` and `.codex/` configuration and leaves `CLAUDE.md` and `AGENTS.md` alone.
- A system notification fires when an agent goes from working to idle. The mobile app has separate toggles for agent completion and agent input.

## Not documented (the trial must answer these)

1. What `tui-idle` means exactly, the other `--for` values, and the exit codes of `terminal wait`.
2. Whether two orchestration workers can run in the same worktree with `--worktree current`.
3. How task dependencies are declared (`task-create` documents only `--spec`, `--task-title`, `--json`).
4. Size limits on `--spec` and message bodies, and whether a worker can read its spec back.
5. The JSON shape `orchestration check` returns.
6. How a decision gate notifies the human.
7. Whether an agent can trigger a system notification. `orca worktree set --unread` sets the unread dot only.
8. Whether `worktree.sharedDirectories` accepts a folder ignored through `.git/info/exclude` and not `.gitignore`.
9. Where `orca skills install` writes for Claude Code, and whether `orca agent hooks on` edits `~/.claude/settings.json`.
10. Whether a slash command passed through `--prompt` runs as a command.
11. Any permission model for agent-issued CLI calls such as `orca worktree rm --force` or `orca workspace cleanup run`.
12. Whether PR review comments can be sent to an agent from the UI.

## Source pages

- https://github.com/stablyai/orca
- https://orca.dev/
- https://orca.dev/docs/cli/overview
- https://orca.dev/docs/cli/reference
- https://orca.dev/docs/cli/orchestration
- https://orca.dev/docs/cli/skills
- https://orca.dev/docs/model/worktrees
- https://orca.dev/docs/browser/design-mode
- https://orca.dev/docs/review/annotate-ai-diff
- https://orca.dev/docs/review/commit-push
- https://orca.dev/docs/review/github
- https://orca.dev/docs/agents/hooks-memory
- https://orca.dev/docs/settings
- https://orca.dev/docs/notifications
- https://orca.dev/docs/ways-to-run
