---
name: implementation-workflow-state-machine
description: State machine diagram, state schema, and resumption logic for the Implementation Workflow Orchestrator.
---

# Implementation Workflow State Machine

This skill visualizes workflow control flow and owns the state schema and resumption logic.
Mirrors `skills/specs-workflow-state-machine/SKILL.md`'s role for the specs workflow.
Canonical rule sources for the steps themselves: `agents/implementation-workflow-orchestrator.agent.md`.

## State Diagram

```
┌───────────────────────────────────────────────────────────────────────┐
│                            WORKFLOW STATES                            │
├───────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌──────────┐  ┌───────────┐  ┌───────────┐  ┌────────┐ ┌──────────┐  │
│  │ PREFLIGHT│─▶│ RECONCILE │─▶│ IMPLEMENT │─▶│ REVIEW │▶│  COMMIT  │  │
│  └──────────┘  └───────────┘  └───────────┘  └────────┘ └──────────┘  │
│       │              │              │              │          │       │
│       ▼              ▼              ▼              ▼          ▼       │
│  [Spec check]   [Plan vs     [Implementation] [Code         [Git      │
│  [File check]    reality]    [Unit tests]      Reviewer +    Operator]│
│                                                  Goal Verify]          │
│                                                     │                  │
│                                                ┌────┴────┐            │
│                                                │COMPLETE │            │
│                                                └─────────┘            │
└───────────────────────────────────────────────────────────────────────┘
```

