---
agent: 'Code Reviewer'
tools: ['read', 'edit', 'search', 'agent', 'etools/bitbucket_get-pull-request', 'etools/bitbucket_get-pr-diff', 'etools/bitbucket_get-commits', 'etools/bitbucket_get-pr-activities', 'etools/bitbucket_get-file-content', 'etools/bitbucket_browse-files', 'etools/bitbucket_list-pull-requests', 'execute']
description: 'Analyze and fix pull request feedback based on PR ID from Bitbucket'
argument-hint: '<PR_ID> [--dry-run] [--skip-tests] [--auto-commit] [--priority=<level>] [-y]'
---

# Fix PR

Analyze Bitbucket pull request feedback and automatically apply fixes to address reviewer comments and CI failures.

**You MUST use the etools MCP Bitbucket tools to fetch PR data. Do NOT skip this step or fabricate PR information.**

**DO NOT USE Bitbucket API directly or any other method to obtain PR details. All information must come from the specified etools MCP tools.**

## Command Usage

```
/fix pr <PR_ID> [flags]
```

**Examples**:

```
# Standard usage - analyze and fix PR issues
/fix pr 4821

# Dry run - analyze issues without applying fixes
/fix pr 4821 --dry-run

# Skip running tests after applying fixes
/fix pr 4821 --skip-tests

# Auto-commit fixes after resolution
/fix pr 4821 --auto-commit

# Only fix critical and high priority issues
/fix pr 4821 --priority=high
```

## Bitbucket Configuration

> **Adopter note**: Replace these values with your project's Bitbucket coordinates. See `ADAPTER-GUIDE.md`.

- **Project**: `{YOUR_BITBUCKET_PROJECT}`
- **Repository**: `{YOUR_BITBUCKET_REPO}`

## Workflow Overview

The fix process follows this sequence:

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Fetch PR   │───▶│   Analyze   │───▶│    Apply    │───▶│   Verify    │───▶│   Report    │
│   Details   │    │  Feedback   │    │    Fixes    │    │   Changes   │    │   Summary   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                  │                  │                  │                  │
       ▼                  ▼                  ▼                  ▼                  ▼
  PR metadata       Review comments     Code edits        Run tests          Fix summary
  Diff analysis     CI failures         Lint/format       Run lint           Next steps
  Branch info       Build errors        Security fixes    Verify build       Commit msg
```

## Step-by-Step Process

### 1. Fetch PR Details

Call the following etools MCP tools in sequence to gather all PR data. Do NOT ask the user to supply this information manually.

1. **PR metadata and description**:
   `etools/bitbucket_get-pull-request` — project: `{YOUR_BITBUCKET_PROJECT}`, repo: `{YOUR_BITBUCKET_REPO}`, prId: `<PR_ID>`
   → Capture: title, description, status, source branch, target branch

2. **Changed files and diff**:
   `etools/bitbucket_get-pr-diff` — project: `{YOUR_BITBUCKET_PROJECT}`, repo: `{YOUR_BITBUCKET_REPO}`, prId: `<PR_ID>`
   → Capture: list of modified files and their diffs

3. **Review comments and inline feedback**:
   `etools/bitbucket_get-pr-activities` — project: `{YOUR_BITBUCKET_PROJECT}`, repo: `{YOUR_BITBUCKET_REPO}`, prId: `<PR_ID>`
   → Capture: all reviewer comments, inline annotations, approval status

4. **Commit history**:
   `etools/bitbucket_get-commits` — project: `{YOUR_BITBUCKET_PROJECT}`, repo: `{YOUR_BITBUCKET_REPO}`, prId: `<PR_ID>`
   → Capture: commit messages and authors


### 2. Analyze Feedback

Classify and prioritize issues:

**Priority Levels**:
- 🔴 **Critical**: Build failures, test failures, security vulnerabilities
- 🟠 **High**: Architectural violations, forbidden imports, memory leaks
- 🟡 **Medium**: Code style, complexity issues, missing tests
- 🟢 **Low**: Nitpicks, suggestions, documentation improvements

**Issue Categories**:
- **Build Errors**: Compilation failures, missing dependencies
- **Test Failures**: Failing unit/e2e tests
- **Lint Issues**: linting and formatting violations
- **Security**: XSS risks, unsafe operations, exposed secrets
- **Architecture**: dependency boundary violations, improper layering
- **Codebase Patterns**: Deprecated syntax, old control flow, missing tech-stack patterns
- **Performance**: unoptimized rendering, resource leaks, memory leaks
- **Code Quality**: High complexity, deep nesting (>4 levels), missing immutability annotations
- **Testing**: Missing unit tests, inadequate coverage

### 3. Apply Fixes

Execute fixes in priority order. When `--priority=<level>` is set, run only sections at or above the specified level: `critical` runs 3.1 only; `high` runs 3.1–3.2; `medium` runs 3.1–3.3; `low` (default) runs all sections.

#### 3.1 Critical Fixes (Automated)

**Build Errors**:
```bash
# Check for compilation/build errors using {{BUILD_COMMAND}}
# Fix missing dependencies using {{INSTALL_COMMAND}}
# Verify workspace dependency graph using {{DEPENDENCY_GRAPH_COMMAND}}
```

**Test Failures**:
```bash
# Run failed tests using {{TEST_COMMAND}}
# Review test output and fix assertions
# Update snapshots/expected outputs if needed
```

**Security Issues**:
- Replace unsafe output/rendering APIs with safe alternatives
- Sanitize user inputs using the framework's sanitization APIs
- Remove exposed secrets/tokens and move them to environment variables
- Add CSP headers if missing

```
// ❌ Deprecated pattern: bypassing framework sanitization
// element.unsafeRender(userInput)

