---
agent: 'Generic Reviewer'
tools: ['read', 'search', 'bitbucket/*']
description: 'Comprehensive review of a pull request from Bitbucket using PR ID'
argument-hint: '<PR_ID>'
---

# Review PR

Perform a comprehensive architectural, code quality, and security review of a pull request using its Bitbucket PR ID.

This prompt is Bitbucket-specific orchestration.
Canonical review workflow, severity model, risk scoring, and output template are defined in [../agents/generic-reviewer.agent.md](../agents/generic-reviewer.agent.md).

## Command Usage

```
/review pr <PR_ID>
```

**Examples**:

```bash
# Review a pull request
/review pr 4821

# Review another PR
/review pr 5042
```

## Bitbucket Configuration

- **Project**: `{project_key}`
- **Repository**: `{repository_name}`
- **Base URL**: `https://bitbucket.trimble.tools/trimbleprojectmep/{project_key}/{repository_name}`

## Execution Steps

1. Fetch PR metadata, diff, comments, and pipeline status from Bitbucket.
2. Run the end-to-end review workflow defined in [../agents/generic-reviewer.agent.md](../agents/generic-reviewer.agent.md).
3. Apply the exact output template defined in [../agents/generic-reviewer.agent.md](../agents/generic-reviewer.agent.md).

## Bitbucket-Specific Checks

- Confirm PR URL and compare view resolve correctly:
      - `https://bitbucket.trimble.tools/trimbleprojectmep/{project_key}/{repository_name}/pull-requests/${PR_ID}`
      - `https://bitbucket.trimble.tools/trimbleprojectmep/{project_key}/{repository_name}/compare/commits/${TARGET_COMMIT}..${SOURCE_COMMIT}`
- Include unresolved comment threads and approval state in findings.
- Include pipeline/build status and failing steps in findings.
- Flag missing required approvals or failed policy checks as merge blockers.

## Consolidation Rules

- Do not duplicate review checklists, severity definitions, risk scoring, or report template in this prompt.
- Treat [../agents/generic-reviewer.agent.md](../agents/generic-reviewer.agent.md) as the single source of truth for review methodology.
