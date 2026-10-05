---
name: specs-complexity-assessment
description: Two-stage complexity classification for tech research depth. Determines whether a ticket warrants minimal, standard, or comprehensive research depth.
---

# Specs Complexity Assessment

> **Stack tokens**: `{{TOKEN}}` names in this file are symbolic — resolve them at runtime from the installed `{stack}-stack-profile` skill (registry: `skills/stack-profile/SKILL.md`). Never substitute them into files.

Classify a ticket into a research depth level before and after initial scope narrowing. Classification is two-stage to avoid circularity: shared library involvement is only discoverable during codebase analysis, not before it.

## Depth Levels

| Level | Description |
|---|---|
| `minimal` | Narrow, isolated change. Limited scope, few ACs, no cross-cutting concerns. |
| `standard` | Typical feature or bug. Default level when no strong escalation or de-escalation signals are present. |
| `comprehensive` | Cross-service, migration, shared library, or complex integration work. Full research depth required. |

---

## Stage 1 — Pre-Research Classification (BRIEF-only signals)

Run Stage 1 before any codebase access. All signals come from the Requirement Brief.

### AC Count and Testability

| Signal | Classification |
|---|---|
| ≤ 2 simple, isolated ACs | `minimal` |
| 3–4 ACs, no other escalation signals | `standard` (default) |
| ≥ 5 ACs, OR ACs are cross-cutting across multiple components | lean `comprehensive` |

### Issue Type

| Issue Type | Classification |
|---|---|
| Bug with isolated, localized symptom | `minimal` |
| Story / Task (no other signals) | `standard` |
| Epic | `comprehensive` |
| Spike | `standard` |

### Parent Epic

| Signal | Classification |
|---|---|
| No parent Epic | lean `minimal` |
| Parent Epic with existing HLD (`docs/specs/{EPIC_KEY}/high-level-design.md`) | `standard` |

### Keyword Signals in Description / Summary

| Keywords | Classification |
|---|---|
| "new service", "shared", "cross-team", "migration", "breaking change" | escalate to `comprehensive` |
| "typo", "label", "colour", "copy", "text change", "rename" | `minimal` |

### Stage 1 Resolution

Apply all signals above. The **highest** applicable level wins. When no signal applies, default to `standard`.

---

## Stage 2 — Post-Scope Escalation (after 2a, module manifest reads only)

Run Stage 2 after scope narrowing (step 2a in the Tech Researcher) once the initial affected-project list is known. Stage 2 reads module metadata from the build system — **no CLI commands, no test runs**.

> **CRITICAL**: Do NOT use `{{DEPENDENCY_GRAPH_COMMAND}}` for Stage 2 classification. That command is git-diff-based and returns meaningless results before any code changes exist (which is always the case at research time). Reserve `{{DEPENDENCY_GRAPH_COMMAND}}` for build and test workflows only.

### Escalation Triggers

| Signal | Escalation |
|---|---|
| Any affected project path starts with `{{SHARED_LIB_PATH_PREFIX}}` OR has tag `{{SHARED_LIB_TAG}}` in module metadata | Escalate to at least `standard` |
| More than 2 distinct domains affected (identified via `{{DOMAIN_TAG_PREFIX}}` metadata tag) | Escalate to `comprehensive` |

### Stage 2 Rules

- Stage 2 can only **escalate** — it never de-escalates a Stage 1 result.
- If Stage 1 produced `comprehensive`, Stage 2 is a no-op.
- Record the final classification in the `audit.log` entry (see D — Append-Only Workflow Audit Log).

---

## Step Ordering Within Tech Researcher

The correct classification order within the Tech Researcher workflow:

1. Stage 1 classify (from BRIEF)
2. Scope narrow (step 2a — build system project discovery)
3. Stage 2 escalate (module manifest reads)
4. Assumption registry (C — ambiguity detection)
5. Codebase analysis (step 2b — scoped to affected projects)

---

## Output

Record the classification result in the audit log entry:

```
Decision: classified as {level} (Stage 1: {signals}; Stage 2: {escalation reason | no escalation})
```

The Tech Researcher writes the final `complexityLevel` (after Stage 2) to the CONTEXT YAML frontmatter. The Specs Workflow Orchestrator reads it after RESEARCH, overwrites the preliminary `routing.complexityLevel`, and passes it to the Specs Writer, which maps it into the SPEC frontmatter (`specs-writer-common` § Frontmatter Sources).
