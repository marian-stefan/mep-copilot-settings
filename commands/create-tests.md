---
agent: 'Test Generator'
description: 'Generate or update unit tests for added, updated, or deleted functionality from current branch changes using local project test conventions'
argument-hint: '[base-branch]'
---

# Create Tests

> **Stack tokens**: `{{TOKEN}}` names in this file are symbolic — resolve them at runtime from the installed `{stack}-stack-profile` skill (registry: `skills/stack-profile/SKILL.md`). Never substitute them into files.

Generate unit tests for newly added, updated, or deleted functionality.

## Command Usage

```bash
/mep:create-tests
/mep:create-tests main
/mep:create-tests release/2026.04
```

## Contract

1. Optional argument accepts a base branch; default is `develop` when omitted.
2. The command should generate/update/delete test files (matching the project's `{{TEST_FILE_GLOB}}`) needed for current-branch source changes.
3. The command should verify tests for affected modules and report coverage status.
4. Validation test commands (`{{TEST_COMMAND}}`) should run in the current active/shared terminal session (foreground), not a separate Copilot/background terminal.
5. The command should return the required summary format below.

## Behavior Ownership

- Detailed execution behavior (style inheritance, validation, retries, error handling) is defined in `agents/test-generator.agent.md`; change discovery and consumer tracing in `skills/test-change-discovery/SKILL.md`.
- Keep this prompt focused on command UX and output contract.

## Output Format

Return this summary after execution:

1. Source files analyzed
2. Test files created/updated
3. Style source selected for each test file
4. Test commands executed (`{{TEST_COMMAND}}`) and result
5. Coverage result (pass/fail) per project — must meet the Coverage Contract (`skills/implementation-rules/SKILL.md` § 3.1: 100% of changed lines and branches, no repo-wide regression)
6. Assumptions, fallbacks, or unresolved gaps
