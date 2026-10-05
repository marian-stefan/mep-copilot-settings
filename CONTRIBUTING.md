# Contributing to the Harness

This repository is prompts, not code, so correctness is checked by linting the mechanical parts and by dry-running the flows.

## Before you change anything

1. Read `docs/CONVENTIONS.md` (file types, frontmatter, tools policy, single source of truth) and find the **owner** of the rule you are changing (`ARCHITECTURE.md` § Single Sources of Truth). Edit the owner, not a copy.
2. Keep each rule in one owner and load detailed skills only where needed. Moving text between agents and skills changes the static inventory, not necessarily billed usage: measure what the host actually loads, repeated dispatches and tool output before claiming a cost reduction.

## Checks (run before every commit)

```bash
node scripts/harness.mjs lint            # frontmatter, references, tokens, README commands, size budgets, catalog freshness
node scripts/harness.mjs catalog         # regenerate docs/CATALOG.md after adding/renaming/re-describing anything
node --test hooks/tool-guardian/guard-tool.test.mjs scripts/workflow-contracts.test.mjs
```

`lint` fails on:
- broken skill/agent/prompt references and unresolved harness-internal relative links (including `.prompt.md` command files, which would change the command name);
- unquoted YAML colons in descriptions, unregistered `{{TOKEN}}`s, tech-layer profiles that miss a registry token, plugin manifest, `.mcp.json` and `hooks/hooks.json` validity (the hook must locate its script through `${PLUGIN_ROOT}`), rules without `applyTo`, and a tech layer whose profile misses a registry token;
- the agent graph: unknown `handoffs`/`agents:`/prompt `agent:` targets, handoffs on (or to) `user-invocable: false` agents, and an `agent` tool without an `agents:` allowlist;
- orchestrator pause reasons missing from their state-machine enum, and change-log markers (`[F3]`, "introduced by A", "Plan Agent") in live instructions;
- orchestrators above 24 KB, README commands with no command file, and a stale catalog.

It warns on size budgets and on tool heuristics (a body that runs git, edits files or fetches the web without the matching tool). Node 18+ is required (already a prerequisite of the Tool Guardian hook).

CI: `.github/workflows/harness-lint.yml` runs `lint`, hook process integration tests and static workflow-contract tests on every PR and on pushes to `main`. The contract tests assert required fields, caller wiring and critical policy anchors; wording changes may require updating them after review. They do not execute agents. For a local pre-commit lint check: `ln -s ../../scripts/pre-commit .git/hooks/pre-commit`.

## Testing a prompt change

Lint and source-text assertions check wiring, not whether an agent follows the contract. The static review cases in `docs/SCHEMAS.md` are fixture specifications, not executed workflow tests. For any change to an orchestrator, gate, or contract:

1. Pick a small fixture ticket (a real low-risk Story) and run `/mep:create-specs <KEY>` end to end; check `docs/specs/<KEY>/` contains BRIEF, CONTEXT, SPEC, state file and `audit.log`, and that the SPEC frontmatter has `qualityScore`.
2. Run `/mep:start-implementation <KEY>` on an isolated scratch checkout through commit confirmation, decline the commit and inspect the review results/state. Retrospective and metrics writes occur only after choosing commit; testing that path requires separate explicit authorization.
3. For gate changes, force the gate (e.g. an ambiguous ticket for the C gate) and confirm pause → resume works from the state file.
4. Compare the same controlled fixtures before/after for cost-motivated changes. Pin both revisions and keep model, host, stack, tools and cache conditions consistent; record loaded guidance, dispatches, tool calls, elapsed time, available tokens/credits and quality outcome. Repeat runs and report variation. File bytes alone are not tokens, credits or proven runtime savings.

If the required host, authorized fixture ticket or runnable adopter project is unavailable, record the affected gate as **unverified** with the missing prerequisite. Do not substitute a prose walkthrough or a new workflow simulator for a live result. Keep these outstanding gates in Beads.

### Controlled workflow fixtures

