---
name: snippet
description: Generate code snippets for common patterns in the current tech stack
agent: 'Code Reviewer'
tools: ['search/codebase', 'read/readFile', 'edit/createFile', 'search/textSearch', 'search/fileSearch', 'search/listDirectory', 'execute']
---

# Code Snippet Generator

Generate code snippets following the tech-layer's established patterns and idioms.

## Usage

`/snippet [component|service|test|handler|dto]`

## What to Generate

When the user requests a snippet:
1. Detect the current tech stack from the repository structure.
2. Load the tech-layer's `{stack}-patterns/SKILL.md` to get the canonical patterns.
3. Generate the snippet following those patterns exactly.
4. Include only what is needed — no boilerplate the user did not ask for.

## Common Snippet Types

| Type | What to include |
|------|----------------|
| `component` | Presentation class/module with correct DI, lifecycle hooks, naming convention |
| `service` | Service/handler class with interface, DI registration pattern |
| `test` | Test file skeleton with mock lifecycle, arrange-act-assert, naming convention |
| `handler` | Command/query handler (if CQRS is the pattern) |
| `dto` | Request/response DTO following the tech stack's immutability conventions |

## Output

- Code in the correct language for this repository
- Follows tech-layer naming conventions
- No extra boilerplate or unnecessary imports
- Annotated with one-line comments where the pattern is non-obvious
