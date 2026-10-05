---
agent: 'Specs Workflow Orchestrator'
description: 'Generate implementation-ready Specs from Jira tickets using the multi-agent orchestrator'
argument-hint: '<JIRA_KEY> [--review-context]'
---

# Create Specs

Run the Specs Workflow for a Jira ticket.

```bask
/mep:create-specs HON-123
/mep:create-specs HON-123 --review-context
```

| Flag | Effect |
| ------ | -------- |
| `--review-context` | After research, pause on a Research Summary (impacted modules, approach, shared libs, top risk) so you can correct the CONTEXT before the Spec is written. Use for complex tickets; omit for well-specified ones. |

Input: `$ARGUMENTS`. Store `--review-context` in `options.reviewContext`, then execute your workflow from Step -1 (session resume check).
