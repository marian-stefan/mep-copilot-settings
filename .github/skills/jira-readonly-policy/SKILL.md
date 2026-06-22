---
name: jira-readonly-policy
description: Canonical READ-ONLY Jira operations policy for all Specs workflow agents. Agents that do not interact with Jira at all reference this file to declare their non-interaction scope. The Jira Analyst is the only agent permitted to perform Jira read operations beyond what is listed here.
---

# Jira Read-Only Policy

All agents in the Specs workflow (Tech Researchers, Specs Writers, Spec Reviewer, Code Reviewer, Git Operator) are **READ-ONLY or NO-OP** for Jira. This file is the single source of truth for that policy.

## Standard Prohibited Operations (all Specs workflow agents)

- ❌ Do NOT post comments to Jira tickets
- ❌ Do NOT transition issue status
- ❌ Do NOT update Jira fields or custom fields
- ❌ Do NOT create new Jira issues (including child tickets or sub-tasks)
- ❌ Do NOT link issues
- ❌ Do NOT change assignee, priority, or labels
- ❌ Do NOT invoke any Jira MCP write operations

## Agents With No Jira Interaction

The following agents do not use any Jira tools — they operate on files only:
- Specs Writer (Story / Epic / Spike)
- Spec Reviewer
- Code Reviewer
- Git Operator

## Agents With Limited Jira Read Access

- **Tech Researcher (Story / Epic / Spike)**: May call `jira_get-issue` and `jira_search-issues` only for data enrichment. No write operations.
- **Jira Analyst**: May call `jira_get-issue`, `jira_search-issues`, and linked issue traversal. No write operations.
- **Specs Workflow Orchestrator**: Coordinates agent invocations. Does not call Jira tools directly.
