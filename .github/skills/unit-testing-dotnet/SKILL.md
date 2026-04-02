---
name: unit-testing-dotnet
description: .NET plugin extension for unit test generation.
---

# Unit Testing .NET Plugin

This skill extends technology-agnostic guidance from `.github/skills/unit-testing-core/SKILL.md`.

## Required Tools

- None - standard terminal commands only

## Framework and Style

- Use xUnit (`[Fact]`, `[Theory]`, `[InlineData]`) for unit and integration tests.
- Prefer project-local assertion style (`Assert.*` or FluentAssertions) already present in the target project.
- Keep tests co-located in repository test project conventions.

## Mock Strategy

| Scenario | Preferred approach |
|---|---|
| Service dependency | NSubstitute or Moq |
| API integration | `WebApplicationFactory<Program>` + `HttpClient` |
| Persistence (unit) | In-memory DbContext |
| Persistence (integration) | In-memory DbContext or Testcontainers |
| Validation | Test `AbstractValidator<T>` branches and boundary rules |

## Project and File Structure

- Unit test project pattern: `tests/{Domain}.{Feature}.Tests/`
- Integration test project pattern: `tests/{Domain}.{Feature}.IntegrationTests/`
- Unit test file pattern: `{ServiceName}Tests.cs`
- Integration test file pattern: `{Resource}EndpointTests.cs`
- Typical project creation: `dotnet new xunit -n {Domain}.{Feature}.Tests -o tests/{Domain}.{Feature}.Tests`

## Artifact Expectations

### Services and Handlers

- Cover success and error paths.
- Include async cancellation behavior where applicable (`CancellationToken`).

### API Endpoints

- Use integration tests with `WebApplicationFactory<Program>`.
- Assert status code and response contract.

### Validators

- Cover valid input, invalid input, and boundary values.

### Persistence

- Verify EF Core state transitions and query outcomes.
- Include error/constraint behavior where relevant.

### Authorization

- Cover authorized and unauthorized branches.

## Consumer Tracing

- Trace changed namespace usage via `using` and type references.
- Trace dependent projects via `<ProjectReference>` to include consumer tests.

## Verification Rules

- Run tests with `dotnet test` (project-scoped where possible).
- Coverage threshold baseline: >80% for new code unless repository policy specifies stricter gates.
- Run dependency vulnerability audit: `dotnet list package --vulnerable` when required by repo policy.

## Review Handoff

- Use .NET-specific review checks via .NET Reviewer (or Generic Reviewer with .NET plugin rules enabled).
