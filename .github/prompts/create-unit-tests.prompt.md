---
agent: 'Unit Test Generator'
tools: ['agent', 'search/changes', 'search/codebase', 'search/textSearch', 'search/listDirectory', 'read/readFile', 'edit/createFile', 'edit/editFiles', 'execute']
description: 'Generate or update unit tests for added, updated, or deleted functionality from current branch changes using local project test conventions'
argument-hint: '[base-branch]'
---

# Create Unit Tests

Generate unit tests for newly added, updated, or deleted functionality.

## Command Usage

```bash
/create-unit-tests
/create-unit-tests main
/create-unit-tests release/2026.04
```

## Contract

1. Optional argument accepts a base branch; default is `develop` when omitted.
2. The command should generate/update/delete test files needed for current-branch source changes.
3. The command should verify tests for affected projects and report coverage status.
4. Validation test commands should run in the current active/shared terminal session (foreground), not a separate Copilot/background terminal.
5. The command should return the required summary format below.

## Behavior Ownership

- Detailed execution behavior (change discovery, style inheritance, consumer tracing, plugin resolution, validation, retries, and error handling) is defined in `.github/agents/unit-test-generator.agent.md`.
- Technology-specific testing behavior is defined in extension skills loaded by the agent.
- Keep this prompt focused on command UX and output contract.

## Output Format

Return this summary after execution:

1. Source files analyzed
2. Test files created/updated
3. Style source selected for each test file
4. Test commands executed and result
5. Coverage result (pass/fail) per project with threshold used
6. Assumptions, fallbacks, or unresolved gaps
