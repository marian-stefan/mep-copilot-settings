---
name: review-angular
description: Angular 20+ / Nx review extension. Adds Angular-specific architecture, reactive, performance, and testing checks to Generic Reviewer.
---

# Review Angular

Use this skill only when `pluginId == angular`.

Generic Reviewer remains the only reviewer agent.
This skill contributes Angular-specific checks.

## Review Contract

```text
input:
  diff
  changedFiles
  repoContext

output:
  findings
  suggestedPatches
  missingTests
  reviewNotes
```

## Review Flow

```text
for each changed file:
  classify Nx layer and domain
  inspect imports and dependency direction
  inspect Angular APIs, templates, and reactive patterns
  record only representative violations
```

## Checks

### Architecture

- Enforce Nx boundaries: no `ui -> feature/data-access`, no `data-access -> ui`, no cross-domain feature coupling.
- Flag direct deep imports that bypass public APIs.

### Angular Patterns

- Prefer standalone components/directives/pipes.
- Prefer modern control flow: `@if`, `@for`, `@switch`, `@defer`.
- Prefer required inputs where the API requires them.
- Flag oversized smart components that mix orchestration and presentation.

### Reactivity

- Prefer `signal()` for local synchronous UI state.
- Prefer `computed()` for derivations.
- Minimize `effect()` usage and require idempotent behavior.
- Flag unnecessary `Subject`/`BehaviorSubject` usage when signals are a better fit.

### RxJS

- Flag nested subscribes.
- Check operator ordering and cancellation behavior.
- Validate `shareReplay` usage and refCount behavior.
- Ensure lifecycle cleanup, preferably with `takeUntilDestroyed()`.

### Performance

- Require `track` in `@for` for non-trivial lists.
- Flag heavy template expressions and repeated pipe chains.
- Suggest `@defer` for below-the-fold or non-critical content.

### Security

- Flag `bypassSecurityTrust*` usage.
- Flag unsafe DOM access and direct `innerHTML` writes.
- Flag embedded secrets or tokens.

### Immutability

- Mark constructor-assigned fields and DI dependencies as `readonly` when not reassigned.
- Flag mutable state that can be narrowed.

### Testing

- Require updated specs for new services/components/effects/selectors.
- Require tests for new branching logic, edge cases, and failure paths.

## Reporting Rules

```text
if the same root problem appears many times:
  report one representative finding
  summarize affected pattern count in impact text

if fix is small and localized:
  include a patch diff
else:
  include a short refactor plan
```
