---
name: testing-standards
description: Defines what earns a test, what never does, how strong a test must be, and how tests are pruned and judged. Loaded explicitly by the QA Engineer (who writes tests), the Architect (who lists protected behaviors), and the review skill and Reviewer (who judge tests).
user-invocable: false
---

# Testing Standards

A test exists to protect a behavior someone relies on. A test that cannot fail when that behavior breaks protects nothing and still costs maintenance on every future change. More tests is not better. The goal is the smallest suite that fails whenever a protected behavior breaks.

## 1. What Earns a Test
Every test protects exactly one named behavior and has one of these reasons:

- **AC** - an Acceptance Criterion of the work item.
- **Contract** - something a consumer or other code relies on: an API response, a function's result, an emitted event, a persisted format.
- **Regression** - a bug that actually occurred. The test reproduces it and must fail on the code as it was before the fix.
- **Setup** - a failure caught during setup or integration (wrong wiring, missing migration, bad configuration) that would otherwise come back silently.

No reason, no test. "This file changed" and "this branch exists" are not reasons.

**Perspective.** Write the test from the position of the caller of a public interface: an end user, an API consumer, or another module that relies on the contract. Drive the behavior through that interface and assert on what the caller can observe. Pure domain logic with a public function is a valid target; a private helper is not.

**Naming.** The test name states the behavior, so a failure reads as "what broke" without opening the file.

## 2. What Never Gets a Test
- The framework, the language, the runtime, or a third-party library doing its own job.
- The environment (that a variable is set, that a package is installed), unless it is a **Setup** reason with a failure that was actually caught.
- Anything that does not exist in the product: invented options, hypothetical callers, speculative edge cases no requirement or contract mentions.
- That an argument, prop, or option exists or is accepted. Test what it does, and that it does it correctly.
- Constants, configuration values, trivial getters and setters, and type shapes the compiler or linter already guarantees.
- Private functions and internal call order.
- The return value of your own mock.

## 3. Strength
- **It must be able to fail.** Breaking the protected behavior in a small way must turn the test red. A test that stays green proves nothing.
- **State how it fails.** Every test has a **failure statement**: the specific change to the product's behavior that would make it fail, and the assertion that would catch it. A test with no credible failure statement is not written.
- **Assert outcomes, not activity.** Assert exact expected values and observable effects. "Is defined", "is truthy", "does not throw", "rendered without crashing", and "was called" on their own are not assertions of behavior.
- **Mock only at system boundaries.** Network, clock, randomness, filesystem, and third-party services may be replaced. The product's own modules may not: a test that mocks the code it is meant to exercise tests the mock.
- **No snapshot dumps by default.** A snapshot of a whole tree or payload fails on irrelevant changes and gets re-approved without reading. Assert the specific values that matter.
- **Deterministic.** No real time, real network, sleeps, or dependence on test order.

When `.gsd/project-context.md` names a mutation testing tool the project already uses, the QA Engineer runs it scoped to the files the feature changed once the suite is green, and strengthens the test behind each surviving mutant.

## 4. Proportion
- A change adds tests in proportion to the behavior it changes. One changed behavior usually means one test, plus one per distinct failure the caller can hit.
- **One behavior, one test, one level.** Protect a behavior at the lowest level that can observe it through a public interface. Do not repeat the same assertion at unit, integration, and end-to-end level.
- **Search first.** Before writing a test, look for an existing test that already protects the behavior. Extend or tighten it instead of adding a near-duplicate.
- **No new tests is a valid outcome.** A refactor, documentation, or configuration change that alters no behavior needs no new tests. Run the existing suite and say so.

## 5. Missing Tools, Missing Data, and Skips
- A missing tool, service, binary, fixture, or data set **fails** the run. It is never skipped and never mocked away. Guards such as "skip if not installed" or "return early if the fixture is absent" are forbidden.
- Provide the real dependency through setup. If that is impossible, leave the test failing and report it as a blocker.
- A test that only applies to some platforms is excluded through the test runner's configuration, not skipped at runtime.
- A change introduces no skipped test: no `.skip`, `.only`, `xit`, `todo`, `pytest.skip`, or equivalent on a test it adds, and none added to a test that already existed. A test that was already skipped before the change is pre-existing, even in a file the change touches: it is reported, not fixed, and never blocks.

## 6. Pruning
Deleting a test is allowed only when one of these holds:
- The current change removed or deliberately changed the behavior the test protected.
- A stronger test now protects the same behavior, so the old one is redundant.
- The test violates Section 2 and sits in a file the current change already touches.

Rules:
- Never delete, weaken, or skip a test that is failing because of a real defect.
- Never prune outside the reach of the current change. Unrelated bloat is reported as a suggestion.
- Every prune is logged with the test name, file, and which rule above applies.

## 7. Judging Tests (review skill and Reviewer)
When reviewing a diff that adds, changes, or removes tests, ask of each test:
- Which behavior does it protect, and for which reason from Section 1? If there is no answer, it is a finding.
- Would it still pass if that behavior were broken? If yes, it is a finding.
- When the feature's log gives a failure statement for it (the workflow's own self-review only): does the statement hold? Read the named assertion and the code it exercises. If the stated change would not make that assertion fail, it is a finding.
- Does it fall under Section 2?
- Does another test already protect the same behavior at the same or a lower level?
- Does it introduce a skip, or a guard against a missing tool or data, in violation of Section 5?
- Is the number of tests in proportion to the behavior the diff changes?
- For each removed test: does a pruning rule in Section 6 justify it?

Also ask of the change: is there a behavior it adds or alters that no test would catch breaking?

In the workflow's own self-review (the review skill), a test that protects nothing carries the same weight as a missing test. The Reviewer agent, reviewing someone else's PR, applies its own blocking rules: there a missing test can block, and a test that protects nothing is a suggestion.
