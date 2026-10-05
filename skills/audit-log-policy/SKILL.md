---
name: audit-log-policy
description: Single source of truth for the append-only workflow audit log format shared by every Specs and Implementation workflow agent.
---

# Audit Log Policy

Single source of truth for the `docs/specs/{JIRA_KEY}/audit.log` format. Every agent that
produces a workflow artifact appends its own entry here rather than restating this policy.

## Rule

**File**: `docs/specs/{JIRA_KEY}/audit.log` — **APPEND ONLY**.

**CRITICAL**: ALWAYS use Edit/append to add entries. NEVER overwrite the entire file. If the
file does not yet exist, create it with the new entry as the first line.

## Entry Format

```
## {workflowId} | {ISO-8601-timestamp} | {agent-name}
Decision: {key decision made}
Output: {output artifact path}
Warnings: {warnings or fallbacks | none}
```

`{agent-name}` is the appending agent's own name (e.g. `jira-analyst`, `tech-researcher-story`).
`Decision`, `Output`, and `Warnings` are agent-specific — each agent defines what it records
there; this skill only owns the shared file rule and entry shape.

## Correlation

The `workflowId` field ties every entry back to a specific workflow run — it's the same ID
used in the SPEC/CONTEXT frontmatter and the workflow state file. `/mep:review-harness-health`
correlates `docs/specs/METRICS.md` rows to audit entries via this field.

## Who Appends

Every agent that produces an artifact (Jira Analyst, Tech Researcher variants, Specs Writer
variants, Spec Reviewer) appends its own entry immediately after producing that artifact. An
orchestrator additionally appends entries for decision points that no subagent owns (e.g. user
overrides, gate outcomes) — see the orchestrator's own workflow steps for exactly when.
