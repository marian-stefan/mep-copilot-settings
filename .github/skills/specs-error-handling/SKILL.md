---
name: specs-error-handling
description: Standardized error taxonomy, templates, and escalation patterns across Specs workflow agents.
---

# Error Handling Guidelines for Specs Agents

Use this skill to keep error handling consistent across orchestrator and sub-agents.

## Error Types

- `hard-stop`: Abort workflow with remediation steps.
- `recoverable`: Continue with fallback and document limitation.
- `validation-failure`: Return for iteration with specific gaps.

## Standardized Error Codes

| Code | Category | Severity | Action |
|------|----------|----------|--------|
| `INPUT_MISSING` | Required Input | HARD STOP | Abort, request input |
| `INPUT_INVALID` | Required Input | HARD STOP | Abort, request correction |
| `TOOL_UNAVAIL` | Tool Unavailability | CONTINUE | Document, provide manual alternative |
| `DATA_PARTIAL` | Fallback | CONTINUE | Proceed, document limitation |
| `VALIDATION_FAIL` | Validation | RETURN | Mark for iteration |
| `EXTERNAL_TIMEOUT` | Tool Unavailability | CONTINUE | Retry or skip |

## Error Message Template

```markdown
⚠️/❌ {Severity} {Category}: {Title}

**Issue**: {What went wrong}
**Root Cause**: {Why it happened}
**Impact**: {Effect on user/workflow}

### Remediation
1. {Actionable step}
2. {Actionable step}
3. {Actionable step}

**Next Steps**: {What to do after fix}
```

## Escalation Path

1. Validation failure → return for iteration.
2. Partial data → continue with explicit limitation notes.
3. Tool unavailable → provide manual alternative and continue where possible.
4. Hard-stop conditions → abort with remediation checklist.

## Agent-specific Expectations

- Jira Analyst: hard-stop on missing/invalid ticket, continue on partial non-critical data.
- Tech Researcher: hard-stop on missing brief or invalid workspace, continue with documented gaps.
- Specs Writer: return validation failures with concrete missing sections.
- Git Operator: hard-stop on unrelated staged files/auth failures.
- Reviewer: return structured validation issues and decision bucket.
