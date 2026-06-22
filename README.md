# Important

The repository has been moved to [mep-copilot-settings](https://github.com/trimble-oss/mep-copilot-settings).
The code remains available here for those who do not yet have a Trimble GitHub account.

## Generic Engineering Workflow Toolkit

Technology-agnostic multi-agent harness for spec-to-implementation workflows. Copy this repository into any project root and run `/init-ai-workflows` to get a fully-working agentic development workflow.

## Repository Structure

```markdown
mep-copilot-settings/
├── .github/
│   ├── agents/       # Orchestrators and specialist agents (active harness)
│   ├── skills/       # Domain knowledge files loaded on demand
│   └── prompts/      # User-facing slash commands
├── template/
│   └── tech-layers/  # Technology-specific overlays (source of truth)
│       └── dotnet/   # .NET 8+ / C# 12 reference implementation
├── CLAUDE.md         # Guidance for Claude Code
├── MAINTAINERS.md
└── README.md
```

## Quick Start

1. Copy this repository into your project root:

   ```bash
   cp -r mep-copilot-settings/. your-project/
   ```

2. Open your project in VS Code with GitHub Copilot or Claude Code.
3. Run `/init-ai-workflows` — it detects your tech stack, installs the matching tech layer from `template/tech-layers/`, resolves all placeholders, and writes `.github/copilot-instructions.md`.
4. Run `/create-specs <JIRA_KEY>` to verify the flow end-to-end.

## Core Flows

| Flow | Command | What it does |
| ------ | --------- | ------------- |
| Spec generation | `/create-specs <JIRA_KEY>` | Jira ticket → Requirement Brief → Technical Context → validated Spec |
| Implementation | `/start-implementation [JIRA_KEY]` | Validated Spec → code + tests → review → commit |
| Unit tests | `/create-tests` | Branch diff → unit test files → 100% coverage verification |
| PR review | `/review pr <ID>` | Bitbucket PR → structured review report |
| Branch review | `/review branch` | Local changeset → review report |
| High-level design | `/create-high-level-design <EPIC_KEY>` | Epic → HLD + ADRs |
| Impact map | `/create-impact-map <EPIC_KEY>` | Epic → architecture impact map |
| Harness init | `/init-ai-workflows` | Detect stack, install tech layer, configure repo |
| Tech layer generation | `/generate-tech-layer <stack>` | Research a new stack and generate its tech layer |

## How the Tech Layer Works

The base agents contain `{{PLACEHOLDER}}` tokens for technology-specific concepts. A tech layer provides agent overrides that fill these in. Tech-layer agents **shadow** base agents by name — the AI coding tool prefers the stack-specific variant when the tech layer is active.

| Placeholder | Meaning | .NET example |
| ------------ | --------- | ------------- |
| `{{BUILD_SYSTEM_PROJECT_DISCOVERY}}` | Find affected projects | `find . -name "*.csproj"` |
| `{{DEPENDENCY_GRAPH_COMMAND}}` | Build dependency graph | `dotnet list ref` |
| `{{CODEBASE_MODULE_TAXONOMY}}` | Module naming convention | `*.Api / *.Application / *.Domain / *.Infrastructure` |
| `{{STATE_MANAGEMENT_PATTERNS}}` | How state is managed | MediatR CQRS, IOptions, DI |
| `{{SUBSCRIPTION_LIFECYCLE_PATTERN}}` | Resource/subscription cleanup | `IDisposable`, `CancellationToken` |
| `{{TEST_COMMAND}}` | Run tests with coverage | `dotnet test --collect:"XPlat Code Coverage"` |
| `{{SCAFFOLD_COMMAND}}` | Scaffold new modules/classes | `dotnet new classlib` |

## Creating a New Tech Layer

**Automated (recommended)**: run `/generate-tech-layer <stack>` — it researches the stack online, adversarially verifies claims, presents a human review gate, then writes all required files into `template/tech-layers/<slug>/`. The next `/init-ai-workflows` run will pick it up automatically.

**Manual**: see `template/ADAPTER-GUIDE.md` for the full contract — mandatory files, required placeholder resolutions, and a validation checklist.

## Steering Loop

The harness includes a feedback loop that improves spec quality over time:

```bash
/create-specs → spec → /accept-spec or /reject-spec → METRICS.md → /review-harness-health → guide improvement
```

Run `/review-harness-health` after accumulating 5+ accept/reject signals to surface systematic issues in the workflow guides.

## Prerequisites

- VS Code with GitHub Copilot, or Claude Code
- MCP servers configured in `.vscode/mcp.json`:
  - `etools` — Jira + Bitbucket access (required for `/create-specs`, `/review-pr`, `/fix-pr`)
  - `web` / `fetch` — required for backend service discovery
