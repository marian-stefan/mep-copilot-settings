---
name: implementation-requirement-reconciliation
description: Pre-implementation gate that validates the SPEC's Implementation Plan is still accurate against the current codebase and the ticket's Acceptance Criteria before any code is written. Detects stale file references, drifted ACs, and plan/architecture conflicts. Runs once, between PREFLIGHT and IMPLEMENT, in the Implementation Workflow Orchestrator.
---

# Implementation Requirement Reconciliation Gate

A validated SPEC can still be **stale** by the time `/mep:start-implementation` runs: the ticket's Acceptance Criteria may have been edited in Jira after the SPEC was generated, the codebase may have moved since CONTEXT was researched, or the SPEC's plan may simply have missed an existing utility. The Pre-Flight SPEC Quality Check (PREFLIGHT) only re-displays metadata computed once, at spec-creation time — `qualityScore`, `qualityBucket` — it never re-checks the plan against present-day reality. This gate closes that gap.

This mirrors the Specs workflow's Ambiguity Gate (`skills/specs-ambiguity-detection/SKILL.md`) — reuse its pause/resume mechanics and `blocking`/`confidence` vocabulary rather than inventing new ones, so the two gates feel like the same system to a user who has seen both.

## When to Run

Once per implementation run, immediately after PREFLIGHT completes (spec metadata displayed, warnings surfaced) and before the first line of IMPLEMENT. Not re-run on REVIEW iterations within the same run — the plan doesn't move once implementation has started against it.

**Fast path**: when the SPEC's Implementation Summary lists ≤ 2 files **and** its frontmatter `complexity` is `Low`, run only Check 1 (a cheap existence check) and skip Checks 2–3. The orchestrator records `reconciliation.fastPath: true`. A missing `complexity` field means the full path.

## Inputs

- The SPEC file (`spec.filePath`) — specifically its Acceptance Criteria section and Implementation Summary/Plan section
- The Technical Context file (`docs/specs/{JIRA_KEY}/CONTEXT-{JIRA_KEY}.md`), if present — specifically its Implementation Plan and any file paths it cites
- Current repository state (read-only checks only — no writes in this gate)

## Reconciliation Checks

Run all three (Check 1 only on the fast path); each produces zero or more findings.

### 1. Stale File References

For every file path named in the SPEC's Implementation Summary or the CONTEXT's Implementation Plan:
- Verify the path exists (for "modify" steps) or its parent directory exists (for "create" steps).
- A "modify" step targeting a path that no longer exists is a finding: `type: stale-file-ref`.
- A "create" step targeting a path that already exists as a file (not a directory) is a finding: `type: create-target-exists` — the plan may be out of date relative to work already done on this branch or a sibling change.

### 2. Acceptance Criteria Drift

Compare the SPEC's Acceptance Criteria against the ticket data currently embedded in `BRIEF-{JIRA_KEY}.md` (if present in the same folder — this orchestrator does not re-fetch Jira; it is read-only per `skills/jira-readonly-policy/SKILL.md`, so it can only compare against artifacts already on disk).
- Any AC present in the BRIEF but absent (in substance, not exact wording) from the SPEC is a finding: `type: ac-not-in-spec`.
- This check is skipped silently if `BRIEF-{JIRA_KEY}.md` is not found — it is not required for this gate to run, only for this specific check.

### 3. Plan-vs-Architecture Conflict

Spot-check whether the Implementation Summary's approach still fits the codebase:
- For each step naming a class/component/module, confirm it isn't already deprecated, superseded, or renamed (grep for `[Obsolete]`, `@deprecated`, or a sibling file with a near-identical name that suggests the plan targeted an old name).
- Confirm no step duplicates an existing utility that already does what the step describes (same lightweight symbol/pattern search as `skills/specs-fix-approach-evaluation/SKILL.md` § Step 2, not a full audit).
- A conflict found here is a finding: `type: architecture-conflict`.

## Finding Schema

```yaml
findings:
  - type: stale-file-ref | create-target-exists | ac-not-in-spec | architecture-conflict
    detail: "one-sentence description of what was found"
    location: "SPEC section or file path"
    blocking: true | false
    confidence: high | medium | low
```

Assign `blocking`/`confidence` using the same judgment as `skills/specs-ambiguity-detection/SKILL.md` § Blocking × Confidence Matrix — severity of the gap, not a mechanical function of `type`. A `stale-file-ref` on a step central to the SPEC's core behavior is `blocking: true`; a `stale-file-ref` on an incidental config touch-up may be `blocking: false`.

## Gate Behavior

