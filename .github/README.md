# Generic Specs Workflow

A portable, repo-agnostic specs generation workflow for .NET, C++, and other non-Nx repositories.

## Overview

This folder contains a complete, copy-paste-ready implementation of the Specs generation workflow. It creates comprehensive specification documents from ticket requirements, without depending on:
- ❌ Nx monorepo tooling
- ❌ Backend discovery / Swagger analysis
- ❌ Angular 20+ patterns

## What's Included

```
generic-specs/
├── agents/                 # Specialized AI agents
│   ├── jira-analyst.agent.md
│   ├── tech-researcher.agent.md
│   ├── specs-writer.agent.md
│   ├── angular-reviewer.agent.md
│   └── git-operator.agent.md
├── skills/                 # Domain knowledge modules
│   ├── specs-workflow-routing/SKILL.md
│   ├── specs-validation/SKILL.md
│   ├── specs-error-handling/SKILL.md
│   ├── specs-subagent-invocation/SKILL.md
│   ├── specs-generation/SKILL.md
│   ├── specs-generation-core/SKILL.md
│   ├── specs-workflow-state-machine/SKILL.md
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
✅ **Multi-Agent Orchestration**: Jira Analyst → Tech Researcher → Specs Writer → Reviewer (plugin-selected) → Git Operator  
✅ **Quality Gates**: Automated validation and quality scoring  
✅ **Git Integration**: Branch creation, commits, optional push  
✅ **Generic Core + Plugins**: Works with any repository structure; technology behavior is plugin-driven

## Quick Start

1. Copy `generic-specs/` folder to your repository root
2. Configure `config/repo.config.json` for your repo
3. Run the `create-specs` prompt or agent workflow
4. Review the generated spec and merge the branch

See [RUN.md](RUN.md) for detailed step-by-step instructions.

## Differences from Angular Workflow

| Feature | Angular Workflow | Generic Workflow |
|---------|------------------|------------------|
| **Nx Support** | ✅ Full nx-mcp support | ❌ None (generic file paths) |
| **Backend Discovery** | ✅ Auto-discovers APIs | ❌ Skipped (manual API docs) |
| **Framework** | ✅ Angular 20+ specific | ❌ Language-agnostic |
| **Validation** | ✅ Full analyzer | ✅ Quality gates only |
| **Git Ops** | ✅ Feature branch conventions | ✅ Simple commit + push |

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

Reviewer selection is resolved from `.github/skills/specs-technology-routing/SKILL.md`.
If no plugin matches, `Generic Reviewer` is used.

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
  "repoType": "dotnet",
  "specOutputPath": "./docs/specs",
  "ticketSource": "jira",
  "jiraConfig": {
    "host": "https://your-jira.atlassian.net",
    "projectKey": "PROJ"
  },
  "repositoryInfo": {
    "name": "my-backend-service",
    "language": "C#",
    "description": "Backend API service"
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
|-------|-----------|
| Ticket not found | Verify `ticketSource` config and Jira access |
| Git conflicts | Stash unrelated changes, retry |
| Partial data | Review Open Questions in output, update ticket |

See `skills/specs-error-handling/SKILL.md` for detailed error taxonomy.

## Extending for Your Repo

### For .NET Repos
- Adjust `config/repo.config.json` with `.NET` language
- Tech Researcher will reference C# file paths and namespaces
- Add domain-specific skills in `skills/` if needed

### For C++ Repos
- Set `repoType: "cpp"` in config
- Tech Researcher will reference C++ file paths and classes
- Add C++-specific plugin skill and register it in `skills/specs-technology-routing/SKILL.md`

### For Other Languages
- Edit config with appropriate `repoType` and `language`
- Tech Researcher adapts automatically to language conventions

## References

- **Routing & Naming**: `skills/specs-workflow-routing/SKILL.md`
- **Quality Validation**: `skills/specs-validation/SKILL.md`
- **Error Taxonomy**: `skills/specs-error-handling/SKILL.md`
- **Spec Core Template**: `skills/specs-generation-core/SKILL.md`
- **Angular Extension Template**: `skills/specs-generation/SKILL.md`
- **Technology Routing**: `skills/specs-technology-routing/SKILL.md`
- **Plugin Contract**: `skills/specs-technology-plugin-contract/SKILL.md`
- **Agent Invocation**: `skills/specs-subagent-invocation/SKILL.md`

## Support & Maintenance

- All agents are polymorphic (auto-adapt to issue type)
- All skills are generic (language/framework agnostic)
- No Nx, no backend discovery — minimal dependencies
- Ready for replication into other repositories without modification

---

**Version**: 1.0  
**Created**: March 10, 2026  
**Status**: Ready for production use
