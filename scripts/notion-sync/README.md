# notion-sync

One-way mirror of a project's `backlog/` ticket files into the Notion `Tasks` database.
The `backlog-protocol` skill runs it automatically after every ticket change, so day to day
you never need to touch it. The commands below are for the rare manual cases.

## Setup (once per machine)

1. `NOTION_TOKEN` must be set as a Windows user environment variable. It is the secret of the
   Notion internal integration `backlog-sync` (notion.so/profile/integrations). Restart VS Code
   fully after setting it.
2. Install dependencies:
   ```
   cd "$HOME/agents/scripts/notion-sync"
   npm install
   ```

## Manual commands

Run from anywhere; the argument is the project root.

| When | Command |
|---|---|
| Preview what would change | `node "$HOME/agents/scripts/notion-sync/sync.ts" <project-root> --dry-run` |
| Force a resync (after a warning, or after editing ticket files by hand) | `node "$HOME/agents/scripts/notion-sync/sync.ts" <project-root>` |

A run with nothing to change makes no writes, so re-running is always safe.

## Adding a project

1. Add the name (the project's folder name) to `PROJECTS` in `sync.ts`.
2. Add the same name as an option of the `Project` select in Notion, and create its board and
   backlog views.
3. Run the sync once for that project.

## Troubleshooting

| Output | Fix |
|---|---|
| `NOTION_TOKEN is not set` | Set the env var, then restart VS Code fully. |
| `API token is invalid` | Token was rotated or mistyped. Copy it again from the integration page. |
| `Could not find data_source` / `object_not_found` | The `Tasks` database lost its connection. In Notion: `...` > Connections > add `backlog-sync`. |
| `orphan LG-xxx` | A row exists in Notion with no ticket file. Nothing is deleted automatically; remove the row by hand if it is really gone. |
