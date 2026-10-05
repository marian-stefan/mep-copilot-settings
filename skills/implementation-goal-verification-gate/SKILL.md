---
name: implementation-goal-verification-gate
description: Orchestrator-side Goal Verification gate for the REVIEW step — when to run, skip rule for small changes, gate decision and shared iteration cap, state update, and the Implementation Retrospective addendum. The agent-side procedure is implementation-goal-verification.
---

# Implementation Goal Verification — Gate (orchestrator side)

The Goal Verifier (`agents/goal-verifier.agent.md`) runs the procedure in `skills/implementation-goal-verification/SKILL.md` and returns `criteria`, `acCoverage`, `scopeConsistency`. This skill covers what the orchestrator does with that result. The orchestrator must not perform the verification itself — independence from the implementing context is the point.

## When to Run

At REVIEW, alongside the Code Reviewer and before COMMIT, subject to the orchestrator's existing small-change eligibility rule. Invalidation and reuse are owned by `implementation-rules` § 3.6: any fix can invalidate AC or whole-goal evidence, regardless of which gate failed. Re-run affected checks with explicit prior results/provenance, including previously satisfied ACs; unknown dependencies require a full pass. Only demonstrably current unaffected checks may be reused. All review-driven fixes share `review.reviewIterations` and its existing cap; independent rechecks do not create another retry budget.

## Gate Decision

- All AC text, coverage, and recheck criteria below refer to `effectiveRequirements`, not superseded SPEC wording. A corrected contract cannot use the small-change skip; its initialization, recovery, and evidence invalidation follow `implementation-requirement-reconciliation` § Effective Requirements Contract.
- Evaluate the complete current criteria/scope result after merging fresh and valid retained checks, not just `recheckCriteria`. Stale or missing review evidence blocks at `implementation-blocked`, including at the cap (§ 3.6); it is never an accepted gap or a passing result.
- An invalid/missing contract or a verifier error (including unreadable original goal context) is not a satisfied or unverifiable AC result. Pause at `reconciliation-gate` for recovery; never proceed to COMMIT on that error, including at the iteration cap.
- **All AC criteria `satisfied` or `unverifiable`, and scope consistency is `aligned` or a non-blocking `mismatch`**: proceed to COMMIT. Note any `unverifiable` AC items and any non-blocking `mismatch` in the Implementation Retrospective (§ below) so a human reviewer knows what static verification could not confirm or flagged as narrow-but-not-blocking.
- **Any AC criterion `partial`/`not-satisfied`, or a blocking `goal-scope-mismatch`**:
  - If `reviewIterations < 2` (shared cap with the Code Reviewer loop): pause and present:
    ```
    ⚠️ Goal Verification Gate — Acceptance Criteria / Goal Not Fully Met

    AC coverage: {satisfied}/{satisfied+partial+not-satisfied} ({acCoverage}%)
    Scope consistency: {aligned | mismatch}

    [not-satisfied] "{AC text}"
      No evidence found in the changeset.

    [partial] "{AC text}"
      {what's missing, one line}

    [goal-scope-mismatch] (if present)
      Ticket's stated goal: {one line}
      What the changeset actually does: {one line}

    Options:
      1. Fix now — return to IMPLEMENT with these specific gaps (Feature Implementer `fixRequest.source: goal`); reviewIterations +1
      2. Accept as-is — proceed to COMMIT with gaps recorded in the Implementation Retrospective as known limitations
      3. Mark unverifiable — reclassify a listed AC item as genuinely unverifiable (e.g. requires manual QA) rather than unmet; requires a one-line justification
    ```
  - If `reviewIterations >= 2`: do not pause again — proceed to COMMIT with all `partial`/`not-satisfied` AC items and any `goal-scope-mismatch` finding automatically recorded as known gaps in the Implementation Retrospective — the same way the Code Reviewer gate fails at its cap (`implementation-workflow-orchestrator.agent.md` § REVIEW), so neither loop is silently stricter than the other.

## State Update

```yaml
goalVerification:
  acCoverage: {0-100}
  criteria:
    - text: "{AC text}"
      status: satisfied | partial | not-satisfied | unverifiable
      evidence: "{file:line or test name}" | null
      gap: "{what's missing}" | null
  scopeConsistency:
    status: aligned | mismatch
    detail: "{ticket goal vs. changeset, one line}" | null
    blocking: true | false | null
  userDecision: fix | accept | reclassify | null
```

Iterations are counted only in `review.reviewIterations`, shared with the Code Reviewer gate.

## Implementation Retrospective Addendum

When the Implementation Retrospective section is appended to the SPEC at COMMIT (template: `skills/workflow-report-templates/SKILL.md`), add a subsection:

```markdown
### Goal Verification

| Criterion | Status | Evidence / Gap |
|---|---|---|
| {AC text} | ✅ Satisfied | {evidence} |
| {AC text} | ⚠️ Partial | {gap} |
| {AC text} | ➖ Unverifiable | {justification} |

AC coverage: {acCoverage}%

**Scope consistency**: {✅ Aligned | ⚠️ Mismatch — {detail}}
```

If `acCoverage < 100%` or `scopeConsistency.status == mismatch` at COMMIT time (user chose "Accept as-is" or hit the iteration cap), the orchestrator also appends a `goal-verification` row to METRICS.md **before** invoking the Git Operator — row format and column mapping are owned by `skills/spec-metrics-log/SKILL.md`.

