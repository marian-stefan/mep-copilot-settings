# Tech Layers

A tech layer is a technology-specific overlay for the harness: the skills `skills/{slug}-*` and rules `rules/{slug}-*.instructions.md` shipped in the plugin. This folder holds one notes page per layer (`{slug}.md`). `/mep:init-ai-workflows` records the matching layer as active; nothing is copied.

## Available Tech Layers

| Layer | Stack | Status |
| ------- | ------- | -------- |
| `dotnet` ([notes](dotnet.md)) | .NET 8+ / C# 12 / ASP.NET Core | ✅ Ready |

## Creating a New Tech Layer

Run `/mep:generate-tech-layer <stack>` (recommended), or build one by hand. What a layer contains and how base agents load it: the repository `README.md` § How the Tech Layer Works. The full contract, mandatory files and validation checklist: `template/ADAPTER-GUIDE.md`.

## Naming Conventions

Tech layer slugs are lowercase stack identifiers and the prefix of every layer file:

- `dotnet` — .NET / C# / ASP.NET Core
- `angular` — Angular / TypeScript
- `react-nextjs` — React / Next.js / TypeScript
- `java-spring` — Java / Spring Boot
- `python-fastapi` — Python / FastAPI
