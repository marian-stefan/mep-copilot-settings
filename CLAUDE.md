# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repository Is

A technology-agnostic multi-agent harness for spec-to-implementation workflows. The `template/` directory is the distributable — copy it into a project's `.github/` to get a complete agentic development workflow. This repo has no build system or tests of its own.

## Repository Structure

``` markdown
.github/
├── agents/           # Orchestrators and specialist agents (active harness)
├── skills/           # Domain knowledge files loaded on demand
└── prompts/          # User-facing slash commands (/create-specs, /start-implementation, …)
template/
├── ADAPTER-GUIDE.md  # Contract for building new tech layers
└── tech-layers/
    └── dotnet/       # Reference tech-layer implementation for .NET 8+ / C# 12
```

## Core Workflows (User-Facing Commands)

| Command | What it does |
| --------- | ------------- |
| `/init-ai-workflows` | **Bootstrap** — detect stack, install tech layer, configure repo |
| `/create-specs <JIRA_KEY>` | Jira ticket → validated Spec document |
| `/create-specs <JIRA_KEY> --review-context` | Same as above, with Research Summary approval gate (E gate) enabled |
| `/start-implementation [JIRA_KEY]` | Validated Spec → code + tests → review → commit |
| `/create-tests` | Branch diff → unit test files with 100% coverage |
| `/review pr <ID>` | Bitbucket PR → structured review report |
| `/review branch` | Local changeset → review report |
| `/create-high-level-design <EPIC_KEY>` | Epic → HLD + ADRs |
| `/create-impact-map <EPIC_KEY>` | Epic → architecture impact map |
| `/generate-tech-layer <stack>` | Research a stack and generate all mandatory tech-layer files |
| `/accept-spec <JIRA_KEY>` | Mark spec accepted; logs to `docs/specs/METRICS.md` |
| `/reject-spec <JIRA_KEY> --reason <code>` | Mark spec rejected; logs to `docs/specs/METRICS.md` |
| `/feedback-spec <JIRA_KEY> --accuracy <level>` | Developer accuracy signal after implementation |
| `/review-harness-health` | Analyze METRICS.md to surface systematic harness issues |
| `/fix-pr <ID>` | Bitbucket PR review comments → apply fixes → push |
| `/snippet` | Generate a reusable code snippet from a description |

## Architecture: Base Agents + Tech-Layer Shadowing

The base agents in `.github/agents/` contain `{{PLACEHOLDER}}` tokens for stack-specific concepts. A tech layer provides agent overrides that fill these in. The AI coding tool prefers a tech-layer agent over the base agent **when they share the same name**.

To activate a tech layer: copy its `agents/`, `skills/`, and `instructions/` into the target repo's `.github/` alongside the base files.

Key placeholder tokens that every tech layer must resolve:

| Token | Meaning |
| ------- | --------- |
| `{{BUILD_SYSTEM_PROJECT_DISCOVERY}}` | Shell commands to find affected projects |
| `{{DEPENDENCY_GRAPH_COMMAND}}` | Command to view dependency graph |
| `{{CODEBASE_MODULE_TAXONOMY}}` | Layer naming conventions table |
| `{{STATE_MANAGEMENT_PATTERNS}}` | How state is managed in this stack |
| `{{SUBSCRIPTION_LIFECYCLE_PATTERN}}` | Resource/subscription cleanup pattern |
| `{{TEST_COMMAND}}` | Full test runner command with coverage flags |
| `{{SCAFFOLD_COMMAND}}` | Scaffolding/generator command for new modules |
| `{{MODULE_LESSONS_PATH}}` | Path to module-scoped lessons file (written by implementation orchestrator) |
| `{{SHARED_LIB_PATH_PREFIX}}` | Path prefix for shared library detection (e.g., `libs/`, `packages/shared`) |
| `{{SHARED_LIB_TAG}}` | Module metadata tag name identifying shared libraries |
| `{{DOMAIN_TAG_PREFIX}}` | Module metadata tag prefix for domain classification (e.g., `domain:`) |

## Specs Workflow: INIT → ANALYZE → ROUTE → RESEARCH → GENERATE → VALIDATE → COMPLETE

The `specs-workflow-orchestrator.agent.md` coordinates five specialist agents. Issue type (Epic / Spike / Story / Task / Bug / Regression Bug) determines routing via the matrix in `skills/specs-workflow-routing/SKILL.md`.

