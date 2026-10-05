---
name: specs-writer-common
description: Shared procedural boilerplate for Specs Writer (Story/Epic/Spike) — the input pre-flight, frontmatter field sources, revision-input contract, file creation/validation, and common policies. Section templates (what the Spec itself contains) remain in specs-generation-{story|epic|spike}/SKILL.md — this file covers process only.
---

# Specs Writer — Shared Procedures

This skill centralizes the pre-flight decision logic that is identical across all three Specs Writer agent files.

## Pre-Flight

Run before loading section templates. Verify both inputs exist and are non-empty: the Requirement Brief and the Technical Context (`CONTEXT-{KEY}.md`). If either is missing, abort and report which one; do not generate a Spec from partial input.

## Frontmatter Sources

Fill the SPEC frontmatter from these sources only; never invent a value:

| Field | Source |
| ----- | ------ |
| `issueKey`, `issueType` | Requirement Brief frontmatter |
| `priority` | Requirement Brief (Jira priority); `Not set` if absent |
| `complexity` | Invocation input `complexityLevel` (from CONTEXT frontmatter): `minimal` → `Low`, `standard` → `Medium`, `comprehensive` → `High` (use `Very High` only when the CONTEXT explicitly says so) |
| `workflowId` | Invocation input `workflowId` |

`qualityScore`, `qualityBucket` and `failedImportantGates` are **not** written by the writer — the Specs Workflow Orchestrator adds them after review.

## Assumption Mapping

Read the `assumptions` frontmatter from CONTEXT (schema: `skills/specs-ambiguity-detection/SKILL.md`) and map each **non-blocking** assumption into the SPEC's Open Questions / Assumptions section (Story: § Risks & Open Questions). Blocking assumptions never reach the writer; the orchestrator's Ambiguity Gate resolves them first.

## Revision input (regeneration after an `iterate` verdict)

Shape: `revisionInput: { failedGates: [{ gate, issue }], recommendations: [string] }`, taken from the Spec Reviewer's report.

When the invocation prompt contains `revisionInput`, the Spec already exists. Regenerate it in full (never patch selectively) from the same BRIEF and CONTEXT, and treat every failed gate and recommendation in `revisionInput` as a requirement of this pass. Do not weaken or drop content that passed review. Keep `workflowId` unchanged. If a listed gate cannot be satisfied from the available BRIEF/CONTEXT (e.g. missing data upstream), say so in the Spec's Risks & Open Questions section instead of fabricating content.

## Create & Validate File

1. **Create**: use `create_file` (first pass) or overwrite the existing file in full with `edit/editFiles` (regeneration). Filename and location are fixed by the type: `docs/specs/{JIRA_KEY}/SPEC-{JIRA_KEY}[-Epic|-Spike].md` (routing matrix: `skills/specs-workflow-routing/SKILL.md`). Include `workflowId` in the frontmatter (Story-family templates carry it; Epic/Spike specs add `workflowId: {workflowId}` as the first frontmatter line).
2. **Validate**: the file exists at the expected path, is larger than 0 bytes, and its filename matches the type's pattern. On failure STOP, report the path and cause, and do NOT proceed to the Spec Reviewer. On success output a validation summary with filename and size.

## Policies

- **Jira**: writers do not interact with Jira at all (`skills/jira-readonly-policy/SKILL.md`). Ticket tables in a Spec are suggestions; creating issues requires explicit human action.
- **User interaction**: none — Spec generation is automated; never ask for confirmation.
- **Errors**: missing required inputs → abort and report. Validation failure → return the missing sections and remediation steps. File creation failure → STOP with path and cause.
