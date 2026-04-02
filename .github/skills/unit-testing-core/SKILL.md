---
name: unit-testing-core
description: Technology-agnostic core guidance for unit test generation across stacks.
---

# Unit Testing Core

This skill defines reusable, technology-agnostic behavior for unit test generation.
It is designed to be extended by stack-specific plugin skills.

## Testing Philosophy

- Tests are documentation of expected behavior.
- Tests should be readable, maintainable, deterministic, and fast.
- Tests should validate business logic and decision paths, not just satisfy coverage.
- Tests should include happy path, error path, and edge-case behavior.

## Generic Conventions

- Keep a clear arrange-act-assert flow.
- Use test names in the `should ... when ...` form where feasible.
- Keep tests isolated with no shared mutable state across test cases.
- Inherit local folder style before introducing any new structure.

## Style Inheritance

Resolve style baseline in this order:

1. Nearest sibling test file in same folder
2. Same feature/library test files
3. Same domain/app test files
4. Shared testing utilities and repository-level test patterns

If no baseline exists, continue with a minimal, explicit test structure and mark confidence as low.

## Change Discovery

1. Resolve base branch (`develop` by default)
2. Resolve fork point (`git merge-base HEAD <base-branch>`)
3. Build change set (`git diff --name-status <fork-point>...HEAD`)
4. Filter non-production files (tests, snapshots, generated outputs, docs-only changes)
5. Map changed sources to expected test file targets based on active extension conventions

## Consumer Tracing

For each changed source, trace importers/references and include consumer test files in scope.
The active extension skill defines stack-specific tracing patterns.

## Verification Gate

- Run tests for changed and affected projects/components based on active extension rules.
- Use targeted runs over workspace-wide runs when possible.
- Enforce coverage thresholds declared by the active extension skill.
- If coverage fails, add targeted tests for uncovered branches and rerun until passing.
- Never report success while coverage is failing.

## Required Tools Convention

Each extension skill must include a `## Required Tools` section.

- If extra MCP tools are required, list them explicitly.
- If none are required, state: `None - standard terminal commands only`.

The unit test generator agent resolves the active extension skill, reads this section, and activates stack-specific tools before running discovery and verification.

## Error Handling

- If fork-point resolution fails, stop and request a valid base branch.
- If no extension plugin matches, proceed with core guidance and report low confidence.
- If command execution fails, report failing command, target project, and first actionable error.
- Never fabricate execution or coverage results.
