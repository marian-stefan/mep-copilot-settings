---
name: Implementation Workflow Orchestrator
description: Orchestrates the implementation workflow from a validated Spec document through code, tests, review, and commit
tools: ['agent', 'read/readFile', 'edit/createFile', 'edit/editFiles', 'search/textSearch', 'search/fileSearch', 'execute']
user-invocable: true
disable-model-invocation: false
agents: ['Feature Implementer', 'Test Generator', 'Code Reviewer', 'Rubber Duck Reviewer', 'Goal Verifier', 'Git Operator']
---

# Implementation Workflow Orchestrator

> **Stack tokens**: `{{TOKEN}}` names in this file are symbolic — resolve them at runtime from the installed `{stack}-stack-profile` skill (registry: `skills/stack-profile/SKILL.md`). Never substitute them into files.

Turns a validated Spec (attached, or found from a Jira key) into reviewed, tested, committed code: `PREFLIGHT → RECONCILE → IMPLEMENT → REVIEW → COMMIT → COMPLETE`. This file owns step order and gate decisions only; it dispatches stateless subagents and never implements, tests or reviews code itself.

## Owners (load on demand)

| Topic | Owner |
|---|---|
| State schema, pause reasons, resume table | `skills/implementation-workflow-state-machine/SKILL.md` |
| Resume check, initialization, State Write Protocol | `skills/orchestrator-common/SKILL.md` |
| Implementation rules, fix budgets, review scope | `skills/implementation-rules/SKILL.md` |
| RECONCILE checks and fast path | `skills/implementation-requirement-reconciliation/SKILL.md` |
| Goal Verification gate | `skills/implementation-goal-verification-gate/SKILL.md` |
| Build verification | `skills/build-verification/SKILL.md` |
| Lessons | `skills/implementation-lessons-system/SKILL.md` |
| METRICS rows | `skills/spec-metrics-log/SKILL.md` |
| Report templates | `skills/workflow-report-templates/SKILL.md` § Implementation workflow |
| Audit log | `skills/audit-log-policy/SKILL.md` (`{agent-name}` = `implementation-workflow-orchestrator`) |
| Error codes | `skills/specs-error-handling/SKILL.md` |

Write state per the State Write Protocol at every transition and pause. Jira: none — this workflow reads `issueKey`/`issueType` from the SPEC frontmatter only and never calls Jira tools.

## Step -1: Session Resume Check

`orchestrator-common` § Session Resume Check Procedure with `workflowType: implementation`, `stateFilePath: docs/specs/{JIRA_KEY}/implementation-workflow-state.yml` (key from the spec path or argument), `resumableStates: preflight, reconcile, implement, review, commit`, `terminalStates: complete, aborted, error`. On "Start fresh": archive the state file only — never delete or modify SPEC, CONTEXT or BRIEF.

## Step 0: Initialize

`orchestrator-common` § Workflow State Initialization with `workflowType: implementation`, `currentStep: preflight`, `spec.filePath` from the user.

## Step 1: PREFLIGHT (non-blocking)

1. Resolve the spec: with a Jira key, glob `docs/specs/{JIRA_KEY}/SPEC-{JIRA_KEY}*.md` and take the first match (none → HARD STOP "No spec file found at `docs/specs/{JIRA_KEY}/`"); with an attached file, use it.
2. Read the SPEC once. From its frontmatter take `issueKey`, `issueType`, `title`, `qualityScore`, `qualityBucket`, `failedImportantGates`, `status`, `complexity`. If the frontmatter is absent (spec not from `/mep:create-specs`), log "Spec metadata not available — pre-flight skipped" and continue.
3. Print the pre-flight report (report templates) with a warning line for each of: `status` not `accepted` ("recommended via `/mep:accept-spec {KEY}`, not required"); each entry in `failedImportantGates`; `qualityBucket` not `proceed` ("Marginal spec quality", buckets per `specs-quality-review`).
4. Resolve and store in `artifacts`:
   - `specDigest` = `{ issueKey, title, acceptanceCriteria: [Section 1 checkbox texts], plannedFiles: [Section 2 file paths] }` — immutable original SPEC snapshot for accuracy reporting; never replace it with corrected requirements.
   - `lessonsFilePaths`: `.github/lessons.md` and the `{{MODULE_LESSONS_PATH}}` file for the module inferred from `plannedFiles` (lessons skill), each only if it exists. Lessons never block.
   - `stackSkills`: paths of the installed `skills/*-{patterns,testing,security-practices,stack-profile}/SKILL.md`. None → `[]` and warn "No tech layer installed — run /mep:init-ai-workflows".
   - `briefFilePath`: `docs/specs/{JIRA_KEY}/BRIEF-{JIRA_KEY}.md` if it exists, else `null`.
   - `startBranch` (`git branch --show-current`). On `main`, `master`, `develop` or `release/*` warn: "Implementation will edit files here; the Git Operator will create a feature branch at COMMIT and carry the changes onto it."
   - `gitBaseline` (`git status --porcelain`) — COMMIT uses it to exclude files that were dirty before this session.
   - `testContext.baselineRef` (`git rev-parse HEAD`, or an explicitly identified reproducible pre-edit snapshot) — immutable comparison reference for test/coverage evidence; distinct from the dirty-file exclusion list. Evidence identity and baseline compatibility: `implementation-rules` § 3.1.1.