Artifacts are written to `docs/specs/{JIRA_KEY}/`:

- `BRIEF-{KEY}.md` — produced by Jira Analyst
- `CONTEXT-{KEY}.md` — produced by Tech Researcher
- `SPEC-{KEY}.md` (or `SPEC-{KEY}-Epic.md` / `SPEC-{KEY}-Spike.md`) — produced by Specs Writer

The workflow has three user-facing gates that pause for human input:

- **G gate (Orientation)** — After the BRIEF is produced, a Mermaid pipeline diagram shows the planned route (issue type, routing decision, complexity estimate). Confirm or correct before research begins.
- **C gate (Ambiguity)** — If the Tech Researcher identifies blocking architectural assumptions or ticket ambiguities, the workflow pauses. Resolve them (confirm, correct, or request clarification) before spec generation proceeds. Non-blocking assumptions flow to the Spec Writer as Open Questions without blocking.
- **E gate (Review Context Approval)** — Active only when `--review-context` is passed. After research completes, a Research Summary is presented. Provide feedback to trigger a localised CONTEXT revision (Revision Mode), or approve to continue to spec generation.
- **Backend Swagger gate** — If backend service discovery fails or Swagger is unavailable, the user chooses continue (with override flag) or stop.

Quality scoring and the `qualityBucket` (proceed / iterate / abort) decision that controls the VALIDATE → COMPLETE transition are owned by `skills/specs-quality-review/SKILL.md`.

## Complexity Assessment & Ambiguity Detection

Tech Researchers run two-stage complexity classification:

- **Stage 1** (BRIEF-only signals): AC count, issue type, parent Epic presence, keyword signals → `minimal` | `standard` | `comprehensive`
- **Stage 2** (post-scope escalation): shared library paths, domain tag counts, cross-domain span — can only escalate, never de-escalate Stage 1 result

Research depth is proportional to the final `complexityLevel`. Before running broad codebase analysis, Tech Researchers also enumerate the top 3–5 architectural assumptions from the Requirement Brief and scope-narrowing results. These flow into the `assumptions` frontmatter of the CONTEXT file and drive the C gate.

## Session Resume & Workflow State

Both workflows support resuming interrupted runs. When you re-run `/create-specs` or `/start-implementation` for a key that has an incomplete prior run, you're prompted:

```markdown
A previous workflow run was found for {JIRA_KEY}.
State: {currentStep} | Started: {startedAt} | Last updated: {updatedAt}
Resume from where it left off, or start fresh?
[R]esume / [S]tart fresh
```

Workflow state is persisted in:

- Specs: `docs/specs/{JIRA_KEY}/specs-workflow-state.yml`
- Implementation: `docs/specs/{JIRA_KEY}/implementation-workflow-state.yml`

On completion, state files are archived to `docs/specs/{JIRA_KEY}/archive/`. Resumable states: `analyze`, `route`, `research`, `generate`, `validate` (specs); `preflight`, `implement`, `review`, `commit` (implementation). Terminal states (`complete`, `aborted`, `error`) are not resumable — start fresh after displaying a history summary.

All workflow IDs use the format `wf-{JIRA_KEY}-{YYYYMMDDTHHmmssZ}`. The format is identical for both specs and implementation runs; the `workflowType` field in the state file disambiguates them.

See `skills/specs-workflow-state-machine/SKILL.md` for the complete state schema, resume decision table, and checkpoint invalidation rules.

## Audit Log

Every agent that produces an artifact appends an entry to `docs/specs/{JIRA_KEY}/audit.log` (append-only — never overwrite). Entries follow the format:

```markdown
## {workflowId} | {ISO-8601-timestamp} | {agent-name}
Decision: {key decision made}
Output: {output artifact path}
Warnings: {warnings or fallbacks | none}
```

The `workflowId` field in audit entries and in SPEC frontmatter enables `/review-harness-health` to correlate spec outcomes with specific workflow runs.

## Implementation Workflow: PREFLIGHT → IMPLEMENT → REVIEW → COMMIT

The `implementation-workflow-orchestrator.agent.md` reads a Spec frontmatter to extract quality gates and backend override flags, then implements following `skills/implementation-rules/SKILL.md` (single source of truth for implementation rules). Tests must reach 100% coverage before proceeding to REVIEW. The Code Reviewer runs on the local changeset; High/Critical risk findings pause for a user fix/skip decision.

