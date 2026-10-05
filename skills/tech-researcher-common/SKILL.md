---
name: tech-researcher-common
description: Shared procedural boilerplate for Tech Researcher (Story), Tech Researcher (Epic), and Tech Researcher (Spike) — file creation constraints, Jira read-only policy, Revision Mode (both the E-gate and Pattern Selection Gate triggers), and Validation.
---

# Tech Researcher — Shared Procedures

This skill centralizes the procedural sections that are identical (or near-identical) across all three Tech Researcher agent files. Each agent file references this skill and supplies only its own type-specific parameters (which "Allowed" Jira reads it has, and any extra Revision Mode steps its own Core Workflow requires).

## File Creation Constraints

**This agent is permitted to create exactly one file per workflow run:**

| Permitted path | Description |
|---|---|
| `docs/specs/{JIRA_KEY}/CONTEXT-{JIRA_KEY}.md` | Technical Context — this agent's sole output |

**Prohibited**:
- ❌ Do NOT create any other files under `docs/specs/{JIRA_KEY}/` (no NOTES, DRAFT, RESEARCH, or PLAN files).
- ❌ Do NOT create, modify, or delete any files outside `docs/specs/`.
- ❌ Do NOT write intermediate or scratch files anywhere in the repository.

## Jira Write Operations Policy

**CRITICAL**: This agent MUST NOT post Jira comments, update Jira fields, or perform any Jira write operations. See `skills/jira-readonly-policy/SKILL.md` for the full prohibition list.

The calling agent file lists its own "Allowed" reads (these differ by issue type — e.g. Epic reads child-issue data via `jira_get-issue`/`jira_search-issues`; Story and Spike receive all ticket context via the Requirement Brief and have no direct Jira tool access).

## Research Skeleton (Step 2)

Every researcher runs Step 2 in this order; its agent file adds only the type-specific parts.

- **2a Stage 1 complexity** (BRIEF-only signals, `skills/specs-complexity-assessment/SKILL.md`): if the invocation carries `complexityLevel` (computed once by the orchestrator at the G gate), reuse it; otherwise classify now, using the type's default from that skill.
- **2b Scope narrowing** (before any broad search): use `{{BUILD_SYSTEM_PROJECT_DISCOVERY}}` and the module taxonomy (`{{CODEBASE_MODULE_TAXONOMY}}`) to find the minimal affected set, then restrict every later search and read to it. Upstream docs: when the ticket has a parent Epic (or *is* the Epic), load `docs/specs/{EPIC_KEY}/high-level-design.md` § Major components and responsibilities and note the constraints in `docs/specs/{EPIC_KEY}/impact-map.md`, when they exist.
- **2c Stage 2 escalation** (module manifest reads only): apply the Stage 2 signals from the complexity skill. It can only escalate, never de-escalate. This sets the final `complexityLevel`; research depth follows it (minimal → targeted, standard → normal, comprehensive → full cross-service).
- **Assumption Registry** (before 2d, `skills/specs-ambiguity-detection/SKILL.md`): enumerate the type's number of top assumptions, add ticket ambiguities found during analysis, and write the final `assumptions` block and final `complexityLevel` to the CONTEXT frontmatter.
- **2d Codebase analysis**: scoped to the 2b set.

## Revision Mode (`--review-context` localised feedback, or Research Decisions)

Two triggers invoke this mode:

- The orchestrator's Step 3a Research Summary Gate (E): `{ sections: string[], feedback: string, preserveContext: true }`.
- The orchestrator's Step 3b Research Decisions gate (C + Pattern Selection), combined shape: `{ sections: string[], assumptionResolutions?: [{ id, resolution }], chosenPattern?: {name, path, reason} | { custom: true, note: string }, feedback?: string, preserveContext: true }`. When `chosenPattern` is present, `sections` includes the blocked section named in `skills/implementation-pattern-discovery/SKILL.md` § Blocked Section by Issue Type (Implementation Plan / Strategic Architecture Guidance / Minimal Prototype Guidance).

Run in Revision Mode:

1. Read the existing `CONTEXT-{KEY}.md`.
2. Apply the feedback, assumption resolutions and chosen pattern only to the specified `sections`. Do NOT re-run steps that are unrelated to them.
3. Re-check the `assumptions` frontmatter: apply every `assumptionResolutions` entry (`blocking: false` plus the resolution), and remove or update any other assumption the revision resolves.
4. When `chosenPattern` is present: write the blocked section using it, and replace `patternCandidates` with a single `patternReference` (or, on `custom: true`, drop both fields and note the custom approach in the section body).
5. Overwrite `docs/specs/{JIRA_KEY}/CONTEXT-{JIRA_KEY}.md` with the updated content.
6. Apply § Validation to the revised content and replace its Quality Validation Summary with the current result, including failures. Finish this CONTEXT write before reporting completion; do not leave the previous summary attached to changed content.
7. Append an audit log entry noting the revision and which sections were updated (per `skills/audit-log-policy/SKILL.md`).

Do NOT produce a new CONTEXT file at a different path — always overwrite the existing file in Revision Mode.

Do not write workflow state, `contextVersion`, `contextMutation`, or research checkpoints. The orchestrator finalizes those after your last CONTEXT write per `specs-workflow-state-machine` § Context Mutation Checkpoint. Return the revised artifact and validation outcome even on failure; do not claim a resolved decision gate yourself.

## Validation

Before returning Technical Context, apply the validation gates defined in `skills/specs-validation/SKILL.md` and include the validation summary block.
