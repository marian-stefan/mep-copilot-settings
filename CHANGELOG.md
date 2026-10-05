# Changelog

Notable changes to the harness. Adopters: read **Changed** and **Removed** before updating.

## Unreleased

### Added (agent plugin)

The harness is packaged as a **VS Code agent plugin** named `mep` (Open Plugin format, `.plugin/plugin.json`), installed from this repository (README § Installation).

- **Layout.** `agents/`, `commands/` (`{name}.md` → `/mep:{name}`), `skills/`, `rules/`, `hooks/` (`hooks.json` plus Tool Guardian) and `.mcp.json` (`etools`). The dotnet tech layer's skills live in `skills/dotnet-*` and its rules in `rules/dotnet-*.instructions.md`; its notes page is `docs/tech-layers/dotnet.md`.
- **Commands are namespaced.** Slash commands are `/mep:<name>` (for example `/mep:create-specs`). Files under `commands/` must not use a `.prompt.md` suffix.
- **Tech layers are a naming convention.** A plugin discovers only immediate children of `skills/` and files in `rules/`, so a layer is every skill `{slug}-*` plus `rules/{slug}-*.instructions.md`. Each layer ships its review template as `{stack}-code-review-output` so layers cannot collide.
- **`/mep:init-ai-workflows`** records the active tech layer and project identity (Jira prefix, Bitbucket project/repo, default branch) in the repository's `.github/copilot-instructions.md` and installs nothing. `/mep:review-pr` and `/mep:fix-pr` read the Bitbucket coordinates from that file at run time and ask when they are `not set`. The `stack-profile` skill resolves the active stack from the same file.
- **`/mep:generate-tech-layer` has two targets.** Inside this repository (`.plugin/plugin.json` named `mep`) it writes `skills/`, `rules/` and `docs/tech-layers/`; anywhere else it writes a team-local layer to `.github/skills/` and `.github/instructions/`.
- **Tool Guardian** is registered by `hooks/hooks.json` and locates its script through `${PLUGIN_ROOT}`. Only the Open Plugin format expands that token in hook commands; Agent Plugins v1 and plain Copilot plugins do not. Verified in VS Code Chat only — see `hooks/tool-guardian/README.md` for other hosts.
- **Tooling.** `scripts/harness.mjs` checks the plugin manifest, `.mcp.json`, `hooks/hooks.json`, rules without `applyTo` and `.prompt.md` command files.

**Verified in VS Code Chat (manual run):** plugin load, `/mep:*` commands, `/mep:init-ai-workflows`, skill lookup, Tool Guardian blocking, rule `applyTo`, and `/mep:create-specs` with `etools`.

**Not yet verified:** team-wide enablement through `enabledPlugins`, and hook execution outside VS Code Chat (agents window, Copilot CLI, cloud agent).

### Verified (Combined Remediation)

- Add repeatable static cross-stage contract checks to CI alongside the executable Tool Guardian process tests. Static checks do not establish live workflow behavior; controlled fixture procedures and unverified gates are recorded in `CONTRIBUTING.md`.
- Record a restricted Copilot CLI hook-discovery event; subsequent shell execution was denied by CLI permissions, not verified as successful.
- Publish pinned, all-Markdown size comparisons in `docs/CONVENTIONS.md`: Stages 1-5 guidance totals 427,700 bytes versus main's 367,562 (+16.4%), despite a smaller agents/prompts subtotal. No runtime cost reduction is claimed; matched adopter benchmarks remain unverified.

### Fixed (CONTEXT Revision Checkpoints)

- Finalize validation and `contextVersion` after every CONTEXT mutation, including localized feedback, direct assumption resolutions and pattern selection; record checkpoints before the next pause or transition.
- Keep workflow-state writes in the orchestrator. Researchers finish the current validation summary before returning; failed validation cannot resolve decision gates or reach GENERATE.
- Persist pending mutations for interrupted-write recovery. External edits invalidate stale validation/approvals but are preserved for revalidation rather than silently overwritten by fresh research.

### Fixed (Independent Review Freshness)

- Replace gate-failed-only review reruns with dependency-aware invalidation. Code review checks every fix; eligible goal and regression checks refresh affected evidence, including previously satisfied ACs and unchanged consumers.
- Pass full prior results through `reviewContext` and preserve per-check provenance in `reviewEvidence`. Update orchestrator, reviewer contracts, state and tech-layer output guidance together; standalone review output is unchanged.
- Recheck freshness on resume and before acting on commit confirmation. Preserve small-change eligibility and the shared review retry cap; scoped nits retain only proven-current results, and stale/missing reviews cannot become accepted gaps at the cap.

### Fixed (Consumer Tests and Coverage Evidence)

- Run affected downstream consumer tests in implementation subagent and fix passes without expanding edit permissions.
- Replace Test Generator aggregate percentages with target results, dependency/run identities, changed-line/branch counters, and comparable repository coverage evidence. Adopters consuming the old result shape must update with the orchestrator and state schema.
- Merge evidence before gates; invalidate dependent results, preserve valid untouched entries, and block on unavailable baseline/required targets instead of inferring a pass. Document zero-denominator, exclusion, resume, and report-parsing rules.

### Fixed (Requirement Corrections)

