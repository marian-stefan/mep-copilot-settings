# Harness Conventions

Rules for authoring and changing agents, skills, prompts and tech layers. `docs/CATALOG.md` lists what exists; `node scripts/harness.mjs lint` enforces the mechanical parts of this file.

## File types

| Type | Location | Naming | Loaded by |
| --- | --- | --- | --- |
| Agent | `agents/{kebab-name}.agent.md` | file name = kebab-case of the `name:` | Picked by the user, dispatched as a subagent, or handed off to |
| Command (slash command) | `commands/{command}.md` | the file name **is** the command, prefixed by the plugin name (`review-pr.md` → `/mep:review-pr`); never use a `.prompt.md` suffix — it becomes part of the name | The user |
| Skill | `skills/{name}/SKILL.md` | directory = `name:` | On demand, by description match or explicit path |
| Rule | `rules/{slug}-*.instructions.md` | starts with the tech-layer slug; `applyTo` is required | Auto-applied by `applyTo` glob |
| Tech layer | `skills/{slug}-*` + `rules/{slug}-*.instructions.md` + `docs/tech-layers/{slug}.md` | lowercase stack slug as the name prefix; entry point `{slug}-stack-profile` | Resolved at run time from the active layer recorded in the adopter's `.github/copilot-instructions.md` |

## Frontmatter

**Agent** — required: `name`, `description`. Common: `tools`, `user-invocable`, `disable-model-invocation`, `agents`, `handoffs`. Optional: `model`, `mcp-servers`.
**Command** — required: `description`. Common: `agent` (`'agent'` or an agent name), `tools`, `argument-hint`. `name` is optional (the file name wins).
**Skill** — required: `name` (must equal the directory name), `description`.

`description` is what routes work to an agent or skill, so make it say *when to use it*. Quote any `description` that contains `:` or `#` — an unquoted colon silently breaks YAML parsing (the linter flags it).

## Tools and permissions policy

- Grant the minimum. Tool ids use the `namespace/tool` form where one exists (`read/readFile`, `edit/editFiles`, `execute/runInTerminal`, `agent/runSubagent`); bare category names (`read`, `edit`, `search`, `execute`, `agent`) are accepted by Copilot and used where the whole category is needed.
- Only agents that must write files get `edit/*`; only agents that must run commands get `execute`. Reviewers and verifiers are read-only unless they need `git diff` (`execute`).
- The Goal Verifier and Spec Reviewer are read-only by design (independence and auditability). The Spec Reviewer's audit entry is appended by the Specs Workflow Orchestrator.
- Agents that are internal building blocks set `user-invocable: false` so they don't clutter the picker; they remain callable as subagents.
- Jira is read-only for every agent (`skills/jira-readonly-policy/SKILL.md`). Only the Jira Analyst and Tech Researcher (Epic) have Jira read tools.

| Capability | Agents |
| --- | --- |
| read-only | goal-verifier, spec-reviewer |
| edit (writes files) | specs-workflow-orchestrator, specs-writer-{story,epic,spike}, jira-analyst, tech-researcher-{story,epic,spike}, feature-implementer, test-generator, implementation-workflow-orchestrator |
| execute (runs commands) | code-reviewer, git-operator, rubber-duck-reviewer, feature-implementer, test-generator, tech-researchers, both orchestrators |
| dispatches subagents (`agent`) | both orchestrators, code-reviewer |

