# Artifact & Data Schemas

Index of the files the workflows read and write in an adopting repository, with the owner of each format. This file adds the section maps; formats with a dedicated owner are linked, not repeated.

`scripts/workflow-contracts.test.mjs` checks selected cross-contract wiring and policy anchors. The scenario tables below specify live verification cases; they are not claims that those scenarios have executed. Controlled procedures and the current verification limits are in `CONTRIBUTING.md`.

## `docs/specs/{JIRA_KEY}/` layout

| File | Written by | Purpose |
| --- | --- | --- |
| `BRIEF-{KEY}.md` | Jira Analyst | Original ticket requirements and goal; approved implementation corrections are recorded separately in state |
| `CONTEXT-{KEY}.md` | Tech Researcher | Technical Context (code-level detail) |
| `SPEC-{KEY}.md` / `SPEC-{KEY}-Epic.md` / `SPEC-{KEY}-Spike.md` | Specs Writer | The Spec (one per ticket; naming: `specs-workflow-routing`) |
| `specs-workflow-state.yml` | Specs Workflow Orchestrator | Resume state — schema: `specs-workflow-state-machine` |
| `implementation-workflow-state.yml` | Implementation Workflow Orchestrator | Resume state — schema: `implementation-workflow-state-machine` |
| `audit.log` | All agents (append-only) | Decision trail — format: `audit-log-policy` |
| `archive/` | Orchestrators | Archived state files of finished runs |
| `impact-map.md`, `high-level-design.md`, `adrs.md` | `/mep:create-impact-map`, `/mep:create-high-level-design` | Epic-level inputs read by the Jira Analyst |

`docs/specs/METRICS.md` (one file for the repo): schema and row types in `spec-metrics-log`. Lessons files: `.github/lessons.md` (workspace) and a module-scoped file (`{{MODULE_LESSONS_PATH}}`); format and capture triggers in `implementation-lessons-system` (one paragraph per lesson: *situation → mistake → rule*).

All skill names above live in `skills/{name}/SKILL.md`.

## CONTEXT mutation checkpoints

`specs-workflow-state-machine` § Context Mutation Checkpoint owns expected CONTEXT writes, `contextVersion`, `contextMutation: {source, baseVersion, request}`, and version-bound research checkpoints. Only the Specs Workflow Orchestrator writes that state. Researchers finish the revised artifact and current validation summary first; the orchestrator validates, records the final timestamp with the matching checkpoints, and clears the pending mutation before the next pause or transition.

Static review cases (live workflow execution is a separate check):

| Case | Expected outcome |
| --- | --- |
| Localized E feedback, then C pause and resume | Validate the revision and refresh its version before the C pause. Resume at the pending decisions without repeating research or losing the correction. |
| Assumption-only resolution | Direct frontmatter edits run validation and refresh the version; no researcher call unless a validation defect needs repair. |
| Pattern choice or combined decisions | One targeted Revision Mode call, then validation/version finalization and paired C/pattern checkpoints. |
| Required validation fails after revision | Persist the failed outcome without a validation-complete or resolved current-gate checkpoint; no GENERATE. Repair without discarding completed corrections. |
| Interruption after CONTEXT write but before state update | Recover the saved pending mutation, preserve the file, confirm completion and revalidate; uncertain authorship/completion needs confirmation. |
| External edit with no pending workflow mutation | Invalidate old validation/approvals, preserve the changed artifact and revalidate/revisit decisions before downstream work. |
| No blocking assumptions or candidate patterns | Mark both decision checkpoints on the validated version without another CONTEXT write or research call. |

## Effective implementation requirements

The implementation state keeps the original `artifacts.specDigest` separately from `artifacts.effectiveRequirements`. Shape: `implementation-workflow-state-machine`; construction, approval, precedence, and legacy-state recovery: `implementation-requirement-reconciliation` § Effective Requirements Contract. The orchestrator writes it; Feature Implementer, Test Generator, and Goal Verifier consume the same contract. Standalone `/mep:create-tests` still reads the on-disk SPEC.

