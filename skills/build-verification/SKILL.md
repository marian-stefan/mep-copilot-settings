---
name: build-verification
description: Generic build-verification strategy for the IMPLEMENT step — affected-scope builds during iteration, full-scope only at the exit gate, and token-efficient error handling. Concrete build commands are supplied by the active tech layer.
---

# Build Verification

> **Stack tokens**: `{{TOKEN}}` names in this file are symbolic — resolve them at runtime from the installed `{stack}-stack-profile` skill (registry: `skills/stack-profile/SKILL.md`). Never substitute them into files.

## Purpose

Verify that code compiles successfully after implementation and tests pass. Catches compilation errors that tests might miss (missing imports, type errors, dependency issues).

## Critical Rule

**Never skip build verification for a component with no standalone build target.** When a non-buildable component changes, build whatever consumes it instead — determined by the active tech layer's dependency graph (`{{DEPENDENCY_GRAPH_COMMAND}}`). Skipping entirely can miss breaking changes in downstream consumers.

## Build Scope Strategy

- **During iteration** (fixing a failing build): use the tech layer's `{{AFFECTED_BUILD_COMMAND}}` — scoped to the changed component(s) only. Never run a full-scope build on every fix attempt.
- **At the exit gate** (the first time IMPLEMENT hands over to REVIEW): run the tech layer's `{{BUILD_COMMAND}}` once, at full scope, as the final confirmation.
- **Later fix passes** (any IMPLEMENT re-entry after that, including REVIEW-driven ones): verify with `{{AFFECTED_BUILD_COMMAND}}` for the files the pass changed. Re-run the full-scope build only if the pass changed a public surface or a `{{SHARED_LIB_PATH_PREFIX}}` path.
- If the changed component has no standalone build target: use the dependency graph to find and build whatever consumes it. Only skip entirely when the graph confirms nothing depends on it — log that explicitly (e.g. "No consumers affected by {component} changes; build verification skipped").

## Error Extraction

Never read a full build log. Parse stdout/stderr for compiler error lines only (file path, line number, error code, message) and extract just those. The exact error-code taxonomy (e.g. `CS####` for .NET, `TS####` for TypeScript) and common-error/fix tables live in the active tech layer's `{stack}-patterns/SKILL.md`.

## Error Handling

- **Build succeeds**: continue to REVIEW. No user notification needed. Log what was built.
- **Build fails**: this is `BUILD_FAIL` — the fix budget and loop-control numbers are owned by `skills/implementation-rules/SKILL.md` § 3.3 Loop Control. Do not restate the iteration cap here.
- **Build timeout**: if the build takes more than 5 minutes, warn the user and continue waiting. If it exceeds 10 minutes, treat it as `BUILD_FAIL`.

## Output Optimization Rules

Never read large generated or vendor output in full (token waste) — scope first, then read:
- Vendor/minified bundles (e.g. `node_modules/**`) → extract only the matching lines with `grep`, never `cat` the whole file.
- Structured coverage reports → use a JSON/XML parser or the reporter's query tool to emit scoped counts/gaps and compact comparison evidence (`implementation-rules` § 3.1.1), never load the whole report into context or infer counters from percentage-only stdout.
- Rendered HTML coverage reports → use the tool's stdout summary or a scoped `grep`, not the HTML file.

## Performance Optimization

- Prefer incremental/affected builds over full rebuilds during iteration (concrete flags come from the tech layer).
- Cache build artifacts between iterations where the toolchain supports it.
- If multiple independently-buildable components changed, build them in parallel and report the first failure immediately rather than waiting for all to finish.

## Integration with Workflow

**Called from**: `agents/implementation-workflow-orchestrator.agent.md` § IMPLEMENT, after tests pass and the Coverage Contract (`implementation-rules` § 3.1) is met.

**Procedure**:
1. Run build verification per the Build Scope Strategy above.
2. Build succeeds → proceed to REVIEW.
3. Build fails → apply `skills/implementation-rules/SKILL.md` § 3.3 Loop Control (fix budget, then PAUSE for a manual-fix/abort decision on exhaustion).
