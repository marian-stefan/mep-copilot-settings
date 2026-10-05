---
name: implementation-rules
description: Canonical implementation rules for the IMPLEMENT step of the Implementation Workflow Orchestrator. Single source of truth for pre-implementation validation, controlled implementation, verification, and definition of done.
---

# Implementation Rules

> **Stack tokens**: `{{TOKEN}}` names in this file are symbolic — resolve them at runtime from the installed `{stack}-stack-profile` skill (registry: `skills/stack-profile/SKILL.md`). Never substitute them into files.

This skill is the **single source of truth** for the IMPLEMENT step, applied by the Feature Implementer and Test Generator and sequenced by `agents/implementation-workflow-orchestrator.agent.md`.

> If these rules need to change, update this skill first — then validate the orchestrator's IMPLEMENT step remains consistent.

Act as a **Senior Software Engineer**. The SPEC is the baseline; during the implementation workflow, use the shared `effectiveRequirements` contract with the approval and precedence rules in `implementation-requirement-reconciliation` § Effective Requirements Contract. References to spec requirements below mean that effective contract when supplied; the original file list remains the scope authorization baseline.

The goal is a change that a reviewer can approve in one pass: it does exactly what the spec asks, nothing more, in the shape the repository already uses.

## 1. Pre-Implementation Validation

