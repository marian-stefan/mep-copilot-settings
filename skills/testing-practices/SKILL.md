---
name: testing-practices
description: Testing conventions index. Universal rules that apply regardless of stack, plus a routing table to the active tech layer's stack-specific testing skill.
---

# Testing Practices — Index

Universal rules apply to every stack. For stack-specific rules (test framework, mock lifecycle,
file naming/location conventions), consult the routed skill for the active tech layer.

| Tech layer | Files | Skill |
|---|---|---|
| .NET / ASP.NET Core (xUnit + Moq) | `**/*.cs`, `**/*.csproj` | `skills/dotnet-testing/SKILL.md` |

> New tech layers register their own row here when generated (`template/ADAPTER-GUIDE.md` §
> Registration) — this table is not exhaustive of every stack this harness could support, only
> the tech layers currently installed in this repository.

---

## Universal Rules (apply to every stack)

- **Every new source file gets a matching test file** — created in the same change, not deferred to the coverage gate (per `skills/implementation-rules/SKILL.md` § 2.4 Test Companion Rule). Baseline cases ship with the source change; gap-fill may follow in the same IMPLEMENT step.
- **Coverage Contract** — owned by `skills/implementation-rules/SKILL.md` § 3.1. Never lower thresholds. Reduce **rounds and suite scope**, not the bar (§ 3.3 Loop Control).
- **No shared mutable state between tests** — each test creates its own mocks/fixtures.
- **No real I/O in unit tests** — no real HTTP calls, no real file/database access; use the stack's mocking mechanism.
- **Test-file location is stack-specific** — see each stack skill's own file-naming/location convention (adjacent to source vs. a mirrored test project, for example).
- **Test the public contract, not implementation details** — no testing of private methods.
- **Coverage gap-finding must use a compact/filtered command output, never a full raw coverage report file read.** A full-project coverage report scales with the whole project's instrumentation, not with the specific gap being chased — reading it into context on every iteration of a coverage-fixing loop is one of the largest avoidable token costs in this workflow. See each stack skill's own "Coverage Gap Localization" section for the concrete command, and `skills/build-verification/SKILL.md` § Output Optimization Rules for the general principle.
- **UT fix efficiency** — see `agents/test-generator.agent.md` § UT Efficiency Contract and Coverage Loop Strategy for the full batching/scoping/fix-budget rules; this index does not restate them.

---

## Naming Convention

Every tech layer's own testing skill is named `{stack}-testing` — already the established
convention (`dotnet-testing`), consistent with `{stack}-patterns` and `{stack}-security-practices`.
