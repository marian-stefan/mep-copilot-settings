---
name: dotnet-stack-profile
description: .NET 8+ / C# 12 / ASP.NET Core values for every `{{TOKEN}}` in the stack-profile registry, plus .NET-specific research steps, and snippet format. Load whenever a harness file references a `{{TOKEN}}`, or when researching or scaffolding in a .NET repo.
---

# .NET Stack Profile

Registry and resolution rules: `skills/stack-profile/SKILL.md`. This file supplies the
.NET values. Tokens are resolved at runtime by reading this table — never text-substituted.

## Token values

| Token | .NET value |
| ----- | ---------- |
| `{{BUILD_SYSTEM_PROJECT_DISCOVERY}}` | `find . -name "*.sln" -not -path "*/obj/*"` and `find . -name "*.csproj" -not -path "*/obj/*" -not -path "*/bin/*"` (pipe to `head -200` on very large repos and say the list was truncated); affected projects: map each changed file to its nearest ancestor directory containing a `*.csproj` |
| `{{DEPENDENCY_GRAPH_COMMAND}}` | Dependencies: `dotnet list <project.csproj> reference`. Consumers (reverse lookup): `grep -rl --include="*.csproj" "<ProjectName>.csproj" .` |
| `{{CODEBASE_MODULE_TAXONOMY}}` | See [Module taxonomy](#module-taxonomy) |
| `{{STATE_MANAGEMENT_PATTERNS}}` | MediatR CQRS (Commands/Queries → Handlers → Responses); `IRepository<T>` → EF Core repository (Infrastructure); DI via `IServiceCollection` in `Program.cs`; Options pattern (`IOptions<T>`) for configuration; no client-side state for pure backend services |
| `{{SUBSCRIPTION_LIFECYCLE_PATTERN}}` | `IDisposable` / `using`; `IAsyncDisposable` for async cleanup; `CancellationToken` propagated through async chains; `IHostedService`/`BackgroundService` for long-running work; `async Task`, never `async void` |
| `{{TEST_COMMAND}}` | Full: `dotnet test --collect:"XPlat Code Coverage" --results-directory ./coverage`. Scoped: `dotnet test tests/<Project>.Tests/ --collect:"XPlat Code Coverage" --filter "FullyQualifiedName~<TypeOrMethod>"` |
| `{{TEST_FILE_GLOB}}` | `**/*Tests.cs` |
| `{{SCAFFOLD_COMMAND}}` | `dotnet new classlib -n <Name>` / `dotnet new webapi -n <Name>` / `dotnet new xunit -n <Name>.Tests` (add `-o <dir>` and `-f net8.0`) |
| `{{BUILD_COMMAND}}` | `dotnet build --no-restore -warnaserror` (solution scope; run `dotnet restore` first if packages changed). If the test command already compiled the same scope in this pass, a green `dotnet test` is build evidence |
| `{{AFFECTED_BUILD_COMMAND}}` | `dotnet build <changed-project.csproj> --no-restore` (repeat per affected project; dependents build transitively when they are in the same solution build) |
| `{{INSTALL_COMMAND}}` | `dotnet restore` |
| `{{RUN_COMMAND}}` | `dotnet run --project <project.csproj> --` |
| `{{MODULE_LESSONS_PATH}}` | `src/<Project>/.github/lessons.md` when more than 50% of impacted paths share one project directory; otherwise the workspace fallback `.github/lessons.md` (algorithm: `implementation-lessons-system`) |
| `{{SHARED_LIB_PATH_PREFIX}}` | Any of `src/Shared`, `src/Common`, `src/*.Shared`, `src/*.Common`, `src/*.Contracts`, `src/BuildingBlocks` |
| `{{SHARED_LIB_TAG}}` | n/a — .NET has no module-metadata tags; the path signal above is the only shared-library signal |
| `{{DOMAIN_TAG_PREFIX}}` | n/a — count distinct `<Domain>.` project-name prefixes (e.g. `Estimating.*` vs `Billing.*`) as the cross-domain signal |

## Module taxonomy

| Layer | Pattern | Purpose |
| ----- | ------- | ------- |
| `*.Api` | `src/{Domain}.Api/` | ASP.NET Core controllers/endpoints, middleware, startup |
| `*.Application` | `src/{Domain}.Application/` | Use cases, commands, queries (CQRS/MediatR) |
| `*.Domain` | `src/{Domain}.Domain/` | Entities, value objects, domain services |
| `*.Infrastructure` | `src/{Domain}.Infrastructure/` | EF Core, repositories, external services |
| `*.Tests` | `tests/{Domain}.Tests/` | Unit tests |
| `*.IntegrationTests` | `tests/{Domain}.IntegrationTests/` | Integration tests |

Dependency rule: `Api` → `Application` → `Domain` ← `Infrastructure`. No circular
dependencies; `Domain` must not reference `Infrastructure`; `Application` must not reference `Api`.

## Research steps (.NET)

Apply in addition to the base Tech Researcher workflow:

1. **Project structure**: locate `.sln` / `.csproj`; determine solution layout and target frameworks.
2. **NuGet dependencies**: read `<PackageReference>` elements of the affected projects only.
3. **DI registrations**: read `Program.cs` / `Startup.cs` for service registration patterns.
4. **EF Core**: check `DbContext` for entity configurations and migrations when persistence is touched.
5. **API contracts**: read controllers/endpoint maps for route and HTTP-method attributes and model binding.
6. **Middleware pipeline**: review `app.Use*` calls for auth, CORS, error handling.

## Code snippet format

Before/after snippets in CONTEXT documents use C# syntax with current idioms
(see `dotnet-patterns`): constructor injection, `CancellationToken ct = default` on async
methods, records for DTOs. Show only the changed members, not whole files.
