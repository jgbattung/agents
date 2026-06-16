---
name: back-prop
description: 'Back-propagate reusable components from a completed, deployed prototype build into the canonical component-library, applying component-library/AGENTS.md policy and producing an audit-trail notes file. Use after `npm run deploy` succeeds and the live URL is verified, before outreach begins, when asked to "run back-prop on sites/{slug}", extract components into the library, or harvest a prototype into the component library.'
---

# Back-Propagation

Extract reusable components from a completed prototype build into the canonical `component-library/`, applying the rules in `component-library/AGENTS.md`, and produce an audit-trail notes file.

This skill is **procedure**. `component-library/AGENTS.md` is **policy**. Every classification, token rename, content-stripping, and dependency decision is governed by AGENTS.md — this skill never invents or overrides those rules. Where AGENTS.md is silent, surface a finding; do not improvise.

## When to Invoke

- After `npm run deploy` succeeds for a prototype build **and** the live URL is verified, **before** outreach begins.
- One prototype at a time.
- Manual invocation by the owner, typically:
  > "Read `~/agents/skills/back-prop/SKILL.md` and run back-prop on `sites/{slug}`."

## Required Inputs

- **Prototype path** (e.g., `sites/fig-dental`) — provided by the owner at invocation.
- **Workspace must include `component-library/`** as a sibling to the prototype directory. If absent, halt and ask the owner to add it before proceeding.

## Discovered Context (read automatically)

- `component-library/AGENTS.md` — source of all policy. Read **fully** as step 1. Cannot proceed without it.
- `component-library/back-prop-history/` — must exist; create if missing.
- Current `component-library/` contents — Component Status inventory, `sections/`, `ui/`, `lib/`.
- Prototype's `src/components/sections/`, `src/components/ui/`, `src/lib/` — walked for the inventory.
- (Optional) `targets/{slug}/brief.md` — informs judgment about what content is client-specific.

## Hard Constraints (Non-Goals)

- **Read-only on the prototype side.** Never modify the prototype repo. Extraction copies *out* of it only.
- **No deploy.** Deploy must already have succeeded before invocation.
- **No policy edits.** Never modify AGENTS.md's Semantic Token Contract, Classification Rules, Content Handling Rules, or Dependency Chain Rules. Only the **Component Status inventory** section of AGENTS.md may be updated (Phase 4).
- **No improvising.** If a case isn't covered by AGENTS.md, record it as a finding rather than make a value judgment.

## Phase Structure

Four phases. Phases 1, 3, 4 run automatically. **Phase 2 pauses for owner approval per flagged component.** This shape is contractual — do not collapse phases or move the human-in-the-loop checkpoint.

---

### Phase 1 — Setup and Pre-Extraction Plan (Automated)

1. Read `component-library/AGENTS.md` and `component-library/THEME-CONTRACT.md` **in full**. Extract and hold for the pass:
   - Current **Semantic Token Contract** (canonical tokens)
   - **Classification Rules** (dispositions)
   - **Content Handling Rules**
   - **Dependency Chain Rules**
   - Current **Component Status** inventory
   If AGENTS.md is missing or unreadable, **halt here** and report.
2. Verify the workspace includes both `sites/{slug}/` and `component-library/`. **Halt** if either is missing.
3. Ensure `component-library/back-prop-history/` exists; create if missing.
4. Walk the prototype's `src/components/sections/`, `src/components/ui/`, and `src/lib/`. Inventory every component and utility.
5. For each component:
   - Cross-reference against the AGENTS.md Component Status inventory (**new** vs. **existing-but-changed**).
   - Assign a preliminary **disposition**, one of:
     - **back-prop**
     - **back-prop ⚐** (deep parameterization — requires Phase 2 approval)
     - **don't back-prop**
     - **gray-zone**
   - Identify the **dependency chain**: internal lib deps, external shadcn primitives, utilities (e.g., `cn`).
   - Detect the **per-pass token mapping** (raw brand utilities used in the prototype → semantic tokens in the library, e.g., `navy → brand-strong`, `cream → on-brand`).
6. Produce a **Pre-Extraction Plan** and present it to the owner **before any file write or commit**:
   - Component list with assigned dispositions.
   - Token mapping table.
   - Which components require Phase 2 approval (the ⚐ flagged ones).
   - Any conflicts with the existing inventory (component already exists; change is non-trivial). If a component's natural disposition **conflicts** with what the AGENTS.md inventory suggests, surface it explicitly and **ask the owner before proceeding**.

The owner may revise dispositions, edit the token mapping, or stop the pass entirely before Phase 2 begins.

---