- **Repo Analysis:** Validate the implementation plan in the spec against the existing code in the repository before writing code.
- **Acceptance Criteria Extraction:** Before writing code, list the spec's acceptance criteria. This list is the definition of the result and is carried through to the Output Contract.
- **Strict Consistency:** Ensure the plan adheres to the existing tech stack, naming conventions, and patterns found in the repo.
- **Reuse Before Add:** Search the repo for an existing utility, service, or pattern that covers the need before writing a new one. If a near-match exists, extend it or state why divergence is required.
- **Conflict Resolution:** If the spec's plan is insufficient, contradicts the existing architecture, or misses a superior existing utility, **stop** and ask for clarification or propose an alternative that fits the current system.
- **Stop and ask at these points, always** — do not guess past them:
  - Two or more existing patterns conflict with each other (not resolved by Implementation Pattern Discovery's Pattern Selection Gate, since that only fires during research — if a conflict surfaces mid-implementation, stop the same way).
  - A dependency the plan or the repo assumes is missing (package, service, internal utility) and there is no safe substitute.
  - The change would cross a service or module boundary the spec did not call out.
  - The spec's instructions and what the code actually does disagree.

## 2. Controlled Implementation

### 2.1 Scope

- **Scope Ceiling:** Implement the acceptance criteria and nothing beyond them. No speculative extensibility, no configuration flags nobody asked for, no interface with a single implementation, no new abstraction layer until a third caller exists.
- **Smallest Viable Diff:** Prefer modifying an existing file over adding a parallel one. If the change requires touching more than the spec's listed files plus their companion tests, **stop** and report the extra blast radius before writing code (`SCOPE_EXPANSION`).
- **Location Intelligence:** Determine the appropriate file(s) based on the repository structure and spec details. Create new files or modify existing ones as needed.

### 2.2 Maintainability

- **Module Boundaries:** Respect the repository's module/dependency-boundary rules — see the active tech layer's `{stack}-patterns/SKILL.md` (e.g. `dotnet-patterns/SKILL.md`) for the concrete rules (project reference constraints, lint boundary rules, etc.). Never add a dependency edge the build system's boundary enforcement would reject.
- **Minimal Public Surface:** Export only what a caller outside the file needs. Default to `private`/`internal` and non-exported.
- **Meaningful Names:** Use descriptive, intention-revealing names for variables and parameters. Avoid vague abbreviations and one-letter names except for conventional, tightly scoped cases.
- **Cohesive Parameters:** When a method needs several related inputs, pass them through a cohesive request or options model instead of exposing many independent parameters. Keep simple or unrelated inputs as direct parameters.
- **Local Consistency:** Match the size, layering, and error-handling style of the files being edited — the local convention wins over a general best practice.
- **Explicit Failure Modes:** Do not swallow errors to make a path succeed. Propagate or handle them the way the surrounding service already does.

### 2.3 Correctness Discipline

- **Technology Lockdown:** Use ONLY the languages, frameworks, and library versions already established in the repository. Do not introduce new dependencies.
- **Config Adherence:** Follow all repository configurations exactly. The code must pass all existing linting and formatting rules.
- **Zero Hallucinations:** Implement exactly what is defined. If a dependency or internal utility is missing from both the spec and the repo, do not invent it — ask for the correct location.
- **Comment Discipline:** Match the file's existing comment density — do not add comments a file in this repo would not already have. Do not write a comment that only repeats the ticket, the spec, or an Acceptance Criterion (example to avoid: `// AC-2: ...`, `// Implements ticket requirement`, `// Per SPEC section 2`). Write a comment only for a reason the code itself cannot show — a non-obvious trade-off, a workaround, or a rule from outside the file.

### 2.4 Tests and Tracking

- **Test Companion Rule:** Every new source class/file must get a corresponding test file created (and every modified class its tests updated) in the same IMPLEMENT pass — e.g. `Foo.cs` → `FooTests.cs`, `foo.ts` → `foo.spec.ts`. Follow the naming and location conventions in `{stack}-testing.instructions.md` (deployed by the active tech layer). This is a per-file obligation carrying **baseline real cases** for the public contract (not empty shells) — not something to leave to the end-of-IMPLEMENT coverage gate.
- **File Tracking:** Maintain a running list of every file created or modified. Do NOT include the spec file itself — only source, test, and config files produced by the implementation.

### 2.5 Resource Discipline

- **Read Budget:** Prefer targeted search (grep, symbol lookup, signature reads) over whole-file reads. Never re-read a file already in context.
- **Write Budget:** Batch all edits to a single file into one write. Do not re-open a file to make a change that could have been included in the previous edit.

## 3. Verification & Definition of Done

### 3.1 Tests

- **Test Generation:** Extend the companion baseline tests (2.4) into a comprehensive suite using the repository's existing testing framework, matching the style and structure of current tests, per `{stack}-testing.instructions.md`.
- **AC Traceability:** Every acceptance criterion maps to at least one named test. Encode the criterion in the test name in plain language — never as an ID comment in source. An unmapped acceptance criterion is `AC_UNCOVERED`.
- **Coverage Contract:** **100% of changed lines and branches in the diff.** Repo-wide coverage totals must not regress. Excluded by default:
  - DTOs / POCOs / interfaces with no behaviour
  - Generated code and generated API clients
  - Framework-generated boilerplate (e.g. barrel/index re-export files, module/routing declaration files) as defined by the active tech layer
  - Application startup and DI wiring (e.g. `Program.cs`)
  - Pure mapping profiles

  Exclusions live in the repository coverage configuration and are reviewed like any other code change — do not add an exclusion inline to pass the gate.
- **Behaviour Over Lines:** A test must assert an observable outcome — a return value, persisted state, an emitted event, or an HTTP status. A test whose only assertion is that a mock was called does not count toward the gate.
- **Test Execution (efficient):**
  - Failure fixes: **scoped** commands only (path/filter/name pattern), batched all-failures-then-rerun.
  - Full coverage: **exit gate only**, maximum **2** full-coverage invocations per IMPLEMENT test pass.
  - Never sequential write-one-test → run → write-one-test → run.

### 3.1.1 Evidence and Scoped Merging

The Test Generator's Output Contract owns the result shape. These rules own its interpretation by IMPLEMENT and subsequent verification:

- **Identity**: capture `testContext.baselineRef` before the first implementation edit (immutable commit or reproducible snapshot); never substitute the post-edit HEAD on resume. `requirementsKey` is SHA-256 of canonical JSON for the effective contract (recursively sorted object keys, array order preserved). Each run records the tested HEAD/worktree and coverage-configuration fingerprints. Keep referenced reports outside source control and preserve them for the run; missing artifacts invalidate evidence that depends on them.
- **Execution versus edits**: run directly affected and downstream consumer test targets, even when their files are unchanged. This grants no edit permission. `scope.requiredTargets` is the complete obligation for all workflow changes; a focused pass may execute a subset only if the rest have valid retained results. Missing targets, incomplete discovery, or unavailable results block verification. A failed consumer target is `TEST_FAIL`, not an optional note.
- **Counters**: require integer `0 <= covered <= total` for changed executable lines and branches in each source diff, with reporter evidence and exact gaps. Emit one record for every changed source, including excluded/deleted sources. Exclusions require the existing coverage-config rule and reason. A verified zero denominator is not applicable, never fabricated 100%; pure deletions have no new executable lines, but consumer execution remains required. Unsupported/missing branch instrumentation is unavailable, not zero. Partial-file exclusions remain in the reporter evidence; do not classify a whole behavioral file as excluded to hide gaps.
- **Repository non-regression**: compare baseline/current counts over the same repository instrumentation scope, tool/version, configuration and exclusion policy. `delta` is current percentage minus baseline percentage for each supported metric; all applicable deltas must be nonnegative. Verified zero denominators are not applicable (null delta); an unavailable metric required by repository policy blocks the gate. Missing baseline/current data or incomparable reports yields `unavailable`, never `verified`. Changed-file counters or affected-project percentages cannot establish repository non-regression.
- **Exit scope and cost**: reuse a compatible baseline report. Obtain current repository totals either from a fresh repository-wide run or an exact merge of complete, non-overlapping instrumentation partitions whose dependency fingerprints are all current. Merge reporter data by executable line/branch identity before counting; never sum overlapping totals or average percentages. A narrow run without that complete partition evidence cannot verify the repository gate. Use affected scope during failure/gap rounds and widen only for the smallest valid exit measurement. Baseline collection and current full-scope runs both count toward the full-coverage invocation budget in § 3.1; unavailable evidence pauses rather than authorizing an extra run or resetting a budget.
- **Invalidate before gating**: after any edit, mark target results stale when any source/test/transitive/config dependency fingerprint changes. Invalidate dependent file coverage and behavior mappings too. A shared dependency invalidates all consumers even if their files are untouched. Uncertain dependency completeness invalidates the enclosing scope; contract or coverage-config changes invalidate incompatible evidence globally. Refresh discovery when targets/references are added or removed. Never infer freshness solely from path intersection with `focusFiles`.
- **Merge**: retain prior run metadata keyed by `run.id`. After a focused pass, replace that pass's target/file entries (including failures or unavailable results), and remove old behavior mappings for retested or invalidated targets before inserting the new passing mappings. Keep only demonstrably current untouched entries with their original `runId`; do not relabel them as newly tested. Obsolete deleted targets cannot prove an AC. Repository evidence must represent the current whole snapshot, not inherit a prior `verified` flag after a source/test/config change. A rerun that fails or emits no mapping never leaves its old passing mapping active.
- **Gate**: merge before evaluating any IMPLEMENT exit or AC gate. Require complete current passing target results, all applicable changed counters covered in full, current repository status `verified`, and every effective AC mapped to a passing named test with matching dependencies. Preserve genuine failures and gaps across partial passes; replace resolved failures/gaps only for retested targets/files. A known `TEST_FAIL` takes precedence over coverage absent because that test run failed. `blocked` or legacy aggregate-only evidence cannot pass; recover by scoped retesting plus the required repository exit measurement, never by manufacturing missing metadata.

### 3.2 Build

- **Build Verification:** Follow `skills/build-verification/SKILL.md` — affected-scope commands during iteration, full-scope only at the exit gate. Concrete commands come from the active tech layer (`{{AFFECTED_BUILD_COMMAND}}` during iteration, `{{BUILD_COMMAND}}` once as the exit gate).

### 3.3 Loop Control

This is the **single source of truth** for the fix budget shared by every gate in IMPLEMENT (`TEST_FAIL`, `COVERAGE_GAP`, `BUILD_FAIL`). Other files that describe these gates should cite this number rather than restating their own.

- **Fix Budget:** Maximum **2** remediation cycles per failing gate. On the 3rd consecutive failure, stop and emit the error code with a diagnosis and the list of attempted fixes — do not keep retrying.
- **Orchestrator-level cap:** the fix budget above bounds a single implementation pass's own retries. The orchestrator additionally bounds how many times it re-enters IMPLEMENT for the *same* gate: max 2 round trips, then PAUSE (`pauseReason: test-loop-exhausted` for TEST_FAIL/COVERAGE_GAP, existing BUILD_FAIL pause for build) with the same [M]anual-fix / [A]bort choice — it must never re-enter a 3rd time hoping a fresh attempt resets the count.
- **Global IMPLEMENT budget:** the orchestrator additionally caps *combined* gate re-entries (TEST_FAIL, COVERAGE_GAP, AC_UNCOVERED, BUILD_FAIL) at **4** per workflow run, so per-gate caps of 2 cannot multiply into an unbounded loop. On the 4th, PAUSE with the same [M]anual-fix / [A]bort choice.
- **REVIEW-driven re-entries** (Code Reviewer "fix", Goal Verification "Fix now") do not consume the IMPLEMENT budget; they are bounded by the shared `review.reviewIterations` cap. Gate failures *inside* such a fix pass do count toward it.
- **No Silent Weakening:** Never satisfy a gate by deleting a test, loosening an assertion, adding a coverage exclusion, or disabling a lint rule. If a gate is wrong, raise it as a blocker instead.

### 3.4 Success Criteria

The task is complete ONLY when:

1. The code is fully functional per the spec, and every acceptance criterion maps to a passing named test.
2. It passes **100%** of the generated tests, and changed-line/branch coverage is 100% with no repo-wide regression.
3. **It compiles without errors** (build succeeds at exit-gate scope).
4. It matches all repository-defined style and configuration rules.
5. The Output Contract below has been emitted.

### 3.5 Review Scope

Single source for the size signals and the "small change" rule used by the orchestrator's REVIEW step to skip the Rubber Duck and the Goal Verifier.

- `changedLines` = added + removed lines across non-test source files (`git diff --numstat`); `sourceFiles` = count of non-test source files; `docsConfigOnly` = only docs, config and data files changed.
- **Small change** = `changedLines ≤ 30` **and** `sourceFiles ≤ 2` **and** no public-surface change (method/route/event-payload signature, exported type shape, changed defaults or validation). The Code Reviewer judges public surface; when in doubt, the change is not small.

### 3.6 Review Evidence Freshness

This section owns independent-review invalidation and reuse; `implementation-workflow-state-machine` owns persistence. Apply it after every fix, on resume, and before COMMIT, regardless of which gate requested the fix.

- **Current scope**: compare the last reviewed snapshot with the current source/test/config changes, including deletions, untracked files and affected consumers. Recompute § 3.5 eligibility from the complete workflow changeset, not just the last fix. Code Reviewer examines every new fix; Rubber Duck and Goal Verifier retain their existing eligibility rules. A previous pass is never sufficient reason to skip an invalidated eligible check.
- **Dependency-aware invalidation**: invalidate a result if any reviewed source, test, transitive consumer, configuration, requirement, or referenced evidence it depends on changes. Include the absence of findings and the whole-goal/regression assessment, not just lines with findings. Changed test evidence can invalidate an AC even when production source is unchanged. Unknown dependency coverage means re-run the full applicable check; do not guess that untouched paths imply independence.
- **Scoped rechecks**: with complete dependency evidence, pass the changed files plus affected consumers/dependencies as `focusFiles`, all affected criteria as `recheckCriteria`, and prior results explicitly. Previously satisfied ACs belong in the recheck set when their dependencies change. Review-only nits stay scoped when their impact is demonstrably local; include prior findings until resolved or explicitly retained. An effective-requirements change requires a fresh full Goal Verifier pass and invalidates incompatible review evidence.
- **Reuse with provenance**: retain only results whose dependencies, effective requirements and relevant inputs still match. Preserve their original run identity and evidence; never present retained checks as newly executed. Stateless agents must receive the previous results and the orchestrator's invalidation/reuse decisions, not infer them from conversation. Missing legacy provenance disables reuse, not verification.
- **Merge before decisions**: replace invalidated findings/criteria/regression assessments only after the appropriate independent reviewer returns. Do not erase findings outside the rechecked scope or carry forward stale passing statuses. Recompute risk, AC coverage and scope consistency from the complete current result set; a failed/incomplete reviewer call cannot count as a pass. Recheck freshness after parallel calls and before commit confirmation is acted on; a changed snapshot returns to IMPLEMENT for stale test/build evidence or REVIEW for stale reviews.
- **Budget**: invalidation schedules required checks, not additional fix attempts. All reviewers share the existing `review.reviewIterations` cap; increment once for a user-selected fix round, not per reviewer or invalidated entry. Even the last allowed fix must receive fresh applicable reviews. At the cap, the existing known-gap policy applies only to current completed findings; missing/stale review evidence pauses at `implementation-blocked`, never silently becomes accepted risk.

## 4. Output Contract

On completion, emit:

- **Files changed** — created/modified source, test, and config files (never the spec).
- **AC → test mapping** — each acceptance criterion with the test name(s) proving it.
- **Coverage** — changed-line/branch result and repo-wide delta.
- **Commands run** — test and build invocations with their results.
- **Risk notes** — public API changes, data-model or migration changes, cross-service impact, and anything deliberately left out of scope.

## Error Codes

Use the standardized codes from `skills/specs-error-handling/SKILL.md` when blocking conditions are encountered:

| Condition | Code |
|-----------|------|
| Tests fail | `TEST_FAIL` — stay in IMPLEMENT |
| Changed-line coverage below 100% | `COVERAGE_GAP` — stay in IMPLEMENT |
| Lint/build failure | `BUILD_FAIL` — stay in IMPLEMENT |
| Change extends beyond the spec's file set | `SCOPE_EXPANSION` — stop before writing code |
| Acceptance criterion with no mapped test | `AC_UNCOVERED` — stay in IMPLEMENT |
| Fix budget exhausted (2 cycles) | Emit the originating code with diagnosis — exit IMPLEMENT |
