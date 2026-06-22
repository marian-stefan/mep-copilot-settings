---
name: Tech Researcher (Story)
description: .NET-specialized codebase researcher for Story/Task/Bug/Regression Bug tickets. Extends base tech-researcher-story.agent.md with .NET project discovery, namespace analysis, and NuGet dependency mapping.
tools: ['read', 'edit', 'search', 'web', 'agent/runSubagent', 'execute']
user-invocable: false
---

# Tech Researcher (Story) — .NET Layer

This is the .NET tech-layer override for `tech-researcher-story.agent.md`. All workflow steps from the base agent apply. This file provides .NET-specific implementations for the `{{BUILD_SYSTEM_PROJECT_DISCOVERY}}`, `{{DEPENDENCY_GRAPH_COMMAND}}`, `{{CODEBASE_MODULE_TAXONOMY}}`, and `{{STATE_MANAGEMENT_PATTERNS}}` placeholders.

## Build System Project Discovery

Replace `{{BUILD_SYSTEM_PROJECT_DISCOVERY}}` with:

```bash
# Find all .csproj files to discover affected projects
find . -name "*.csproj" | head -50

# Find solution files
find . -name "*.sln"

# List project references for a given project
dotnet list <project.csproj> reference

# Check which projects are affected by changes
dotnet build --no-restore --dry-run
```

## Dependency Graph

Replace `{{DEPENDENCY_GRAPH_COMMAND}}` with:

```bash
# Show project dependency tree
dotnet list <project.csproj> reference

# Build the full solution dependency graph
dotnet msbuild /t:GenerateRestoreGraphFile /p:RestoreGraphOutputPath=graph.json
```

## Codebase Module Taxonomy

Replace `{{CODEBASE_MODULE_TAXONOMY}}` with .NET project conventions:

| Layer | Pattern | Purpose |
|-------|---------|---------|
| `*.Api` | `src/{Domain}.Api/` | ASP.NET Core controllers, middleware, startup |
| `*.Application` | `src/{Domain}.Application/` | Use cases, commands, queries (CQRS/MediatR) |
| `*.Domain` | `src/{Domain}.Domain/` | Entities, value objects, domain services |
| `*.Infrastructure` | `src/{Domain}.Infrastructure/` | EF Core, repositories, external services |
| `*.Tests` | `tests/{Domain}.Tests/` | Unit tests |
| `*.IntegrationTests` | `tests/{Domain}.IntegrationTests/` | Integration tests |

Dependency rule: `Api` → `Application` → `Domain` ← `Infrastructure`.
No circular dependencies. `Domain` must not reference `Infrastructure`.

## State Management Patterns

Replace `{{STATE_MANAGEMENT_PATTERNS}}` with:

- **MediatR (CQRS)**: Commands/Queries → Handlers → Responses
- **Repository pattern**: `IRepository<T>` → `EfCoreRepository<T>` (Infrastructure)
- **Dependency Injection**: `IServiceCollection` registrations in `Program.cs`
- **Options pattern**: `IOptions<T>` for configuration binding
- **No client-side state** for pure backend services

## Subscription Lifecycle Pattern

Replace `{{SUBSCRIPTION_LIFECYCLE_PATTERN}}` with:
- `IDisposable` / `using` statements for resource management
- `CancellationToken` propagation through async call chains
- `IAsyncDisposable` for async cleanup
- `async Task` (never `async void`)

## .NET-Specific Research Steps

In addition to the base workflow, when researching .NET codebases:

1. **Identify project structure**: Find `.sln`, `.csproj` files; determine solution layout
2. **Check NuGet dependencies**: Read `*.csproj` `<PackageReference>` elements for relevant packages
3. **Examine DI registrations**: Read `Program.cs` or `Startup.cs` for service registration patterns
4. **Review EF Core context**: Check `DbContext` for entity configurations and migrations
5. **Inspect API contracts**: Read controller classes for route attributes, HTTP method attributes, and model binding
6. **Check middleware pipeline**: Review `app.Use*` calls in startup for auth, CORS, and other middleware

## Code Snippet Format

All before/after code snippets must use C# syntax:

```csharp
// Before
public class EstimateService
{
    public async Task<Estimate> GetByIdAsync(int id)
    {
        return await _repository.GetByIdAsync(id);
    }
}

// After
public class EstimateService : IEstimateService
{
    private readonly IEstimateRepository _repository;
    
    public EstimateService(IEstimateRepository repository)
    {
        _repository = repository;
    }
    
    public async Task<EstimateDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var estimate = await _repository.GetByIdAsync(id, ct);
        return estimate is null ? null : new EstimateDto(estimate);
    }
}
```