### Phase 2 — Per-Component Approval (Interactive, Flagged Components Only)

For **each ⚐ component** in the approved plan, present a **change report**:

- **Source path** (in prototype)
- **Library path** (target)
- **Disposition**
- **Token-rename diff** — concrete substitutions to be applied
- **Stripped content** — what will be removed (with examples)
- **Parameterized content** — props to be created, with their default values
- **Dependencies retained** — what remains imported as-is
- **Dependencies rewritten** — what import paths will change
- **Anticipated forbidden-string sweep result**

Wait for the owner's response on **each**: **yes / edit / skip**. Apply edits if the owner adjusts the plan.

Unflagged components are **not** presented individually — they were approved in bulk via the Phase 1 plan.

---

### Phase 3 — Extraction Execution (Automated, Per-Component Loop)

For each approved component, **in order**:

1. Copy the component file to its library path.
2. Apply the **semantic token rename** per AGENTS.md > Semantic Token Contract, using the per-pass mapping locked in Phase 1.
3. Apply **Content Handling Rules** per AGENTS.md:
   - Convert copy / URLs / image paths / business-name references to **props**.
   - Set **neutral placeholder defaults** — self-evidently placeholder, never realistic-looking.
4. Apply **Dependency Chain Rules** per AGENTS.md:
   - **Case A** (internal lib deps) → rewrite import paths to library-relative.
   - **Case B** (external shadcn primitives) → keep the original import path; do **not** vendor.
   - **Case C** (utilities like `cn`) → rewrite to the library's neutral path (e.g., `../lib/cn`).
5. Run the **forbidden-string sweep** on the resulting file. The sweep checks for:
   - Original brand utility names (e.g., `navy`, `cream`)
   - Hex codes
   - Business name and slug
   - Hardcoded URLs (phone numbers, social handles, map embed URLs)
6. **If the sweep fails:** halt the loop, report the offending strings to the owner, do **not** commit.
7. **If the sweep passes:** commit atomically with message
   `feat(library): extract {ComponentName} from {prototype-slug}`.
8. Record the commit hash in the per-component change report.

---

### Phase 4 — Finalization (Automated)

1. Run a **library-wide forbidden-string sweep** across all newly-extracted files plus any existing files that were updated. **Halt if any hit** — do not update AGENTS.md or write notes; the owner resolves, then re-run Phase 4 only.
2. Detect **component reuse gaps**: any file in `ui/` not imported by any file in `sections/`. Record as a **finding** in the notes (not a blocker).
3. Update `component-library/AGENTS.md` > **Component Status** inventory:
   - Add new components with their disposition flag (⚐ if applicable).
   - Update existing components if their state changed.
4. Write `component-library/back-prop-history/back-prop-{N}-notes.md`, where `{N}` is the next sequential number (scan the directory to determine it). Required sections — keep this structure consistent across passes:
   - **(a) Final dispositions table** — per-component, with the change-report fields.
   - **(b) Token mapping used this pass** — the specific brand-to-semantic mapping applied.
   - **(c) Heuristic gaps surfaced** — cases where AGENTS.md was silent or ambiguous; recommendations for rule updates.
   - **(d) Deviations from the Phase 1 plan** — what changed mid-pass and why.
   - **(e) Component reuse gaps** — from Phase 4 step 2.
   - **(f) Other findings** — anything worth recording for future passes.
5. Commit the AGENTS.md update and the notes file **together**:
   `docs(library): update inventory and back-prop-{N} notes`.
6. Print the final **owner-facing summary**:
   - Components extracted (count, list)
   - Components skipped (count, with reasons)
   - Sweep status
   - Notes file path
   - Any flags raised (reuse gaps, deviations)

---

## Error Handling

| Situation | Action |
|-----------|--------|
| AGENTS.md missing or unreadable | Halt at Phase 1 step 1. Report. |
| Workspace missing `component-library/` | Halt at Phase 1 step 2. Report. |
| Forbidden-string sweep failure mid-Phase 3 | Halt the loop, do **not** commit, surface offending strings to the owner. |
| Library-wide sweep failure in Phase 4 | Halt; do **not** update AGENTS.md or write notes. Owner resolves; re-run **Phase 4 only**. |
| Conflicting disposition (component classified differently than the AGENTS.md inventory suggests) | Surface as a finding; ask the owner before proceeding. |

## Outputs (after a successful run)

- New / updated component files in `component-library/sections/`, `ui/`, `lib/`.
- Updated `component-library/AGENTS.md` > Component Status.
- New `component-library/back-prop-history/back-prop-{N}-notes.md`.
- Per-component commits + one final commit for inventory and notes.
- Owner-facing summary of what changed.
