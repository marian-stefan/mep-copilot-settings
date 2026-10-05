---
name: specs-workflow-routing
description: Canonical routing, filename mapping, and artifact naming for Specs workflow.
---

# Specs Workflow Routing and Artifacts

Use this skill as the single source of truth for issue-type routing and naming in the Specs workflow.

## Routing Matrix

Each issue type routes to a dedicated, focused agent pair. The orchestrator reads this matrix during the ROUTE step to populate `routing.techResearcherAgent` and `routing.specsWriterAgent` in workflow state.

| Issue Type | Tech Researcher | Specs Writer | Spec Filename |
|------------|-----------------|--------------|---------------|
| `Epic` | `Tech Researcher (Epic)` | `Specs Writer (Epic)` | `SPEC-{KEY}-Epic.md` |
| `Spike` | `Tech Researcher (Spike)` | `Specs Writer (Spike)` | `SPEC-{KEY}-Spike.md` |
| `Story` | `Tech Researcher (Story)` | `Specs Writer (Story)` | `SPEC-{KEY}.md` |
| `Task` | `Tech Researcher (Story)` | `Specs Writer (Story)` | `SPEC-{KEY}.md` |
| `Bug` | `Tech Researcher (Story)` | `Specs Writer (Story)` | `SPEC-{KEY}.md` |
| `Regression Bug` | `Tech Researcher (Story)` | `Specs Writer (Story)` | `SPEC-{KEY}.md` |

## Artifact Naming

| Artifact | Filename Pattern | Location | Producer |
|----------|------------------|----------|----------|
| Requirement Brief | `BRIEF-{JIRA_KEY}.md` | `docs/specs/{JIRA_KEY}/` | `Jira Analyst` |
| Technical Context | `CONTEXT-{JIRA_KEY}.md` | `docs/specs/{JIRA_KEY}/` | `Tech Researcher` |
| Spec | `SPEC-{JIRA_KEY}.md` (Story/Task/Bug) or `SPEC-{JIRA_KEY}-{Epic\|Spike}.md` | `docs/specs/{JIRA_KEY}/` | `Specs Writer` |

## Policy

- All three artifacts (BRIEF, CONTEXT, SPEC) are created in `docs/specs/{JIRA_KEY}/`. The directory is created automatically by the `create_file` tool.
- Orchestrator, writer, prompts, and helper docs should reference this skill instead of duplicating mapping tables.
- If mappings change, update this skill first.
