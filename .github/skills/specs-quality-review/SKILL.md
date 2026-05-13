---
name: specs-quality-review
description: Quality gates, scoring formula, and required output format for Spec document review. Use when validating a generated Spec file for completeness, accuracy, and implementation-readiness. Consumed by Generic Reviewer (Spec Review Mode) and any other agent or flow that needs to evaluate a Spec document.
---

# Specs Quality Review

Single source of truth for Spec document validation. Any agent evaluating a `docs/specs/{TICKET_KEY}/SPEC-*.md` file MUST apply this skill instead of defining its own gates or scoring.

## Detection — When to Apply This Skill

Apply this skill (instead of the standard code-diff review) when:
- Input is a file path matching `docs/specs/*/SPEC-*.md`, **or**
- The invoking prompt explicitly states "validate spec quality" or "spec quality review"

The standard PR risk-scoring formula and PR review template do **NOT** apply in this mode.

## Quality Gates

### Critical Gates — each failure deducts 20 points

- [ ] All required sections present: Overview, Background & Context, Requirements, Technical Architecture, Security Analysis, Implementation Plan, Testing Strategy
- [ ] No unresolved `{placeholder}` syntax anywhere in the document
- [ ] At least 2 concrete file paths with real library/module references (no invented paths)
- [ ] Security Analysis section contains at least 1 named threat vector with a corresponding mitigation strategy

### Important Gates — each failure deducts 8 points

- [ ] Acceptance criteria are testable (not vague or subjective)
- [ ] Implementation Plan has numbered steps with at least 1 concrete code snippet
- [ ] Component/service/module names are concrete (not generic placeholders like `MyComponent` or `MyService`)
- [ ] Non-functional requirements (performance, accessibility, scalability) are present
- [ ] If backend services required: API contracts section contains real endpoint paths and DTO field definitions

### Optional Gates — informational only, no score impact

- [ ] Before/after code snippets present for file modifications
- [ ] Epic or Spike-specific sections present when `issueType` is Epic or Spike
- [ ] Tooling commands (generators, CLI) include all flags with real populated values

## Scoring Formula

```
qualityScore = 100
  - (critical_failures x 20)
  - (important_failures x 8)
  (clamped to 0-100)
```

## Quality Bucket Thresholds

| Score Range | `qualityBucket` | Orchestrator Action |
|-------------|-----------------|---------------------|
| 70 - 100    | `proceed`        | Continue to COMPLETE |
| 40 - 69     | `iterate`        | Return to Specs Writer for revision (max 2 cycles) |
| 0 - 39      | `abort`          | Hard stop — spec cannot be salvaged without new input |

## Required Output Format

The reviewer MUST return results in this exact format:

```markdown
## Spec Quality Review

**Quality Score**: {score}/100
**Quality Bucket**: proceed | iterate | abort

### Critical Gates: {x}/4 passed
- [x] All required sections present
- [ ] No unresolved placeholders  ← example failure

### Important Gates: {x}/5 passed
- [x] Testable acceptance criteria
- ...

### Optional Gates: {x}/3 passed
- ...

### Recommendations
- {specific actionable improvement}
```