- Persist `artifacts.effectiveRequirements` and pass it to Feature Implementer, Test Generator, and Goal Verifier on initial, fix, and resumed runs. It replaces implementer-only correction inputs and the Test Generator's separate AC input.
- Confirm normalized corrections at reconciliation; retain the original SPEC digest, file-scope authorization, and ticket-goal comparison. Recover older corrected state through confirmation, not silent fallback.
- Report approved corrections separately from original-spec accuracy. Corrected requirements do not qualify for the small-change Goal Verifier skip.

### Fixed (Tool Guardian)

- Read Copilot's `toolArgs` payload, decode serialized arguments, and scan only command fields. Legacy `toolInput` and snake-case payloads remain supported.
- Move the manifest to `.github/hooks/tool-guardian.json` for CLI/cloud-agent discovery. Adopters must remove the previous nested manifest when upgrading.
- Add process-level hook regression tests to CI. Live host discovery remains a separate smoke check.

### Changed (measure)
- Tech Researcher (Story) under the 12 KB budget: the Regression Analysis template now points to `regression-commit-investigation`. Removed the Revision Mode steps that told the researcher to write workflow state, which it isn't allowed to do.
- `docs/CONVENTIONS.md` § Model policy explains how to measure a model change (credit usage, quality protocol, cost-tier limit).

### Changed (guardrails)
- **Rubber Duck dispatch**: VS Code subagents can't call subagents by default, so in `/start-implementation` the orchestrator now runs Code Reviewer, Rubber Duck and Goal Verifier in parallel. The Code Reviewer accepts `rubberDuck: external` (replaces `rubberDuck: auto`) and returns `publicSurfaceChanged` (replaces `rubberDuckSkipped` in the tech layer's `code-review-output` compact template — regenerate other tech layers accordingly).
- `agents:` allowlists on both orchestrators and the Code Reviewer. Handoffs removed from `user-invocable: false` agents; the Specs orchestrator offers a "Start implementation" handoff.
- Code Reviewer gains `web/fetch` (needed for the Trimble API Standard).
- `harness.mjs lint` checks the agent graph, pause-reason enums, change-log markers, harness-internal relative links and tool heuristics, with tiered size budgets. It runs in GitHub Actions (`harness-lint.yml`, harness repo only) and via `scripts/pre-commit`.

### Changed (latency)
- Specs workflow: blocking assumptions and the implementation-pattern choice are asked in **one** pause (`pauseReason: research-decisions`, replacing `ambiguity-gate` / `pattern-selection-gate`; old values resume as the new one), with at most one researcher Revision Mode call.
- Implementation fix passes are scoped: the Test Generator gets `focusFiles`, builds use `{{AFFECTED_BUILD_COMMAND}}`, and the full-scope build runs once per workflow.
- Code Reviewer fix iterations re-fetch the Trimble API Standard only when an endpoint changed.
- Both COMPLETE summaries report `usage` (subagent runs, fix passes, pauses).

### Removed
- `google-docs-extraction` skill. The Jira Analyst lists linked documents under `Referenced Documents` instead of extracting them.
- `specs-generation` index skill (unreferenced; writers load `specs-generation-{story,epic,spike}` directly).
- `specs-subagent-invocation` skill (unreferenced); its rule is now `orchestrator-common` § Subagent Dispatch.
- `handoffs` from both orchestrators (manual buttons duplicating the automated flow).

### Added
- `workflow-report-templates` skill: report/confirmation/retrospective templates, loaded only at the step that prints them.
- `test-change-discovery` skill: Test Generator standalone-mode discovery, not loaded in subagent mode.

### Changed
- Orchestrators became dispatchers; `/create-specs` and `/start-implementation` are thin launchers. Earlier notes reported intermediate file sizes (implementation 29.4 → 11.9 KB, specs 26.2 → 10.4 KB) without pinned revisions; these are not current sizes, a comparison against main, or measured runtime savings. Implementation steps are renumbered (RECONCILE = Step 2 … COMPLETE = Step 6); cross-references use step names.
- Earlier notes reported Test Generator 14.5 → 7.6 KB as an unpinned intermediate file-size snapshot, not measured per-invocation usage. Researchers share one Research Skeleton (`tech-researcher-common`); all three reuse the orchestrator's Stage 1 `complexityLevel`. The Regression Commit Investigation step is `2e`.
- `implementation-rules` § 3.5 owns the review-scope "small change" rule; `orchestrator-common` owns the State Write Protocol; `specs-writer-common` owns Assumption Mapping and the `revisionInput` shape.
- Feature Implementer accepts `fixRequest` (test / build / review / goal fixes) and `approvedScope`, and blocks with `blockedReason: scope-expansion` before editing files outside the SPEC's file set.
- Coverage gaps and unmapped acceptance criteria are sent to the Test Generator only (`focusGaps`).
- Every implementation subagent declares an Inputs/Outputs contract; orchestrators dispatch by field list instead of pseudo-code.
- RECONCILE fast path is owned by `implementation-requirement-reconciliation`.
- REVIEW-driven re-entries into IMPLEMENT do not consume the IMPLEMENT budget (`implementation-rules` § 3.3).
- State: `goalVerification.iterationsUsed` removed (use `review.reviewIterations`); `implement.approvedScope` added.
- Tool grants: prompts that run as a named agent inherit its tools; `/fix-pr` and `/snippet` no longer run as the Code Reviewer.
- `/init-ai-workflows` cleanup only lists and deletes verified harness files.
