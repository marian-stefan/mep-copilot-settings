---
name: test-change-discovery
description: Standalone-mode procedure for the Test Generator (/mep:create-tests or direct agent pick) — find the spec's acceptance criteria from the branch name, resolve the current branch's changed sources against a base branch, trace consumers, and handle dry-run and user questions. Not used in subagent mode, where the orchestrator passes changedFiles.
---

# Test Change Discovery (standalone mode)

Loaded by `agents/test-generator.agent.md` only when it is **not** invoked with `mode: subagent`. It produces the target list that the agent's shared Core Workflow then tests.

## 1. Spec acceptance criteria (optional)

1. Detect the Jira key from the current branch name (`[A-Z]+-\d+`, e.g. `feature/HON-38287` → `HON-38287`).
2. If found, read the first `docs/specs/{KEY}/SPEC-{KEY}*.md`: Section 1 (Acceptance Criteria) and, for Bug / Regression Bug, the root-cause statement that opens Section 2.
3. No key or no spec → skip silently.

## 2. Change-set resolution

1. Base branch = the user's argument, default `develop`.
2. Fork point = `git merge-base HEAD <base-branch>`.
3. Changed set = `git diff --name-status <fork-point>...HEAD`, keeping only files introduced by this branch's commits.
4. Drop non-production targets: test files, snapshots, generated files, docs-only changes.
5. Map each remaining source to its expected test path (`{{TEST_FILE_GLOB}}`).

If the fork point or diff can't be resolved, stop and ask for a valid base branch or an explicit file list.

## 3. Consumer tracing

For each changed source, text-search the workspace for importers and add their test paths to the work list. "Affected projects" = the directly changed projects plus their downstream dependents from the build system; run tests for all of them.

## 4. Interaction rules

- A conflict between general best practice and local test conventions → stop and ask which to follow.
- Run test commands in the active/shared terminal (foreground). If it is unavailable, ask before using another terminal.
- **Dry-run**: skip writes and test runs; output a file-level plan.

## 5. Output

The six-item summary defined in `commands/create-tests.md` § Output Format.