5. Audit entry (workflow start). → RECONCILE.

## Step 2: RECONCILE

Follow the reconciliation skill (it selects the full or fast path; record `reconciliation.fastPath`) against the SPEC and, if present, its CONTEXT.

- No findings, or only `blocking: false` → show them as warnings and continue.
- Any `blocking: true` → PAUSE (`reconciliation-gate`) per the skill's Gate Behavior: Continue / Revise / Fix inline. Record `reconciliation.userDecision` and, for Fix inline, `reconciliation.inlineCorrections` (run-scoped in state, never written into SPEC requirements). Audit entry.

Before proceeding, build, confirm when corrected, and persist `artifacts.effectiveRequirements` per the reconciliation skill's Effective Requirements Contract. Revise stays paused. Dispatch only with a complete contract; use its AC list for all test/goal gates. Restore the same contract on resume, using that skill's legacy-state recovery when absent.

Set `artifacts.testContext.requirementsKey` from the confirmed effective contract per `implementation-rules` § 3.1.1; requirement changes invalidate incompatible test evidence without replacing the original baseline.

→ IMPLEMENT.

## Step 3: IMPLEMENT

Rules, per-gate fix budget and the IMPLEMENT budget: `implementation-rules` § 3.3. Track `implement.gateReentries`; when the IMPLEMENT budget is spent, PAUSE with [M]anual-fix / [A]bort even if no single gate hit its own cap. Evaluate the lessons capture hook at the end of each iteration and on any explicit user correction (lessons skill).

1. **Feature Implementer** (stateless; contract: its § Inputs / § Outputs) → `implResult`. Pass `specFilePath`, `specDigest` (original scope baseline), `effectiveRequirements` (from `artifacts`), `lessonsFilePaths`, `stackSkills`, `approvedScope` (`implement.approvedScope`, default `[]`) and, on a fix pass only, `fixRequest`.
2. If `implResult.blocked`:
   - `blockedReason: scope-expansion` (nothing written yet) → PAUSE (`scope-expansion-gate`, `pendingDecision: { extraFiles }`). Confirm → append to `implement.approvedScope` and re-invoke; abort → stop.
   - any other reason → PAUSE (`implementation-blocked`, `pendingDecision: { blockedDetail }`). Resolve → re-invoke with the correction; or abort.
   - Audit entry with the blocker and decision.
3. Backstop: if `implResult.changedFiles` goes beyond original `specDigest.plannedFiles` + companion tests + `approvedScope`, the files are already written → PAUSE (`scope-expansion-gate`) and let the user keep them (add to `approvedScope`) or revert them. Corrected planned paths do not bypass this authorization boundary.
4. **Test Generator** (stateless; contract: its § Inputs/Outputs and § Output Contract) → `testResult`. Pass `mode: subagent`, `specFilePath`, `effectiveRequirements` (from `artifacts`), `changedFiles` (all workflow source/test edits, including prior Test Generator edits), `stackSkills`, `testContext`, `approvedScope` (`implement.approvedScope`), `priorTestEvidence` (`artifacts.testRunSummary`), plus `focusGaps` when re-invoked for a gap and `focusFiles` on a fix pass. Consumer discovery widens execution only.
5. Merge `testResult` into `artifacts.testRunSummary` **before gates**, following `implementation-rules` § 3.1.1. Validate identity, current dependency fingerprints, target completeness, counters and repository comparability; invalidate stale entries and replace retested results, retaining only current untouched evidence and original run IDs.
   - `blockedReason: scope-expansion` → PAUSE (`scope-expansion-gate`, `pendingDecision: { extraFiles }`); confirmation adds test paths to `implement.approvedScope`, then re-invoke the Test Generator. Source edits still belong to the Feature Implementer.
   - Other blockers or missing/unverifiable evidence → PAUSE (`implementation-blocked`, `pendingDecision: { blockedDetail }`); resolve the missing evidence or abort. Exception: coverage absent because tests failed follows `TEST_FAIL` first. Do not turn unavailable measurements into source-fix loops or a passed gate.
