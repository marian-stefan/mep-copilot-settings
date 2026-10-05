---
name: stack-profile
description: Single source of truth for the `{{TOKEN}}` placeholders used across base agents, skills and prompts, and the rule for resolving them at runtime from the installed tech layer's `{stack}-stack-profile` skill. Load when a file references a `{{TOKEN}}` and you need its value.
---

# Stack Profile — Token Registry & Resolution

Base agents, skills and prompts are technology-agnostic. Where they need a stack-specific
command, path or convention they name a `{{TOKEN}}`. Tokens are **symbolic references that
are never text-substituted into files**. Resolve them at runtime:

1. Find the active stack profile. Read the `slug` under `## Active Tech Layer` in
   `.github/copilot-instructions.md` (written by `/mep:init-ai-workflows`) and use the skill
   `{slug}-stack-profile` (e.g. `dotnet-stack-profile`). If the file or slug is absent, list the
   available `*-stack-profile` skills: exactly one → use it; several → ask the user which stack
   applies and suggest `/mep:init-ai-workflows`. Read only the row(s) for the token(s) you need.
   A workspace may also carry its own layer under `.github/skills/`; it is an equal candidate.
2. Use the value from the profile's **Token values** table verbatim.
3. If no stack profile is installed, or the profile has no value for a token marked
   **Required** below: do not guess. Report `STACK_PROFILE_MISSING: {{TOKEN}}` to the
   invoking agent/user and continue only with steps that do not need it.
4. If a token is marked **Optional** and has no value, skip the step that needs it and say so.

Tokens appearing in documentation examples (`{{TOKEN}}`, `{{PLACEHOLDER}}`) are not real
tokens and are not in this registry.

## Registry

| Token | Req. | Meaning | Used by |
| ----- | ---- | ------- | ------- |
| `{{BUILD_SYSTEM_PROJECT_DISCOVERY}}` | Required | Shell commands that list the projects/modules affected by a change | Tech Researchers (Story/Epic/Spike), prompts `create-impact-map`, `create-high-level-design` |
| `{{DEPENDENCY_GRAPH_COMMAND}}` | Required | Command that shows a project's dependencies **and** its dependents (consumers). If the toolchain only lists forward references, the profile must also give a reverse-lookup recipe | Tech Researchers, `build-verification`, review prompts |
| `{{CODEBASE_MODULE_TAXONOMY}}` | Required | Table of layer → directory pattern → purpose, plus the dependency rule between layers | Tech Researchers, Code Reviewer, review prompts, `create-impact-map` |
| `{{STATE_MANAGEMENT_PATTERNS}}` | Required | How state/data flow is managed in this stack | Code Reviewer, `review-pr`, `fix-pr` |
| `{{SUBSCRIPTION_LIFECYCLE_PATTERN}}` | Required | How resources/subscriptions/handles are released | Code Reviewer, `review-pr`, `fix-pr` |
| `{{TEST_COMMAND}}` | Required | Full test run with coverage; the profile also gives the scoped form (single project / filter) | Test Generator, `create-tests`, `fix-pr` |
| `{{TEST_FILE_GLOB}}` | Required | Glob matching test files of this stack | `create-tests` |
| `{{SCAFFOLD_COMMAND}}` | Optional | Scaffold command for new modules/classes, with flags | `specs-validation`, Tech Researchers |
| `{{BUILD_COMMAND}}` | Required | Full-scope build/compile check, run once at the exit gate | `build-verification`, `implementation-rules`, `fix-pr` |
| `{{AFFECTED_BUILD_COMMAND}}` | Optional | Build scoped to the changed component(s) for fix iterations; falls back to `{{BUILD_COMMAND}}` when absent | `build-verification`, `implementation-rules` |
| `{{INSTALL_COMMAND}}` | Optional | Restore/install dependencies | `fix-pr`, `specs-generation-spike` |
| `{{RUN_COMMAND}}` | Optional | Run a script/prototype (used for spike repro steps) | `specs-generation-spike` |
| `{{MODULE_LESSONS_PATH}}` | Required | Where the module-scoped `lessons.md` lives, given the module-root convention. Resolution algorithm: `implementation-lessons-system` | Implementation Orchestrator, `start-implementation` |
| `{{SHARED_LIB_PATH_PREFIX}}` | Optional | Path prefix identifying shared libraries (complexity Stage 2 escalation). If absent, the path signal is skipped | `specs-complexity-assessment`, Tech Researcher (Story) |
| `{{SHARED_LIB_TAG}}` | Optional | Module metadata tag marking a shared library. If absent, the tag signal is skipped | same |
| `{{DOMAIN_TAG_PREFIX}}` | Optional | Module metadata tag prefix for domain classification (cross-domain span signal). If absent, the signal is skipped | same |

## Rules for tech-layer authors

- A stack profile MUST give a value (or an explicit `n/a — <reason>`) for every token in this
  registry. `n/a` for a **Required** token is a validation failure.
- Values must be concrete and runnable for the stack. Never leave `{{...}}` or `<TODO>` in a
  profile.
- Adding a token: add it here first (owner + meaning + Required/Optional), then to every
  installed layer's profile, then reference it. Do not introduce tokens that are not in this table.
