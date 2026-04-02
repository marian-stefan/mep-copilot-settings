---
name: unit-testing-angular
description: Angular/Nx plugin extension for unit test generation.
---

# Unit Testing Angular Plugin

This skill extends technology-agnostic guidance from `.github/skills/unit-testing-core/SKILL.md`.

## Required Tools

- nx-mcp-server/*

## Framework and Style

- Use Jest + Jasmine style: `describe`, `it`, `beforeEach`.
- Follow existing `TestBed` setup patterns used in the same feature/library.
- Keep tests co-located with source based on Angular/Nx repo conventions.

## Mock Strategy

| Scenario | Preferred approach |
|---|---|
| Angular service dependency | `jest.spyOn` or `ng-mocks` `MockProvider` |
| NgRx store | `provideMockStore` with typed initial state |
| HTTP calls | `HttpTestingController` with `provideHttpClientTesting` |
| Component children | `ng-mocks` `MockComponent` / `MockDirective` |

## Artifact Expectations

### Components

- Cover render paths, user interactions, and `@Input`/`@Output` bindings.
- Test conditional rendering driven by signals or observables.

### Services

- Cover success and error paths.
- Mock outbound HTTP calls with `HttpTestingController`.
- Assert completion/error propagation for observables.

### NgRx

- Effects: triggering action, success branch, and error branch.
- Reducers: state shape transition per action.
- Facades: `store.dispatch` and `store.select` behavior.
- Selectors: varied state snapshot coverage.

## Consumer Tracing

- Trace TypeScript importers of changed modules using text search.
- Include dependent facades/actions/effects/selectors in test scope.

## Verification Rules

- Run tests with `nx run <project>:test`.
- Resolve affected downstream projects with `nx show projects --affected --base=<fork-point-sha> --head=HEAD`.
- Coverage threshold: 100% branches/functions/lines/statements.

## Review Handoff

- Use Angular-specific review checks via Angular Reviewer (or Generic Reviewer with Angular plugin rules enabled).
