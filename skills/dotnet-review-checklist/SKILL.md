---
name: dotnet-review-checklist
description: .NET / ASP.NET Core / EF Core review checklist for the Code Reviewer — architecture boundaries and a compact pointer list into dotnet-patterns, dotnet-security-practices and dotnet-testing. Load when reviewing C# changes (local branch, PR, or implementation REVIEW step).
---

# .NET Review Checklist

Used by the Code Reviewer with the base workflow in `agents/code-reviewer.agent.md`.
Report format: `skills/dotnet-code-review-output/SKILL.md`. This checklist owns only the
**architecture boundaries** and the review-time triage; the detailed rules and code examples
live in the skills named below — do not restate them in findings, cite them.

## Architecture (owned here)

- No `Domain` → `Infrastructure` reference; no `Application` → `Api` reference; no circular
  project dependencies (layer map: `dotnet-stack-profile` § Module taxonomy).
- Repositories are injected as `IRepository<T>` interfaces, never concrete classes.
- No `DbContext` usage outside `Infrastructure`.
- Controllers/endpoints are thin: delegate to application services or MediatR handlers.

## Triage pointers (rules live elsewhere)

| Concern | Check against |
| ------- | ------------- |
| C# 12+ idioms, nullable reference types, records, `async Task` (never `async void`), `CancellationToken` propagation, `IDisposable`, LINQ/EF Core (`AsNoTracking`, N+1, no `ToList()` in loops, no interpolated raw SQL), `[ApiController]`, problem details, minimal CORS | `skills/dotnet-patterns/SKILL.md` |
| Secrets, input validation, `[Authorize]` coverage, anti-forgery on state-changing form actions, secrets in logs | `skills/dotnet-security-practices/SKILL.md` |
| xUnit `[Fact]`/`[Theory]`, mocking interfaces only, FluentAssertions, Arrange-Act-Assert, coverage on changed lines/branches | `skills/dotnet-testing/SKILL.md` and the coverage rule in `skills/implementation-rules/SKILL.md` §3.1 |
| HTTP endpoint shape | `skills/trimble-api-standard-compliance/SKILL.md` |

Severity mapping and the Rubber Duck step are defined by the base Code Reviewer — this
checklist adds no severity rules of its own.
