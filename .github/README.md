# Generic Specs Workflow

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
│   └── create-specs.prompt.md      # User entry point
├── config/
│   └── repo.config.sample.json     # Per-repo config template
├── README.md                       # This file
└── RUN.md                          # Step-by-step execution guide
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
3. Run the `create-specs` prompt or agent workflow
4. Review the generated spec and merge the branch

See [RUN.md](RUN.md) for detailed step-by-step instructions.

## Workflow Steps

### 1. Analyze (Jira Analyst)

Extract requirements, acceptance criteria, and acceptance criteria from ticket.

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

### Auto-push

```bash
/create-specs TICKET-123 --push
```

### Dry-run (local only)

```bash
/create-specs TICKET-123 --dry-run
```

## Configuration

Edit `config/repo.config.json`:

```json
{
  "repoType": "your-stack",
  "specOutputPath": "./docs/specs",
  "ticketSource": "jira",
  "jiraConfig": {
    "host": "https://your-jira.atlassian.net",
    "projectKey": "PROJ"
  },
  "repositoryInfo": {
    "name": "your-repo-name",
    "language": "your-language",
    "description": "Brief description of repo purpose"
  }
}
```

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

1. Set `repoType` and `language` in `config/repo.config.json`
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
