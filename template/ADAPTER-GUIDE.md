# Adapter Guide — Writing a Tech Layer

> **Installation**: Run `/init-ai-workflows` in your repository — it detects your tech stack and installs the matching layer automatically. This guide is reference material for understanding the tech layer contract and for authoring new tech layers.

A tech layer provides the technology-specific knowledge that the base agents need. This guide describes the contract: which files are mandatory, which are optional, and what each must contain.

## Directory Structure

``` markdown
tech-layers/{stack}/
├── README.md                         # Setup guide for this stack
├── agents/                           # Agent overrides (shadow base agents by name)
│   ├── tech-researcher-story.agent.md  # REQUIRED — build system, dependency discovery
│   ├── code-reviewer.agent.md          # REQUIRED — language-specific review checklist
│   ├── test-generator.agent.md         # REQUIRED — test framework conventions
│   └── backend-service-discovery.agent.md  # OPTIONAL — only if DI scanning differs
├── skills/
│   ├── {stack}-patterns/SKILL.md      # REQUIRED — language/framework idioms & anti-patterns
│   ├── {stack}-testing/SKILL.md       # REQUIRED — test framework conventions & mock lifecycle
│   ├── security-practices/SKILL.md    # REQUIRED — stack-specific security rules
│   └── code-review-output/SKILL.md    # REQUIRED — review report template
└── instructions/
    ├── testing.instructions.md        # REQUIRED — applyTo test file globs
    └── security.instructions.md      # REQUIRED — applyTo source file globs
```

## Mandatory Agent Overrides

### tech-researcher-story.agent.md

Must provide implementations for all `{{PLACEHOLDER}}` tokens:

| Placeholder | What to provide |
| ------------ | ---------------- |
| `{{BUILD_SYSTEM_PROJECT_DISCOVERY}}` | Shell commands to list affected projects |
| `{{DEPENDENCY_GRAPH_COMMAND}}` | Command to generate/view dependency graph |
| `{{CODEBASE_MODULE_TAXONOMY}}` | Layer naming conventions (table: layer → directory pattern → purpose) |
| `{{STATE_MANAGEMENT_PATTERNS}}` | How state is managed in this stack |
| `{{SUBSCRIPTION_LIFECYCLE_PATTERN}}` | How subscriptions/resources are cleaned up |
| `{{TEST_COMMAND}}` | Full test runner command with coverage flags |
| `{{SCAFFOLD_COMMAND}}` | Code scaffolding/generator command for new modules or classes |
| `{{MODULE_LESSONS_PATH}}` | Path to the module-scoped lessons file (e.g., `src/{app}/docs/lessons.md`). Written by the implementation orchestrator when module-level corrections are captured. |
| `{{SHARED_LIB_PATH_PREFIX}}` | Path prefix for shared library detection (e.g., `libs/`, `packages/shared`) — used by complexity assessment Stage 2 escalation |
| `{{SHARED_LIB_TAG}}` | Module metadata tag name identifying shared libraries (e.g., `type:shared`) — used to detect shared lib cross-cutting scope |
| `{{DOMAIN_TAG_PREFIX}}` | Module metadata tag prefix for domain classification (e.g., `domain:`) — used to detect cross-domain span and escalate complexity |

Must also provide:

- Code snippet format examples using the target language syntax
- Language-specific research commands (what to grep for, what file types to read)

### code-reviewer.agent.md

Must provide:

- Architecture checklist (module/layer boundary rules)
- Language-specific idioms checklist (e.g., null safety, async patterns)
- Framework-specific anti-patterns
- Testing checklist
- Reference to the tech-layer's `code-review-output/SKILL.md`

### test-generator.agent.md

Must provide:

- `{{TEST_COMMAND}}` replacement — full command with coverage flags
- Test file naming convention (source → test path mapping)
- Test structure example with mock lifecycle
- Coverage verification commands

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

### security-practices/SKILL.md

Must cover at minimum:

- Secret management (never hardcode)
- Input validation at API boundaries
- Authentication/authorization patterns
- Known injection risks for the stack (SQL, XSS, command injection)
- Secure defaults

### code-review-output/SKILL.md

