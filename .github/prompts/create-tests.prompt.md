---
agent: 'Test Generator'
tools: ['agent', 'search/changes', 'search/codebase', 'search/textSearch', 'search/listDirectory', 'read/readFile', 'edit/createFile', 'edit/editFiles', 'execute']
description: 'Generate or update unit tests for added, updated, or deleted functionality from current branch changes using local project test conventions'
argument-hint: '[base-branch]'
---

# Create Tests

Generate unit tests for newly added, updated, or deleted functionality.

## Command Usage

```bash
/create-tests
/create-tests main
/create-tests release/2026.04
```

## Contract

1. Optional argument accepts a base branch; default is `develop` when omitted.
2. The command should generate/update/delete test files (matching the project's `{{testFileGlob}}`) needed for current-branch source changes.
3. The command should verify tests for affected modules and report coverage status.
4. Validation test commands (`{{TEST_COMMAND}}`) should run in the current active/shared terminal session (foreground), not a separate Copilot/background terminal.
5. The command should return the required summary format below.

## Behavior Ownership

- Detailed execution behavior (change discovery, style inheritance, consumer tracing, validation, retries, and error handling) is defined in `.github/agents/test-generator.agent.md`.
- Keep this prompt focused on command UX and output contract.

## Output Format

Return this summary after execution:

1. Source files analyzed
2. Test files created/updated
3. Style source selected for each test file
4. Test commands executed (`{{TEST_COMMAND}}`) and result
5. Coverage result (pass/fail) per project — must meet 100% branches/functions/lines/statements
6. Assumptions, fallbacks, or unresolved gaps