At COMMIT, the orchestrator compares changed files against the spec's "Impacted Components" list and logs the divergence as a spec accuracy signal to `docs/specs/METRICS.md`.

## Lessons System

The implementation workflow captures corrections as reusable lessons. When the Code Reviewer flags an issue and the fix is accepted, or when tests fail due to a code pattern mistake, a lesson is written:

> *[Situation]: [Mistake made] → [Rule to apply next time]*

Lessons are written to:

- **Module-scoped**: `{{MODULE_LESSONS_PATH}}` (e.g., `src/{app}/docs/lessons.md`) — when the SPEC predicts a single module
- **Workspace-level**: `.github/lessons.md` — for cross-cutting patterns or when no single module is inferable

At PREFLIGHT, the implementation orchestrator reads these lesson files and injects them as context into the IMPLEMENT step.

## Playwright Test Workflow

Three specialist agents handle end-to-end test generation: `playwright-test-planner.agent.md` (generates a test plan from a spec), `playwright-test-generator.agent.md` (writes the test code), and `playwright-test-healer.agent.md` (repairs broken tests after UI changes). These are invoked by `/create-tests` when a Playwright context is detected.

## Steering / Feedback Loop

``` markdown
/create-specs → spec → /accept-spec or /reject-spec → METRICS.md → /review-harness-health → guide improvement
```

`/reject-spec` categorizes failures by reason code. After 5+ signals, `/review-harness-health` reads `docs/specs/METRICS.md`, identifies the top failure mode (wrong-requirements / wrong-architecture / wrong-api-contracts / missing-edge-cases), reads the responsible guide file, and proposes a targeted change.

## Single Sources of Truth

When multiple files could define a rule, defer to the canonical owner:

| Topic | Owner file |
| ------- | ----------- |
| Routing and artifact naming | `skills/specs-workflow-routing/SKILL.md` |
| Validation gates and quality scoring | `skills/specs-quality-review/SKILL.md` |
| Backend/Technical Context validation | `skills/specs-validation/SKILL.md` |
| Error taxonomy and templates | `skills/specs-error-handling/SKILL.md` |
| Subagent invocation patterns | `skills/specs-subagent-invocation/SKILL.md` |
| Implementation rules | `skills/implementation-rules/SKILL.md` |
| Workflow state schema and resumption | `skills/specs-workflow-state-machine/SKILL.md` |
| Complexity classification | `skills/specs-complexity-assessment/SKILL.md` |
| Assumption registry and blocking conditions | `skills/specs-ambiguity-detection/SKILL.md` |
| Backend discovery requirement checklists | `skills/specs-backend-discovery-checklist/SKILL.md` |
| Fix approach evaluation (Bug / Regression Bug) | `skills/specs-fix-approach-evaluation/SKILL.md` |
| Mermaid diagram syntax validation | `skills/mermaid/SKILL.md` |
| Backend validation gate (Technical Context) | `skills/specs-backend-validation-gate/SKILL.md` |
| Spec section templates (Story / Task / Bug) | `skills/specs-generation-story/SKILL.md` |
| Spec section templates (Epic) | `skills/specs-generation-epic/SKILL.md` |
| Spec section templates (Spike) | `skills/specs-generation-spike/SKILL.md` |
| Regression commit investigation procedure | `skills/regression-commit-investigation/SKILL.md` |

## Creating a New Tech Layer

Automated: run `/generate-tech-layer <stack>` — it fans out 4 parallel research agents, adversarially verifies claims, presents a human review gate, then writes all 11 mandatory files.

Manual: follow `template/ADAPTER-GUIDE.md` for the full contract (mandatory files, required placeholder resolutions, validation checklist). The only existing reference implementation is `template/tech-layers/dotnet/`.

## Deploying to a Project

1. Copy the full `mep-copilot-settings` repo into the target project root.
2. Configure MCP tools in `.vscode/mcp.json`: `etools` (Jira + Bitbucket) and `web`/`fetch`.
3. Run `/init-ai-workflows` — detects the tech stack, installs the matching tech layer from `template/tech-layers/` into `.github/`, resolves all `{YOUR_BITBUCKET_*}` placeholders, and writes `.github/copilot-instructions.md`.
4. Run `/create-specs <TICKET>` to verify end-to-end.
