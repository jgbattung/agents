---
name: state-machine
description: Defines strict protocols for interacting with the .gsd state directory, logging changes, and handling archives.
user-invocable: false
---

# State Machine Protocol (.gsd)

All agents must adhere to these rules to prevent context drift and ensure a reliable handoff between the Architect, Builder, QA, and Integrator.

## 1. The Archive Rule (Scope Isolation)
* **Active Workspace:** ONLY read and write files located in the root of the `.gsd/` directory.
* **Isolation:** You must completely ignore any files inside `.gsd/archive/`. These are historical records and should not influence current implementation decisions.

## 2. The Logging Rule (Save State)
The `.gsd/[feature]-log.md` file is the "save state" for the feature.
* **Append-Only:** NEVER overwrite or delete existing content in the log. Always append new entries to the bottom of the file.
* **Immediate Updates:** Log every move, code change, or decision immediately after it occurs.
* **Mandatory Sections:** Every log entry must use this AI-optimized format:

### [Timestamp / Phase Name]
1. **Changes Implemented**: Highly detailed breakdown of logic, functions created, and exact file paths modified.
2. **Deviations/Pivots**: Any changes made that differ from the original XML plan and the rationale.
3. **Unresolved Errors**: Any blockers, failing tests, or stack traces that require another agent's attention.

## 3. QA & Verification Summary
When testing is complete, the QA Engineer must append a `### QA & Testing Summary` section detailing test coverage and any Category B (source code) bug fixes.