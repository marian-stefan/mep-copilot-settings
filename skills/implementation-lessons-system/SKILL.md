---
name: implementation-lessons-system
description: Module-scoped lesson file resolution algorithm, capture triggers, and format for the Implementation Workflow Orchestrator's PREFLIGHT and IMPLEMENT steps.
---

# Implementation Lessons System

> **Stack tokens**: `{{TOKEN}}` names in this file are symbolic — resolve them at runtime from the installed `{stack}-stack-profile` skill (registry: `skills/stack-profile/SKILL.md`). Never substitute them into files.

Single source of truth for how `agents/implementation-workflow-orchestrator.agent.md`
resolves, reads, and appends to lesson files. That agent owns *when* this system is invoked
(its Lessons Read at PREFLIGHT and its Capture Hook Location in IMPLEMENT); this skill owns the
resolution algorithm, format, and capture-trigger definitions.

## `{{MODULE_LESSONS_PATH}}` Resolution Algorithm

`{{MODULE_LESSONS_PATH}}` is a placeholder resolved at runtime:

1. Extract all file paths from the SPEC's Section 2 (Implementation Summary) and the CONTEXT's "Impacted Components" and "Implementation Plan" sections.
2. If more than 50% of those paths share a common module-root prefix — as defined by the active tech layer (e.g. an NX `apps/{app}` prefix, a `libs/{domain}/{layer}` prefix, or another convention the tech layer specifies) — the resolved path is `{module-root}/.github/lessons.md`.
3. Otherwise → fall back to the workspace root `.github/lessons.md` (no module scope inferable). This is also the correct outcome for a single-repo service with no sub-module structure.

The concrete module-root prefix patterns are defined by the active tech layer's
`{stack}-patterns/SKILL.md` (or equivalent); this algorithm is stack-agnostic.

- **Module-scoped lesson** (specific to one resolved module root): write to the resolved `{{MODULE_LESSONS_PATH}}`.
- **Cross-cutting lesson** (shared-library patterns, architecture rules, testing patterns): write to `.github/lessons.md` at the workspace root.
- When a run touches both, write to both.
- Create on demand — write if absent, append if present. If no module is inferable (algorithm step 3), fall back to the workspace root file only.

## Lesson Format

One paragraph max, structured as:
> *[Situation]: [Mistake made or pattern observed] → [Rule to apply next time]*

## Confirmed Correction Event Definition

A confirmed correction event occurs when any of the following happen:
- (a) The user explicitly corrects generated code or architecture choices.
- (b) The Code Reviewer flags an issue and the agent accepts the fix.
- (c) A test run fails due to a code pattern mistake (not a test-setup issue).
- (d) The user identifies an implementation error mid-run.

## Capture Hook Location

- **End of each IMPLEMENT iteration** where `reviewIterations > 0` and the reviewer flagged at least one accepted fix: evaluate whether the finding constitutes a confirmed correction event and append to the lessons file before re-entering IMPLEMENT.
- **Immediately** when the user provides an explicit correction mid-run, before proceeding to the next agent step.
