---
name: specs-quality-review
description: Quality gates, scoring formula, and required output format for Spec document review. Applies to the 5-section compact SPEC format (Acceptance Criteria, Implementation Summary, Security Decisions, Risks & Open Questions, Cross-references). Consumed by the Spec Reviewer agent.
---

# Specs Quality Review

Single source of truth for Spec document validation. Any agent evaluating a `docs/specs/{JIRA_KEY}/SPEC-*.md` file MUST apply this skill instead of defining its own gates or scoring.

## Detection — When to Apply This Skill

Apply this skill (instead of the standard code-diff review) when:
- Input is a file path matching `docs/specs/*/SPEC-*.md`, **or**
- The invoking prompt explicitly states "validate spec quality" or "spec quality review"

The standard PR risk-scoring formula and PR review template do **NOT** apply in this mode.

## Quality Gates

<!-- Keep gate counts below in sync with the output template's {x}/N placeholders -->

### Critical Gates — each failure deducts 20 points

<!-- 4 critical gates — output template uses {x}/4 -->
- [ ] Frontmatter present and complete: `issueKey`, `issueType`, `priority`, `complexity`, `backend` fields populated with no `{placeholder}` syntax
- [ ] Section 1 (Acceptance Criteria) contains at least one testable functional criterion and the standard Technical criteria block
- [ ] Section 3 (Security Decisions) contains at least one row with a named threat and a concrete mitigation
- [ ] Section 5 (Cross-references) contains a relative Markdown link to `CONTEXT-{KEY}.md`

### Important Gates — each failure deducts 8 points

<!-- 5 important gates — output template uses {x}/5 -->
- [ ] Section 2 (Implementation Summary) lists at least 2 steps with real file paths (no invented or placeholder paths)
- [ ] Section 2 contains no code snippets (code belongs in CONTEXT — presence of a fenced code block is a gate failure)
- [ ] For Bug / Regression Bug: Section 2 opens with a one-sentence root cause statement
- [ ] Total SPEC length does not exceed 200 lines (target is 150; 200 is the hard ceiling)
- [ ] No unresolved `{placeholder}` syntax anywhere in the document

### Optional Gates — informational only, no score impact

<!-- 3 optional gates — output template uses {x}/3 -->
- [ ] Section 4 (Risks & Open Questions) is present and either lists items or explicitly states "None identified."
- [ ] Implementation Summary steps use action verbs (Create, Modify, Register, Delete, …)
- [ ] For Regression Bug: Section 1 includes a criterion confirming the regression scenario no longer reproduces

## Scoring Formula

```
qualityScore = 100
  − (critical_failures × 20)
  − (important_failures × 8)
  (clamped to 0–100)
```

## Quality Bucket Thresholds

| Score Range | `qualityBucket` | Orchestrator Action |
|-------------|-----------------|---------------------|
| 70 – 100    | `proceed`        | Continue to COMPLETE |
| 40 – 69     | `iterate`        | Return to Specs Writer for revision (max 2 cycles) |
| 0 – 39      | `abort`          | Hard stop — requires human review |

## Required Output Format

**REQUIRED**: Return this exact structure. The Orchestrator parses `qualityBucket` and `qualityScore` from this output — do not alter key names or heading levels.

```markdown
## Spec Quality Review: {SPEC_FILENAME}

**Ticket**: {JIRA_KEY}  
**Issue Type**: {issueType}  
**qualityScore**: {0–100}  
**qualityBucket**: proceed | iterate | abort

### Gate Results

**Critical Gates**: {x}/4 passed  
**Important Gates**: {x}/5 passed  
**Optional Gates**: {x}/3 passed (informational)

#### Failed Critical Gates
- {gate name}: {specific issue found}

#### Failed Important Gates
- {gate name}: {specific issue found}

#### Passed Gates
- {gate name} ✅

### Findings

{Prioritized list of issues found, with specific section references and remediation guidance}

### Decision

**{PROCEED | ITERATE | ABORT}** — {1–2 sentence rationale}
```
