---
agent: 'Implementation Workflow Orchestrator'
tools: ['agent', 'read/readFile', 'edit/createFile', 'edit/editFiles', 'search/textSearch', 'search/fileSearch', 'execute']
description: 'Implement the solution defined in a validated Spec document, with pre-flight quality check, local review, spec accuracy signal, and guided commit.'
---

# Start Implementation

Implement the solution defined in the attached Spec document using the **Implementation Workflow Orchestrator**.

## Command Usage

Attach the spec file to this conversation or provide the Jira key:

```
/start-implementation
/start-implementation HON-123
```

When a Jira key is provided, the orchestrator auto-resolves the spec path as `docs/specs/{JIRA_KEY}/SPEC-{JIRA_KEY}*.md` — no manual attachment needed.

The spec file must be located at `docs/specs/{JIRA_KEY}/SPEC-{JIRA_KEY}[.md|-Epic.md|-Spike.md]`.

## Workflow Overview

The orchestrator runs a structured PREFLIGHT → IMPLEMENT → REVIEW → COMMIT pipeline:

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  PREFLIGHT  │───▶│  IMPLEMENT  │───▶│   REVIEW    │───▶│   COMMIT    │
│             │    │             │    │             │    │             │
│ Spec quality│    │ Code + tests│    │ Code        │    │ Git Operator│
│ check +     │    │ 100%        │    │ Reviewer    │    │ + spec      │
│ git baseline│    │ coverage    │    │ (local)     │    │ accuracy    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

**Documentation**: [implementation-workflow-orchestrator.agent.md](../agents/implementation-workflow-orchestrator.agent.md)

---

## Implementation Rules

The orchestrator's IMPLEMENT step is governed by the canonical rules in:

- [implementation-rules/SKILL.md](../skills/implementation-rules/SKILL.md) — Pre-implementation validation, controlled implementation, definition of done

This skill is the single source of truth. Any change to implementation behavior must be made there first.

---

## Lessons System

The implementation orchestrator maintains a lessons system to surface prior corrections at the start of each run and capture new ones as they occur.

### Lesson Files

| File | Scope |
|------|-------|
| `.github/lessons.md` | Cross-cutting: shared lib patterns, architecture rules, testing patterns |
| `{{MODULE_LESSONS_PATH}}` | Module-scoped: corrections specific to one app or module (resolved by tech layer) |

Files are created on demand — the orchestrator writes them if absent, appends if present. No pre-created lessons files are needed.

### How It Works

- **At PREFLIGHT**: The orchestrator reads `.github/lessons.md` and the module-scoped file (if inferable from SPEC predicted files). Relevant lessons are surfaced as context in the IMPLEMENT step.
- **During IMPLEMENT**: After each review iteration with accepted fixes, the orchestrator evaluates whether a confirmed correction event occurred and appends a lesson before re-entering IMPLEMENT.
- **On explicit user correction**: The lesson is captured immediately, before the next agent step.

### Lesson Format

`[Situation]: [Mistake made or pattern observed] → [Rule to apply next time]`

See [implementation-workflow-orchestrator.agent.md](../agents/implementation-workflow-orchestrator.agent.md) for the full confirmed correction event definition and capture hook locations.

---

## Workspace Policy References

- [implementation-rules/SKILL.md](../skills/implementation-rules/SKILL.md) — Canonical implementation rules (single source of truth)
- [implementation-workflow-orchestrator.agent.md](../agents/implementation-workflow-orchestrator.agent.md) — Orchestrator implementation, state schema, and agent contracts
- [testing.instructions.md](../instructions/testing.instructions.md) — Test conventions and 100% coverage mandate
- tech-layer `{stack}-patterns/SKILL.md` — codebase layering and naming conventions (provided by your tech layer)
- [security.instructions.md](../instructions/security.instructions.md) — Security rules
- [specs-error-handling/SKILL.md](../skills/specs-error-handling/SKILL.md) — Error taxonomy