6. Gates use the merged current summary, each within the fix budget:
   - `TEST_FAIL` (including unchanged consumer failures) → Feature Implementer with `fixRequest: { source: test, items: failing tests, focusFiles }`, then Test Generator. Focus on implicated changed source dependencies, not permission to edit the failing consumer tests.
   - `COVERAGE_GAP` (changed counters below full coverage or repository regression) → Test Generator only, `focusGaps` = the merged remaining gaps.
   - `AC_UNCOVERED` (an effective AC with no current passing named test in merged `behaviorEvidence`) → Test Generator only, `focusGaps` = the unmapped effective ACs.
   - `BUILD_FAIL` → build at exit-gate scope per `build-verification`, skipped when the final test run already compiled the same scope (a green `{{TEST_COMMAND}}` run is build evidence); on failure, Feature Implementer with `fixRequest: { source: build, items: parsed errors }`.
   - Budget exhausted → PAUSE (`test-loop-exhausted` or `build-loop-exhausted`) with [M]anual-fix / [A]bort.
7. Set `artifacts.changedFiles` = union of every pass's `changedFiles` and `testFiles`, excluding the SPEC and `docs/specs/`. Persist the merged `testRunSummary` with provenance and report references, not aggregate percentages. Check Test Generator writes against test paths in its supplied `changedFiles`, direct companions and approved test paths; other writes trigger step 3's scope backstop, never self-authorization from its returned `testFiles`.

**Fix passes are scoped.** A fix pass is any Feature Implementer re-invocation with `fixRequest`, whether from the gates above or from REVIEW.
- Pass the Test Generator `focusFiles` = the files the pass changed. It recomputes downstream execution scope; invalidate dependent evidence even for unchanged consumers. The repository exit check follows § 3.1.1, not an assumed carry-forward of old totals.
- Build with `{{AFFECTED_BUILD_COMMAND}}` for the same files.
- The full-scope `{{BUILD_COMMAND}}` runs once per workflow, at the first IMPLEMENT exit. It runs again only if a later pass changed a public surface or a `{{SHARED_LIB_PATH_PREFIX}}` path (`build-verification`).

Proceed to REVIEW only when tests pass, changed-line/branch coverage meets `implementation-rules` § 3.1, every AC maps to a passing test, and the build succeeds.

## Step 4: REVIEW

1. **Scope** — compute `changedLines`, `sourceFiles`, `docsConfigOnly` per `implementation-rules` § 3.5. "Small" is judged from those numbers here; the Code Reviewer confirms the public-surface part via `publicSurfaceChanged`.
   - Clear previous skip markers and record current `review.selection` (run/reuse/skip). Missing prior results count as invalidated. Only selected current results feed the gates; skipped stale results are not carried into combined findings.
   - The Code Reviewer always runs.
   - Run the **Rubber Duck** unless the change is `docsConfigOnly` or small. The orchestrator dispatches it directly, because subagents can't call subagents by default in VS Code. Record `review.rubberDuck.skipped` with the reason when it is skipped.
   - Skip the Goal Verifier (`goalVerifierSkipped`) only if the change is small **and** every effective AC maps to a passing named test in `testRunSummary.behaviorEvidence` **and** no scope expansion happened **and** `effectiveRequirements.approval` is null. Record `goalVerification.skipped: small-change`, `acCoverage` from that mapping, and `scopeConsistency: aligned` ("not independently verified (small change)"). Otherwise, avoid a call only when all its prior checks remain current under § 3.6; record reuse separately from a small-change skip.
   - If a reviewer was skipped as "small" but the Code Reviewer returns `publicSurfaceChanged: true`, the change wasn't small: dispatch the skipped reviewer(s) now, before the gates.
   - On every fix iteration, invalidate dependent review evidence per `implementation-rules` § 3.6, regardless of which gate failed. Code Reviewer checks the fix; re-run each eligible invalidated Goal Verifier/Rubber Duck check. Use dependency-aware `focusFiles` and affected `recheckCriteria` only when provenance supports scoping; otherwise run the full applicable review.
