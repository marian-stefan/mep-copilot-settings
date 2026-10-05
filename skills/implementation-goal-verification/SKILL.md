---
name: implementation-goal-verification
description: Independent Goal Verifier procedure for effective Acceptance Criteria and the original ticket goal. Scheduling and evidence reuse follow implementation-rules; the orchestrator owns the shared review retry cap and gates.
---

# Implementation Goal Verification Gate

100% test coverage and a passing Code Reviewer pass both check *mechanical* correctness — the code runs, the code is well-formed. Neither checks whether the code actually does what the ticket asked for. A developer (or agent) can pass every test and every lint rule while silently missing an Acceptance Criterion, especially on a criterion that's easy to half-implement (e.g. "loading state shows a spinner" — trivially satisfiable in a way that doesn't actually wire to the real async call). Worse, a changeset can satisfy every literal AC checkbox while still missing the ticket's actual goal, if the checkboxes themselves under-specify intent.

This gate is the implementation-side analogue of iterating a plan against a stated goal until the goal is verifiably reached, rather than stopping at "looks done." It is deliberately independent from the SPEC Accuracy Signal (`artifacts.specAccuracySignal`), which only compares *which files* were touched against *which files* the SPEC predicted — a purely mechanical diff that says nothing about whether behavior is correct.

> Scope: this skill is the agent-side procedure only (inputs, Check 1, Check 2, non-goals). The orchestrator-side gate — when to run, gate decision and iteration cap, state update, retrospective addendum — is `skills/implementation-goal-verification-gate/SKILL.md`. The dispatch fields live in `implementation-workflow-orchestrator.agent.md` § REVIEW.

## Independence Requirement

This procedure is owned and executed by the **Goal Verifier** subagent (`agents/goal-verifier.agent.md`) — a separate, stateless invocation from the orchestrator's own context, exactly like the Code Reviewer. The orchestrator must never perform this check inline: the context that just implemented or supervised IMPLEMENT is the wrong context to grade it — it shares the same blind spots that produced any gap in the first place. The Goal Verifier receives only the artifacts listed below (§ Inputs) and re-derives its judgment from scratch on each invocation.

## Inputs

- `specFilePath` — original SPEC Section 2 (Implementation Summary, for goal/intent context); its Section 1 is historical context, not a replacement for effective ACs
- `effectiveRequirements` — shared approved run contract from the orchestrator; construction and precedence are owned by `implementation-requirement-reconciliation` § Effective Requirements Contract
- `briefFilePath` — `docs/specs/{JIRA_KEY}/BRIEF-{JIRA_KEY}.md`, if it exists (path resolved at PREFLIGHT, existence-checked) — read directly for the ticket's originally stated problem/goal, which may carry intent broader than the SPEC's checkbox wording
- `changedFiles` — the actual changeset
- `testRunSummary` — the orchestrator's merged current evidence (`implementation-rules` § 3.1.1), not a single focused result; use qualified test identities and dependencies, never stale/unavailable results or passing-but-vacuous assertions as proof
- `reviewContext`, optional `recheckCriteria` — explicit prior native result and current invalidation/retention decisions; shape: `implementation-workflow-state-machine` § Independent Review Contracts

## Verification Procedure

Run both checks below. They produce independent finding sets but share one gate decision (§ Gate Decision).

### Check 1 — Acceptance Criteria (AC-by-AC)

For each entry in `effectiveRequirements.acceptanceCriteria`, using its approved guidance instead of superseded SPEC wording:

On a scoped recheck, `reviewContext` supplies prior criteria/evidence and explicit retention decisions (`implementation-rules` § 3.6). Re-evaluate every invalidated criterion, including previously satisfied ones; reuse only proven-current retained entries. Missing prior data or unknown dependencies requires a full check. Return all criteria and compute coverage over the complete list. Apply the same freshness rule independently to Check 2's `goal-scope`, even when no AC is in the focused subset.

