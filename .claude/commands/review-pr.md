---
description: >
  Comprehensive architectural, code quality, and security review of a Bitbucket
  pull request. Fetches PR data via eTools MCP then runs the Code Reviewer agent.
argument-hint: <PR_ID>
arguments: [pr_id]
allowed-tools: >
  mcp__etools__bitbucket_get-pull-request mcp__etools__bitbucket_get-pr-diff
  mcp__etools__bitbucket_get-commits mcp__etools__bitbucket_get-pr-activities
  Bash(git diff *) Bash(git log *) Bash(find . *) Bash(grep *)
  Read
effort: high
disable-model-invocation: true
---

# Review PR

Perform a comprehensive architectural, code quality, and security review of a Bitbucket PR.

## Step 1 — Fetch PR Data

Call these eTools MCP tools in parallel:

1. `mcp__etools__bitbucket_get-pull-request` — project: `{YOUR_BITBUCKET_PROJECT}`, repo: `{YOUR_BITBUCKET_REPO}`, prId: `$pr_id`
2. `mcp__etools__bitbucket_get-pr-diff` — same project/repo, prId: `$pr_id`
3. `mcp__etools__bitbucket_get-commits` — same project/repo, prId: `$pr_id`
4. `mcp__etools__bitbucket_get-pr-activities` — same project/repo, prId: `$pr_id`

If the PR diff is already present in the current context window, skip this step and proceed directly to Step 2.

## Step 2 — Run Code Review

Read `.github/agents/code-reviewer.agent.md` in full and execute its review workflow
against the fetched PR data.

Follow the output template defined in the tech-layer's `code-review-output/SKILL.md`
for the report format. If no tech-layer is configured, use the base structure from
the agent file.

## Error Handling

- **PR not found or MCP unavailable**: report `PR #$pr_id not found in {YOUR_BITBUCKET_PROJECT}/{YOUR_BITBUCKET_REPO}` and stop.
