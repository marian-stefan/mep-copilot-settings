# Tech Layers

Each subdirectory here is a technology-specific overlay for the harness. When `/init-ai-workflows` runs, it installs the matching layer from here into `.github/`.

## Available Tech Layers

| Layer | Stack | Status |
|-------|-------|--------|
| `dotnet/` | .NET 8+ / C# 12 / ASP.NET Core | ✅ Ready |

## Creating a New Tech Layer

**Automated (recommended)**: run `/generate-tech-layer <stack>` — it researches the stack online, adversarially verifies claims, presents a human review gate, then writes all required files into `template/tech-layers/<slug>/`. The `/init-ai-workflows` prompt also triggers this automatically when no matching layer is found for the detected stack.

**Manual**: see `template/ADAPTER-GUIDE.md` for the full contract — mandatory files, required placeholder resolutions, and a validation checklist. Manual creation is needed only when adapting the harness for an unsupported stack without web research access.

## How Agent Shadowing Works

Tech-layer agents shadow base agents **by name**. When the orchestrators call `agentName: "Tech Researcher (Story)"`, the AI coding tool prefers the tech-layer variant (e.g., `dotnet/agents/tech-researcher-story.agent.md`) over the base variant.

After `/init-ai-workflows` installs a tech layer, the tech-layer `agents/`, `skills/`, and `instructions/` files are merged directly into `.github/`. They take precedence over base files because they are more specific.

## Naming Conventions

Tech layer directories use lowercase stack identifiers:

- `dotnet` — .NET / C# / ASP.NET Core
- `angular` — Angular / TypeScript
- `react-nextjs` — React / Next.js / TypeScript
- `java-spring` — Java / Spring Boot
- `python-fastapi` — Python / FastAPI
