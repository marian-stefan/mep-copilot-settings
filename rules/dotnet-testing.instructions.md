---
applyTo: "**/*.cs"
---

# .NET Testing Instructions

Follow `skills/dotnet-testing/SKILL.md`.

**When you add a new source class/file, create or update its matching test file in the same change** — `Foo.cs` → `FooTests.cs` in the mirrored `tests/*.Tests` project (see the File Naming Convention table in the skill). Do not defer this to the coverage gate.

Non-negotiable: 100% of changed lines and branches covered (Coverage Contract, `implementation-rules` § 3.1); mocks initialized in the constructor, never `[SetUp]`.
