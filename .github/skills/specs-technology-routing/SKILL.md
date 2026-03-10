---
name: specs-technology-routing
description: Canonical technology detection and review-skill routing for the Specs workflow.
---

# Specs Technology Routing

Use this skill as the single source of truth for selecting technology plugins.

## Inputs

- `repo.config.json` (if present)
- Repository file patterns

## Resolution Output

- `pluginId`
- `reviewSkill`
- `specExtensionSkill`
- `researchFocus`

## Plugin Registry

```text
plugins = [
  {
    pluginId: generic,
    priority: 0,
    reviewSkill: null,
    specExtensionSkill: null,
    matchRules: fallback,
  },
  {
    pluginId: angular,
    priority: 100,
    reviewSkill: .github/skills/review-angular/SKILL.md,
    specExtensionSkill: .github/skills/specs-generation-angular/SKILL.md,
    matchRules: {
      config.repoType: [angular, nx, frontend],
      config.language: [TypeScript],
      files.any: [angular.json, nx.json, project.json, **/*.component.ts],
    },
  },
  {
    pluginId: dotnet,
    priority: 90,
    reviewSkill: .github/skills/review-dotnet/SKILL.md,
    specExtensionSkill: .github/skills/specs-generation-dotnet/SKILL.md,
    matchRules: {
      config.repoType: [dotnet, backend],
      config.language: [C#, F#],
      files.any: [**/*.csproj, **/*.sln, Program.cs, **/*.fsproj],
    },
    researchFocus: [
      API contracts and versioning strategy,
      dependency injection and service lifetime impacts,
      data access and migration impacts,
    ],
  },
]
```

## Plugin Structure

```yaml
pluginId: string
priority: number
reviewSkill: string | null
specExtensionSkill: string | null
matchRules:
  config:
    repoType: string[]
    language: string[]
  files:
    any: string[]
researchFocus:
  - string
validationExtensions:
  - id: string
    description: string
    severity: warning | error
```

## Adding a Plugin

1. Create an extension skill file at `.github/skills/specs-generation-{pluginId}/SKILL.md`.
2. Create a review skill file at `.github/skills/review-{pluginId}/SKILL.md` when stack-specific review checks are needed.
3. Add a registry entry with `pluginId`, `priority`, `reviewSkill`, `specExtensionSkill`, and `matchRules`.
4. Prefer explicit matching via `config/repo.config.json` (`repoType` and `language`).
5. Add file heuristics as fallback when config is missing.
6. Keep `generic` as the fallback plugin.

## Resolution Algorithm

```text
resolvePlugin(repo):
  configMatches = matchByConfig(repo.config)
  if configMatches is not empty:
    return highestPriority(configMatches)

  fileMatches = matchByFiles(repo.files)
  if fileMatches is not empty:
    return highestPriority(fileMatches)

  return plugin(generic)
```

## Usage Notes

- Orchestrator resolves plugin once, then passes resolved values to subagents.
- Specs Writer uses core templates and may apply plugin extension guidance.
- Validation always uses `Generic Reviewer`, optionally enriched by `reviewSkill` from resolution output.
