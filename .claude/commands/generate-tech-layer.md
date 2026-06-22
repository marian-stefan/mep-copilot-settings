---
description: >
  Research a tech stack and generate all mandatory tech-layer files for the harness.
  Fans out 4 parallel research agents, adversarially verifies claims, presents a
  human review gate, then writes all required files.
argument-hint: <STACK_NAME>
arguments: [stack]
allowed-tools: >
  Read Write WebFetch(domain:github.com) WebFetch(domain:docs.anthropic.com)
  Bash(find . *) Bash(grep *)
effort: high
disable-model-invocation: true
---

# Generate Tech Layer

Research a tech stack and generate all mandatory tech-layer files for the harness.

## Context

- Stack: $stack

## Instructions

Read `.github/prompts/generate-tech-layer.prompt.md` in full and execute its workflow
exactly as written. Pass `$stack` as the stack name input.
