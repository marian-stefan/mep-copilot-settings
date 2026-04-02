---
agent: 'Generic Reviewer'
tools: ['read', 'edit', 'search', 'agent', 'bitbucket/*']
description: 'Analyze and fix pull request feedback based on PR ID from Bitbucket'
argument-hint: '<PR_ID> [--dry-run] [--skip-tests]'
---

# Fix PR

Analyze Bitbucket pull request feedback and automatically apply fixes to address reviewer comments and CI failures.

## Command Usage

```
/fix pr <PR_ID> [flags]
```

**Examples**:

```bash
# Standard usage - analyze and fix PR issues
/fix pr 4821

# Dry run - analyze issues without applying fixes
/fix pr 4821 --dry-run

# Skip running tests after applying fixes
/fix pr 4821 --skip-tests

# Auto-commit fixes after resolution
/fix pr 4821 --auto-commit
```

## Repository Platform Configuration

- **Project**: `{replace_with_project_key}` (e.g., `MP`)
- **Repository**: `{replace_with_repository_name}` (e.g., `mepworkspace`)
- **Base URL**: `https://bitbucket.trimble.tools/trimbleprojectmep/{replace_with_project_key}/{replace_with_repository_name}`

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
  Diff analysis     CI failures         Lint/format       Check lint         Next steps
  Branch info       Build errors        Security fixes    Verify build       Commit msg
```

## Step-by-Step Process

### 1. Fetch PR Details

Request PR information from the user or via manual Bitbucket access:
- PR title, description, and status
- Source and target branches
- Review comments and inline feedback
- CI/CD pipeline results and errors
- Build/test failures
- Changed files in the PR

**User Prompt**:
```
Please provide the PR details for PR #<PR_ID>:
1. Link to the PR: https://bitbucket.trimble.tools/trimbleprojectmep/{replace_with_project_key}/{replace_with_repository_name}/pull-requests/<PR_ID>
2. Review comments (if any)
3. CI/CD failures (if any)
4. Any specific feedback to address

Or simply share the PR URL and I'll guide you through gathering the needed information.
```

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
- **Lint Issues**: Linting and formatting violations
- **Security**: XSS risks, unsafe operations, exposed secrets
- **Architecture**: Boundary violations, improper layering, circular dependencies
- **Framework Patterns**: Deprecated framework patterns, outdated syntax, anti-patterns
- **Performance**: Unoptimized rendering, redundant work, memory leaks
- **Code Quality**: High complexity, deep nesting (>4 levels), missing immutability safeguards
- **Testing**: Missing unit tests, inadequate coverage

### 3. Apply Fixes

Execute fixes in priority order:

#### 3.1 Critical Fixes (Automated)

**Build Errors**:
```bash
# Check for compilation errors
<build_command> --verbose

# Fix missing dependencies
<package_manager_install_command> <missing-package>

# Verify dependency graph and project configuration are valid
<dependency_graph_check_command>
```

**Test Failures**:
```bash
# Run failed tests
<test_command> --watch=false

# Review test output and fix assertions
# Update snapshots if needed
<test_command> --updateSnapshot
```

**Security Issues**:
- Remove exposed secrets/tokens immediately
- Replace unsafe trust/bypass APIs with safe alternatives
- Validate and sanitize all external input (query params, body, headers, file uploads)
- Enforce output encoding/escaping in templates and DOM rendering paths
- Apply least-privilege access for API keys, tokens, service accounts, and RBAC roles
- Avoid unsafe dynamic execution (`eval`, dynamic script injection, unsafe HTML rendering)
- Do not log secrets, credentials, PII, or full auth tokens; redact sensitive values in logs
- Pin and update vulnerable dependencies; remove deprecated or unmaintained packages

#### 3.2 High Priority Fixes

**Architecture Boundary Violations**:
- Identify forbidden cross-layer imports and coupling points
- Refactor to respect layering rules (presentation -> application -> domain -> infrastructure)
- Move shared logic to appropriately scoped shared modules/packages

**Framework Pattern Violations**:
```typescript
// ❌ Before: Mutable state and lifecycle-heavy imperative setup
class ExampleComponent {
  value = 0;

  init() {
    // Imperative setup spread across lifecycle hooks
    this.value = this.value + 1;
  }
}

// ✅ After: Explicit immutability and predictable initialization
class ExampleComponent {
  readonly value = 1;

  constructor() {
    // Keep initialization deterministic and side-effect aware
  }
}
```

**Control Flow Modernization**:
```typescript
// ❌ Before: Nested and hard-to-follow conditional/loop flow
if (items && items.length > 0) {
  for (const item of items) {
    render(item);
  }
}

// ✅ After: Clear guards and explicit iteration behavior
if (!items || items.length === 0) return;
for (const item of items) {
  render(item);
}
```

#### 3.3 Medium Priority Fixes

**Code Style & Formatting**:
```bash
# Auto-fix linting issues
<lint_command> --fix

# Format all changed files
<format_command>
```

**Missing readonly Modifiers**:
```typescript
// ❌ Before
class ExampleService {
  private client = createClient();
  private config = { timeoutMs: 3000 };
}

