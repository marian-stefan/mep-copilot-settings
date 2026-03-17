---
name: specs-validation
description: Centralized validation gates and scoring rules for the Specs workflow (Technical Context and Spec quality).
---

# Specs Validation Gates

This skill is the single source of truth for validation logic across the Specs workflow. Agents and the orchestrator must reference this document instead of duplicating gate definitions.

## Scope

- Technical Context validation (RESEARCH -> GENERATE)
- Quality gate scoring and warning rules
- Validation summary format

## Technical Context Validation (Tiered)

### Critical Gates (MUST PASS - blocking)

- File `CONTEXT-{JIRA_KEY}.md` exists in repository root (no subdirectories)
- File size > 1KB (substantive analysis)
- Contains at least 2 concrete file paths with no `{placeholder}` syntax

Failure action: reject Technical Context, return to Tech Researcher with specific gaps. Orchestrator blocks progression.

### Important Gates (SHOULD PASS - warnings if <4)

- At least 1 before/after code snippet (5-10 lines of context)
- File modifications include approximate line numbers or ranges
- Uses actual component/service names (no placeholders)
- Method signatures show parameter and return types

Failure action: proceed with warning banner and record failed gates in state.

### Optional Gates (Metrics Only)

- All file paths include explicit line numbers (not ranges)
- State changes show complete interface/action/selector definitions
- Feasibility section lists specific measurable risks

Failure action: log metrics only.

## Quality Gate Scoring (Decision Logic)

- If all critical gates pass:
  - If >=4 important gates pass: proceed with no warnings
  - If <4 important gates pass: proceed with warnings
- If any critical gate fails: reject and return to Tech Researcher

## Validation Summary Format

Return a validation summary block in Technical Context output:

```markdown
## Quality Validation Summary

**Status**: PASSED | PASSED_WITH_WARNINGS | REJECTED

**Critical Gates**: {x}/4 passed
**Important Gates**: {x}/5 passed
**Optional Gates**: {x}/6 passed

**Failed Critical Gates**:
- {gate}

**Failed Important Gates**:
- {gate}
```

## Spec Quality Validation (Reviewer)

Spec quality scoring remains owned by `Generic Reviewer`.
Stack-specific review depth is determined by `.github/skills/specs-technology-routing/SKILL.md`, which may resolve an optional `reviewSkill` for `Generic Reviewer` to load.
