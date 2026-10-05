# Adapter Guide — Writing a Tech Layer

> **Installation**: a tech layer ships inside the `mep` plugin (or, for a team-local layer, in a repository's `.github/`). Run `/mep:init-ai-workflows` in your repository — it detects your tech stack and records the matching layer as active. This guide is reference material for understanding the tech layer contract and for authoring new tech layers.

A tech layer provides the technology-specific knowledge that the base agents need. This guide describes the contract: which files are mandatory, which are optional, and what each must contain.

## Design: skills-only layers

A tech layer is a set of **skills and rules**, never same-name agent overrides.
An agent with the same name as a base agent would conflict with it or replace it: the base workflow (gates,
output contracts, subagent dispatch, audit logging) disappears unless the override
duplicates it. Instead, base agents stay technology-agnostic and load the active layer's skills
at runtime:

| Base agent / prompt | Loads from the layer |
| ------------------- | -------------------- |
| Tech Researchers (Story/Epic/Spike) | `{stack}-stack-profile` (research steps, snippet format, token values) |
| Code Reviewer, review prompts | `{stack}-review-checklist`, `{stack}-patterns`, `{stack}-security-practices`, `{stack}-code-review-output` |
| Test Generator, `/mep:create-tests` | `{stack}-testing`, `{stack}-stack-profile` (`{{TEST_COMMAND}}`, `{{TEST_FILE_GLOB}}`) |
| Orchestrators, build/lessons/complexity skills | `{stack}-stack-profile` (`{{BUILD_COMMAND}}`, `{{MODULE_LESSONS_PATH}}`, …) |

`{{TOKEN}}` placeholders in base files are **symbolic**: they are never substituted into files.
Agents resolve them at runtime from `{stack}-stack-profile`. The token registry (names, meaning,
required/optional) is owned by `skills/stack-profile/SKILL.md` — add tokens there first.

A layer carries no agents. A stack-specific agent, if ever needed, belongs to the plugin's `agents/` under a name that
does not exist in the base harness; never reuse a base agent name.

## Layout

A plugin discovers only the immediate children of `skills/` and the files directly inside `rules/`, so a layer is a **naming convention** over flat directories, not a folder. Every file of layer `{stack}` starts with `{stack}-`:

``` markdown
skills/{stack}-stack-profile/SKILL.md       # REQUIRED — values for every registry token + research steps + snippet format
skills/{stack}-patterns/SKILL.md            # REQUIRED — language/framework idioms & anti-patterns
skills/{stack}-testing/SKILL.md             # REQUIRED — test framework conventions & mock lifecycle
skills/{stack}-security-practices/SKILL.md  # REQUIRED — stack-specific security rules
skills/{stack}-review-checklist/SKILL.md    # REQUIRED — architecture boundaries + triage into the skills above
skills/{stack}-code-review-output/SKILL.md  # REQUIRED — review report template
rules/{stack}-testing.instructions.md       # REQUIRED — applyTo ALL source file globs (Test Companion Rule needs source-file triggers, not just test files)
rules/{stack}-security.instructions.md      # REQUIRED — applyTo source file globs
docs/tech-layers/{stack}.md                 # Notes page: stack assumptions and versions
```

Nine files (notes page + 6 skills + 2 rules). The layer is **active** when `.github/copilot-instructions.md` § Active Tech Layer names its slug (written by `/mep:init-ai-workflows`). A repository-local layer uses the same names under `.github/skills/` and `.github/instructions/`.

## Mandatory: `{stack}-stack-profile`

Must contain:

- A **Token values** table with one row for every token in `skills/stack-profile/SKILL.md`.
  Each value is concrete and runnable, or `n/a — <reason>` for an **Optional** token. `n/a` on a
  **Required** token, empty values, and `TODO` are validation failures.
- **Module taxonomy** (layer → directory pattern → purpose, plus the dependency rule) — the value
  of `{{CODEBASE_MODULE_TAXONOMY}}`.
- **Research steps** — stack-specific additions to the Tech Researcher workflow (what to grep, what files to read).
- **Code snippet format** — the language syntax for before/after snippets in CONTEXT documents.

Reference: `skills/dotnet-stack-profile/SKILL.md`.

## Mandatory Skills

### {stack}-patterns/SKILL.md

Must cover:

- Modern syntax patterns for the language/framework version in use
- Common anti-patterns to flag in code review
- State management patterns with code examples
- Dependency injection / module system patterns
- Performance patterns (lazy loading, async, caching)

### {stack}-testing/SKILL.md

Must cover:

- Test framework and assertion library
- Mock lifecycle rules (when/how mocks are initialized)
- Minimal defaults convention
- Test isolation rules
- Coverage threshold configuration
- Artifact-specific patterns (services, controllers/handlers, state)

### {stack}-security-practices/SKILL.md

Must cover at minimum:

- Secret management (never hardcode)
- Input validation at API boundaries
- Authentication/authorization patterns
- Known injection risks for the stack (SQL, XSS, command injection)
- Secure defaults

**Naming**: always prefix with `{stack}-` (e.g. `dotnet-security-practices`, not bare
`security-practices`) — the base `skills/security-practices/SKILL.md` index skill
already owns that unprefixed name, and every tech layer lives in the same flat `skills/`
directory, so an unprefixed name from two tech layers would collide.

**Registration**: add a row to the base `skills/testing-practices/SKILL.md` and
`skills/security-practices/SKILL.md` routing tables pointing at this stack's
`{stack}-testing`/`{stack}-security-practices` skills, so agents that consult the base index
find this stack.

### {stack}-review-checklist/SKILL.md

Must contain the architecture-boundary rules (layer/module dependency rules) — the only content
owned here — plus a triage table pointing into `{stack}-patterns`, `{stack}-security-practices`
and `{stack}-testing` (do not restate their rules), and a reference to `{stack}-code-review-output/SKILL.md`.
Reference: `dotnet-review-checklist`.

### {stack}-code-review-output/SKILL.md

Must contain the exact template for review reports. The Code Reviewer agent uses this template for all output. It must include:

- Summary section
- Risk assessment table with severity ratings
- Findings sections by severity (Critical/High/Medium/Suggestions)
- Metrics section
- Follow-up actions checklist

## Mandatory Rules

### rules/{stack}-testing.instructions.md

```yaml
---
applyTo: "**/*.{source-extension}"  # e.g., "**/*.cs" or "**/*.ts" — ALL source files, not just test files
---
```

Must cover the same rules as `{stack}-testing/SKILL.md` in instruction form — these are auto-applied to matching files by the AI coding tool. Scope this to **all source files of the stack's extension**, not just test files: `skills/implementation-rules/SKILL.md` § 2.4 Test Companion Rule requires creating/updating a test file when a *source* file changes, so the instruction must fire on source-file edits too, not only when a test file is directly touched.

### rules/{stack}-security.instructions.md

```yaml
---
applyTo: "**/{source-file-glob}"  # e.g., "**/*.cs" or "**/*.ts,**/*.html"
---
```

Must cover the same rules as `{stack}-security-practices/SKILL.md` in instruction form — auto-applied to source files.

## Project Configuration

Project-specific values are **never substituted into plugin files**. `/mep:init-ai-workflows` records them in the adopter's `.github/copilot-instructions.md` § Project Identity, and commands read them at run time:

| Command | Reads | Purpose |
| -------- | ------------- | --------------------- |
| `/mep:fix-pr`, `/mep:review-pr` | `Bitbucket project`, `Bitbucket repo` | Bitbucket coordinates for every `etools/bitbucket_*` call; asks when `not set` |
| `/mep:create-specs` and others | `Jira project`, `Default branch` | Example commands and branch defaults |

## Audit Log Policy

The base orchestrators and all agents write audit trail entries to `docs/specs/{JIRA_KEY}/audit.log`. This file is **append-only** — agents must use `Edit/append`, never overwrite. If the file does not exist, create it with the first entry.

**Entry format**:

```markdown
## {workflowId} | {ISO-8601-timestamp} | {agent-name}
Decision: {key decision made}
Output: {output artifact path}
Warnings: {warnings or fallbacks | none}
```

The base agents own audit-log appends; tech-layer skills must not add or change audit behavior. The `workflowId` in entries and in SPEC frontmatter enables `/mep:review-harness-health` to correlate outcomes with specific runs.

## Validation Checklist

Before publishing a tech layer, verify:

- [ ] The layer adds no agent, and no file under `skills/`/`rules/` reuses a base name (every layer file starts with `{stack}-`)
- [ ] `{stack}-stack-profile` has a value row for every token in `skills/stack-profile/SKILL.md`; Required tokens are not `n/a`; no `TODO` or `{{...}}` inside value cells
- [ ] `{stack}-review-checklist` references `{stack}-code-review-output/SKILL.md`
- [ ] `{{TEST_COMMAND}}` gives both full and scoped forms; test file naming is defined in `{stack}-testing`
- [ ] `{{DEPENDENCY_GRAPH_COMMAND}}` covers consumers (reverse lookup), not only forward references
- [ ] `rules/{stack}-testing.instructions.md` and `rules/{stack}-security.instructions.md` have `applyTo` covering **all source files** of the stack (the Test Companion Rule fires on source edits)
- [ ] Skills are named `{stack}-…`, and the routing tables in `skills/testing-practices/SKILL.md` and `skills/security-practices/SKILL.md` have a row for this stack
- [ ] All code examples use correct language syntax
- [ ] `docs/tech-layers/{stack}.md` documents stack assumptions (versions, frameworks, test libraries)
- [ ] Any Mermaid diagrams apply pre-write validation from `skills/mermaid/SKILL.md`
