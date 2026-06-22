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
| `TEST_FAIL` | Implementation | STAY IN IMPLEMENT | Fix failing tests before advancing to REVIEW |
| `COVERAGE_GAP` | Implementation | STAY IN IMPLEMENT | Add tests to meet 100% threshold before advancing |
| `BUILD_FAIL` | Implementation | STAY IN IMPLEMENT | Resolve build/lint errors before advancing |
| `SPEC_NOT_FOUND` | Spec Resolution | HARD STOP | Verify spec path or re-run `/create-specs {KEY}` |

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
- Code Reviewer: return structured validation issues and decision bucket.
- Implementation Workflow Orchestrator: use `TEST_FAIL`/`COVERAGE_GAP`/`BUILD_FAIL` to stay in IMPLEMENT; use `SPEC_NOT_FOUND` for hard-stop on missing spec.
