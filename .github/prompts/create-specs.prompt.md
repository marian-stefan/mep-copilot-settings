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
# Standard usage - creates and validates spec locally
/create-specs TICKET-123

# Epic with suggested child tickets
/create-specs TICKET-456 --create-children
```

## Workflow Overview

The orchestrator coordinates a team of specialized agents to transform a ticket into a validated Spec file:

```
+-------------+    +-------------+    +--------------------+    +-------------+    +-------------+    +-------------+
|    Jira     |--->|   Route &   |--->| Resolve Tech       |--->|    Tech     |--->|   Specs     |--->|  Reviewer   |
|   Analyst   |    |   Validate  |    | Plugin             |    |  Researcher |    |   Writer    |    |  (Validate) |
+-------------+    +-------------+    +--------------------+    +-------------+    +-------------+    +------+------+
       |                  |                    |                       |                  |                   |
       v                  v                    v                       v                  v                   v
  Requirement        Issue Type           Plugin +               Technical            Spec File        Quality Decision
    Brief              Routing           ReviewSkill              Context                                 + Score
```

**Documentation**:
- Full workflow implementation: [specs-workflow-orchestrator.agent.md](../agents/specs-workflow-orchestrator.agent.md)
- State machine & validation gates: [specs-workflow-state-machine/SKILL.md](../skills/specs-workflow-state-machine/SKILL.md)
- Implementation handoff prompt: [start-implementation.prompt.md](./start-implementation.prompt.md)

## Flags & Options

| Flag | Description | Default |
|------|-------------|---------|
| `--create-children` | (Epics only) Include machine-readable child ticket suggestions | `false` |

## Output Files & Routing

The workflow produces three artifact files in `docs/specs/{TICKET_KEY}/`:

| Artifact | Path |
|----------|------|
| Requirement Brief | `docs/specs/{TICKET_KEY}/BRIEF-{TICKET_KEY}.md` |
| Technical Context | `docs/specs/{TICKET_KEY}/CONTEXT-{TICKET_KEY}.md` |
| Spec | `docs/specs/{TICKET_KEY}/SPEC-{TICKET_KEY}-{Plan|Epic|Spike}.md` |

Routing and filename mapping are canonical in [specs-workflow-routing/SKILL.md](../skills/specs-workflow-routing/SKILL.md).

## Expected Output

On successful completion, the orchestrator produces a summary with ticket info, spec filename, quality score, complexity, and risk level. See [specs-workflow-orchestrator.agent.md](../agents/specs-workflow-orchestrator.agent.md) for the full output format.

## Next Step After Approval

After reviewing the generated spec, run `/start-implementation` and attach:
- `docs/specs/{TICKET_KEY}/SPEC-{TICKET_KEY}-{Plan|Epic|Spike}.md` — required source of truth
- `docs/specs/{TICKET_KEY}/CONTEXT-{TICKET_KEY}.md` — optional, for additional file-level technical guidance

## Error Handling

The orchestrator handles errors at each step:

- **Ticket errors**: Verify ticket key and ticket source configuration
- **Routing errors**: Ensure ticket has valid issue type
- **File creation errors**: Check write permissions

See [specs-error-handling/SKILL.md](../skills/specs-error-handling/SKILL.md) for detailed error patterns.

Quality scoring policy is canonical in [specs-quality-review/SKILL.md](../skills/specs-quality-review/SKILL.md).

## Agent References

| Agent | Purpose |
|-------|---------|
| [jira-analyst](../agents/jira-analyst.agent.md) | Extract requirements from ticket source |
| [tech-researcher](../agents/tech-researcher.agent.md) | Polymorphic: Technical planning for Story/Task/Bug/Epic/Spike |
| [specs-writer](../agents/specs-writer.agent.md) | Polymorphic: Generate Spec for Story/Task/Bug/Epic/Spike |
| [generic-reviewer](../agents/generic-reviewer.agent.md) | Default quality validation (plugin may override reviewer skill) |
