# Architecture

Deeper workflow mechanics for this harness, complementing README.md's quick-start and
command reference. See README.md first for setup, the command table, and how the
tech-layer skills-plus-instructions mechanism works.

## Specs Workflow: INIT → ANALYZE → ROUTE → RESEARCH → GENERATE → VALIDATE → COMPLETE

`specs-workflow-orchestrator.agent.md` coordinates five specialist agents. Issue type
(Epic / Spike / Story / Task / Bug / Regression Bug) determines routing via the matrix in
`skills/specs-workflow-routing/SKILL.md`.

Artifacts are written to `docs/specs/{JIRA_KEY}/`:

- `BRIEF-{KEY}.md` — produced by Jira Analyst
- `CONTEXT-{KEY}.md` — produced by Tech Researcher
- `SPEC-{KEY}.md` (or `SPEC-{KEY}-Epic.md` / `SPEC-{KEY}-Spike.md`) — produced by Specs Writer

The workflow has user-facing gates that pause for human input:

- **G gate (Orientation)** — After the BRIEF is produced, a one-line summary shows the planned route (issue type, routing decision, complexity estimate). Confirm or correct before research begins; the pause is skipped for unambiguous `minimal` Story-family tickets.
- **C gate (Ambiguity) and Pattern Selection** — If the Tech Researcher records blocking assumptions or ticket ambiguities, or implementation-pattern-discovery finds 2+ candidate patterns for the same problem shape, the workflow pauses **once** for all of these decisions. Blocking assumptions are confirmed, corrected, or sent back for a CONTEXT revision, and a pattern is picked. The orchestrator writes simple resolutions itself and makes at most one Revision Mode call to the researcher. Non-blocking assumptions flow to the Spec Writer as Open Questions without blocking. See `skills/implementation-pattern-discovery/SKILL.md`.
- **E gate (Review Context Approval)** — Active only when `--review-context` is passed. After research completes, a Research Summary is presented. Provide feedback to trigger a localised CONTEXT revision (Revision Mode), or approve to continue to spec generation.

Quality scoring and the `qualityBucket` (proceed / iterate / abort) decision that controls the VALIDATE → COMPLETE transition are owned by `skills/specs-quality-review/SKILL.md`.

## Complexity Assessment & Ambiguity Detection

Tech Researchers run two-stage complexity classification:

- **Stage 1** (BRIEF-only signals): AC count, issue type, parent Epic presence, keyword signals → `minimal` | `standard` | `comprehensive`
- **Stage 2** (post-scope escalation): shared library paths, domain tag counts, cross-domain span — can only escalate, never de-escalate Stage 1 result

Research depth is proportional to the final `complexityLevel`. Before running broad codebase analysis, Tech Researchers also enumerate the top 3–5 architectural assumptions from the Requirement Brief and scope-narrowing results. These flow into the `assumptions` frontmatter of the CONTEXT file and drive the C gate.

## Session Resume & Workflow State

Both workflows support resuming interrupted runs. Re-running `/mep:create-specs` or
`/mep:start-implementation` for a key that has an incomplete prior run prompts:

```markdown
A previous workflow run was found for {JIRA_KEY}.
State: {currentStep} | Started: {startedAt} | Last updated: {updatedAt}
Resume from where it left off, or start fresh?
[R]esume / [S]tart fresh
```

Workflow state is persisted in:

- Specs: `docs/specs/{JIRA_KEY}/specs-workflow-state.yml`
- Implementation: `docs/specs/{JIRA_KEY}/implementation-workflow-state.yml`

On completion, state files are archived to `docs/specs/{JIRA_KEY}/archive/`. Resumable states: `analyze`, `route`, `research`, `generate`, `validate`, `paused` (specs); `preflight`, `reconcile`, `implement`, `review`, `commit` (implementation). Terminal states (`complete`, `aborted`, `terminated`, `error`) are not resumable — start fresh after displaying a history summary.

All workflow IDs use the format `wf-{JIRA_KEY}-{YYYYMMDDTHHmmssZ}`. The format is identical for both specs and implementation runs; the `workflowType` field in the state file disambiguates them.

See `skills/specs-workflow-state-machine/SKILL.md` and
`skills/implementation-workflow-state-machine/SKILL.md` for the complete state schemas,
resume decision tables, and pause reasons of each workflow.

## Audit Log

Every agent that produces an artifact appends an entry to `docs/specs/{JIRA_KEY}/audit.log` (append-only — never overwrite). Entries follow the format:

```markdown
## {workflowId} | {ISO-8601-timestamp} | {agent-name}
Decision: {key decision made}
Output: {output artifact path}
Warnings: {warnings or fallbacks | none}
```

The `workflowId` field in audit entries and in SPEC frontmatter enables `/mep:review-harness-health` to correlate spec outcomes with specific workflow runs.

## Implementation Workflow: PREFLIGHT → RECONCILE → IMPLEMENT → REVIEW → COMMIT

RECONCILE checks the original SPEC against current code and requirements, then persists a shared effective-requirements contract after confirming any inline corrections (`implementation-requirement-reconciliation`). The original digest remains the scope/accuracy baseline. IMPLEMENT sequences **Feature Implementer**, which writes authorized source and companion tests, and **Test Generator**, which extends tests and runs affected consumer targets without gaining extra edit permissions. Coverage, dependency evidence, merging and budgets are owned by `implementation-rules` § 3.1 / § 3.3.

REVIEW coordinates three independent reviewers: **Code Reviewer** for mechanical correctness, **Rubber Duck Reviewer** for critique/regressions, and **Goal Verifier** for effective ACs and the original ticket goal. Applicable checks run in parallel under the existing eligibility rules; fixes invalidate dependent evidence regardless of which gate failed. Reuse requires explicit provenance (`implementation-rules` § 3.6; state schema in `implementation-workflow-state-machine`). Rubber Duck findings merge into the code-review gate; goal findings use their own gate, sharing the review retry cap. The orchestrator dispatches them directly because VS Code subagents cannot nest by default; standalone code review still dispatches Rubber Duck itself.