// ✅ Modern pattern: use the framework's sanitization APIs
// element.safeRender(framework.sanitize(userInput))

// ❌ Deprecated pattern: hardcoded secret
// const API_KEY = 'sk-abc123'

// ✅ Modern pattern: use environment variable
// const API_KEY = env.API_KEY  // injected via build-time environment config
```

#### 3.2 High Priority Fixes

**Dependency Boundary Violations**:
- Identify forbidden imports using the tech-layer's dependency graph tooling
- Refactor to respect layering rules defined in `{{CODEBASE_MODULE_TAXONOMY}}`
- Move shared logic to appropriate shared modules/libraries

**Codebase Pattern Violations**:
```
// ❌ Deprecated pattern
// (refer to tech-layer patterns skill for stack-specific examples)

// ✅ Modern tech-stack patterns
// (refer to tech-layer patterns skill for stack-specific examples)
```

#### 3.3 Medium Priority Fixes

**Code Style & Formatting**:
```bash
# Auto-fix linting issues using the tech-layer lint command
# Format all changed files using {{BUILD_COMMAND}} format tooling
```

**Missing Immutability Annotations**:
```
// ❌ Before: mutable field / dependency reference
//   service = container.resolve(SomeService)

// ✅ After: immutable/readonly field / dependency reference
//   readonly service = container.resolve(SomeService)
// (exact syntax depends on the tech stack)
```

**Reduce Nesting (≤4 levels)**:
```
// ❌ Before: Deep nesting
function process() {
  if (condition1) {
    if (condition2) {
      if (condition3) {
        if (condition4) {
          if (condition5) { // Level 5 - too deep
            // logic
          }
        }
      }
    }
  }
}

// ✅ After: Early returns
function process() {
  if (!condition1) return;
  if (!condition2) return;
  if (!condition3) return;
  if (!condition4) return;
  if (!condition5) return;
  // logic
}
```

#### 3.4 Low Priority Fixes (Optional)

- Add JSDoc comments for public APIs
- Update README files
- Improve error messages
- Add accessibility attributes

### 4. Verify Changes

Run comprehensive checks using the tech-layer tooling:

```bash
# Build affected modules: {{BUILD_COMMAND}}
# Run affected tests:     {{TEST_COMMAND}}
# Lint and format:        (refer to tech-layer lint/format commands)
# Verify dependency graph: {{DEPENDENCY_GRAPH_COMMAND}}
```

### 5. Report Summary

Generate a comprehensive fix report:

```markdown
## PR #<PR_ID> Fix Summary

**Status**: ✅ Fixed | ⚠️ Partially Fixed | ❌ Failed

### Issues Addressed

