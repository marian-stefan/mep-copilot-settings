---
name: specs-workflow-state-machine
description: Control-flow state machine and transition view for the Specs workflow.
---

# Specs Workflow State Machine

This skill visualizes workflow control flow only.
Canonical rule sources:

- Routing and artifact naming: `.github/skills/specs-workflow-routing/SKILL.md`
- Technology plugin and reviewer routing: `.github/skills/specs-technology-routing/SKILL.md`
- Validation/scoring policy: `.github/skills/specs-validation/SKILL.md`
- Error taxonomy and templates: `.github/skills/specs-error-handling/SKILL.md`
- Step orchestration and guards: `.github/agents/specs-workflow-orchestrator.agent.md`

## Full Control-Flow View

```mermaid
stateDiagram-v2
    [*] --> INIT: User invokes with Jira key
    INIT --> ANALYZE

    state ANALYZE {
        [*] --> InvokeJiraAnalyst
        InvokeJiraAnalyst --> ReceiveBrief
        ReceiveBrief --> ValidateBrief
        ValidateBrief --> [*]
        ValidateBrief --> ERROR_ANALYZE
    }

    ANALYZE --> ROUTE
    ROUTE --> RESOLVE_TECH_PLUGIN
    RESOLVE_TECH_PLUGIN --> RESEARCH

    state RESEARCH {
        [*] --> InvokeTechResearcher
        InvokeTechResearcher --> ReceiveContext
        ReceiveContext --> ApplyValidationGates
    }

    RESEARCH --> GENERATE: Context accepted
    RESEARCH --> ERROR_RESEARCH: Validation reject

    state GENERATE {
        [*] --> InvokeSpecsWriter
        InvokeSpecsWriter --> ReceiveSpec
        ReceiveSpec --> VerifySpecFile
        VerifySpecFile --> [*]
        VerifySpecFile --> ERROR_GENERATE
    }

    GENERATE --> VALIDATE

    state VALIDATE {
        [*] --> InvokeReviewer
        InvokeReviewer --> ReceiveReviewerDecision
        ReceiveReviewerDecision --> DecideTransition

        state DecideTransition {
            [*] --> CheckBucket
            CheckBucket --> Proceed: qualityBucket=proceed
            CheckBucket --> Iterate: qualityBucket=iterate
            CheckBucket --> Abort: qualityBucket=abort
        }

        DecideTransition --> [*]
    }

    VALIDATE --> COMMIT: proceed
    VALIDATE --> GENERATE: iterate (within limit)
    VALIDATE --> ERROR_VALIDATE: abort

    state COMMIT {
        [*] --> RunPreCommitGuards
        RunPreCommitGuards --> InvokeGitOperator
        RunPreCommitGuards --> ERROR_COMMIT
        InvokeGitOperator --> [*]
    }

    COMMIT --> COMPLETE
    COMPLETE --> [*]: Success
```

## Notes

- Numeric scoring thresholds are intentionally not defined in this skill.
- Agent IO contracts are intentionally not defined in this skill.
- If control flow conflicts with canonical sources, canonical sources win.
