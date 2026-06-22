---
description: >
  Implement the solution defined in a validated Spec document. Runs the full
  PREFLIGHT → IMPLEMENT → REVIEW → COMMIT pipeline with 100% test coverage
  requirement and spec accuracy signal at commit.
argument-hint: [JIRA_KEY]
arguments: [key]
allowed-tools: >
  Read Edit Write
  Bash(find . *) Bash(grep *) Bash(git rev-parse *) Bash(git diff *) Bash(git log *)
  Bash(git status) Bash(git add *) Bash(git commit *) Bash(git push *) Bash(git branch *)
effort: high
disable-model-invocation: true
---

# Start Implementation

Implement the solution defined in a validated Spec document using the Implementation Workflow Orchestrator.

## Context

- Jira key: $key
- Branch: !`git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "detached"`
- Workspace lessons: read `.github/lessons.md` before starting (if present)

## Instructions

Read `.github/agents/implementation-workflow-orchestrator.agent.md` in full and execute
its workflow exactly as written.

When `$key` is provided, the orchestrator resolves the spec path as
`docs/specs/$key/SPEC-$key*.md` — no manual attachment needed.

If `$key` is empty and no spec is attached to this conversation, ask the user:
"Please provide a Jira key (e.g. HON-123) or attach the spec file directly."
