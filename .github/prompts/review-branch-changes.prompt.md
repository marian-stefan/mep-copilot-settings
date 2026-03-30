---
agent: 'Generic Reviewer'
tools: ['vscode/runCommand', 'read', 'search', 'gitkraken/*', 'agent', 'bitbucket/*']
description: 'Guide for reviewing current branch changes versus develop'
---

# Branch Review Checklist

Use this prompt to review all differences between your current branch and the default `develop` branch.

## Preflight
- Ensure local refs are current: `git fetch origin develop:refs/remotes/origin/develop`
- Confirm working tree state: `git status --short --branch`

## High-Level Diff
- Summaries: `git diff --stat origin/develop...HEAD`
- Newly added files: `git diff --name-only --diff-filter=A origin/develop...HEAD`
- Deleted files: `git diff --name-only --diff-filter=D origin/develop...HEAD`

## Detailed Investigation
- Inspect staged + unstaged changes: `git diff origin/develop...HEAD`
- Include remote-only commits: `git diff origin/develop...@{u}`
- Focus on a file: `git diff origin/develop...HEAD -- <path/to/file>`
- Check commit history divergence: `git log --oneline origin/develop..HEAD`

## Project Impact (Optional)
- Identify impacted modules/components/packages based on changed paths
- If your workspace provides dependency tooling, generate an affected/dependency graph for validation

## Review Focus Areas
- Breaking changes or API shifts across libs/apps
- Dependency graph impacts (cross-domain imports)
- Security-sensitive updates (auth flows, data access)
- Performance-sensitive changes in critical paths
- Missing automated test coverage for risky paths

## Bitbucket Review Checks
- Verify all unresolved Bitbucket review comments are addressed or responded to
- Confirm Bitbucket pipeline/build status is green before merge
- Ensure required Bitbucket approvals are present per branch policy
- Validate PR description includes scope, risk, and test evidence

## Wrap-Up
- Summarize findings and unresolved questions
- List required follow-up tasks or tests before merge
