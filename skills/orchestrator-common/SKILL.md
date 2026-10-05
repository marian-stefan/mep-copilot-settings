---
name: orchestrator-common
description: Common session-resume and state-initialization patterns shared by specs-workflow-orchestrator and implementation-workflow-orchestrator.
---

# Orchestrator Common Patterns

Extracted patterns to eliminate duplication between the two workflow orchestrators' Step -1 (Session Resume Check) and Step 0 (Initialize Workflow). Both orchestrators read/write their state file directly with their own Read/Write tools — this skill owns the shared *procedure*, not a shared implementation mechanism or script.

## Session Resume Check Procedure

**Parameters** (set by the calling orchestrator):
- `workflowType` — `specs-generation` | `implementation`
- `stateFilePath` — `docs/specs/{JIRA_KEY}/specs-workflow-state.yml` or `docs/specs/{JIRA_KEY}/implementation-workflow-state.yml`
- `resumableStates` / `terminalStates` — the workflow-specific lists (see that workflow's own state-machine skill § Resumable vs Terminal States; the two lists are not identical between workflows — do not assume symmetry)

**Procedure**:

1. Check for `stateFilePath`.
2. If the file does **not** exist → proceed to Workflow State Initialization (new run).
3. If the file **exists**, read it and inspect `currentStep`:
   - **`currentStep` in `resumableStates`**:
     - Display:
       ```
       A previous {workflow label} run was found for {JIRA_KEY}.
       State: {currentStep} | Started: {startedAt} | Last updated: {updatedAt}
       Resume from where it left off, or start fresh?
       [R]esume / [S]tart fresh
       ```
     - **Resume**: restore state from the file and re-enter at the interrupted step. If `pauseReason` is set, re-display the appropriate gate UI. Apply the workflow's own Resume Decision Table from its state-machine skill.
     - **Start fresh**: archive the existing state file to `docs/specs/{JIRA_KEY}/archive/{state-file-basename}-{timestamp}.yml`, delete any stale draft artifacts from the interrupted run (which files count as "stale drafts" is workflow-specific — defined in that workflow's own Step -1), then proceed to Workflow State Initialization.
   - **`currentStep` in `terminalStates`**:
     - Display history summary (`workflowId`, outcome, timestamp).
     - Offer "Start fresh?" — on confirmation, archive the state file (and delete stale drafts per the workflow's own rule), then proceed to Workflow State Initialization.

## Workflow State Initialization

**Procedure**: Write the initial state file at `stateFilePath` with at minimum:

- `workflowId` — format `wf-{JIRA_KEY}-{YYYYMMDDTHHmmssZ}` (see `skills/specs-workflow-state-machine/SKILL.md` § Canonical workflowId Format — the format is shared by both workflows; `workflowType` disambiguates them)
- `workflowType`
- `currentStep` — that workflow's initial step
- `startedAt`
- the workflow-specific fields defined in that workflow's own state schema (`skills/specs-workflow-state-machine/SKILL.md` or `skills/implementation-workflow-state-machine/SKILL.md` § State Schema)

## Subagent Dispatch

Subagents are stateless: they can't read the orchestrator's state or conversation. Pass every field listed in the callee's `## Inputs` section, pass file **paths** rather than pasted contents, and expect exactly the callee's `## Outputs`. Orchestrators name the fields they pass; the callee's agent file is the contract. Validate that the output is non-empty and carries the fields the next step needs before acting on it.

## State Write Protocol

**Usage counters** (shown in the COMPLETE summary so budget use is visible): on every subagent dispatch, increment `usage.subagentRuns.{agent name}`; on every user pause, increment `usage.userPauses`. The implementation workflow also increments `usage.fixPasses` on every Feature Implementer call that carries a `fixRequest`.

On every transition and every pause, write the state file: set `currentStep` and `previousStep`, append the step just left to `completedSteps`, refresh `updatedAt`, keep `resumable: true` (set `false` only on a terminal state), set `pauseReason` + `pendingDecision` when pausing and clear them on resolution. On an error set `errors.hasErrors`, `errors.errorType`, `errors.errorMessage`. The fields each step fills are listed in that workflow's state schema; orchestrators name them, not re-print them.

## Usage in Orchestrators

Replace the orchestrator's own Step -1 and Step 0 prose with a pointer, keeping only the workflow-specific parameters inline:

```markdown
### Step -1: Session Resume Check

Procedure: `skills/orchestrator-common/SKILL.md` § Session Resume Check Procedure, with
`workflowType: {specs-generation|implementation}`, `stateFilePath: docs/specs/{JIRA_KEY}/{...}`,
and `resumableStates`/`terminalStates` from this workflow's own state-machine skill.

### Step 0: Initialize Workflow

Procedure: `skills/orchestrator-common/SKILL.md` § Workflow State Initialization, with
this workflow's own initial-state fields (below).
```
