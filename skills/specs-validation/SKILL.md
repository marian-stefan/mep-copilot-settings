---
name: specs-validation
description: Centralized validation gates and scoring rules for the Specs workflow (Technical Context and Spec quality).
---

> **⚠️ Scope Notice:** This skill's authority is **limited to Technical Context validation** (RESEARCH step gates and validation summary format). It does **not** own Spec document quality scoring or quality-bucket thresholds. Those are exclusively defined in [specs-quality-review/SKILL.md](../specs-quality-review/SKILL.md). Agents and orchestrators must consult that file for `qualityScore` calculation, `qualityBucket` thresholds, and Spec review output format.

# Specs Validation Gates

> **Stack tokens**: `{{TOKEN}}` names in this file are symbolic — resolve them at runtime from the installed `{stack}-stack-profile` skill (registry: `skills/stack-profile/SKILL.md`). Never substitute them into files.

This skill covers Technical Context validation logic for the Specs workflow. Agents and the orchestrator must reference this document for RESEARCH-step gate decisions.

## Scope

- Technical Context validation (RESEARCH -> GENERATE)
- Artifact boundary enforcement (approved output files only)
- Validation summary format

## Technical Context Validation (Tiered)

### Critical Gates (MUST PASS - blocking)

- File `docs/specs/{JIRA_KEY}/CONTEXT-{JIRA_KEY}.md` exists at the expected artifact path
- File size > 1KB (substantive analysis)
- Contains at least 2 concrete file paths with no `{placeholder}` syntax
- **Artifact boundary respected** — see "Artifact Boundary Enforcement" section below

Failure action: reject Technical Context, return to Tech Researcher with specific gaps. Orchestrator blocks progression.

### Important Gates (SHOULD PASS - warnings if fewer than 3 of 4 pass)

- At least 1 before/after code snippet (5-10 lines of context)
- File modifications include approximate line numbers or ranges
- Uses actual component/service names (no placeholders)
- Method signatures show parameter and return types

Failure action: proceed with warning banner and record failed gates in state.

### Optional Gates (Metrics Only)

- All file paths include explicit line numbers (not ranges)
- State changes show complete interface/action/selector definitions
- Template/view examples use the current tech stack's syntax patterns (no deprecated patterns)
- Scaffold/generator commands (`{{SCAFFOLD_COMMAND}}`) include all flags with concrete values
- Feasibility section lists specific measurable risks
- Documented tool usage (workspace/project discovery commands run, e.g. the stack profile's project-discovery commands)

Failure action: log metrics only.

## Artifact Boundary Enforcement

**Rule**: The Specs workflow produces exactly three *deliverable* files per Jira ticket (BRIEF, CONTEXT, one SPEC), all scoped to `docs/specs/{JIRA_KEY}/`. Workflow bookkeeping files (below) are allowed alongside them and are not deliverables. No other files may be created anywhere in the repository as part of the Specs workflow.

### Approved Files (one of each, per ticket)

| File | Producer | Purpose |
|------|----------|---------|
| `docs/specs/{JIRA_KEY}/BRIEF-{JIRA_KEY}.md` | Jira Analyst | Requirement Brief |
| `docs/specs/{JIRA_KEY}/CONTEXT-{JIRA_KEY}.md` | Tech Researcher | Technical Context |
| `docs/specs/{JIRA_KEY}/SPEC-{JIRA_KEY}.md` | Specs Writer | Final Spec (Story/Task/Bug/Regression Bug) |
| `docs/specs/{JIRA_KEY}/SPEC-{JIRA_KEY}-Epic.md` | Specs Writer | Final Spec (Epic variant) |
| `docs/specs/{JIRA_KEY}/SPEC-{JIRA_KEY}-Spike.md` | Specs Writer | Final Spec (Spike variant) |

> **Note**: Only ONE Spec document is produced per ticket. The variant depends on issue type (see `skills/specs-workflow-routing/SKILL.md`).

### Enforcement Rules

- **No additional files** may be created under `docs/specs/{JIRA_KEY}/` (e.g., no `NOTES-*.md`, `RESEARCH-*.md`, `DRAFT-*.md`, `PLAN-*.md`).
- **No files outside `docs/specs/`** may be created, modified, or deleted by any Specs workflow agent (e.g., no changes to `libs/`, `apps/`, `tools/`, workspace config files).
- Agents must use `create_file` only for the three approved paths above. Any `edit` or `create` operation targeting a path outside `docs/specs/{JIRA_KEY}/` is a boundary violation.
- **Regression Analysis** and all other sections (Implementation Plan, build commands, code snippets, etc.) must be embedded inside the approved files — **not** written to separate files.

### Validation Check

Before the orchestrator advances from RESEARCH → GENERATE or GENERATE → REVIEW, it MUST verify:

1. Count *deliverable* files under `docs/specs/{JIRA_KEY}/` (`BRIEF-*`, `CONTEXT-*`, `SPEC-*`) — must be ≤ 3, with at most one SPEC.
2. Verify each file matches an approved name pattern: deliverables `BRIEF-{KEY}.md`, `CONTEXT-{KEY}.md`, `SPEC-{KEY}.md` | `SPEC-{KEY}-Epic.md` | `SPEC-{KEY}-Spike.md`; bookkeeping `specs-workflow-state.yml`, `implementation-workflow-state.yml`, `audit.log`, `archive/`; and, for Epics, the pre-existing `impact-map.md`, `high-level-design.md`, `adrs.md` produced by `/mep:create-impact-map` and `/mep:create-high-level-design`. Anything else is a violation.
3. Verify no files were written outside `docs/specs/{JIRA_KEY}/`.

If any violation is detected:
- **Block** progression immediately.
- **Surface** the list of unexpected files to the user with their full paths.
- **Log** the violation in the validation summary under a new `Artifact Boundary Violations` field.
- Do NOT delete files — each agent's `## File Creation Constraints` section is the primary prevention mechanism; the orchestrator's role here is to block and report only.

### Failure Action

Artifact boundary violation is a **Critical Gate failure**. The orchestrator must not advance the workflow. It must surface the full list of unexpected files to the user and wait for an explicit user decision before taking any further action.

---

## Quality Gate Scoring (Decision Logic)

- If all critical gates pass:
  - If >=3 important gates pass: proceed with no warnings
  - If <3 important gates pass: proceed with warnings
- If any critical gate fails: reject and return to Tech Researcher

## Validation Summary Format

Return a validation summary block in Technical Context output:

```markdown
## Quality Validation Summary

**Status**: PASSED | PASSED_WITH_WARNINGS | REJECTED

**Critical Gates**: {x}/4 passed
**Important Gates**: {x}/4 passed
**Optional Gates**: {x}/6 passed

**Failed Critical Gates**:
- {gate}

**Failed Important Gates**:
- {gate}

**Artifact Boundary Violations**:
- {unexpected_file_path} (created by {agent})
```

## Spec Quality Validation

Spec quality scoring is owned by `specs-quality-review/SKILL.md`. Refer to that file for `qualityScore` calculation, `qualityBucket` thresholds, and Spec review output format. The agent responsible for running quality review is the **Spec Reviewer** (`spec-reviewer.agent.md`).
