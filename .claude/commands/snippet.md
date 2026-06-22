---
description: >
  Generate a code snippet for a common pattern in the current tech stack.
  Detects the stack from repo structure and loads the matching tech-layer patterns.
argument-hint: [component|service|test|handler|dto]
arguments: [type]
allowed-tools: Read Bash(find . *) Bash(grep *)
disallowed-tools: Bash(npx *) Bash(npm *) Bash(git *)
effort: low
disable-model-invocation: true
---

# Code Snippet Generator

Generate a code snippet following the tech-layer's established patterns and idioms.

## Workflow

1. Detect the current tech stack from the repository structure (look for `angular.json`, `package.json` framework deps, `.csproj` files, etc.).
2. Load the tech-layer's `{stack}-patterns/SKILL.md` to get the canonical patterns.
3. Generate the snippet for the requested type (`$type`) following those patterns exactly.
4. Include only what is needed — no boilerplate the user did not ask for.

## Snippet Types

| Type | What to include |
| ------ | ---------------- |
| `component` | Presentation class/module with correct DI, lifecycle hooks, naming convention |
| `service` | Service/handler class with interface, DI registration pattern |
| `test` | Test file skeleton with mock lifecycle, arrange-act-assert, naming convention |
| `handler` | Command/query handler (if CQRS is the pattern) |
| `dto` | Request/response DTO following the tech stack's immutability conventions |

## Output

- Code in the correct language for this repository
- Follows tech-layer naming conventions
- No extra boilerplate or unnecessary imports
- One-line comments only where the pattern is non-obvious
