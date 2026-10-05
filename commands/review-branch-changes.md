---
agent: 'Code Reviewer'
tools: ['read', 'search', 'agent', 'execute']
description: 'Review current branch changes versus the default branch (develop unless stated)'
---

# Branch Review Checklist

> **Stack tokens**: `{{TOKEN}}` names in this file are symbolic — resolve them at runtime from the installed `{stack}-stack-profile` skill (registry: `skills/stack-profile/SKILL.md`). Never substitute them into files.

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

- Run `{{DEPENDENCY_GRAPH_COMMAND}}` (from the stack profile) to identify affected projects and their consumers.

## Review

Run the Code Reviewer workflow (`agents/code-reviewer.agent.md`, `human-full` output) over `git diff origin/develop...HEAD`, with `baselineRef: origin/develop`. Do not pass `rubberDuck: auto` — a direct branch review always runs the Rubber Duck. Findings use the Code Reviewer's severity vocabulary.

## Wrap-Up

- Summarize findings and unresolved questions
- List required follow-up tasks or tests before merge
