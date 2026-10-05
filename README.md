# mep-copilot-settings

The repository has been moved to [mep-copilot-settings](https://github.com/trimble-oss/mep-copilot-settings).
The code remains available here for those who do not yet have a Trimble GitHub account.

Technology-agnostic multi-agent harness for spec-to-implementation workflows, packaged as a **VS Code agent plugin** named `mep`. Install the plugin, run `/mep:init-ai-workflows` once per repository, and you have a working agentic development workflow — nothing is copied into your project except one configuration file.

## Repository Structure

```markdown
mep-copilot-settings/            # = the plugin root (Open Plugin format)
├── .plugin/plugin.json          # Plugin manifest (name: mep)
├── agents/                      # Orchestrators and specialist agents
├── commands/                    # User-facing slash commands → /mep:{file name}
├── skills/                      # Domain knowledge and rule owners, loaded on demand
│                                #   base skills + tech-layer skills ({slug}-*, e.g. dotnet-*)
├── rules/                       # Auto-applied instructions, one set per tech layer ({slug}-*.instructions.md)
├── hooks/                       # hooks.json + Tool Guardian: blocks dangerous shell commands
├── .mcp.json                    # etools MCP server (Jira + Bitbucket)
├── docs/                        # Maintainer docs: CATALOG (generated), CONVENTIONS, SCHEMAS, TROUBLESHOOTING, tech-layers/
├── template/ADAPTER-GUIDE.md    # The tech-layer contract
├── scripts/                     # harness.mjs — lint and catalog generation (Node 18+)
├── ARCHITECTURE.md              # Workflow mechanics: gates, state, audit log, single sources of truth
└── CONTRIBUTING.md · CHANGELOG.md · MAINTAINERS.md
```

In an adopter repo the only file the harness writes is `.github/copilot-instructions.md` (by `/mep:init-ai-workflows`). Generated at run time: `docs/specs/{KEY}/…` and `docs/specs/METRICS.md` (layout: `docs/SCHEMAS.md`). Everything else under this repository is maintainer material and is not used at run time.

> **Platform**: the harness targets **GitHub Copilot in VS Code** (agent mode). Frontmatter and tool ids are Copilot-specific. The plugin uses the Open Plugin layout because it is the only plugin format whose hook commands can locate their own script (`${PLUGIN_ROOT}`).

## Installation

The plugin is installed straight from this repository — there is no separate marketplace. You need git access to `marian-stefan/mep-copilot-settings` (VS Code clones it) and VS Code with GitHub Copilot.

### Install

Use either method:

- **Install From Source** — Command Palette → **Chat: Install Plugin From Source** → enter `marian-stefan/mep-copilot-settings` (or the full git URL). Trust the source when asked.
- **Marketplaces setting** — add `"marian-stefan/mep-copilot-settings"` to `chat.plugins.marketplaces`, then install `mep` from the Extensions view (filter `@agentPlugins`).

Then **reload the window** (Developer: Reload Window). Newly installed or updated plugin skills, agents and hooks are picked up reliably only after a reload.

### Set up a repository

1. Open your project and run `/mep:init-ai-workflows` — it detects your tech stack, records the active tech layer and project identity in `.github/copilot-instructions.md`, and checks that the `etools` MCP server is available. Commit that file; it is the only file the harness writes into your repository.
2. Start and sign in to the plugin's `etools` server (Jira + Bitbucket) from the MCP servers list if it is not running.
3. Run `/mep:create-specs <JIRA_KEY>` to verify the flow end-to-end.

### Update

VS Code checks installed plugins for updates about once a day; you can also update `mep` from the Extensions view (`@agentPlugins`). Reload the window afterwards. Updates follow the repository's default branch.

### Develop locally

To try a checkout of this repository, point `chat.pluginLocations` at it and reload the window:

```json
"chat.pluginLocations": { "/path/to/mep-copilot-settings": true }
```

## Core Flows

| Flow | Command | What it does |
| ------ | --------- | ------------- |
| Spec generation | `/mep:create-specs <JIRA_KEY>` | Jira ticket → Requirement Brief → Technical Context → validated Spec |
| Implementation | `/mep:start-implementation [JIRA_KEY]` | Validated Spec → code + tests → review → commit |
| Unit tests | `/mep:create-tests` | Branch diff → unit test files meeting the Coverage Contract (100% of changed lines/branches) |
| PR review | `/mep:review-pr <ID>` | Bitbucket PR → structured review report |
| PR fixes | `/mep:fix-pr <ID>` | Apply fixes for PR feedback and review findings |
| Branch review | `/mep:review-branch-changes` | Local branch changeset → review report |
| High-level design | `/mep:create-high-level-design <EPIC_KEY>` | Epic → HLD + ADRs |
| Impact map | `/mep:create-impact-map <EPIC_KEY>` | Epic → architecture impact map |
| Spec feedback | `/mep:accept-spec`, `/mep:reject-spec`, `/mep:feedback-spec <KEY>` | Record spec quality and accuracy signals in `docs/specs/METRICS.md` |
| Harness health | `/mep:review-harness-health` | Analyze METRICS.md and propose guide improvements |
| Code snippets | `/mep:snippet` | Snippets for common patterns in the current stack |
| Harness init | `/mep:init-ai-workflows` | Detect stack, record the active tech layer and project identity |
| Tech layer generation | `/mep:generate-tech-layer <stack>` | Research a new stack and generate its tech layer |

## How the Tech Layer Works

The base agents are technology-agnostic. A tech layer is a set of **skills and rules** (never same-name agent overrides) that the base agents load at runtime. Because a plugin has one flat `skills/` directory, a layer is identified by name: every skill `{slug}-*` plus the rules `rules/{slug}-*.instructions.md`, with `{slug}-stack-profile` as its entry point:

- `{stack}-stack-profile` — concrete values for every `{{TOKEN}}` used in base files (build/test commands, module taxonomy, lessons path, …), plus stack research steps and snippet format.
- `{stack}-patterns`, `{stack}-testing`, `{stack}-security-practices`, `{stack}-review-checklist`, `{stack}-code-review-output` — loaded by the Code Reviewer and Test Generator.

`{{TOKEN}}` names in base files are symbolic and are **never substituted**; the registry (meaning, required/optional, users) is `skills/stack-profile/SKILL.md`. The active layer is recorded by `/mep:init-ai-workflows` in `.github/copilot-instructions.md` § Active Tech Layer; nothing is copied or rewritten. A repository can also carry its own layer under `.github/skills/` and `.github/instructions/`.

## Creating a New Tech Layer

**Automated (recommended)**: run `/mep:generate-tech-layer <stack>` — it researches the stack online, adversarially verifies claims, presents a human review gate, then writes all required files — into this repository's `skills/` and `rules/` when run by a maintainer of the plugin, or into the current workspace's `.github/skills/` and `.github/instructions/` otherwise. The next `/mep:init-ai-workflows` run will pick it up automatically.

**Manual**: see `template/ADAPTER-GUIDE.md` for the full contract — mandatory files, the stack-profile token contract, and a validation checklist.

## Steering Loop

The harness includes a feedback loop that improves spec quality over time:

```markdown
/mep:create-specs → spec → /mep:accept-spec or /mep:reject-spec → METRICS.md → /mep:review-harness-health → guide improvement
```

Run `/mep:review-harness-health` after accumulating 5+ accept/reject signals to surface systematic issues in the workflow guides.

## Documentation

| Doc | For |
| --- | --- |
| `ARCHITECTURE.md` | How the workflows, gates and state machines fit together; owner of each rule |
| `docs/CATALOG.md` | Every agent, command and skill with its purpose (generated) |
| `docs/CONVENTIONS.md` | Authoring rules: frontmatter, tools/model policy, single source of truth |
| `docs/SCHEMAS.md` | `docs/specs/` layout, BRIEF/CONTEXT/SPEC section maps, flags, gate codes |
| `docs/TROUBLESHOOTING.md` | Common failures and fixes |
| `template/ADAPTER-GUIDE.md` | The tech-layer contract |
| `CONTRIBUTING.md` | Changing the harness, testing a prompt change |

## Prerequisites

- VS Code with GitHub Copilot
- `node` 18+ on PATH — required by the Tool Guardian hook (`hooks/tool-guardian/`) and by `scripts/harness.mjs`
- The plugin's `etools` MCP server (Jira + Bitbucket access; required for `/mep:create-specs`, `/mep:review-pr`, `/mep:fix-pr`) — start and trust it from the MCP servers list after installing; it provides the tools as `etools/*`