Must contain the exact template for review reports. The Code Reviewer agent uses this template for all output. It must include:

- Summary section
- Risk assessment table with severity ratings
- Findings sections by severity (Critical/High/Medium/Suggestions)
- Metrics section
- Follow-up actions checklist

## Mandatory Instructions

### testing.instructions.md

```yaml
---
applyTo: "**/{test-file-glob}"  # e.g., "**/*Tests.cs" or "**/*.spec.ts"
---
```

Must cover the same rules as `{stack}-testing/SKILL.md` in instruction form — these are auto-applied to test files by the AI coding tool.

### security.instructions.md

```yaml
---
applyTo: "**/{source-file-glob}"  # e.g., "**/*.cs" or "**/*.ts,**/*.html"
---
```

Must cover the same rules as `security-practices/SKILL.md` in instruction form — auto-applied to source files.

## Optional Overrides

### backend-service-discovery.agent.md

Override only if your stack's service registration pattern differs significantly from the generic OpenAPI discovery workflow. The base agent handles:

- Scanning for service config files
- Constructing Swagger URLs
- Fetching and parsing OpenAPI specs
- Generating data contracts

Override if your stack uses a non-standard service registry (e.g., Consul, custom service mesh config files).

## Prompt Configuration

Some base prompts contain placeholder values that must be set for your project:

| Prompt | Placeholder | What to replace with |
| -------- | ------------- | --------------------- |
| `prompts/fix-pr.prompt.md` | `{YOUR_BITBUCKET_PROJECT}`, `{YOUR_BITBUCKET_REPO}` | Your Bitbucket project key and repository slug |
| `prompts/review-pr.prompt.md` | `{YOUR_BITBUCKET_PROJECT}`, `{YOUR_BITBUCKET_REPO}` | Your Bitbucket project key and repository slug |
| `skills/google-docs-extraction/SKILL.md` | `YOUR_CLIENT_ID_VAR`, `YOUR_OAUTH_ENDPOINT`, `N8N_WEBHOOK_URL` | Your org's OAuth credentials and n8n webhook endpoints |

These are resolved automatically by `/init-ai-workflows` when you provide your Bitbucket and Jira configuration during setup.

## Audit Log Policy

The base orchestrators and all agents write audit trail entries to `docs/specs/{JIRA_KEY}/audit.log`. This file is **append-only** — agents must use `Edit/append`, never overwrite. If the file does not exist, create it with the first entry.

**Entry format**:
```
## {workflowId} | {ISO-8601-timestamp} | {agent-name}
Decision: {key decision made}
Output: {output artifact path}
Warnings: {warnings or fallbacks | none}
```

All tech-layer agent overrides that produce artifacts (tech-researcher, code reviewer, test generator) must append entries at completion. The `workflowId` in entries and in SPEC frontmatter enables `/review-harness-health` to correlate outcomes with specific runs.

## Validation Checklist

Before publishing a tech layer, verify:

- [ ] All `{{PLACEHOLDER}}` tokens are resolved in tech-researcher-story.agent.md (including `{{MODULE_LESSONS_PATH}}`, `{{SHARED_LIB_PATH_PREFIX}}`, `{{SHARED_LIB_TAG}}`, `{{DOMAIN_TAG_PREFIX}}`)
- [ ] code-reviewer.agent.md references the tech-layer's `code-review-output/SKILL.md`
- [ ] test-generator.agent.md has `{{TEST_COMMAND}}` resolved and test file naming defined
- [ ] `testing.instructions.md` has correct `applyTo` glob for this stack's test files
- [ ] `security.instructions.md` has correct `applyTo` glob for this stack's source files
- [ ] All code examples in skills use the correct language syntax
- [ ] README.md documents the tech stack assumptions (versions, frameworks, test libraries)
- [ ] All tech-layer agents append to `docs/specs/{JIRA_KEY}/audit.log` (never overwrite) using Edit/append
- [ ] Backend discovery step loads `.github/skills/specs-backend-discovery-checklist/SKILL.md` — do not inline checklists
- [ ] Any Mermaid diagrams produced apply pre-write validation from `.github/skills/mermaid/SKILL.md`
