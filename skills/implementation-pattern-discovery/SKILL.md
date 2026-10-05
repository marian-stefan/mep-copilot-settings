---
name: implementation-pattern-discovery
description: Procedure for finding an existing implementation pattern in the workspace that solves a problem with the same shape as the current ticket, and the rule for when to ask the user to pick between more than one pattern.
---

# Implementation Pattern Discovery

Use this skill during Codebase Analysis. Apply it before you write the section that
describes the implementation approach (see § Blocked Section by Issue Type). The goal:
reuse a pattern that already works in the codebase, instead of writing a new approach
for a problem the codebase already solves. This is the research-time counterpart of
`skills/implementation-rules/SKILL.md`'s Reuse Before Add rule.

## Rule

Search the repository (and any other repos present in the workspace). Do not search
outside the workspace.

## Method

Use two passes.

### Pass 1 — Keyword Match

1. Take the operation words from the Requirement Brief (title, summary, acceptance
   criteria). Example words: "duplicate", "reorder", "bulk delete", "soft delete",
   "import", "export".
2. Search file names and symbol names for these words. Use the naming taxonomy from
   the active tech layer's `{stack}-patterns/SKILL.md` (e.g. `*Command.cs`/`*Handler.cs`
   for a CQRS .NET stack, `*.service.ts`/`*.component.ts` for a service-oriented
   frontend stack — the concrete taxonomy is stack-specific).
3. Keep only real name matches. Do not count a word that appears only in a comment
   or a string literal.

### Pass 2 — Confirm Match

1. Read each file found in Pass 1.
2. Confirm the file solves a problem with the same shape as the current ticket.
   Example: both copy an entity and assign it a new id.
3. Drop a match when the shape is different, even when the word matches.

## Output Rule

- **Zero confirmed matches**: write no pattern fields. Continue the normal research
  steps.
- **One confirmed match**: write it to the `patternReference` frontmatter field.
  Cite the file path. Use it as the base for the blocked section. Do not ask the
  user.
- **Two or more confirmed matches**: do not pick one. Write each match to the
  `patternCandidates` frontmatter field. Do not write the blocked section yet — write
  `pending pattern selection` in its place instead, and add the "Candidate
  Implementation Patterns" output section.

## Evidence Rule

Every entry in `patternReference` or `patternCandidates` must cite a real file path
from a file you read. Do not invent a pattern. Do not describe a pattern from
memory.

## Field Shapes

```yaml
patternReference:
  name: {short pattern name, e.g. "Duplicate Estimate"}
  path: {file path}
  reason: {one line — why this pattern fits the ticket}

patternCandidates:
  - name: {short pattern name}
    path: {file path}
    reason: {one line — why this pattern fits the ticket}
```

`patternReference` and `patternCandidates` are mutually exclusive. A CONTEXT file
carries one or the other, never both.

## "Candidate Implementation Patterns" Output Section

Add this section only when `patternCandidates` is present. Use a table:

```markdown
## Candidate Implementation Patterns

| Pattern Name | Source File | Reason |
|---|---|---|
| Duplicate Estimate | src/.../duplicate-estimate.handler.cs | Same copy-and-reassign-id shape as this ticket |
| Duplicate WBS Item | src/.../duplicate-wbs-item.service.ts | Same copy-and-reassign-id shape, different layer |
```

## Blocked Section by Issue Type

The section left as `pending pattern selection` when `patternCandidates` is present:

| Issue Type | Blocked Section |
|---|---|
| Story / Task / Bug / Regression Bug | Implementation Plan |
| Epic | Strategic Architecture Guidance |
| Spike | Minimal Prototype Guidance |

## Resolution

The Specs Workflow Orchestrator's Research Decisions gate (see
`agents/specs-workflow-orchestrator.agent.md` § Step 3b) reads
`patternCandidates` from the CONTEXT frontmatter and asks the user to choose, in the same pause as any blocking assumptions. It then
re-invokes the routed Tech Researcher agent once in Revision Mode (`tech-researcher-common` § Revision Mode) with the choice. The agent writes the blocked section
using the chosen pattern and clears `patternCandidates` in favour of a single
`patternReference`.
