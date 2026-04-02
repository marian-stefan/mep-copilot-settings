# Important

The repository has been moved to [mep-copilot-settings](https://github.com/trimble-oss/mep-copilot-settings).
The code remains available here for those who do not yet have a Trimble GitHub account.

## Generic Specs Workflow

A portable, repo-agnostic specs generation workflow for any technology stack.

## What's Included

``` text
.github/
├── agents/                 # Specialized AI agents
│   ├── jira-analyst.agent.md
│   ├── tech-researcher.agent.md
│   ├── specs-writer.agent.md
│   ├── generic-reviewer.agent.md
│   ├── specs-workflow-orchestrator.agent.md
│   └── git-operator.agent.md
├── skills/                 # Domain knowledge modules
│   ├── specs-workflow-routing/SKILL.md
│   ├── specs-workflow-state-machine/SKILL.md
│   ├── specs-validation/SKILL.md
│   ├── specs-error-handling/SKILL.md
│   ├── specs-subagent-invocation/SKILL.md
│   ├── specs-generation-core/SKILL.md
│   ├── specs-technology-routing/SKILL.md
│   ├── specs-generation-angular/SKILL.md   # Angular spec extension
│   ├── specs-generation-dotnet/SKILL.md    # .NET spec extension
│   ├── review-angular/SKILL.md             # Angular review extension
│   ├── review-dotnet/SKILL.md              # .NET review extension
│   └── google-docs-extraction/SKILL.md
├── prompts/
│   ├── create-specs.prompt.md      # User entry point for spec generation
│   ├── start-implementation.prompt.md # User entry point for implementation from spec
│   ├── review-pr.prompt.md
│   ├── review-branch-changes.prompt.md
│   ├── fix-pr.prompt.md
│   ├── create-impact-map.prompt.md
│   └── create-high-level-design.prompt.md
├── config/
│   └── repo.config.sample.json     # Per-repo config template
├── README.md                       # This file
└── SPECS-WORKFLOW-GUIDE.md         # Step-by-step execution guide
```

## Key Features

✅ **Ticket-to-Spec Automation**: Transform requirements tickets into implementation-ready specifications  
✅ **Multi-Agent Orchestration**: Jira Analyst → Tech Researcher → Specs Writer → Generic Reviewer (+ review skill) → Git Operator  
✅ **Quality Gates**: Automated validation and quality scoring  
✅ **Git Integration**: Branch creation, commits, optional push  
✅ **Generic Core + Plugins**: Works with any repository structure; technology behavior is plugin-driven

## Quick Start

1. Copy `.github/` folder to your repository root
2. Configure `.github/config/repo.config.json` for your repo
3. Add a `.github/copilot-instructions.md` file if one doesn't exist yet — see [GitHub Copilot Instructions](https://code.visualstudio.com/docs/copilot/customization/custom-instructions) for reference
4. Run the `create-specs` prompt or agent workflow
5. Review the generated spec, then run the `start-implementation` prompt with the spec attached

See [SPECS-WORKFLOW-GUIDE.md](.github/SPECS-WORKFLOW-GUIDE.md) for detailed step-by-step instructions.

## Workflow Steps

### 1. Analyze (Jira Analyst)

Extract requirements, acceptance criteria, and ticket context.

### 2. Route (Orchestrator)

Validate issue type and select agents.

### 3. Research (Tech Researcher)

Analyze codebase, identify affected files, plan implementation.

### 4. Generate (Specs Writer)

Create formal specification document.

### 5. Validate (Reviewer)

Check completeness, quality, and coverage.

Validation always uses `Generic Reviewer`.
Technology-specific review depth is resolved from `.github/skills/specs-technology-routing/SKILL.md` via an optional review skill.

### 6. Commit (Git Operator)

Create feature branch, commit spec, optionally push to remote.

## Usage

### Basic

```bash
/create-specs TICKET-123
```

### Implementation From Spec

```bash
/start-implementation
```

Attach the generated `SPEC-{TICKET_KEY}-{Plan|Epic|Spike}.md` file when invoking the prompt. Include `CONTEXT-{TICKET_KEY}.md` as supporting context when useful.

### Auto-push

```bash
/create-specs TICKET-123 --push
```

### Dry-run (local only)

```bash
/create-specs TICKET-123 --dry-run
```

## Architecture and Design Prompts

The repository also includes two prompts for early architecture work:

- `create-impact-map.prompt.md`
- `create-high-level-design.prompt.md`

For architecture work, the requirements source is the Jira Epic, and the prompts fetch that data directly through Jira Analyst.

The recommended architecture flow is:

1. Run `/create-impact-map <EPIC_KEY>`.
2. The prompt uses Jira Analyst to fetch the Epic, acceptance criteria, and child issues.
3. Run `/create-high-level-design <EPIC_KEY>`.
4. The prompt reuses the same Epic context, reads the previously created `impact-map.md`, and generates the HLD and ADRs.

### Recommended Flow

| Step | Input | Output |
| ------ | ------- | -------- |
| 1. Create impact map | Jira Epic key via `/create-impact-map <EPIC_KEY>` | `<topic>/impact-map.md` |
| 2. Create high-level design | Jira Epic key via `/create-high-level-design <EPIC_KEY>` | `<topic>/high-level-design.md` and `adrs.md` |

Traceability stays linear: Jira Epic -> Jira Analyst output -> Impact Map -> High-Level Design.

### How to Use `/create-impact-map`

Run the prompt with the Jira Epic key:

```bash
/create-impact-map HON-1234
```

What it does:

- Uses Jira Analyst to fetch Epic details, acceptance criteria, and child issues.
- Uses Jira Epic data as the source of truth.
- Creates a topic folder in the workspace root based on the Epic summary.
- Writes `impact-map.md` into that folder.
- Uses that folder as the shared output location for later architecture artifacts.

Use this prompt when you want to turn Epic requirements into:

- a clear requirement and acceptance criteria breakdown
- affected modules, dependencies, and risks
- explicit assumptions and scope boundaries

### How to Use `/create-high-level-design`

Run the prompt with the same Jira Epic key used for the impact map:

```bash
/create-high-level-design HON-1234
```

What it does:

- Uses Jira Analyst to fetch Epic details for traceability.
- Locates the existing `impact-map.md` from the prior `/create-impact-map` run.
- Reads the impact map as the primary design input.
- Saves `high-level-design.md` in the same folder as the impact map.
- Creates `adrs.md` in that folder.
- May use the bundled `adr` and `mermaid` skills to structure decisions and diagrams.

Use this prompt when you want to produce:

- major components and responsibilities
- integrations and end-to-end flow
- key architectural decisions with ADR traceability

### Prompt Notes

- The business source of truth and prompt input are both the Jira Epic key.
- Both prompts rely on Jira Analyst to fetch Epic data and child issue context.
- `/create-high-level-design` assumes `/create-impact-map` was already run for the same Epic key.
- Supporting architecture skills live under `.github/skills/`, especially `adr`, `c4-diagrams`, and `mermaid`.

## Configuration

Edit `.github/config/repo.config.json`:

```json
{
  "repoType": "your-stack",
  "specOutputPath": "./docs/specs",
  "ticketSource": "jira",
  "jiraConfig": {
    "host": "https://jira.trimble.tools",
    "projectKey": "PROJ"
  },
  "repositoryInfo": {
    "name": "your-repo-name",
    "language": "your-language",
    "description": "Brief description of repo purpose"
  }
}
```

`specOutputPath` is reserved for workflow variants. The default Specs workflow currently writes generated artifacts to repository root.

## Output Artifacts

Three files are created in repository root:

- **`BRIEF-{TICKET_KEY}.md`** - Requirement Brief (from analyst)
- **`CONTEXT-{TICKET_KEY}.md`** - Technical Context (from researcher)
- **`SPEC-{TICKET_KEY}-Plan.md`** - Final Spec (from writer)

Plus a git branch (feature/{TICKET_KEY}) with committed spec.

## Error Handling

| Error | Resolution |
| ------- | ----------- |
| Ticket not found | Verify `ticketSource` config and Jira access |
| Git conflicts | Stash unrelated changes, retry |
| Partial data | Review Open Questions in output, update ticket |

See `skills/specs-error-handling/SKILL.md` for detailed error taxonomy.

## Extending for Your Stack

The workflow is fully technology-agnostic. To tailor it for your stack:

1. Set `repoType` and `language` in `.github/config/repo.config.json`
2. Tech Researcher adapts automatically to your language conventions
3. To add stack-specific guidance, create a technology plugin:
    - Register the plugin in `skills/specs-technology-routing/SKILL.md`
    - Follow the plugin structure and resolution rules defined there
    - Add `skills/review-{pluginId}/SKILL.md` for review checks
    - Add `skills/specs-generation-{pluginId}/SKILL.md` for spec extensions when needed
4. Without a plugin, `Generic Reviewer` runs with no extra review skill

## References

- **Routing & Naming**: `skills/specs-workflow-routing/SKILL.md`
- **Quality Validation**: `skills/specs-validation/SKILL.md`
- **Error Taxonomy**: `skills/specs-error-handling/SKILL.md`
- **Spec Core Template**: `skills/specs-generation-core/SKILL.md`
- **Angular Extension Template**: `skills/specs-generation-angular/SKILL.md`
- **Technology Routing**: `skills/specs-technology-routing/SKILL.md`
- **Agent Invocation**: `skills/specs-subagent-invocation/SKILL.md`

## Support & Maintenance

- All agents are polymorphic (auto-adapt to issue type)
- All skills are generic (language/framework agnostic)
- Technology behavior is plugin-driven, not hardcoded
- Ready for replication into other repositories without modification

---

**Version**: 1.0  
**Created**: March 10, 2026  
**Status**: Ready for production use