(`docs/CATALOG.md` is authoritative for what each agent's frontmatter currently says.)

A prompt that runs as a named agent (`agent: 'Some Agent'`) omits `tools:` and inherits the agent's list, so the agent file stays the single source of truth. Declare `tools:` in such a prompt only to *narrow* the agent's list, never to add to it. Prompts that must edit code do not run as a reviewer agent.

### Subagents and handoffs

- Every agent with the `agent` tool declares an `agents:` allowlist of the exact (case-sensitive) names it may dispatch.
- **No nesting.** VS Code subagents can't call subagents by default (`chat.subagents.allowInvocationsFromSubagents` is off). An agent that runs as a subagent must not rely on dispatching another one; its caller dispatches both. Example: the Implementation orchestrator runs the Rubber Duck itself and passes `rubberDuck: external` to the Code Reviewer.
- Subagents can't ask the user clarifying questions; they return `blocked` instead.
- `handoffs` are optional buttons for a human to move between *user-invocable* agents at a real checkpoint (e.g. Specs → "Start implementation"). Automated steps use subagents, never handoffs, and `user-invocable: false` agents carry none.

## Model policy

No agent pins a model: they run on the session's model. Do not add `model:` elsewhere without measuring the effect on cost *and* quality.

How to measure:

- **Cost**: enable `chat.subagents.showCreditUsage` to see credits per subagent, and read the `Workflow usage` line of each COMPLETE summary.
- **Quality**: compare pinned harness revisions on the same controlled inputs, model and environment using `CONTRIBUTING.md` § Controlled workflow fixtures. Record quality failures as well as usage; source size is not an outcome metric.
- **Tier limit**: VS Code refuses a subagent model above the main model's cost tier, so tiering can only go down. Prefer a prioritized list (`model: ['A (copilot)', 'B (copilot)']`) so a missing model falls back instead of failing.

## Single source of truth

Every rule has exactly one owner file; everything else links to it. Before adding a rule, check `ARCHITECTURE.md` § Single Sources of Truth. If the rule has an owner, edit the owner; if not, add a row when you create one. Do not restate numbers (caps, thresholds, severity names, column lists) in a second file — link to the owner. Known owners worth remembering:

| Topic | Owner |
| --- | --- |
| `{{TOKEN}}` values | `skills/stack-profile/SKILL.md` (registry) and `{stack}-stack-profile` (values) |
| Coverage rule, fix budget, IMPLEMENT budget | `skills/implementation-rules/SKILL.md` § 3.1 / § 3.3 |
| Finding severity and risk rating | `agents/code-reviewer.agent.md` § Severity Vocabulary |
| METRICS.md schema | `skills/spec-metrics-log/SKILL.md` |
| Audit-log format | `skills/audit-log-policy/SKILL.md` |

## Stack tokens

`{{TOKEN}}` in base files is symbolic and never substituted. Add a token to the registry first, then to every installed layer's stack profile, then use it. The linter fails on unregistered tokens and on profile/registry mismatches.

## Tech layers

Skills and instructions only — never an agent file that shares a name with a base agent (it would replace the base workflow). Contract and checklist: `template/ADAPTER-GUIDE.md`.

## Size budgets

Loaded guidance contributes to model context, but host loading, caching, repeated dispatches and tool output determine actual usage. The linter warns above 12 KB for an agent, 20 KB for an orchestrator and 20 KB for a prompt, and fails above 24 KB for an orchestrator. Keep procedures in one owner and load detailed skills only where needed; file-size reductions alone do not establish billed savings.

### Pinned guidance inventory

Measured on 2026-09-29 from committed Git blob sizes at that revision (paths below are those at that revision). Scope: all Markdown files recursively beneath `.github/agents`, `.github/prompts` and `.github/skills`, including the 903-byte nested ADR template. Excludes tech layers, instructions, documentation, test code and runtime/tool output. Values are bytes, not tokens or credits.

| Revision | Agents + prompts | Skills + resources | Total | Total vs main |
| --- | ---: | ---: | ---: | ---: |
| Main: `53d0d67bb4d674eef801977d18641f1720195464` | 267,053 | 100,509 | 367,562 | baseline |
| Originally reviewed: `a025a121022ffc7e597e459892ddc1ecb649a951` | 216,501 | 172,678 | 389,179 | +5.9% |
| After Stages 1-5: `ff01ef896d9ec32fe67f5308941e333cc8140a68` | 230,308 | 197,392 | 427,700 | +16.4% |

Reproduce with `git ls-tree -rl <revision> -- .github/agents .github/prompts .github/skills`: sum the byte-size field of blob records whose paths end in `.md`, grouping by the three directories and retaining nested resources. The final agents/prompts subtotal is 13.8% below main, while the combined inventory is larger. Neither number establishes runtime savings. Earlier unpinned intermediate size snapshots in the changelog are historical notes, not this comparison. Runtime benchmark prerequisites and unverified gates are recorded in `CONTRIBUTING.md` § Combined validation record.

## Hooks

Tool Guardian inspects shell commands only. Keep its manifest at `hooks/tool-guardian.json` for Copilot CLI/cloud-agent discovery and its script under `hooks/tool-guardian/`. Other hosts require a separate discovery check; see `hooks/tool-guardian/README.md` and `docs/TROUBLESHOOTING.md`.
