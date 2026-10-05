---
agent: 'Implementation Workflow Orchestrator'
description: 'Implement the solution defined in a validated Spec document, with pre-flight quality check, plan reconciliation, local review, goal verification, spec accuracy signal, and guided commit.'
argument-hint: '[JIRA_KEY]'
---

# Start Implementation

Run the Implementation Workflow for the given Spec.

```bash
/mep:start-implementation            # with the SPEC file attached
/mep:start-implementation HON-123    # resolves docs/specs/HON-123/SPEC-HON-123*.md
```

Input: `$ARGUMENTS` (a Jira key), or the attached SPEC file. Execute your workflow from Step -1 (session resume check).