// ✅ After
class ExampleService {
  private readonly client = createClient();
  private readonly config = { timeoutMs: 3000 };
}
```

**Reduce Nesting (≤4 levels)**:
```typescript
// ❌ Before: Deep nesting
function process() {
  if (condition1) {
    if (condition2) {
      if (condition3) {
        if (condition4) {
          if (condition5) { // Level 5 - too deep!
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

Run comprehensive checks:

```bash
# Check for compilation/type errors
<build_command> --parallel

# Run affected tests
<affected_test_command> --base=<base_ref> --head=HEAD

# Lint affected projects
<affected_lint_command> --base=<base_ref> --head=HEAD --fix

# Format code
<format_command>

# Verify dependency graph integrity
<dependency_graph_check_command>
```

### 5. Report Summary

Generate a comprehensive fix report:

```markdown
## PR #<PR_ID> Fix Summary

**Status**: ✅ Fixed | ⚠️ Partially Fixed | ❌ Failed

### Issues Addressed

#### 🔴 Critical (X/Y resolved)
- [x] Build failure in `src/modules/orders` - Fixed missing import
- [x] Test failure in `tests/order-service.test.ts` - Updated mock data
- [ ] Security: Exposed API key in config - **MANUAL REVIEW REQUIRED**

#### 🟠 High Priority (X/Y resolved)
- [x] Architecture boundary violation: feature layer importing infrastructure internals
- [x] Replaced deprecated framework patterns in 3 modules

#### 🟡 Medium Priority (X/Y resolved)
- [x] Lint errors: 12 issues fixed
- [x] Missing `readonly` on 8 class fields

#### 🟢 Low Priority (X/Y resolved)
- [x] Code formatting applied
- [ ] Missing JSDoc comments - Skipped (low priority)

### Changes Applied

**Modified Files**: 14
- `src/modules/orders/order-handler.ts`
- `src/shared/services/order-service.ts`
- ...

**Tests Updated**: 3
- `tests/order-handler.test.ts`
- `tests/order-service.test.ts`

**Verification Results**:
- ✅ Build: Passing
- ✅ Tests: 127 passed
- ✅ Lint: No errors
- ✅ Format: Applied

### Remaining Issues

1. **Manual Review Required**: 
   - Security: Line 42 in `config.ts` contains potential secret
  - Architecture: Consider extracting shared logic to `src/shared/utils`

2. **Follow-up Tasks**:
   - Add e2e tests for new user flow
   - Update documentation for API changes

### Next Steps

```bash
# Review changes
git diff origin/develop...HEAD

# Commit fixes (if --auto-commit not used)
git add .
git commit -m "fix(pr-<PR_ID>): Address review feedback

- Fix build failures in affected projects
- Migrate deprecated framework patterns
- Add missing tests
- Apply code formatting

Resolves feedback from PR #<PR_ID>"

# Push to feature branch
git push origin <feature-branch>
```

### Commit Message Template

```
fix(pr-<PR_ID>): <Short description>

<Detailed description of changes>

- Fixed issues: <list key issues>
- Updated tests: <list test changes>
- Applied formatting and linting

Addresses feedback from PR #<PR_ID>
Reviewers: @<reviewer-names>
```
```

## Flags & Options

| Flag | Description |
|------|-------------|
| `--dry-run` | Analyze issues without applying fixes |
| `--skip-tests` | Skip running tests after applying fixes |
| `--auto-commit` | Automatically commit changes after successful fixes |
| `--priority=<level>` | Only fix issues at or above priority level (critical, high, medium, low) |
| `-y`, `--yes` | Skip confirmation prompts |

## Review Focus Areas

The fix process addresses issues identified by the assigned reviewer agent:

1. **Architecture**: Layering, domain boundaries, forbidden imports
2. **Framework Patterns**: Current framework conventions, modern control flow, stable APIs
3. **Reactivity**: Predictable state updates, proper subscription/resource cleanup
4. **Performance**: Rendering efficiency, query optimization, hot-path optimization
5. **Security**: XSS prevention, safe DOM operations, secret handling
6. **Immutability**: Readonly fields, const usage, immutable state
7. **Complexity**: Function nesting (≤4 levels), cyclomatic complexity
8. **Testing**: Unit test coverage, missing test cases, test quality

## Error Handling

**PR Not Found**:
```
❌ Error: PR #<PR_ID> not found in Bitbucket
Please verify the PR ID and ensure you have access to the repository.
Project: MP | Repository: mepworkspace
```

**Merge Conflicts**:
```
⚠️ Warning: Merge conflicts detected
Please resolve conflicts manually before applying automated fixes.

Files with conflicts:
- src/modules/orders/order-handler.ts
- src/shared/services/api-client.ts
```

**Build Failures After Fixes**:
```
❌ Error: Build failed after applying fixes
Reverting changes and generating diagnostic report...

Check the error output above and address manually, or run with --dry-run to preview changes.
```

## Integration with Other Agents

- Delegates to **Reviewer Agent** for comprehensive code review
- Uses **Git Operator** for branch and commit operations
- Leverages **Tech Researcher** for complex refactoring decisions
- Consults project structure tooling for workspace structure and dependencies

## Best Practices

1. **Always review changes** before committing (use `--dry-run` first)
2. **Run full test suite** before pushing fixes
3. **Update PR description** with fix summary
4. **Request re-review** from original reviewers
5. **Link related issues** in commit messages
6. **Document breaking changes** if any
7. **Verify dependency graph** remains valid after fixes

## Related Documentation

- [Reviewer Agent](../agents/generic-reviewer.agent.md)
- [Review Angular Skill](../skills/review-angular/SKILL.md)
- [Review .NET Skill](../skills/review-dotnet/SKILL.md)
- [Review PR Prompt](./review-pr.prompt.md)
- [Review Branch Changes Prompt](./review-branch-changes.prompt.md)
