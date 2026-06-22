---
name: implementation-rules
description: Canonical implementation rules for the IMPLEMENT step of the Implementation Workflow Orchestrator. Single source of truth for pre-implementation validation, controlled implementation, and definition of done.
---

# Implementation Rules

This skill is the **single source of truth** for the IMPLEMENT step. The orchestrator (`.github/agents/implementation-workflow-orchestrator.agent.md`) and the user-facing prompt (`.github/prompts/start-implementation.prompt.md`) both reference this file.

> If these rules need to change, update this skill first — then validate the orchestrator's Step 2 contract remains consistent.

Act as a **Senior Software Engineer** and use the spec file as the **absolute source of truth**.

## 1. Pre-Implementation Validation

- **Repo Analysis:** Validate the implementation plan in the spec against the existing code in the repository before writing code.
- **Strict Consistency:** Ensure the plan adheres to the existing tech stack, naming conventions, and patterns found in the repo.
- **Conflict Resolution:** If the spec's plan is insufficient, contradicts the existing architecture, or misses a superior existing utility, **stop** and ask for clarification or propose an alternative that fits the current system.

## 2. Controlled Implementation

- **Location Intelligence:** Determine the appropriate file(s) based on the repository structure and spec details. Create new files or modify existing ones as needed.
- **File Tracking:** Maintain a running list of every file created or modified. Do NOT include the spec file itself — only source, test, and config files produced by the implementation.
- **Technology Lockdown:** Use ONLY the languages, frameworks, and library versions already established in the repository. Do not introduce new dependencies.
- **Config Adherence:** Follow all repository configurations exactly. The code must pass all existing linting and formatting rules.
- **Zero Hallucinations:** Implement exactly what is defined. If a dependency or internal utility is missing from both the spec and the repo, do not invent it — ask for the correct location.

## 3. Verification & Definition of Done

- **Test Generation:** Create a comprehensive test suite using the repository's existing testing framework, matching the style and structure of current tests. Follow `.github/instructions/testing.instructions.md`.
- **Execution:** Run tests via the terminal.
- **Success Criteria:** The task is complete ONLY when:
    1. The code is fully functional per the spec.
    2. It passes **100%** of the generated tests (branches, functions, lines, statements).
    3. It matches all repository-defined style and configuration rules.

## Error Codes

Use the standardized codes from `.github/skills/specs-error-handling/SKILL.md` when blocking conditions are encountered:

| Condition | Code |
|-----------|------|
| Tests fail | `TEST_FAIL` — stay in IMPLEMENT |
| Coverage below 100% | `COVERAGE_GAP` — stay in IMPLEMENT |
| Lint/build failure | `BUILD_FAIL` — stay in IMPLEMENT |
