---
name: spec-metrics-log
description: Single source of truth for `docs/specs/METRICS.md` — file header, the 15-column row schema, the five row types (accepted, rejected, feedback, accuracy, goal-verification), spec section maps, and the session-info collection rule. Load before appending or reading METRICS rows.
---

# Spec Metrics Log

Owner of the METRICS.md format. Writers: `/mep:accept-spec`, `/mep:reject-spec`, `/mep:feedback-spec`
(user-initiated signals) and the Implementation Workflow Orchestrator (`accuracy`,
`goal-verification`). Reader: `/mep:review-harness-health`. No other file may define the header or
column order.

## File header (create the file with this if it does not exist)

```markdown
# Spec Quality Metrics

This file records spec acceptance/rejection signals as a proxy for spec quality ("Keep Rate"),
implementation feedback, and per-run implementation signals (spec accuracy, goal verification).
Rejection reasons help identify which workflow steps produce the most rework.

`StartedAt`, `CompletedAt`, `Duration` are auto-captured from workflow state.
`CreditUsage`, `ContextWindow`, and `SessionMeta` are user-supplied session info.
All timing/session columns are informational only — not part of the Keep Rate calculation.

| Date | Key | Type | Status | Reason | Section | Score | Comments | WorkflowId | StartedAt | CompletedAt | Duration | CreditUsage | ContextWindow | SessionMeta |
|------|-----|------|--------|--------|---------|-------|----------|------------|-----------|-------------|----------|-------------|---------------|-------------|
```

Always append rows with all 15 cells. Use `—` for a cell with no value and `N/A` for an
unavailable Score. Rows written by older versions may be shorter (6–8 cells or missing the last
six); readers treat a short row as valid, never as malformed.

## Column meaning by row type

| `Status` | `Reason` | `Section` | `Comments` | `WorkflowId` |
| -------- | -------- | --------- | ---------- | ------------ |
| `accepted` | `—` | `—` | user comments or `—` | the **specs** workflowId from SPEC frontmatter, else `legacy` |
| `rejected` | reason code (`wrong-requirements` \| `wrong-architecture` \| `wrong-api-contracts` \| `missing-edge-cases` \| `other`) | section number or `—` | user comments or `—` | specs workflowId, else `legacy` |
| `feedback` | accuracy level (`accurate` \| `partially-accurate` \| `inaccurate`) | section number or `—` | user comments or `—` | specs workflowId, else `legacy` |
| `accuracy` | `—` | `—` | `modified-not-in-spec: {n}; in-spec-not-modified: {m}` | the **implementation** workflowId |
| `goal-verification` | `—` | `—` | `acCoverage: {n}%; unmet: {k}; scope: aligned\|mismatch` | the implementation workflowId |

`Score` is the SPEC's `qualityScore` (written to SPEC frontmatter by the Specs Workflow
Orchestrator after review). `StartedAt` / `CompletedAt` / `Duration` come from the state file of
the workflow that produced the row.

Keep Rate uses **only** `accepted` and `rejected` rows. `feedback`, `accuracy` and
`goal-verification` rows never count toward it.

## Session info collection (user-initiated rows only)

`/mep:accept-spec`, `/mep:reject-spec` and `/mep:feedback-spec` MUST ask the user for each of
`--credit-usage`, `--context-window`, `--session-meta` not supplied as flags, as three separate
questions: "Credit usage for this session?", "Context window for this session?", "Session
metadata (e.g., model, tool)?". Blank replies are recorded as `—`. Do not append the row before
asking. Orchestrator-written rows (`accuracy`, `goal-verification`) do not prompt — they write `—`.

## Spec section maps (for `--section`)

| Issue type | Sections |
| ---------- | -------- |
| Story / Task / Bug / Regression Bug | 1=Acceptance Criteria · 2=Implementation Summary · 3=Security Decisions · 4=Risks & Open Questions · 5=Cross-references |
| Epic | 1=Overview · 2=Milestones & Timeline · 3=Dependencies & Impacted Areas · 4=Suggested Child Tickets · 5=Security & Risk Summary |
| Spike | 1=Objective & Background · 2=Timebox & Experiment Plan · 3=Success/Failure Criteria · 4=Minimal Repro Steps · 5=Recommended Follow-up Stories |

Valid `--section` range: Story-family 1–5, Epic 1–5, Spike 1–5 (Spike numbering changed when backend discovery was removed; older METRICS rows may use the previous 1–6 numbering).

## Write rules

- Append only; never rewrite or reorder existing rows.
- If the file cannot be written: user-initiated commands report and stop (never skip silently);
  the orchestrator logs a warning and continues (metrics must not fail the workflow).
