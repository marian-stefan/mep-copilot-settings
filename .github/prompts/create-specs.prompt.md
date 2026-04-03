---
agent: 'Specs Workflow Orchestrator'
tools: ['agent', 'read/readFile', 'edit/createFile', 'mcp-atlassian/jira_get_issue', 'execute']
description: 'Generate implementation-ready Specs from tickets using the multi-agent orchestrator'
---

# Create Specs

Generate a comprehensive Specification (Spec) document from a ticket using the multi-agent Specs Workflow Orchestrator.

## Command Usage

```
/create-specs <TICKET_KEY> [flags]
```

**Examples**:

```bash
# Standard usage - creates spec, prompts before push
/create-specs TICKET-123

# Auto-push without confirmation
/create-specs TICKET-123 --push

# Epic with suggested child tickets
/create-specs TICKET-456 --create-children

# Dry run - generate locally, no git operations
/create-specs TICKET-789 --dry-run
```

## Workflow Overview

The orchestrator coordinates a team of specialized agents to transform a ticket into a committed Spec file:

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Jira      │───▶│   Route &   │───▶│    Tech     │───▶│   Specs     │───▶│  Reviewer   │───▶│     Git     │
│   Analyst   │    │   Resolve   │    │  Researcher │    │   Writer    │    │  (Validate) │    │  Operator   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                  │                  │                  │                  │                  │
       ▼                  ▼                  ▼                  ▼                  ▼                  ▼
  Requirement        Routing +          Technical            Spec File       Quality Decision   Branch +
    Brief            Tech Plugin          Context                              + Score             Commit
```

**Documentation**:
- Full workflow implementation: [specs-workflow-orchestrator.agent.md](../agents/specs-workflow-orchestrator.agent.md)
- State machine & validation gates: [specs-workflow-state-machine/SKILL.md](../skills/specs-workflow-state-machine/SKILL.md)
- Implementation handoff prompt: [start-implementation.prompt.md](./start-implementation.prompt.md)

## Flags & Options

| Flag | Description | Default |
|------|-------------|---------|
| `--push` | Skip push confirmation, auto-push to remote | `false` (confirm) |
| `--create-children` | (Epics only) Include machine-readable child ticket suggestions | `false` |
| `--dry-run` | Generate spec locally, skip git and operations | `false` |

## Output Files & Routing

The workflow produces exactly one Spec file in repository root. Routing and filename mapping are canonical in:

- [specs-workflow-routing/SKILL.md](../skills/specs-workflow-routing/SKILL.md)

Use this file for issue-type mapping and artifact naming instead of duplicating tables in prompt text.

## Expected Output

On successful completion, the orchestrator produces a summary with ticket info, branch name, spec filename, quality score, complexity, and risk level. See [specs-workflow-orchestrator.agent.md](../agents/specs-workflow-orchestrator.agent.md) for the full output format.

## Next Step After Approval

After reviewing the generated spec, run `/start-implementation` and attach the generated `SPEC-{TICKET_KEY}-{Plan|Epic|Spike}.md` file. Include `CONTEXT-{TICKET_KEY}.md` if the implementation needs the detailed technical plan.

## Error Handling

The orchestrator handles errors at each step:

- **Ticket errors**: Verify ticket key and ticket source configuration
- **Routing errors**: Ensure ticket has valid issue type
- **File creation errors**: Check write permissions
- **Git errors**: Resolve conflicts or stash unrelated changes

See [specs-error-handling/SKILL.md](../skills/specs-error-handling/SKILL.md) for detailed error patterns.

Quality scoring policy is canonical in:

- [specs-validation/SKILL.md](../skills/specs-validation/SKILL.md)

## Agent References

| Agent | Purpose |
|-------|---------|
| [jira-analyst](../agents/jira-analyst.agent.md) | Extract requirements from ticket source |
| [tech-researcher](../agents/tech-researcher.agent.md) | Polymorphic: Technical planning for Story/Task/Bug/Epic/Spike |
| [specs-writer](../agents/specs-writer.agent.md) | Polymorphic: Generate Spec for Story/Task/Bug/Epic/Spike |
| [git-operator](../agents/git-operator.agent.md) | Branch and commit operations |
| [generic-reviewer](../agents/generic-reviewer.agent.md) | Default quality validation (plugin may override reviewer) |
