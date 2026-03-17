---
name: specs-workflow-routing
description: Canonical routing, filename mapping, branch prefixes, and artifact naming for Specs workflow.
---

# Specs Workflow Routing and Artifacts

Use this skill as the single source of truth for issue-type routing and naming in the Specs workflow.

## Routing Matrix

Both `tech-researcher` and `specs-writer` are polymorphic and auto-adapt to issue type.

| Issue Type | Tech Researcher | Specs Writer | Spec Filename |
|------------|-----------------|--------------|---------------|
| `Epic` | `tech-researcher` | `specs-writer` | `SPEC-{KEY}-Epic.md` |
| `Spike` | `tech-researcher` | `specs-writer` | `SPEC-{KEY}-Spike.md` |
| `Story` | `tech-researcher` | `specs-writer` | `SPEC-{KEY}-Plan.md` |
| `Task` | `tech-researcher` | `specs-writer` | `SPEC-{KEY}-Plan.md` |
| `Bug` | `tech-researcher` | `specs-writer` | `SPEC-{KEY}-Plan.md` |

## Branch Prefix Mapping

| Issue Type | Branch Prefix |
|------------|---------------|
| `Epic` | `epic/{JIRA_KEY}` |
| `Spike` | `spike/{JIRA_KEY}` |
| `Bug` | `bugfix/{JIRA_KEY}` |
| Other (`Story`/`Task`) | `feature/{JIRA_KEY}` |

## Artifact Naming

| Artifact | Filename Pattern | Producer |
|----------|------------------|----------|
| Requirement Brief | `BRIEF-{JIRA_KEY}.md` | `jira-analyst` |
| Technical Context | `CONTEXT-{JIRA_KEY}.md` | `tech-researcher` |
| Spec | `SPEC-{JIRA_KEY}-{Plan|Epic|Spike}.md` | `specs-writer` |

## Policy

- Files are created in repository root unless a workflow variant explicitly overrides this.
- Orchestrator, writer, prompts, and helper docs should reference this skill instead of duplicating mapping tables.
- If mappings change, update this skill first.
