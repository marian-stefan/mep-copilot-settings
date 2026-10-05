# .NET Tech Layer

Technology layer for .NET 8+ / C# 12 / ASP.NET Core. Provides stack-specific skills and auto-applied instructions that the base agents load at runtime.

## What's Here

```markdown
skills/
├── dotnet-stack-profile/SKILL.md          # Token values, module taxonomy, research steps, snippet format
├── dotnet-patterns/SKILL.md               # C# 12+ patterns and anti-patterns
├── dotnet-testing/SKILL.md                # xUnit/Moq/FluentAssertions conventions
├── dotnet-security-practices/SKILL.md     # ASP.NET Core security rules
├── dotnet-review-checklist/SKILL.md       # Architecture boundaries + review triage
└── dotnet-code-review-output/SKILL.md     # Review report template
rules/
├── dotnet-testing.instructions.md         # applyTo: **/*.cs
└── dotnet-security.instructions.md        # applyTo: **/*.cs, **/*.cshtml, **/*.razor
```

## Activation

Install the `mep` plugin, then run `/mep:init-ai-workflows` in your repository — it detects .NET via `*.csproj` files and records `dotnet` as the active tech layer in `.github/copilot-instructions.md`. Nothing is copied into your repository.

## Tech Stack Assumptions

| Concern | Technology |
| --------- | ----------- |
| Language | C# 12+ (.NET 8+) |
| Web framework | ASP.NET Core (Minimal APIs or MVC) |
| ORM | EF Core 8+ |
| CQRS | MediatR (optional) |
| Testing | xUnit + Moq + FluentAssertions + coverlet |
| DI | `Microsoft.Extensions.DependencyInjection` |

## Stack Tokens

Values for every `{{TOKEN}}` (build/test commands, module taxonomy, lessons path, …) live in `skills/dotnet-stack-profile/SKILL.md`. Base agents resolve them at runtime; nothing is substituted into files. The token registry is `skills/stack-profile/SKILL.md`.
