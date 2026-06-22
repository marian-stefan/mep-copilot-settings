---
description: >
  Generate a Spec document from a Jira ticket using the multi-agent Specs Workflow
  Orchestrator. Routes automatically to the correct Tech Researcher and Specs Writer
  based on issue type (Story, Task, Bug, Regression Bug, Epic, Spike).
  Produces BRIEF, CONTEXT, and SPEC artifacts in docs/specs/{KEY}/.
argument-hint: <JIRA_KEY> [--review-context]
arguments: [key]
allowed-tools: >
  mcp__etools__jira_get-issue mcp__etools__jira_search-issues
  mcp__etools__jira_get-comments mcp__etools__jira_get-attachments
  Read Edit Write Bash(git rev-parse *) Bash(find . *) Bash(grep *)
effort: high
disable-model-invocation: true
---

# Create Specs

Generate a comprehensive Specification (Spec) document from a Jira ticket using the multi-agent Specs Workflow Orchestrator.

## Context

- Jira key: $key
- Branch: !`git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "detached"`
- Workspace lessons: read `.github/lessons.md` before starting (if present)

## Instructions

Read `.github/agents/specs-workflow-orchestrator.agent.md` in full and execute its
workflow exactly as written. The JIRA_KEY input is `$key`.

Pass any flags (e.g. `--review-context`) from `$ARGUMENTS` through to the orchestrator
as-is — it handles them natively via `options.reviewContext` in workflow state.
