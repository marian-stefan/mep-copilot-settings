---
name: workflow-report-templates
description: User-facing report templates for both workflow orchestrators — the Specs COMPLETE summary and Harness Health Notice, and the Implementation pre-flight report, commit confirmation, Implementation Retrospective and COMPLETE summary. Load only at the step that prints the report.
---

# Workflow Report Templates

Templates only. When and whether to print them is decided by the orchestrator step that points here. `{if …}` blocks are printed only when the condition holds.

## Specs workflow

### COMPLETE summary

```markdown
✅ Specs Generation Complete

**Ticket**: {JIRA_KEY}
**Issue Type**: {issueType}
**Spec Document**: {specFilename}
**Quality Score**: {qualityScore}/100
**Complexity**: {complexity}
**Workflow usage**: {total} subagent runs ({agent × n, …}) · {iterationCount} regenerations · {userPauses} pauses
**Risk**: {riskLevel}
{if iterationCount reached its cap}**Remaining failed gates**: {list}

### Next Steps
1. Review the Spec at docs/specs/{JIRA_KEY}/{specFilename}
2. Discuss in grooming/planning session
3. (Recommended) Accept the spec: `/mep:accept-spec {JIRA_KEY}` — records an acceptance signal; non-blocking for implementation
4. Begin implementation: `/mep:start-implementation {JIRA_KEY}`
5. If rejected: `/mep:reject-spec {JIRA_KEY} --reason <code> [--section <N>]`
6. After implementation: `/mep:feedback-spec {JIRA_KEY} --accuracy <level>`
7. Review harness health: `/mep:review-harness-health` (after 5+ accept/reject signals)
```

### Harness Health Notice

Appended to the COMPLETE summary for the single reason code with the most rejections, when that count is 5 or more:

```
⚠️ Harness Health Notice
Reason code '{reason-code}' has accumulated {N} rejections — this may indicate a systematic
issue in the responsible workflow guide.
Suggested action: Run `/mep:review-harness-health` to inspect the pattern and apply a targeted fix.
```

## Implementation workflow

### Pre-flight report

```
📋 Implementation Pre-Flight Report
─────────────────────────────────────────────────────────────────
Spec:          {specFilePath}
Ticket:        {issueKey} ({issueType})
Status:        {status | not set}
Spec Quality:  {qualityScore}/100  ({qualityBucket})
{one ⚠️ line per warning}
```

### Commit confirmation

```
✅ Implementation Review: {riskRating}
🎯 Goal Verification: {acCoverage}% AC coverage, scope {aligned | mismatch}
{if effectiveRequirements.approval is present}Approved requirement corrections: {effectiveRequirements.inlineCorrections}
{if specAccuracySignal has entries}
⚠️ Spec Accuracy Signal:
  Modified but not in spec: {list}
  In spec but not modified: {list}

Ready to commit. Please review the files to be staged:

{every file from artifacts.changedFiles, cross-checked against git status}
(Files already dirty before this session are excluded per git baseline snapshot.)

Type "commit" to proceed or "skip" to defer.
```

### Implementation Retrospective

Appended to the SPEC file at COMMIT without rewriting its original requirement sections. The Goal Verification subsection is owned by `skills/implementation-goal-verification-gate/SKILL.md` § Implementation Retrospective Addendum and reports effective ACs. Spec Accuracy still compares files against the original `specDigest`. Branch and commit hash are not recorded here; they don't exist yet.

```markdown
## Implementation Retrospective

**Completed**: {ISO-8601 date}
**Workflow**: {workflowId}

{if effectiveRequirements.approval is present}
### Approved Requirement Corrections

{effectiveRequirements.inlineCorrections}
Confirmed at {effectiveRequirements.approval.confirmedAt} via {effectiveRequirements.approval.source}.
Verification below uses the approved effective requirements; the original SPEC remains unchanged above.

### Spec Accuracy
| Category | Files |
|----------|-------|
| Modified and in spec | {count matching} |
| Modified but NOT in spec | {list or "none"} |
| In spec but NOT modified | {list or "none"} |

{Goal Verification subsection}

### Known Issues Accepted
{High/Critical review findings or unmet criteria carried past the iteration cap or accepted by the user, or "none"}

### Notes
{If divergences exist}: Review divergences above — consider updating the spec or filing a follow-up ticket.
{If no divergences and no approved corrections}: Implementation matched the spec plan.
{If approved corrections exist}: Implementation targeted the approved effective requirements; see the corrections and verification results above.
```

### COMPLETE summary

```markdown
✅ Implementation Complete

**Ticket**: {issueKey}
**Spec**: {specFilePath}
**Quality**: {qualityScore}/100 ({qualityBucket})
**Review**: {riskRating}
**Goal Verification**: {acCoverage}% AC coverage, scope {aligned | mismatch}
**Files changed**: {count}
**Branch**: {branchName}
**Commit**: {commitHash}
**Workflow usage**: {total} subagent runs ({agent × n, …}) · {fixPasses} fix passes · {userPauses} pauses

{if specAccuracySignal has entries}
### Spec Accuracy Signal
Modified but not in spec: {list}
In spec but not modified: {list}
(Consider updating the spec or filing a follow-up ticket if significant.)

### Next Steps
- Record developer feedback: `/mep:feedback-spec {issueKey} --accuracy <accurate|partially-accurate|inaccurate>`
```
