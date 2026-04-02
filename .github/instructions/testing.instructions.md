---
applyTo: "**/*.spec.ts **/*."
---

> Technology-agnostic unit testing conventions for repository test files.
> For automated test generation with diff-discovery, load: `.github/agents/unit-test-generator.agent.md`.
> Stack-specific conventions are defined in extension skills selected by the agent.

## Testing Philosophy

- Tests are **documentation of expected behavior**.
- Tests should be **readable, maintainable, and deterministic**.
- Tests should be **fast** and **reliable**.
- Tests should provide **business value**, not just coverage metrics.
- Unit tests must validate **business logic**, **domain rules**, and **decision-making code**.
- Tests should cover **edge cases** and **error paths**, not just happy paths.

## Style Conventions

- Use project-local test style patterns already established in the target folder.
- Name tests using the `should ... when ...` pattern.
- Follow **Arrange–Act–Assert** (AAA) structure within each `it` block.
- Keep tests isolated — no shared mutable state between test cases.

## Skill Loading

Load these in order when generating or updating tests:

1. `.github/skills/unit-testing-core/SKILL.md`
2. Active extension skill for detected stack (for example Angular/Nx or .NET)
3. This instruction file as baseline guardrails

## Mock Strategy

| Scenario | Preferred approach |
|---|---|
| Service dependency | Use the mocking strategy defined by the active extension skill |
| State store | Use the store/test harness pattern defined by the active extension skill |
| HTTP calls | Use the HTTP test strategy defined by the active extension skill |
| Component/child dependencies | Use the component isolation strategy defined by the active extension skill |

## Coverage Requirement

Coverage thresholds are extension-specific and may vary by stack. Always enforce the threshold declared by the active extension skill and never leave uncovered branches or optional paths.

## Artifact-Specific Expectations

- Cover happy path, error path, and edge-case behavior for each changed or impacted artifact.
- Include optional parameter and `null`/`undefined` behavior where relevant.
- Prioritize business logic, domain constraints, and decision-path assertions.

## Architecture & Security Rules

- No cross-domain forbidden imports in test files.
- No hardcoded secrets, tokens, or bypass patterns.
- Keep test files co-located with source according to active extension conventions.
- Do not add new test dependencies without explicit approval.
