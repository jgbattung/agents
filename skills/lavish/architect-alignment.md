# Visual Alignment for the Architect

The Architect reads this file only when all three hold: the project's Visual alignment workflow option is `on`, the work involves UI design, and the Architect is running interactively. It replaces the plain-text proposal of the Architect's alignment check with a Lavish review artifact. One-shot subagent runs never start a Lavish session.

1. Read `SKILL.md` in this folder in full and follow its workflow, opening each matching playbook before writing HTML - at minimum `plan`, `comparison`, and `input`.
2. Build the artifact at `.lavish/<slug>-alignment.html` containing:
   - the research summary and proposed approach, including the Protected Behaviors intended for the spec and the PR strategy (`plan` playbook);
   - the ranked two or three approaches side by side (`comparison` playbook);
   - a mockup of the proposed UI direction rendered in the target project's own design system;
   - structured approve and request-changes controls (`input` playbook).
3. Immediately after creating the `.lavish/` directory, exclude it from git without modifying `.gitignore`:
   ```bash
   grep -qxF '.lavish/' .git/info/exclude 2>/dev/null || echo '.lavish/' >> .git/info/exclude
   ```
   `.lavish/` is local review state, same as `.gsd/`. Never stage or commit it.
4. Open the session and run the foreground poll per the skill. The artifact MUST open in the user's system default browser, never an editor-integrated or simple browser: `lavish-axi` opens the default browser itself, so do not pass `--no-open` and do not set `LAVISH_AXI_NO_OPEN`. If the session URL comes back with status `ready` (auto-open failed), open the default browser explicitly with the returned URL - `start "" <url>` on Windows, `open <url>` on macOS, `xdg-open <url>` on Linux - and never through an IDE preview.
5. Treat artifact feedback exactly like alignment conversation in chat: apply the requested changes, update the artifact, reply with `--agent-reply`, and poll again.
6. Alignment is granted when the user approves through the artifact's input controls or clearly approves in chat. End the session (`npx -y lavish-axi end <html-file>`) before generating the spec and plan.
7. **Fallback:** if `lavish-axi` fails to launch (restricted sandbox, npx failure), present the proposal as plain text. Never block planning on Lavish.
