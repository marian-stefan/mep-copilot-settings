---
name: dotnet-code-review-output
description: Mandatory output template for .NET code review reports. Two output modes — a compact machine-readable form for the automated Implementation Workflow, and the full human-readable form for direct /mep:review-pr and /review-branch requests.
---

# .NET Code Review Output Template

## Output Modes

### `orchestration-compact`

Use for the Implementation Workflow Orchestrator's automated REVIEW step. Apply the full review checklist internally, then return only:

```yaml
verdict: approve | approve-with-comments | request-changes
riskRating: Low | Moderate | High | Critical   # per the Code Reviewer's Severity Vocabulary
riskScore: {number | null}
publicSurfaceChanged: true | false   # method/route/event-payload signature, exported type shape, changed defaults or validation; drives the orchestrator's Rubber Duck / Goal Verifier skip rule
summary: "{one sentence; name the most important concern when present}"
findings:
  - id: "{CRIT|HIGH|MED|LOW}-{N}"
    severity: Critical | High | Medium | Low
    kind: checklist | critique | regression
    file: "{path}"
    line: {number | null}
    detail: "{one sentence}"
    fix: "{one sentence}"
checks:
  architecture: pass | fail | not-applicable
  security: pass | fail | not-applicable
  testing: pass | fail | not-applicable
  regressions: pass | fail | not-applicable
metrics:
  filesChanged: {number}
  newTestsAdded: {number}
```

In this mode the Rubber Duck runs outside the Code Reviewer and the orchestrator merges its `critique`/`regression` findings, so the Code Reviewer itself returns `kind: checklist` findings. Do not emit empty severity sections, checklist narration, a risk table, or `N/A` placeholders. An approved change normally returns an empty `findings` array. Findings retain exact file/line evidence and remediation, so compact mode does not reduce review depth.

With `reviewContext`, append the shared `reviewEvidence` extension from `implementation-workflow-state-machine` § Independent Review Contracts. Return complete findings/checks/metrics after combining fresh and explicitly retained entries; compute risk over that complete result, not just the fix. This extension does not change `human-full` output.

### `human-full`

Use for direct `/mep:review-pr` and `/review-branch` requests. **REQUIRED**: use this exact template. Fill every section below; use `N/A` only when the section genuinely does not apply.

---

## Code Review: [PR Title / Branch / Changeset]

**Author:** [Name] | **Branch:** [source] → [target] | **Files Changed:** [N]

### Summary

[Brief overview of changes and scope - 2-3 sentences explaining what the PR does]

### Risk Assessment

| Category         | Rating                           | Critical Items |
| ---------------- | -------------------------------- | -------------- |
| Architecture     | [🟢/🟡/🟠/🔴]                    | [count]        |
| Security         | [🟢/🟡/🟠/🔴]                    | [count]        |
| Testing          | [🟢/🟡/🟠/🔴]                    | [count]        |
| Performance      | [🟢/🟡/🟠/🔴]                    | [count]        |
| **Overall Risk** | **[Low/Moderate/High/Critical]** | **Score: [X]** |

**Rating Legend:**

🟢 Green: No issues found
🟡 Yellow: Minor issues, suggestions only
🟠 Orange: Issues that should be addressed
🔴 Red: Critical issues that must be fixed

### Detailed Findings

#### 🔴 Critical Issues (Must Fix)

**[Category]**: [Issue description]

- **Location:** `Path/To/File.cs:123`
- **Impact:** [Explanation of why this is critical]
- **Fix:** [Suggested code change or approach]

#### 🟠 High Priority (Should Fix)

**[Category]**: [Issue description]

- **Location:** `Path/To/File.cs:123`
- **Impact:** [Explanation]
- **Recommendation:** [Suggested approach]

#### 🟡 Medium Priority (Consider Fixing)

**[Category]**: [Issue description]

- **Location:** `Path/To/File.cs:123`
- **Impact:** [Explanation]
- **Suggestion:** [Optional improvement]

#### 🟢 Suggestions (Nice to Have)

**[Category]**: [Positive observation or minor suggestion]

- **Note:** [Explanation or acknowledgment of good practices]

### Regression Check

_Findings from the Rubber Duck Reviewer's regression pass (`kind: regression`) — behavior that existed before this change and silently broke, outside the stated ticket/AC scope. Cite the prior behavior and what changed for each._

- **Location:** `Path/To/File.cs:123`
- **Prior behavior:** [what it did before] — **What changed:** [what changed] — **Why this matters:** [impact]
- **Fix:** [Suggested change]

`No regressions detected.` when the pass found none. If the regression check could not run (baseline reference did not resolve), state that explicitly instead of leaving this section blank.

### Metrics

- **Lines Added:** [N] | **Lines Removed:** [M]
- **Files Modified:** [X] | **New Files:** [Y] | **Deleted Files:** [Z]
- **Test Coverage:** [X% via coverlet or "Not measured"]
- **Violations:** [Total count by severity: Critical: X, High: Y, Medium: Z]

### Follow-up Actions

- [ ] [Specific actionable item 1]
- [ ] [Specific actionable item 2]
- [ ] [Specific actionable item 3]

### Additional Notes

[Any additional context, related tickets, or discussion points]
