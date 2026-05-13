---
name: specs-validation
description: Centralized validation gates for the Specs workflow (Technical Context only). Spec quality scoring is owned by specs-quality-review/SKILL.md.
---

> **Scope Notice:** This skill's authority is **limited to Technical Context validation** (RESEARCH step gates and validation summary format). It does **not** own Spec document quality scoring or quality-bucket thresholds. Those are exclusively defined in [specs-quality-review/SKILL.md](../specs-quality-review/SKILL.md). Agents and orchestrators must consult that file for `qualityScore` calculation, `qualityBucket` thresholds, and Spec review output format.

# Specs Validation Gates

This skill covers Technical Context validation logic for the Specs workflow. Agents and the orchestrator must reference this document for RESEARCH-step gate decisions.

## Scope

- Technical Context validation (RESEARCH -> GENERATE)
- Quality gate scoring and warning rules
- Validation summary format

## Technical Context Validation (Tiered)

### Critical Gates (MUST PASS - blocking)

- File `docs/specs/{TICKET_KEY}/CONTEXT-{TICKET_KEY}.md` exists at the expected output path
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

**Critical Gates**: {x}/3 passed
**Important Gates**: {x}/4 passed
**Optional Gates**: {x}/3 passed

**Failed Critical Gates**:
- {gate}

**Failed Important Gates**:
- {gate}
```

## Spec Quality Validation (Reviewer)

Spec quality scoring is owned by [specs-quality-review/SKILL.md](../specs-quality-review/SKILL.md). Agents must not duplicate gate definitions or scoring here.
Stack-specific review depth is determined by `.github/skills/specs-technology-routing/SKILL.md`, which may resolve an optional `reviewSkill` for `Generic Reviewer` to load alongside `specs-quality-review/SKILL.md`.