Before COMMIT, the orchestrator verifies current test/build/review evidence. Spec accuracy compares changed files with the immutable original digest, while the retrospective separately reports approved corrections and effective-goal verification. CONTEXT revisions and version-bound research checkpoints belong to the Specs orchestrator (`specs-workflow-state-machine` § Context Mutation Checkpoint). Schemas and controlled verification cases are indexed in `docs/SCHEMAS.md`.

## Lessons System

The implementation workflow captures corrections as reusable lessons, written to a
module-scoped or workspace-level `lessons.md` file and re-injected as context at PREFLIGHT. The
`{{MODULE_LESSONS_PATH}}` resolution algorithm, lesson format, and capture triggers are owned by
`skills/implementation-lessons-system/SKILL.md`.

## Steering / Feedback Loop

```markdown
/mep:create-specs → spec → /mep:accept-spec or /mep:reject-spec → METRICS.md → /mep:review-harness-health → guide improvement
```

`/mep:reject-spec` categorizes failures by reason code. After 5+ signals, `/mep:review-harness-health` reads `docs/specs/METRICS.md`, identifies the top failure mode (wrong-requirements / wrong-architecture / wrong-api-contracts / missing-edge-cases), reads the responsible guide file, and proposes a targeted change.

## Single Sources of Truth

When multiple files could define a rule, defer to the canonical owner:

| Topic | Owner file |
| ------- | ----------- |
| Session resume / state initialization (both workflows) | `skills/orchestrator-common/SKILL.md` |
| METRICS.md schema, row types, section maps, session-info rule | `skills/spec-metrics-log/SKILL.md` |
| Finding severity vocabulary and risk rating (Code Reviewer, Rubber Duck mapping) | `agents/code-reviewer.agent.md` § Severity Vocabulary |
| Coverage rules, evidence merging, execution scope and fix budget | `skills/implementation-rules/SKILL.md` § 3.1 / § 3.3 |
| Test/coverage result shape | `agents/test-generator.agent.md` § Output Contract |
| Independent critique + regression check | `agents/rubber-duck-reviewer.agent.md` |
| Independent review invalidation and scoped reuse | `skills/implementation-rules/SKILL.md` § 3.6 |
| `{{TOKEN}}` registry and runtime resolution from the tech layer's `{stack}-stack-profile` | `skills/stack-profile/SKILL.md` |
| Tech Researcher shared procedures (research skeleton, file constraints, Jira policy, Revision Mode, validation) | `skills/tech-researcher-common/SKILL.md` |
| Specs Writer pre-flight, frontmatter sources, assumption mapping, revision input, file creation | `skills/specs-writer-common/SKILL.md` |
| Test Generator standalone change discovery | `skills/test-change-discovery/SKILL.md` |
| Testing conventions (universal + stack routing) | `skills/testing-practices/SKILL.md` |
| Security practices (universal + stack routing) | `skills/security-practices/SKILL.md` |
| Routing and artifact naming | `skills/specs-workflow-routing/SKILL.md` |
| Validation gates and quality scoring | `skills/specs-quality-review/SKILL.md` |
| Technical Context validation | `skills/specs-validation/SKILL.md` |
| Error taxonomy and templates | `skills/specs-error-handling/SKILL.md` |
| Audit log format and append policy | `skills/audit-log-policy/SKILL.md` |
| Lessons file resolution, format, and capture triggers | `skills/implementation-lessons-system/SKILL.md` |
| Implementation pattern discovery and Pattern Selection Gate | `skills/implementation-pattern-discovery/SKILL.md` |
| Build verification strategy | `skills/build-verification/SKILL.md` |
| Implementation workflow state schema and resumption | `skills/implementation-workflow-state-machine/SKILL.md` |
| Trimble API Standard compliance (endpoint shape) | `skills/trimble-api-standard-compliance/SKILL.md` |
| Requirement reconciliation gate and effective requirement semantics | `skills/implementation-requirement-reconciliation/SKILL.md` |
| Goal verification gate (REVIEW, orchestrator side) | `skills/implementation-goal-verification-gate/SKILL.md` |
| Goal verification procedure (Goal Verifier agent) | `skills/implementation-goal-verification/SKILL.md` |
| Subagent dispatch convention, State Write Protocol | `skills/orchestrator-common/SKILL.md` |
| User-facing workflow report templates | `skills/workflow-report-templates/SKILL.md` |
| Review scope and "small change" rule | `skills/implementation-rules/SKILL.md` § 3.5 |
| Implementation rules | `skills/implementation-rules/SKILL.md` |
| Specs state, CONTEXT mutation checkpoints and resumption | `skills/specs-workflow-state-machine/SKILL.md` |
| Complexity classification | `skills/specs-complexity-assessment/SKILL.md` |
| Assumption registry and blocking conditions | `skills/specs-ambiguity-detection/SKILL.md` |
| Fix approach evaluation (Bug / Regression Bug) | `skills/specs-fix-approach-evaluation/SKILL.md` |
| Mermaid diagram syntax validation | `skills/mermaid/SKILL.md` |
| Spec section templates (Story / Task / Bug) | `skills/specs-generation-story/SKILL.md` |
| Spec section templates (Epic) | `skills/specs-generation-epic/SKILL.md` |
| Spec section templates (Spike) | `skills/specs-generation-spike/SKILL.md` |
| Regression commit investigation procedure | `skills/regression-commit-investigation/SKILL.md` |
