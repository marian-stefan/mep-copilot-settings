---
name: specs-technology-routing
description: Canonical technology detection and plugin routing for the Specs workflow.
---

# Specs Technology Routing

Use this skill as the single source of truth for selecting technology plugins.

## Inputs

- `repo.config.json` (if present)
- Repository file patterns

## Resolution Output

- `pluginId`
- `reviewerAgent`
- `specExtensionSkill`
- `researchFocus`

## Plugin Registry

### `generic`

- `priority`: 0
- `reviewerAgent`: `Generic Reviewer`
- `specExtensionSkill`: none
- `matchRules`: fallback only

### `angular`

- `priority`: 100
- `reviewerAgent`: `Angular Reviewer`
- `specExtensionSkill`: `.github/skills/specs-generation/SKILL.md` (acts as Angular plugin extension)
- `matchRules.config.repoType`: `angular`, `nx`, `frontend`
- `matchRules.config.language`: `TypeScript`
- `matchRules.files.any`: `angular.json`, `nx.json`, `project.json`, `**/*.component.ts`

## Resolution Algorithm

1. Try to read `config/repo.config.json`.
2. Match plugins by `repoType` and `language` first.
3. If no config match, match by file heuristics.
4. Sort matches by `priority` descending.
5. Return top match; if none, return `generic`.

## Usage Notes

- Orchestrator resolves plugin once, then passes resolved values to subagents.
- Specs Writer uses core templates and may apply plugin extension guidance.
- Reviewer selection must use `reviewerAgent` from resolution output.
