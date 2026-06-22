# .NET Tech Layer

Technology layer for .NET 8+ / C# 12 / ASP.NET Core. Provides stack-specific agent overrides, skills, and auto-applied instructions that shadow the base harness files by name.

## What's Here

```
dotnet/
├── agents/
│   ├── tech-researcher-story.agent.md     # .NET project/namespace discovery
│   ├── code-reviewer.agent.md             # C# 12+, ASP.NET Core, EF Core review
│   ├── test-generator.agent.md            # xUnit + Moq + FluentAssertions
│   └── backend-service-discovery.agent.md # ASP.NET Core DI + appsettings scanning
├── skills/
│   ├── dotnet-patterns/SKILL.md           # C# 12+ patterns and anti-patterns
│   ├── dotnet-testing/SKILL.md            # xUnit/Moq/FluentAssertions conventions
│   ├── security-practices/SKILL.md        # ASP.NET Core security rules
│   └── code-review-output/SKILL.md        # Review report template
└── instructions/
    ├── testing.instructions.md            # applyTo: **/*Tests.cs
    └── security.instructions.md           # applyTo: **/*.cs, **/*.cshtml
```

## Installation

**Recommended**: run `/init-ai-workflows` in your repository — it detects .NET via `*.csproj` files and installs this tech layer automatically into `.github/`.

**Manual fallback**:
1. Copy `mep-copilot-settings/.github/` into your repo's `.github/`.
2. Merge `template/tech-layers/dotnet/agents/` → `.github/agents/`
3. Merge `template/tech-layers/dotnet/skills/` → `.github/skills/`
4. Merge `template/tech-layers/dotnet/instructions/` → `.github/instructions/`

After installation, tech-layer files live directly under `.github/` alongside base harness files. There is no `.github/tech-layers/` subdirectory at runtime — the merge is flat.

## Tech Stack Assumptions

| Concern | Technology |
|---------|-----------|
| Language | C# 12+ (.NET 8+) |
| Web framework | ASP.NET Core (Minimal APIs or MVC) |
| ORM | EF Core 8+ |
| CQRS | MediatR (optional) |
| Testing | xUnit + Moq + FluentAssertions + coverlet |
| DI | `Microsoft.Extensions.DependencyInjection` |

## Resolved Placeholder Tokens

| Token | .NET value |
|-------|-----------|
| `{{BUILD_SYSTEM_PROJECT_DISCOVERY}}` | `find . -name "*.csproj" ! -path "*/obj/*"` |
| `{{DEPENDENCY_GRAPH_COMMAND}}` | `dotnet list <project> reference` |
| `{{CODEBASE_MODULE_TAXONOMY}}` | `*.Api` / `*.Application` / `*.Domain` / `*.Infrastructure` |
| `{{STATE_MANAGEMENT_PATTERNS}}` | MediatR CQRS, `IOptions<T>`, `IServiceCollection` DI |
| `{{SUBSCRIPTION_LIFECYCLE_PATTERN}}` | `IDisposable`, `CancellationToken`, `IHostedService` |
| `{{TEST_COMMAND}}` | `dotnet test --collect:"XPlat Code Coverage" --results-directory ./coverage` |
| `{{SCAFFOLD_COMMAND}}` | `dotnet new classlib -n <Name>` / `dotnet new webapi -n <Name>` |