- **No findings, or all findings `blocking: false`**: proceed directly to IMPLEMENT. Non-blocking findings are still surfaced to the user as informational warnings (same severity tier as the PREFLIGHT warnings already shown) but do not pause.
- **Any finding `blocking: true`**: pause and present:

  ```
  ⚠️ Requirement Reconciliation Gate — Plan Validation Paused

  The SPEC's plan does not fully match current reality:

  [stale-file-ref] {detail}
    Location: {SPEC section, step N}

  [ac-not-in-spec] {detail}
    Location: {BRIEF AC-N}

  Options:
    1. Continue anyway — proceed to IMPLEMENT; findings are noted in the audit log and carried into the Implementation Retrospective
    2. Revise — pause here; re-run `/mep:create-specs {JIRA_KEY}` to regenerate the SPEC against current state, then restart implementation
    3. Fix inline — describe the correction; the orchestrator treats your answer as ground truth for this run only (does not edit the SPEC file) and proceeds to IMPLEMENT
  ```

  Record the user's choice and any inline correction text in workflow state under `reconciliation.userDecision` and `reconciliation.inlineCorrections`.

## Effective Requirements Contract

Before leaving RECONCILE, persist `artifacts.effectiveRequirements` using the schema in `skills/implementation-workflow-state-machine/SKILL.md`. This is the shared contract for the Feature Implementer, Test Generator, and Goal Verifier, including fix passes and resumed runs. Keep `artifacts.specDigest` unchanged as the original SPEC snapshot for accuracy reporting.

- **No correction** (including Continue anyway): copy the original digest's complete `acceptanceCriteria` and `plannedFiles` lists; set `inlineCorrections` and `approval` to `null`. A warning does not authorize a requirement change.
- **Fix inline**: apply only the user's corrections to copies of those lists, preserving every unaffected entry. Retain the user's correction text in `inlineCorrections`, including implementation guidance not expressible as an AC or path change. Show the original-to-effective AC/path differences and guidance at the existing `reconciliation-gate`; obtain confirmation of this interpretation before recording `approval` and proceeding. Ambiguous or contradictory instructions stay at that gate. Revise leaves implementation paused; it does not produce an approved contract.
- **Precedence**: the approved contract overrides the corresponding SPEC/CONTEXT wording for this run. Read those documents for unchanged context, never to restore a superseded AC or path. All three agents receive the same contract; none independently reconstructs corrections from conversation or infers approval. A missing/incomplete contract, changed AC/path lists without approval, or non-null corrections without approval blocks dispatch rather than falling back to the original ACs. With `approval: null`, both lists must equal the original digest and correction text must be null.
- **Scope remains separate**: `plannedFiles` describes intended targets, not authorization to edit extra files. Paths outside the original `specDigest.plannedFiles` and their companion tests still require the existing scope-expansion gate and `implement.approvedScope`, even when a path was corrected here.
- **Original goal remains visible**: do not rewrite the SPEC or BRIEF goal. The Goal Verifier checks effective ACs, but independently compares behavior with the original ticket goal and reports any remaining mismatch with the correction's provenance. Approval of an AC correction does not automatically classify scope as aligned.

Persist the contract before IMPLEMENT and pass it unchanged on subsequent fix passes. If a later user correction changes requirements, return to the same reconciliation gate, confirm and persist the new contract, clear `artifacts.testRunSummary`, goal-verification results, and pending fix/gap requests, and re-enter IMPLEMENT before REVIEW or COMMIT. Apply initial REVIEW dispatch rules for the new contract without resetting retry counters; never reuse prior gate decisions or evidence for superseded requirements.

On resume, restore the persisted contract without regenerating it from the on-disk SPEC. For older state files without it: an unchanged run can copy its saved `specDigest`; a run with `fix-inline` or correction text must return to `reconciliation-gate` to normalize and confirm the saved correction. If the original digest is also missing or inconsistent, pause for reconciliation rather than guessing. Contract initialization or recovery never recaptures the original git baseline.

## Non-Goals

- This gate does **not** re-run the Tech Researcher — that already happened once during `/mep:create-specs` and this orchestrator is read-only with respect to Jira and does not have Tech Researcher tooling.
- This gate does **not** modify the SPEC, CONTEXT, or BRIEF files. "Fix inline" corrections are run-scoped; their authoritative copy lives in workflow state for consistent implementation, verification, and resume. The COMMIT retrospective may record them without rewriting original requirement sections. For a durable requirement change, use `/mep:create-specs` (Revise) or manual SPEC editing.
- This gate is not a substitute for the Goal Verification Gate (`skills/implementation-goal-verification-gate/SKILL.md`), which runs *after* IMPLEMENT to check whether the resulting code actually satisfies the ACs. This gate only checks whether the *plan* still makes sense before starting.

## Error Handling

Use `skills/specs-error-handling/SKILL.md` codes. If the SPEC's Implementation Summary cannot be parsed at all (e.g., missing that section entirely — an Important Gate failure that should have been caught at spec quality review), treat as `blocking: true`, `confidence: high` with `type: architecture-conflict` and note the missing section explicitly — do not silently skip reconciliation.