Use the same isolated adopter checkout and authorized low-risk ticket for each pinned harness revision. Reset fixture data between runs without touching the user's working branch. Do not commit, push, or write to Jira as part of these checks. See `docs/SCHEMAS.md` for the individual contract cases.

| Fixture | Procedure | Required observations |
| --- | --- | --- |
| Small unchanged Story | Run specs and implementation with no requirement correction, through review and declined commit confirmation. | Original requirements preserved; all required tests/builds run; small-change skips follow their existing rules. |
| Correction and fix | Approve an AC change from A to B; force an unchanged consumer test failure. In separate fix rounds introduce a code-review defect during a goal fix, and invalidate a satisfied AC during a code-review fix. | Implementation/tests/verifier all target B; consumer runs without implicit edit permission; all affected independent checks refresh with provenance and the shared cap remains intact. |
| Pause and resume | Apply localized E feedback, pause at C, start a fresh session and resume. Repeat for assumption-only and pattern edits; separately alter CONTEXT externally and force a failed required validation. | Corrections survive without repeated research; versions/checkpoints match final files; external changes invalidate approvals; failed validation blocks GENERATE. |

For each fixture/revision, retain host/model versions, loaded guidance, dispatch/tool counts, elapsed time, available token/credit figures, cache conditions, and the quality outcome. Use repeated runs, report each result and variation, and compare only like-for-like completed outcomes. A cheaper incomplete or incorrect run is not an improvement.

### Combined validation record (2026-09-29)

Candidate guidance: `ff01ef896d9ec32fe67f5308941e333cc8140a68`; historical comparison refs and inventory scope are in `docs/CONVENTIONS.md` § Pinned guidance inventory. Stage 6 adds static tests and reporting, not a new workflow runtime.

| Gate | Result | Evidence or limitation |
| --- | --- | --- |
| Hook process integration | Passed | 15 tests on Node v24.1.0, Linux; payload decoding, modes, filtering and manifest wiring. No destructive sample command executes. |
| Cross-stage static contracts | Passed | 6 tests in `scripts/workflow-contracts.test.mjs`; mechanical consistency only. |
| CLI hook discovery | Passed, limited scope | Copilot CLI 1.0.84-8 produced a native `guard_passed` event on the restricted shell-tool attempt. CLI permissions then denied `rtk git status`; shell execution and a live denial by the guard were not verified. No permissions were broadened. |
| Live workflow fixtures | Unverified | This workspace is the harness, not a configured runnable adopter; no authorized fixture ticket/adopter checkout was supplied for the controlled runs above. |
| Before/after runtime cost | Unverified | No matched fixture runs. The isolated discovery attempt reported 2.7 credits, 18.9k input tokens (9.4k cached, 9.5k written), 127 output tokens and 45s; host default model was not recorded. These are diagnostic-only figures, not a benchmark or savings evidence. |

## Common changes

| Change | Steps |
|---|---|
| New `{{TOKEN}}` | Add a row to `skills/stack-profile/SKILL.md` (Required/Optional, owner, users) → add a value row to every layer's `{stack}-stack-profile` → use it → `lint` |
| New skill | `skills/{name}/SKILL.md` with `name` = directory; add an owner row to `ARCHITECTURE.md` if it owns a rule; `catalog` |
| New agent | Minimal `tools`; `user-invocable: false` if internal; decide `handoffs` (avoid `send: true`); `catalog` |
| New prompt / command | File name is the command; add it to the README command table; `catalog` |
| New tech layer | `/mep:generate-tech-layer <stack>` or `template/ADAPTER-GUIDE.md`; skills-only |
| Change a schema (state, METRICS, audit log) | Edit the owning skill, then every writer/reader named in `docs/SCHEMAS.md`; bump `CHANGELOG.md` |

## Pull requests

- One concern per PR. Describe the flow affected, the rule owner edited, and how you tested it.
- Update `CHANGELOG.md` under **Unreleased**.
- Do not commit generated adopter files (`docs/specs/`, `.github/copilot-instructions.md`, `.tool-guardian-logs/`).
- Plugin changes take effect in an open window only after a reload. To try a checkout, add its path to `chat.pluginLocations` and reload.