**Key transitions**:
- `RECONCILE` validates the SPEC's plan against present-day reality before any code is written (`skills/implementation-requirement-reconciliation/SKILL.md`).
- `IMPLEMENT` sequences two stateless subagents: Feature Implementer (writes code + companion baseline tests, `agents/feature-implementer.agent.md`) then Test Generator (extends tests to full coverage, `agents/test-generator.agent.md`).
- `REVIEW` runs the Code Reviewer and Goal Verifier as two independent checks over the same changeset (order doesn't matter) — mechanical correctness and "does it actually satisfy the Acceptance Criteria" are checked back-to-back, sharing one `reviewIterations` fix-budget cap (`skills/implementation-goal-verification/SKILL.md`).

## State Schema

```yaml
---
workflowId: wf-{JIRA_KEY}-{YYYYMMDDTHHmmssZ}  # e.g. wf-HON-123-20260619T141500Z
workflowType: implementation
currentStep: preflight | reconcile | implement | review | commit | complete | aborted | error
previousStep: {completed-step | null}
startedAt: {ISO-8601}
updatedAt: {ISO-8601}

spec:
  filePath: {path}
  issueKey: {key | unknown}
  issueType: Story | Task | Bug | Regression Bug | Epic | Spike | unknown
  title: {string}
  qualityScore: {0-100 | null}
  qualityBucket: proceed | iterate | abort | null
  failedImportantGates: [{gate-names} | null]

implement:
  gateReentries: {0-4}   # combined TEST_FAIL/COVERAGE_GAP/AC_UNCOVERED/BUILD_FAIL re-entries; PAUSE at 4 (implementation-rules § 3.3)
  approvedScope: [{file paths}]   # extra files the user approved at scope-expansion-gate; passed to every Feature Implementer pass

reconciliation:
  fastPath: true | false | null   # true when only the stale-file check ran
  findings: [{ type, detail, location, blocking, confidence }] | []
  userDecision: continue | revise | fix-inline | null
  inlineCorrections: {string | null}

artifacts:
  gitBaseline: {git status --porcelain output}
  startBranch: {branch name}
  testContext:
    baselineRef: {immutable pre-edit commit or reproducible snapshot}
    requirementsKey: {effective contract fingerprint | null before RECONCILE}
  lessonsFilePaths: [{paths}]   # resolved at PREFLIGHT, passed to Feature Implementer
  stackSkills: [{paths}]        # tech-layer skill paths resolved at PREFLIGHT, passed to subagents
  specDigest: { issueKey, title, acceptanceCriteria: [...], plannedFiles: [...] }
  effectiveRequirements:
    acceptanceCriteria: [{criterion text}]
    plannedFiles: [{file paths}]
    inlineCorrections: {user correction text | null}
    approval: {source: reconciliation-gate, confirmedAt: ISO-8601} | null
  briefFilePath: {path | null}
  commitHash: {hash | null}
  branchName: {branch | null}
  changedFiles: [{file-paths}]
  testRunSummary: null | {
    runs: [{Test Generator run metadata, keyed by id}],
    scope: {requiredTargets, discoveryComplete},
    targets: [{target results with runId and dependency fingerprints}],
    coverage: {files: [{per-file evidence with runId}], repository: {comparison evidence}},
    behaviorEvidence: [{behavior, runId, tests, sourceFiles}],
    failures: [{test, file, targetId, message}],
    remainingGaps: [{unresolved gaps}]
  }
  specAccuracySignal:
    modifiedNotInSpec: [{file-paths}]
    inSpecNotModified: [{file-paths}]

review:
  riskRating: Low | Moderate | High | Critical | null
  reviewIterations: {0-2}
  selection: {codeReviewer: run | reuse | skip, rubberDuck: run | reuse | skip, goalVerifier: run | reuse | skip} | null
  runs: [{id, baselineRef, reviewedRevision, requirementsKey, inputs}]
  results:
    codeReviewer: {native result including reviewEvidence} | null
    rubberDuck: {native result including reviewEvidence} | null
    goalVerifier: {native result including reviewEvidence} | null
  findings: {summary | null}   # Code Reviewer findings merged with Rubber Duck findings
  rubberDuck:
    skipped: docs-config-only | small-change | null
  userDecision: fix | skip | null

goalVerification:
  skipped: small-change | null
  acCoverage: {0-100 | null}
  criteria: [{ text, status, evidence, gap }] | []
  scopeConsistency:
    status: aligned | mismatch | null
    detail: {string | null}
    blocking: true | false | null
  userDecision: fix | accept | reclassify | null

usage:                          # orchestrator-common § State Write Protocol
  subagentRuns: { {agent name}: {count} }
  fixPasses: {count}
  userPauses: {count}

errors:
  hasErrors: true | false
  errorType: null | hard-stop | recoverable | validation-failure
  errorMessage: {message | null}

# Session Resumption
resumable: true | false
interruptedAt: {ISO-8601 | null}
completedSteps: [list-of-completed-step-names]
pauseReason: reconciliation-gate | implementation-blocked | scope-expansion-gate | test-loop-exhausted | build-loop-exhausted | code-review-gate | goal-verification-gate | commit-confirmation | null
pendingDecision: {object | null}
---
```

## Independent Review Contracts

For implementation-workflow calls, all three reviewers receive `reviewContext` and append `reviewEvidence` to their native output. Standalone review output is unchanged.

```yaml
reviewContext:
  run:
    id: {unique dispatch ID}
    baselineRef: {immutable original comparison reference}
    reviewedRevision: {HEAD plus material worktree fingerprint}
    requirementsKey: {artifacts.testContext.requirementsKey}
    inputs: [{name, fingerprint}]
  priorResult: {this reviewer's full previous native result with reviewEvidence} | null
  invalidatedKeys: [{checks requiring fresh review}]
  retainedKeys: [{checks whose provenance is still valid}]

reviewEvidence:
  - key: {stable check key}
    runId: {dispatch ID that actually performed this check}
    files: [{path, fingerprint}]
    inputs: [{name, fingerprint}]
    complete: true | false
```

Check keys: Code Reviewer uses `file:{path}` (including files with no findings) and `code-scope` (risk/verdict/public-surface assessment); Rubber Duck uses `critique:{path}` and `regression:{path}`; Goal Verifier uses `ac:{exact effective criterion text}` and `goal-scope`. Record all source/test/config/transitive dependencies of each check; named inputs include material SPEC/BRIEF context and referenced test-target evidence, not just the requirement fingerprint. `complete: false` means dependency coverage is uncertain: the result can describe the current full review, but cannot justify later scoped reuse. Fingerprints must be measured, not guessed.

The orchestrator supplies run metadata, computes invalidation/retention per `implementation-rules` § 3.6, records current `selection`, and retains run records referenced by surviving evidence. Clear old skip markers before classifying; `reuse` is not `skip`. Reviewers return complete native results, combining freshly checked and explicitly retained entries; retained evidence keeps its original `runId`. Invalidate the relevant scope assessment as well as individual findings/ACs. Missing prior entries, inconsistent keys, or absent provenance require a full applicable check, not invented carried statuses. A required check without a completed current result remains blocked.

Snapshot identities cover changed-set membership and material source/test/config/requirement inputs, including untracked files and deletions; exclude workflow bookkeeping writes (state, audit, metrics and retrospective appendices), never requirement-section edits. Record acceptance/reclassification decisions against the relevant result identity; they cannot authorize later changed findings. Native results remain separate from the merged display fields so Rubber Duck findings are not merged into the next Code Reviewer input twice.

## Resumable vs Terminal States

`artifacts.specDigest` is the immutable original SPEC snapshot. `artifacts.effectiveRequirements` is populated before IMPLEMENT; its construction, approval, precedence, scope rules, and legacy-state recovery are owned by `implementation-requirement-reconciliation` § Effective Requirements Contract. Empty AC lists are invalid; an empty planned-file list is valid only when the approved plan requires no file edits. Before reconciliation completes, the effective contract may be absent.

Test result field shapes are owned by the Test Generator's Output Contract; identity, completeness, merging and gate semantics by `implementation-rules` § 3.1.1. The summary retains run metadata for all surviving entries. On resume, validate dependency/report fingerprints before reusing evidence. Legacy percentages cannot satisfy the new gates: recover the original baseline from recorded pre-edit metadata or pause for an explicit reference, then retest the invalid scope and obtain a valid repository comparison. Never capture the current post-edit HEAD as a replacement baseline.

**Resumable** (offer resume on next invocation): `preflight`, `reconcile`, `implement`, `review`, `commit`

**Terminal** (not resumable — display history and offer "Start fresh?" instead): `complete`, `aborted`, `error`

## Pause Reasons

When workflow pauses for user input, `pauseReason` is set:

| pauseReason | Where | User Decision |
|---|---|---|
| `reconciliation-gate` | RECONCILE | A blocking reconciliation finding (stale file ref, AC drift, architecture conflict) → continue anyway, revise (re-run `/mep:create-specs`), or fix inline |
| `implementation-blocked` | IMPLEMENT | Feature Implementer returns `blocked: true` (plan conflict or missing dependency/utility) → user resolves the blocker, then Feature Implementer is re-invoked with the correction, or the user aborts |
| `scope-expansion-gate` | IMPLEMENT (pre-code) | Change extends beyond the spec's file set (`SCOPE_EXPANSION`) → confirm the expanded blast radius or abort |
| `test-loop-exhausted` | IMPLEMENT | `TEST_FAIL`/`COVERAGE_GAP`/`AC_UNCOVERED` fix budget exhausted (`implementation-rules/SKILL.md` § 3.3) → [M]anual fix / [A]bort |
| `build-loop-exhausted` | IMPLEMENT | `BUILD_FAIL` fix budget exhausted (`implementation-rules/SKILL.md` § 3.3) → [M]anual fix / [A]bort |
| `code-review-gate` | REVIEW | Reviewer returns High/Critical risk while `reviewIterations < 2` → fix or skip (at the cap the workflow proceeds and records known issues) |
| `goal-verification-gate` | REVIEW | AC criterion `partial`/`not-satisfied`, or a blocking `goal-scope-mismatch` → fix now, accept as-is, or mark unverifiable |
| `commit-confirmation` | COMMIT | Final confirmation before staging/committing → commit or skip |

## Resume Decision Table

| Interrupted at step | Action |
|---|---|
| PREFLIGHT | Re-run PREFLIGHT checks (spec quality display, lessons read, git baseline capture) |
| RECONCILE | Re-run the reconciliation checks; re-display the pending gate if `pauseReason: reconciliation-gate` is set |
| IMPLEMENT | Resume IMPLEMENT; re-display the pending gate if `pauseReason` is set, otherwise re-run from the last incomplete sub-step |
| REVIEW | Validate review/test provenance; dispatch required checks per `implementation-rules` § 3.6 using explicit prior results, including Rubber Duck when eligible |
| COMMIT | Validate freshness before re-displaying or acting on confirmation; stale tests/builds return to IMPLEMENT, stale reviews to REVIEW |

When resuming:
- Before any IMPLEMENT/REVIEW/COMMIT action, restore or recover `artifacts.effectiveRequirements` per `implementation-requirement-reconciliation` § Effective Requirements Contract. Do not replace it or the original digest with a fresh SPEC read. Pending corrections must be confirmed and verified before commit.
- Validate `review.results` and `review.runs` per § Independent Review Contracts. Legacy state without provenance requires fresh applicable reviews; preserve the shared iteration counter and original baseline. Re-display pending decisions only when their evidence is still current.
- If `pauseReason` is set, re-display the appropriate gate UI with `pendingDecision`.
- Validate artifacts still exist at their expected paths.
- Check `artifacts.gitBaseline` hasn't changed; if it has, warn the user before proceeding.

## State File Location

`docs/specs/{JIRA_KEY}/implementation-workflow-state.yml` — written by
`agents/implementation-workflow-orchestrator.agent.md` at every stage transition. On
successful completion, archived to `docs/specs/{JIRA_KEY}/archive/` with a timestamp suffix.

## References

- Audit logging: `skills/audit-log-policy/SKILL.md`
- Requirement reconciliation gate: `skills/implementation-requirement-reconciliation/SKILL.md`
- Goal verification gate: `skills/implementation-goal-verification-gate/SKILL.md` (orchestrator side), `skills/implementation-goal-verification/SKILL.md` (agent procedure)
- Implementation rules (fix budgets, gates): `skills/implementation-rules/SKILL.md`
- IMPLEMENT subagents: `agents/feature-implementer.agent.md`, `agents/test-generator.agent.md`
- REVIEW subagents: `agents/code-reviewer.agent.md`, `agents/goal-verifier.agent.md`
- Build verification: `skills/build-verification/SKILL.md`
- Lessons system: `skills/implementation-lessons-system/SKILL.md`
- Error taxonomy: `skills/specs-error-handling/SKILL.md`
- `workflowId` format (shared with the specs workflow): `skills/specs-workflow-state-machine/SKILL.md` § Canonical workflowId Format
