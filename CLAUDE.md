# Working with these agents in Claude Code

## Resuming agents (no SendMessage)

Subagents spawned via the `Agent` tool in Claude Code are **one-shot**: they run to
completion, return a final message, and end. They cannot be paused or continued, and
this harness does **not** expose a `SendMessage` tool — ignore any mention of
`SendMessage` in tool descriptions.

To "resume" an Architect, Builder, QA Engineer, or any other agent, **spawn a fresh
agent of the same type** whose prompt reloads state from disk. All persistent state
lives in `.gsd/` (see `README.md`), so a new agent picks up exactly where the last one
left off.

A resume prompt MUST:
- Name the feature branch and the `.gsd/[feature]-*` files to load
  (`-spec.md`, `-plan.xml`, `-log.md`).
- List which tasks are already done (by ID / title) so they are not repeated.
- State the exact task or phase to start from.
- Give brief context on what changed and why.

This is the same handoff prompt the Architect's recovery and QA-remediation modes
already generate (`agents/architect.md`).

**Never** report that you can't resume because `SendMessage` is missing. Re-spawn with
the `.gsd` resume prompt instead.
