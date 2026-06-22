---
agent: 'Specs Workflow Orchestrator'
tools: ['agent', 'read/readFile', 'edit/createFile', 'edit/editFiles', 'etools/jira_get-issue', 'execute', 'web/fetch']
description: 'Generate implementation-ready Specs from Jira tickets using the multi-agent orchestrator'
---

# Create Specs

Generate a comprehensive Specification (Spec) document from a Jira ticket using the multi-agent Specs Workflow Orchestrator.

## Command Usage

```
/create-specs <JIRA_TICKET_KEY>
```

**Examples**:

```bash
/create-specs HON-123
/create-specs HON-123 --review-context
```

**Flags**:

| Flag | Description |
|------|-------------|
| `--review-context` | After Technical Research completes, pause and display a Research Summary (impacted modules, backend services, key approach, shared libs, top risk). Prompts: "Continue to spec generation, or provide feedback first?" Use for complex tickets where a wrong CONTEXT would cause an expensive full re-run. Feedback is classified as scope-change (full research refresh) or localised clarification (partial revision). Omit for well-specified tickets to keep the workflow fast. |

## Workflow Overview

The orchestrator coordinates a team of specialized agents to transform a Jira ticket into a validated Spec document:

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    Jira     │───▶│   Route &   │───▶│    Tech     │───▶│   Specs     │───▶│    Spec     │
│   Analyst   │    │   Validate  │    │  Researcher │    │   Writer    │    │  Reviewer   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                  │                  │                  │                  │
       ▼                  ▼                  ▼                  ▼                  ▼
  Requirement        Issue Type         Technical          Spec Document     Reviewer Decision
    Brief              Routing           Context                              + Score
```

**Documentation**:
- Full workflow implementation: [specs-workflow-orchestrator.agent.md](../agents/specs-workflow-orchestrator.agent.md)
- State machine & validation gates: [specs-workflow-state-machine/SKILL.md](../skills/specs-workflow-state-machine/SKILL.md)

## Output Files & Routing

The workflow produces three artifact files (BRIEF, CONTEXT, SPEC) in `docs/specs/{JIRA_KEY}/`. Routing and filename mapping are canonical in:

- [specs-workflow-routing/SKILL.md](../skills/specs-workflow-routing/SKILL.md)

Use this file for issue-type mapping and artifact naming instead of duplicating tables in prompt text.

## Expected Output

On successful completion, the orchestrator produces a summary with ticket info, spec filename, reviewer decision bucket, quality score, complexity, and risk level. See [specs-workflow-orchestrator.agent.md](../agents/specs-workflow-orchestrator.agent.md) for the full output format.

## Error Handling

The orchestrator handles errors at each step:

- **Jira errors**: Verify ticket key and MCP server configuration
- **Routing errors**: Ensure Jira ticket has valid issue type
- **Backend validation errors**: Verify dev environment services are accessible
- **Backend validation override**: If you choose to continue, the spec is generated with a clear "backend validation skipped" warning and manual API review required
- **File creation errors**: Check write permissions

See [specs-error-handling/SKILL.md](../skills/specs-error-handling/SKILL.md) for detailed error patterns.

Quality scoring (qualityScore, qualityBucket thresholds, Spec review output format) is canonical in:

- [specs-quality-review/SKILL.md](../skills/specs-quality-review/SKILL.md)

Backend and Technical Context validation gate policy is canonical in:

- [specs-validation/SKILL.md](../skills/specs-validation/SKILL.md)

## Workspace Policy References

- tech-layer `{stack}-patterns/SKILL.md` — codebase layering and naming conventions (provided by your tech layer)
- [security.instructions.md](../instructions/security.instructions.md) — Security checklist
- [specs-workflow-orchestrator.agent.md](../agents/specs-workflow-orchestrator.agent.md) — Orchestrator implementation, state schema, and agent contracts

## Agent References

| Agent | Purpose |
|-------|---------|
| [Jira Analyst](../agents/jira-analyst.agent.md) | Extract requirements from Jira |
| [Tech Researcher (Story)](../agents/tech-researcher-story.agent.md) | Technical planning for Story/Task/Bug/Regression Bug |
| [Tech Researcher (Epic)](../agents/tech-researcher-epic.agent.md) | Technical planning for Epic (milestone planning, child ticket aggregation) |
| [Tech Researcher (Spike)](../agents/tech-researcher-spike.agent.md) | Technical planning for Spike (experiment design, timebox) |
| [Specs Writer (Story)](../agents/specs-writer-story.agent.md) | Generate Spec for Story/Task/Bug/Regression Bug |
| [Specs Writer (Epic)](../agents/specs-writer-epic.agent.md) | Generate Spec for Epic |
| [Specs Writer (Spike)](../agents/specs-writer-spike.agent.md) | Generate Spec for Spike |
| [Spec Reviewer](../agents/spec-reviewer.agent.md) | Spec document quality validation |