Contract review scenarios (workflow fixtures, not claims that static lint executes agents):

| Scenario | Expected outcome |
| --- | --- |
| No correction or Continue anyway | Effective lists equal the original digest; no approval or correction text is synthesized. |
| AC changes from A to B | Confirmation precedes dispatch; all three agents target B. Original SPEC and digest retain A. |
| Planned path changes from old to new | The implementer targets new, but must obtain scope approval before editing it if outside the original authorized set. Accuracy still compares with old. |
| Resume with approved corrections | Saved effective requirements and approval survive; no fallback to original ACs or recapture of the git baseline. Legacy corrected state requires confirmation before use. |
| Effective ACs conflict with original goal | Goal Verifier reports the remaining mismatch and approved correction rather than silently rewriting the goal or marking it aligned. |
| Missing contract or unapproved differences | Dispatch pauses; tests/verifier do not silently fall back to original requirements. |

## Test and coverage evidence

Result shape: Test Generator § Output Contract. Counter, scope, baseline, freshness, merge and gate semantics: `implementation-rules` § 3.1.1. Persistence: `implementation-workflow-state-machine` (`artifacts.testContext` and `artifacts.testRunSummary`). Consumers receive the merged current evidence, not a focused pass's aggregate percentages. Coverage report artifacts stay outside source control; their paths and fingerprints are retained in state.

Static contract review cases (live agent execution is a separate check):

| Case | Expected outcome |
| --- | --- |
| Changed library breaks an unchanged consumer test | Discover/run the downstream target; return `TEST_FAIL` and repair the source. Consumer-test edits still require scope approval. Missing coverage from that failed run does not hide the failure. |
| Fix shared dependency A; consumer B is untouched; C is independent | Invalidate A/B target, coverage and behavior evidence; retest them. Preserve C only when its dependency fingerprints remain current, with its original run ID. |
| Scoped rerun fails or removes a named test | Replace the target result and remove its old passing AC mapping; a missing mapping cannot inherit the earlier pass. |
| Changed coverage is 12/12 lines and 4/4 branches; baseline or required target is missing | Do not claim verification. Complete changed counters do not establish repository non-regression or target completeness. |
| Verified 0/0 executable diff, deleted source, or configured exclusion | Mark not applicable or excluded with evidence/reason; never display synthetic 100%. Required consumer tests still run. Unknown branch instrumentation remains unavailable. |
| Narrow report overlaps an earlier report, or repo scope/config differs | Do not average percentages or sum overlapping counters. Merge exact reporter identities with complete current partitions, obtain comparable exit reports, or block. |
| Resume with aggregate-only legacy state or missing reports | Recover the original baseline and retest invalid evidence; never substitute post-edit HEAD or label unknown data verified. |

## Independent review evidence

`implementation-workflow-state-machine` § Independent Review Contracts owns `reviewContext`, the `reviewEvidence` output extension and persisted `review.selection`, `review.runs` and `review.results`. `implementation-rules` § 3.6 owns invalidation, scoped reuse and pre-commit freshness. Code Reviewer, Rubber Duck and Goal Verifier receive their full prior native result explicitly; scoped rechecks return complete results with original run IDs on retained evidence. Standalone review output is unchanged.

Static review cases (not live workflow test results):

