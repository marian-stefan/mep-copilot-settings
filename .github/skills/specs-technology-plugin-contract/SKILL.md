---
name: specs-technology-plugin-contract
description: Contract for technology plugins that extend reviewer selection and spec detail in the Specs workflow.
---

# Specs Technology Plugin Contract

Use this skill as the canonical contract for technology-specific plugins.
A plugin can tailor reviewer behavior and spec depth while the core workflow remains technology-agnostic.

## Plugin Shape

Each technology plugin skill should provide this metadata block:

```yaml
pluginId: string
priority: number
reviewerAgent: string
specExtensionSkill: string
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

## Required Fields

- `pluginId`: unique plugin identifier (`generic`, `angular`, `dotnet`, `cpp`)
- `priority`: higher wins if multiple plugins match
- `reviewerAgent`: reviewer agent display name to invoke in validation step
- `specExtensionSkill`: path to the skill with extra section guidance
- `matchRules`: detection rules based on config and file heuristics

## Optional Fields

- `researchFocus`: technology-specific exploration hints for Tech Researcher
- `validationExtensions`: additional, plugin-level validation checks

## Matching Policy

1. Prefer explicit config (`config/repo.config.json`) when available.
2. Fall back to repository file heuristics.
3. If multiple plugins match, select the one with the highest `priority`.
4. If no plugin matches, select `generic`.

## Backward Compatibility

- Existing stack-specific behavior should be represented as plugins.
- Core workflow logic must not hardcode a specific technology.
- Plugin failures should degrade to `generic` with a warning.

## Template Split Guidance

- Technology-neutral sections belong in `.github/skills/specs-generation-core/SKILL.md`.
- Stack-specific detail belongs in plugin extension skills (for example `.github/skills/specs-generation-angular/SKILL.md`).
