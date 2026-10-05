---
agent: 'agent'
tools: ['read', 'edit', 'search', 'agent', 'etools/bitbucket_get-pull-request', 'etools/bitbucket_get-pr-diff', 'etools/bitbucket_get-commits', 'etools/bitbucket_get-pr-activities', 'etools/bitbucket_get-file-content', 'etools/bitbucket_browse-files', 'etools/bitbucket_list-pull-requests', 'execute']
description: 'Analyze and fix pull request feedback based on PR ID from Bitbucket'
argument-hint: '<PR_ID> [--dry-run] [--skip-tests] [--auto-commit] [--priority=<level>] [-y]'
---

# Fix PR

> **Stack tokens**: `{{TOKEN}}` names in this file are symbolic — resolve them at runtime from the installed `{stack}-stack-profile` skill (registry: `skills/stack-profile/SKILL.md`). Never substitute them into files.

Analyze Bitbucket pull request feedback and apply fixes for reviewer comments, CI failures and review findings.

**All PR data MUST come from the etools MCP Bitbucket tools.** Never call the Bitbucket API directly, never fabricate PR information, and never ask the user to paste it.

## Command Usage

```bash
/mep:fix-pr <PR_ID> [--dry-run] [--skip-tests] [--auto-commit] [--priority=<level>] [-y]
```

| Flag | Description |
| ------ | ------------- |
| `--dry-run` | Analyze and report only; the Step 5 report is produced with all items marked pending |
| `--skip-tests` | Skip the test run in Step 4 |
| `--auto-commit` | Commit locally after verification passes (via Git Operator). Never pushes |
| `--priority=<level>` | Fix only issues at or above `critical`, `high`, `medium`, or `low` (default: all) |
| `-y`, `--yes` | Skip confirmation prompts (security-related changes, bulk rewrites) |

## Bitbucket Configuration

> **Adopter note**: the coordinates are never substituted into this file. Read them at runtime from `.github/copilot-instructions.md` § Project Identity (`Bitbucket project` / `repo`), written by `/mep:init-ai-workflows`. If the file or the values are missing or `not set`, ask the user for them and suggest running `/mep:init-ai-workflows`; do not guess.

- **Project**: the `Bitbucket project` value
- **Repository**: the `Bitbucket repo` value

All `etools/bitbucket_*` calls use these two values plus `pullRequestId: <PR_ID>`.

## Workflow

### 1. Fetch PR details

1. `etools/bitbucket_get-pull-request` — title, description, status, source and target branch
2. `etools/bitbucket_get-pr-diff` — modified files and diffs
3. `etools/bitbucket_get-pr-activities` — reviewer comments, inline annotations, approval status
4. `etools/bitbucket_get-commits` — commit messages and authors

If the PR is not found, report the project/repository and PR ID and stop. If the branch has merge conflicts, stop and ask the user to resolve them first.

### 2. Analyze feedback

Collect (a) unresolved reviewer comments and (b) findings from a **Code Reviewer** subagent pass over the diff (dispatch it with the PR ID and `rubberDuck: external`: as a subagent it can't call the Rubber Duck, and fixing doesn't need it. It is read-only and returns findings; this prompt applies the fixes), then classify each with the Code Reviewer's severity vocabulary (`agents/code-reviewer.agent.md` § Severity Vocabulary): **Critical** (build/test failures, security vulnerabilities), **High** (architecture/layering violations, resource leaks), **Medium** (style, complexity, missing tests), **Low** (nitpicks, docs). Drop anything already fixed on the branch.

### 3. Apply fixes (priority order, honoring `--priority`)

For each issue: read the cited code, make the smallest change that resolves it, and follow the stack's rules rather than generic ones — `{stack}-patterns`, `{stack}-security-practices` and `{stack}-*.instructions.md`.

- **Critical**: build errors (`{{BUILD_COMMAND}}`, dependencies via `{{INSTALL_COMMAND}}`); failing tests (`{{TEST_COMMAND}}`, scoped to the failing tests first); security issues (unsafe rendering/queries, unsanitized input, exposed secrets → configuration/secret store). Security changes ask for confirmation unless `-y`.
- **High**: boundary violations per `{{CODEBASE_MODULE_TAXONOMY}}` (verify with `{{DEPENDENCY_GRAPH_COMMAND}}`), lifecycle/resource leaks (`{{SUBSCRIPTION_LIFECYCLE_PATTERN}}`), pattern violations from the stack patterns skill.
- **Medium**: lint/format issues, nesting above 4 levels (early returns), missing immutability, missing tests (Test Companion Rule and Coverage Contract in `skills/implementation-rules/SKILL.md`).
- **Low**: docs, error messages, naming.

Never weaken a test, add a coverage exclusion, or disable a lint rule to make a check pass (`implementation-rules` § 3.3 No Silent Weakening). If a comment is ambiguous or you disagree, list it under "Needs human decision" instead of guessing.

### 4. Verify

Build the affected scope (`{{AFFECTED_BUILD_COMMAND}}`, falling back to `{{BUILD_COMMAND}}`), run affected tests (`{{TEST_COMMAND}}`, unless `--skip-tests`), and run the stack's lint/format tooling. If the build fails after your changes and you cannot fix it within the fix budget (`implementation-rules` § 3.3), stop, keep the working tree as is, and report — do not silently revert.

### 5. Report

```markdown
## PR #<PR_ID> Fix Summary
**Status**: ✅ Fixed | ⚠️ Partially fixed | ❌ Failed

| Severity | Resolved / Total | Notes |
|---|---|---|
| Critical | x/y | ... |
| High | x/y | ... |
| Medium | x/y | ... |
| Low | x/y | ... |

**Files modified**: {n} · **Tests updated**: {n}
**Verification**: build {✅/❌} · tests {passed/failed/skipped} · lint {✅/❌}

### Needs human decision
- {comment or finding that was not auto-fixed, with reason}

### Next steps
Review `git diff origin/<target-branch>...HEAD`, then commit (or it was committed by `--auto-commit`) and push manually to the source branch.
```

Suggested commit message: `fix(pr-<PR_ID>): <short description>` with a body listing the issues fixed and `Addresses feedback from PR #<PR_ID>`.

## Integration

Dispatches the **Code Reviewer** as a read-only subagent for finding classification, and the **Git Operator** for commits (with `--auto-commit`).