| Case | Expected outcome |
| --- | --- |
| Goal-driven fix introduces a security/correctness defect | Code Reviewer checks the new fix before COMMIT, despite passing in the preceding round. |
| Code-review fix changes a satisfied AC's dependency | Goal Verifier rechecks that AC and affected whole-goal evidence; an old satisfied status cannot survive by default. |
| Fix changes a shared API or an unchanged consumer's assumptions | Eligible Rubber Duck critique/regression checks rerun against the original baseline, including affected consumers. |
| Local review nit; unrelated checks have complete unchanged dependencies | Recheck the affected scope only; retain unrelated results with original run IDs and recompute complete risk/AC totals. |
| Missing prior result, unknown dependencies, or legacy state | Perform the full applicable independent check; never invent carried statuses. |
| Second allowed fix changes reviewed behavior | Run fresh applicable checks without adding a retry budget; only current completed findings may become known gaps at the cap. |
| Code changes while reviewers run or while commit confirmation is pending | Invalidate affected outputs, return to IMPLEMENT/REVIEW as needed, and require a current confirmation. Workflow bookkeeping alone does not invalidate source checks. |
| New scope ceases to qualify as small | Recompute eligibility from the complete changeset, clear old skip markers and run newly required reviewers. |

## Document section maps

Agents that reference a spec section must use the names below; the format owners are linked above.

### BRIEF

Frontmatter: `issueKey`, `issueType` (`Epic|Story|Task|Spike|Bug|Regression Bug`), `isEpic`, `isSpike`. Sections: Problem statement, Functional Requirements, Non-Functional Requirements, Acceptance Criteria, Scope, Open Questions, Upstream Architecture Constraints. Epics add `epicChildren` / `childContexts`.

### CONTEXT

Frontmatter: `complexityLevel`, `assumptions[]` (schema: `specs-ambiguity-detection`), `patternCandidates` / `patternReference` (`implementation-pattern-discovery`). Sections (Story family): Impacted Components, Proposed Changes, New Components, API Changes and DTOs, Security Considerations, Implementation Plan (≤15 steps), Feasibility Analysis and Risks, plus a `## Quality Validation Summary`. Bug/Regression Bug add Root cause hypothesis and Proposed fix approach; Regression Bug adds Regression Analysis. Epic and Spike contexts have their own section lists in the respective Tech Researcher agents.

### SPEC (Story / Task / Bug / Regression Bug)

Frontmatter: `issueKey`, `issueType`, `workflowId`, `priority`, `complexity`; after review the orchestrator adds `qualityScore`, `qualityBucket`, `failedImportantGates`; `/mep:accept-spec`, `/mep:reject-spec`, `/mep:feedback-spec` add `status` and feedback fields.
Sections: 1 Acceptance Criteria · 2 Implementation Summary · 3 Security Decisions · 4 Risks & Open Questions · 5 Cross-references. After implementation an `## Implementation Retrospective` is appended.

### SPEC (Epic / Spike)

Epic: 1 Overview · 2 Milestones & Timeline · 3 Dependencies & Impacted Areas · 4 Suggested Child Tickets · 5 Security & Risk Summary.
Spike: 1 Objective & Background · 2 Timebox & Experiment Plan · 3 Success/Failure Criteria · 4 Minimal Repro Steps · 5 Recommended Follow-up Stories.
Quality gates per type: `specs-quality-review`.

## Letter codes

Gate codes used in the Specs workflow: **G** orientation gate (post-BRIEF), **E** research-summary gate (`--review-context`), **C** ambiguity gate. Pattern selection is unlettered and shares C's pause (Step 3b, `pauseReason: research-decisions`). Order: G → (research) → E → C + pattern selection.

## Flags

| Command | Flag | Effect |
| --- | --- | --- |
| `/mep:create-specs` | `--review-context` | Enables the E gate |
| `/mep:fix-pr` | `--dry-run`, `--skip-tests`, `--auto-commit`, `--priority=<level>`, `-y` | See the prompt |
| `/mep:accept-spec`, `/mep:reject-spec`, `/mep:feedback-spec` | `--credit-usage`, `--context-window`, `--session-meta` | Session info; asked interactively when omitted |
| `/mep:reject-spec` | `--reason`, `--section`, `--comments` | Reason codes in `spec-metrics-log` |
| `/mep:feedback-spec` | `--accuracy`, `--section`, `--comments` | `accurate` / `partially-accurate` / `inaccurate` |
