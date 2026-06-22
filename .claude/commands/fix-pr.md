---
description: >
  Analyze and fix Bitbucket PR feedback. Fetches PR metadata, diff, reviewer comments,
  and CI failures via eTools MCP, then applies fixes in priority order
  (Critical → High → Medium → Low).
argument-hint: <PR_ID> [--dry-run] [--skip-tests] [--auto-commit] [--priority=<level>] [-y]
arguments: [pr_id]
allowed-tools: >
  mcp__etools__bitbucket_get-pull-request mcp__etools__bitbucket_get-pr-diff
  mcp__etools__bitbucket_get-commits mcp__etools__bitbucket_get-pr-activities
  mcp__etools__bitbucket_get-file-content mcp__etools__bitbucket_browse-files
  Bash(git diff *) Bash(git stash *) Bash(git add *) Bash(git commit *) Bash(git push *)
  Bash(git status) Bash(git log *) Bash(find . *) Bash(grep *)
  Read Edit Write
effort: high
disable-model-invocation: true
---

# Fix PR

Analyze Bitbucket pull request feedback and automatically apply fixes to address reviewer comments and CI failures.

**You MUST use the etools MCP Bitbucket tools to fetch PR data. Do NOT fabricate PR information.**

## Flags

| Flag | Description |
| ------ | ------------- |
| `--dry-run` | Analyze and report issues without applying fixes. Re-run without flag to apply. |
| `--skip-tests` | Skip running tests after applying fixes |
| `--auto-commit` | Commit changes locally after all fixes pass. Does NOT push. |
| `--priority=<level>` | `critical` (3.1 only), `high` (3.1–3.2), `medium` (3.1–3.3), `low`/default (all) |
| `-y`, `--yes` | Skip confirmation prompts |

## Step 1 — Fetch PR Details

Call these eTools MCP tools in parallel:

1. `mcp__etools__bitbucket_get-pull-request` — project: `{YOUR_BITBUCKET_PROJECT}`, repo: `{YOUR_BITBUCKET_REPO}`, prId: `$pr_id`
2. `mcp__etools__bitbucket_get-pr-diff` — same project/repo, prId: `$pr_id`
3. `mcp__etools__bitbucket_get-pr-activities` — same project/repo, prId: `$pr_id`
4. `mcp__etools__bitbucket_get-commits` — same project/repo, prId: `$pr_id`

## Step 2 — Analyze Feedback

Classify and prioritize issues:

- 🔴 **Critical**: Build failures, test failures, security vulnerabilities
- 🟠 **High**: Architectural violations, forbidden imports, memory leaks
- 🟡 **Medium**: Code style, complexity issues, missing tests
- 🟢 **Low**: Nitpicks, suggestions, documentation

## Step 3 — Apply Fixes

Execute in priority order per `--priority` flag (default: all).

### 3.1 Critical Fixes

**Build Errors**: Run `{{BUILD_COMMAND}}`, fix compilation failures, verify with `{{DEPENDENCY_GRAPH_COMMAND}}`.

**Test Failures**: Run `{{TEST_COMMAND}}`, fix failing assertions.

**Security Issues**:

- Replace `bypassSecurityTrust*` — use the framework's sanitization APIs
- Remove hardcoded secrets; move to environment config
- Sanitize user input through safe template binding

For correct security patterns, read `.github/skills/security-practices/SKILL.md` if present.

### 3.2 High Priority Fixes

**Dependency Boundary Violations**:

- Identify forbidden imports; refactor to respect layering rules in `{{CODEBASE_MODULE_TAXONOMY}}`

**Codebase Pattern Violations**:

- Apply tech-stack patterns; read tech-layer `{stack}-patterns/SKILL.md` for specifics

### 3.3 Medium Priority Fixes

**Code Style & Formatting**: Run lint --fix and format commands from the tech layer.

**Missing immutability modifiers**: Add `readonly` to all class fields assigned only in the constructor.

**Reduce nesting ≤ 4 levels**: Use early returns to flatten deeply nested conditionals.

### 3.4 Low Priority Fixes

- JSDoc for public APIs
- README updates
- Improved error messages
- Accessibility attributes

## Step 4 — Verify Changes

Run build, test, lint, and format via the tech-layer commands:

- `{{BUILD_COMMAND}}`
- `{{TEST_COMMAND}}`
- Lint and format (refer to tech-layer skill)

## Step 5 — Report Summary

```markdown
## PR #$pr_id Fix Summary

**Status**: ✅ Fixed | ⚠️ Partially Fixed | ❌ Failed

### Issues Addressed
#### 🔴 Critical (X/Y resolved)
#### 🟠 High (X/Y resolved)
#### 🟡 Medium (X/Y resolved)
#### 🟢 Low (X/Y resolved)

### Changes Applied
**Modified Files**: N
**Verification**: Build ✅/❌ | Tests ✅/❌ | Lint ✅/❌

### Remaining Issues
[Any items requiring manual review]

### Next Steps
git add .
git commit -m "fix(pr-$pr_id): <description>"
# Push manually: git push origin <source-branch>
```

## Error Handling

- **PR not found**: report `PR #$pr_id not found` and stop.
- **Merge conflicts**: list conflicting files and stop — resolve manually first.
- **Build failure after fixes**: `git stash`, report the failure, stop.
