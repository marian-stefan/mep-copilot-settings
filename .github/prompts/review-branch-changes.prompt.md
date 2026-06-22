---
agent: 'Code Reviewer'
tools: ['read', 'search', 'agent', 'execute']
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

## Codebase Impact
- Run the dependency graph command for your tech layer (see `{{DEPENDENCY_GRAPH_COMMAND}}` in `tech-layers/{stack}/agents/tech-researcher-story.agent.md`) to identify affected projects.

## Review Focus Areas
- Breaking changes or API shifts across libs/apps
- Dependency graph impacts (cross-domain imports)
- Security-sensitive updates (auth flows, data access)
- Missing unit/e2e coverage for risky paths

## Wrap-Up
- Summarize findings and unresolved questions
- List required follow-up tasks or tests before merge