2. **Dispatch required checks in one turn (parallel)**, all stateless. Build each reviewer's `reviewContext` from saved native results and current input fingerprints (state-machine § Independent Review Contracts). Include prior satisfied criteria and clean/regression results, not just failures. `baselineRef` = saved `artifacts.testContext.baselineRef`; `changedFiles` remains the complete workflow changeset, while `focusFiles` is the dependency-aware recheck scope.
   - **Code Reviewer** (contract: its § Inputs) → `reviewResult`: `changedFiles`, `rubberDuck: external`, `stackSkills`, `outputMode: orchestration-compact`, `reviewContext`, and for a proven scoped recheck `focusFiles`, `priorFindings`.
   - **Rubber Duck Reviewer** when eligible and invalidated (contract: its § Inputs / § Outputs) → `rubberDuckResult`: `changedFiles`, `baselineRef`, `workSummary` (effective intent including approved corrections), `reviewContext`, and for a scoped recheck `focusFiles`.
   - **Goal Verifier** when eligible and invalidated (contract: its § Inputs / § Outputs): `effectiveRequirements` (from `artifacts`), `specDigest` (original context), `specFilePath`, `briefFilePath`, `changedFiles`, `testRunSummary`, `reviewContext`, and for a scoped recheck `recheckCriteria` (all affected criteria, including previously satisfied ones).
   - Persist complete native outputs and provenance in `review.results`/`review.runs`; validate all required keys and snapshot freshness before either gate. Missing/failed reviewer output pauses at `implementation-blocked`; concurrent material edits invalidate the affected outputs. A stale test/build result returns to IMPLEMENT first. Reuse current retained results without relabeling them as fresh calls.
3. **Code Reviewer gate**:
   - Rebuild the combined findings from current native Code Reviewer and Rubber Duck results, tagged `kind: critique | regression`; never accumulate merged findings across passes. Recompute risk using the Code Reviewer's § Severity Vocabulary mapping and Rubber Duck override (any `Blocking` → risk at least High).
   - The gate then fires on `riskRating` High/Critical or `verdict: request-changes`.
   - `review.reviewIterations < 2` → PAUSE (`code-review-gate`): "Review found {riskRating} issues. Fix before commit? (fix/skip)". **fix** → re-enter IMPLEMENT (Step 3) with `fixRequest: { source: review, items: High/Critical findings, focusFiles }`, then REVIEW again; `reviewIterations + 1`. **skip** → record the findings as accepted risk.
   - At the cap → continue only with current completed review evidence; the findings become Known Issues in the retrospective. Freshness checks do not reset or consume a separate retry budget (§ 3.6).
4. **Goal Verification gate** — per `implementation-goal-verification-gate` § Gate Decision (report format, options, shared `review.reviewIterations` cap). "Fix now" → re-enter IMPLEMENT (Step 3) with `fixRequest: { source: goal, items: unmet criteria and blocking mismatches }`, then REVIEW again.
5. **Spec accuracy** (when `spec.issueKey` is known) — compare `artifacts.changedFiles` with `specDigest.plannedFiles`; show "modified but not in spec" and "in spec but not modified" (non-blocking) and record `artifacts.specAccuracySignal`.
6. Audit entries: each review decision, the goal-verification outcome, the spec accuracy signal. → COMMIT.

## Step 5: COMMIT

1. Validate test/build/review freshness per `implementation-rules` § 3.6, then print the commit confirmation (report templates) and PAUSE (`commit-confirmation`). Revalidate when the user answers: material changes return to IMPLEMENT or REVIEW before a new confirmation. **skip** → leave state at `commit`, resumable, and write nothing.
2. On **commit**, record the outcome first so the tree is clean after the commit:
   - If `spec.issueKey` is known, append METRICS rows per `spec-metrics-log`: `accuracy` when `specAccuracySignal` has entries; `goal-verification` when `acCoverage < 100` or scope is `mismatch`. `WorkflowId` = this run, `Score` = `spec.qualityScore`, session-info columns `—`.
   - Append the Implementation Retrospective (report templates) to the SPEC.
   - A write failure in either step is a warning, never a workflow failure.
3. **Git Operator** with `jiraKey`, `issueType`, `specTitle`, and `files` = `artifacts.changedFiles` minus `gitBaseline`, plus the SPEC and `docs/specs/METRICS.md` only if git tracks them (`git ls-files --error-unmatch <path>`). Record `artifacts.commitHash` and `artifacts.branchName`. On failure, report with remediation steps.

## Step 6: COMPLETE

Print the COMPLETE summary (report templates), add an audit entry, and archive the state file (state-machine skill).
