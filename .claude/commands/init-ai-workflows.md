---
description: >
  Bootstrap AI workflows into a target project. Detects the tech stack, installs
  the matching tech layer, resolves all placeholders, and writes
  .github/copilot-instructions.md. Run once per project.
allowed-tools: >
  Read Write Edit Bash(find . *) Bash(grep *) Bash(git rev-parse *)
effort: high
disable-model-invocation: true
---

# Init AI Workflows

Bootstrap the AI harness into a target project: detect stack, install tech layer, resolve placeholders, generate instructions.

## Instructions

Read `.github/prompts/init-ai-workflows.prompt.md` in full and execute its workflow
exactly as written.
