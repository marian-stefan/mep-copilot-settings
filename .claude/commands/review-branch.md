---
description: >
  Review all differences between the current branch and the default develop branch.
  Runs the Code Reviewer agent against the local git diff — no Bitbucket MCP needed.
allowed-tools: >
  Bash(git fetch *) Bash(git diff *) Bash(git log *) Bash(git status *)
  Bash(find . *) Bash(grep *)
  Read
effort: medium
disable-model-invocation: true
---

# Review Branch

Review all changes between the current branch and `develop`.

## Preflight

```bash
git fetch origin develop:refs/remotes/origin/develop
git status --short --branch
```

## Collect Diff

```bash
git diff --stat origin/develop...HEAD
git diff origin/develop...HEAD
git log --oneline origin/develop..HEAD
```

## Instructions

Read `.github/agents/code-reviewer.agent.md` in full and execute its review workflow
against the diff collected above. Treat the diff as the full review scope — no PR ID needed.

Follow the output template defined in the tech-layer's `code-review-output/SKILL.md`
for the report format.

## Error Handling

- **No diff vs develop**: report "No changes detected between current branch and origin/develop" and stop.
