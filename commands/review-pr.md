---
agent: 'Code Reviewer'
tools: ['execute', 'read', 'agent', 'search', 'etools/bitbucket_get-pull-request', 'etools/bitbucket_get-pr-diff', 'etools/bitbucket_get-commits', 'etools/bitbucket_get-pr-activities', 'etools/bitbucket_get-file-content', 'etools/bitbucket_list-pull-requests']
description: 'Comprehensive review of a pull request from Bitbucket using PR ID'
argument-hint: '<PR_ID>'
---

# Review PR

> **Stack tokens**: `{{TOKEN}}` names in this file are symbolic — resolve them at runtime from the installed `{stack}-stack-profile` skill (registry: `skills/stack-profile/SKILL.md`). Never substitute them into files.

Review a Bitbucket pull request by ID. This prompt only fetches the PR and hands it to the **Code Reviewer**, which owns the review checklist, the Rubber Duck critique/regression check, the severity vocabulary and the report template (`agents/code-reviewer.agent.md`, tech-layer `{stack}-code-review-output` skill). Do not restate those here.

## Command Usage

```bash
/mep:review-pr <PR_ID>
```

Example: `/mep:review-pr 4821`

## Bitbucket Configuration

> **Adopter note**: the coordinates are never substituted into this file. Read them at runtime from `.github/copilot-instructions.md` § Project Identity (`Bitbucket project` / `repo`), written by `/mep:init-ai-workflows`. If the file or the values are missing or `not set`, ask the user for them and suggest running `/mep:init-ai-workflows`; do not guess.

- **Project**: the `Bitbucket project` value
- **Repository**: the `Bitbucket repo` value

All `etools/bitbucket_*` calls below use these two values plus `pullRequestId: <PR_ID>`.

## Workflow

### 1. Fetch the PR

**Context-first**: if the PR diff and metadata are already in the current context (e.g. the prompt was invoked from a chat that already contains the diff), skip the fetch and go to step 2.

Otherwise use the eTools MCP tools — never fabricate PR data and never call the Bitbucket API directly:

1. `etools/bitbucket_get-pull-request` — title, description, status, author, reviewers, source/target branches
2. `etools/bitbucket_get-pr-diff` — the full diff
3. `etools/bitbucket_get-commits` — commit messages and count
4. `etools/bitbucket_get-pr-activities` — reviewer comments and inline feedback (do not re-raise points reviewers already made)

If a call fails, report which one and stop; do not review from partial data without saying so.

### 2. Review

Run the Code Reviewer workflow over the fetched diff:

- `baselineRef` for the Rubber Duck regression check: the PR's **target branch**.
- `workSummary`: the PR title and description.
- Do **not** pass `rubberDuck: external` — a direct PR review always runs the Rubber Duck.
- Output mode: `human-full` (the tech layer's `{stack}-code-review-output` template).
- Module boundaries, state-management and lifecycle checks use `{{CODEBASE_MODULE_TAXONOMY}}`, `{{DEPENDENCY_GRAPH_COMMAND}}`, `{{STATE_MANAGEMENT_PATTERNS}}` and `{{SUBSCRIPTION_LIFECYCLE_PATTERN}}` via the stack profile.
- Coverage: judge changed lines/branches against the Coverage Contract (`skills/implementation-rules/SKILL.md` § 3.1).

### 3. PR hygiene (in addition to the code review)

Add a short "PR hygiene" note to the report:

- Title is descriptive; description explains the why, not only the what
- Commit messages follow conventional commits
- Breaking changes and documentation updates are called out
- Unresolved reviewer comments from step 1 that the diff does not address

Findings use the Code Reviewer's severity vocabulary (`agents/code-reviewer.agent.md` § Severity Vocabulary). Be constructive: phrase feedback as suggestions, cite established patterns, and separate blocking issues from nice-to-haves.
