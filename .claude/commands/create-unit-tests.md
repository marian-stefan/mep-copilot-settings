---
description: >
  Generate or update unit tests for added, updated, or deleted functionality from
  current branch changes. Inherits project test conventions, traces consumers,
  and validates 100% coverage before reporting.
argument-hint: [base-branch]
arguments: [base_branch]
allowed-tools: >
  Read Edit Write
  Bash(find . *) Bash(grep *) Bash(git diff *) Bash(git log *) Bash(node *)
effort: medium
disable-model-invocation: true
---

# Create Unit Tests

Generate unit tests for newly added, updated, or deleted functionality using the Test Generator agent.

## Context

- Base branch: $base_branch (default: `develop` when empty)
- Branch: !`git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "detached"`

## Instructions

Read `.github/agents/test-generator.agent.md` in full and execute its workflow exactly
as written. Pass `$base_branch` as the base branch input; the agent defaults to
`develop` when empty.

Run any test validation commands in the foreground terminal (not background), so output
is visible during execution.