1. **Locate evidence.** Search `changedFiles` (and their diffs, if available) plus `testRunSummary` for code or an assertion that directly demonstrates this criterion. "Directly" means: an explicit test asserts the behavior, or the implementation is simple enough that reading it settles the question without running anything.
2. **Classify**:

   | Status | Meaning |
   |---|---|
   | `satisfied` | Clear evidence in code and/or a passing test that specifically exercises this criterion |
   | `partial` | Some relevant code exists, but a specific sub-case, edge case, or the acceptance wording's full scope isn't covered (e.g. AC says "shows error on 4xx and 5xx" but only 4xx is handled) |
   | `not-satisfied` | No evidence found — the criterion appears unimplemented |
   | `unverifiable` | Criterion is not evaluable by reading code/tests alone (e.g. depends on a manual UX judgment, an external system's behavior, or a non-functional target that requires live measurement) — this is not a failure, it is an honest limit of static verification |

   Do not mark `satisfied` on inference alone ("the pattern looks like it would probably work") — that is `partial` at best. This mirrors the "Zero Hallucinations" principle in `skills/implementation-rules/SKILL.md` § 2: do not credit work that wasn't actually verified.

3. **Record** each criterion's status, one line of evidence (file:line or test name), and — for `partial`/`not-satisfied` — exactly what's missing in one line. Do not add narrative outside the result schema.

```
acCoverage = satisfied / (satisfied + partial + not-satisfied)   # unverifiable excluded from both terms
```

### Check 2 — Scope/Goal Consistency

Literal AC satisfaction does not guarantee the ticket's actual goal was reached — a checklist can under-specify intent, and an implementation can satisfy every checkbox's letter while missing what the ticket was actually asking for.

1. **Read the stated goal.** Prefer `briefFilePath`'s problem statement (the requirement as originally captured, before it was compressed into checkbox ACs) if present; otherwise fall back to the SPEC's title and Section 2 (Implementation Summary) opening context.
   Keep this original goal separate from effective ACs. Consider the approved correction and its provenance when explaining a mismatch, but do not treat correction approval as evidence that the original goal is satisfied; unresolved conflicts still produce `goal-scope-mismatch`.
2. **Compare against the changeset's actual behavior** (`changedFiles`, `testRunSummary`) — not against the AC checklist. Ask: if every AC above is `satisfied`, does the changeset visibly address the goal as stated in the ticket, or does it only address a narrower slice the checkboxes happened to capture?
3. **Classify**:

   | Status | Meaning |
   |---|---|
   | `aligned` | The changeset's behavior visibly addresses the ticket's stated goal, not just the literal AC wording |
   | `mismatch` | Every AC may be `satisfied`, but the implementation only narrowly satisfies checkbox letter without addressing the ticket's broader stated intent (e.g. AC says "shows error message," but the ticket's underlying goal was "prevent duplicate submissions," and nothing addresses the latter) |

4. If `mismatch`, record a finding: `type: goal-scope-mismatch`, `detail` (what the ticket asked for vs. what the changeset does), `blocking`, `confidence` — same `blocking`/`confidence` vocabulary as `skills/implementation-requirement-reconciliation/SKILL.md` § Finding Schema. A narrow-but-real gap is usually `blocking: false` (recorded, not gating); treat it as `blocking: true` only when the mismatch means the ticket's core purpose is unaddressed despite passing ACs.

**Non-Goal**: this check does not re-derive or second-guess whether the SPEC's ACs were well-written — that is a spec-quality problem caught by `/mep:feedback-spec --accuracy inaccurate`, not this gate. It only flags cases where satisfying the literal ACs doesn't visibly satisfy the ticket's own stated goal.

## Non-Goals

- This gate does not re-derive Acceptance Criteria — Check 1 checks the supplied effective list, which equals SPEC Section 1 unless explicitly corrected and approved. Further requirement changes return to reconciliation rather than being invented by this verifier.
- Check 2 does not re-derive or second-guess the SPEC's AC wording (see its own Non-Goal above) — it only flags a visible gap between literal AC satisfaction and the ticket's stated goal, it does not rewrite or replace the AC list.
- This gate does not replace human QA or the Code Reviewer's security/architecture checklist — it is scoped exclusively to "does the change do what the ticket asked, in full," nothing else.
- This gate never modifies the SPEC file directly — only the Implementation Retrospective addendum appended at COMMIT (same file, same append-point already defined for that section).