#### 🔴 Critical (X/Y resolved)
- [x] Build failure in `libs/example/feature` - Fixed missing import
- [x] Test failure in `{ExampleUnit}.spec` - Updated mock data
- [ ] Security: Exposed API key in config - **MANUAL REVIEW REQUIRED**

#### 🟠 High Priority (X/Y resolved)
- [x] Nx boundary violation: `feature` importing from sibling `feature`
- [x] Missing tech-stack pattern compliance in 3 modules

#### 🟡 Medium Priority (X/Y resolved)
- [x] ESLint errors: 12 issues fixed
- [x] Missing `readonly` on 8 class fields

#### 🟢 Low Priority (X/Y resolved)
- [x] Code formatting applied
- [ ] Missing JSDoc comments - Skipped (low priority)

### Changes Applied

**Modified Files**: 14
- `{path/to/modified/file}`
- `{path/to/modified/file}`
- ...

**Tests Updated**: 3
- `{module}.spec`
- `{service}.spec`

**Verification Results**:
- ✅ Build: Passing
- ✅ Tests: 127 passed
- ✅ Lint: No errors
- ✅ Format: Applied

### Remaining Issues

1. **Manual Review Required**: 
   - Security: Line 42 in `{file}` contains potential secret
   - Architecture: Consider extracting shared logic to a shared module

2. **Follow-up Tasks**:
   - Add e2e tests for new user flow
   - Update documentation for API changes

### Next Steps

# Review changes
git diff origin/develop...HEAD

# Commit fixes using the template below (skipped when --auto-commit is used)
git add .
git commit -m "fix(pr-<PR_ID>): <Short description>

<Detailed description of changes>

- Fixed issues: <list key issues>
- Updated tests: <list test changes>
- Applied formatting and linting

Addresses feedback from PR #<PR_ID>
Reviewers: @<reviewer-names>"

# Push to feature branch
git push origin <source-branch>
```
## Flags & Options

| Flag | Description |
|------|-------------|
| `--dry-run` | Analyze and report issues without applying any fixes. Output uses the same Step 5 report template with all items marked pending. Re-run without this flag to apply fixes. |
| `--skip-tests` | Skip running tests after applying fixes |
| `--auto-commit` | Commit changes locally after all fixes pass verification. Does **not** push — push remains manual. |
| `--priority=<level>` | Only fix issues at or above the specified level: `critical` (3.1 only), `high` (3.1–3.2), `medium` (3.1–3.3), `low` / default (all). |
| `-y`, `--yes` | Skip any confirmation prompts (e.g. before applying security-related changes or bulk rewrites) |

## Review Focus Areas

The fix process addresses issues identified by the Code Reviewer agent:

1. **Architecture**: module layering, domain boundaries, forbidden imports
2. **Codebase Patterns**: current idioms, modern control flow, state management
3. **Resource Lifecycle**: `{{SUBSCRIPTION_LIFECYCLE_PATTERN}}`, async hygiene
4. **Performance**: rendering optimisation, deferred loading, resource cleanup
5. **Security**: injection prevention, safe output APIs, secret handling
6. **Immutability**: readonly/const fields, immutable state patterns
7. **Complexity**: function nesting (≤4 levels), cyclomatic complexity
8. **Testing**: unit test coverage, missing test cases, test quality

## Error Handling

**PR Not Found**:
```markdown
❌ Error: PR #<PR_ID> not found in Bitbucket
Please verify the PR ID and ensure you have access to the repository.
Project: {YOUR_BITBUCKET_PROJECT} | Repository: {YOUR_BITBUCKET_REPO}
```

**Merge Conflicts**:
```markdown
⚠️ Warning: Merge conflicts detected
Please resolve conflicts manually before applying automated fixes.

Files with conflicts:
- {path/to/conflicted/file}
- {path/to/conflicted/file}
```

**Build Failures After Fixes**:
```markdown
❌ Error: Build failed after applying fixes
Reverting changes...

# Stash changes to restore a clean working tree
git stash

# Or discard all unstaged changes
git checkout -- .

Check the error output above and address manually, or run with --dry-run to preview changes.
```

## Integration with Other Agents

- Delegates to **Code Reviewer** for comprehensive code review
- Uses **Git Operator** for branch and commit operations
- Consults the codebase directly for complex refactoring decisions
- Consults **Nx MCP Server** for workspace structure and dependencies

