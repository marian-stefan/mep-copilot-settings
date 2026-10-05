# Troubleshooting

## Setup

| Symptom | Cause / fix |
|---|---|
| `/mep:` commands, agents or skills are missing | The plugin is not installed, is disabled, or the window was not reloaded after install/update. Check the Extensions view (`@agentPlugins`) / Agent Customizations, then **Developer: Reload Window**. |
| `/mep:init-ai-workflows` stops with "the mep plugin is not active" | The skill `stack-profile` is not available — same causes as above. |
| Init reports no matching layer | No `{slug}-stack-profile` skill exists for the detected stack. Let init run `/mep:generate-tech-layer`, or see `template/ADAPTER-GUIDE.md`. |
| Agents print `STACK_PROFILE_MISSING: {{TOKEN}}` | No active tech layer is recorded (`.github/copilot-instructions.md` § Active Tech Layer) or several layers exist and none is selected, or the profile has no value for a Required token. Run `/mep:init-ai-workflows`, or fix the profile (`node scripts/harness.mjs lint` in the harness repo shows missing rows). |
| Re-running init changed nothing | Init pre-fills values from the existing `.github/copilot-instructions.md` and always shows a preview before writing. |
| `/mep:review-pr` asks for the Bitbucket project/repo | The values are `not set` in `.github/copilot-instructions.md` § Project Identity. Provide them when asked, or re-run `/mep:init-ai-workflows`. |
| `/mep:create-specs`, `/mep:review-pr` fail with tool errors | The plugin's `etools` MCP server (Jira + Bitbucket) is not started, not trusted, or not authenticated. Open the MCP servers list and start/sign in to `etools` (it comes from the `mep` plugin — it is not in `.vscode/mcp.json`). |

## Tool Guardian hook

| Symptom | Cause / fix |
|---|---|
| A shell command was blocked | The hook prints the matched pattern and a suggested alternative. Use the safer form, or add a *specific* substring to `TOOL_GUARD_ALLOWLIST`. Set `GUARD_MODE=warn` to log without blocking. |
| Edits to docs/prompts containing `rm -rf` etc. were blocked | Should not happen: only shell tools' commands are scanned. If it does, your host reports edit tools under a shell-like name — check `.tool-guardian-logs/guard.log` for the tool name. |
| Hook does nothing | Confirm the plugin is enabled and the window was reloaded; the hook is `hooks/hooks.json` and finds its script through `${PLUGIN_ROOT}` (Open Plugin format — other plugin formats do not expand that token in hook commands). Verify `node` is on PATH and use the harmless host smoke check in `hooks/tool-guardian/README.md`. Hook support in non-VS Code hosts (Copilot CLI, agents window, cloud agent) must be verified separately. Caught internal script errors fail open; process startup errors may block. |
| Log directory growing | Passes are not logged unless `TOOL_GUARD_LOG_PASSES=true`. `.tool-guardian-logs/` is gitignored in this repo — add it to your project's `.gitignore`. |

## Specs workflow

| Symptom | Cause / fix |
|---|---|
| "A previous workflow run was found" | Resume from the saved state (`R`) or start fresh (`S`). Start fresh keeps the BRIEF and archives state; it never deletes SPEC/CONTEXT. |
| Workflow paused at the orientation gate | Wrong issue type or routing detected. `Y` continue, `N` adjust. Skipped automatically for unambiguous `minimal` tickets. |
| Paused at the ambiguity (C) gate | A blocking assumption exists (including an undecided fix approach, id `FIX-1`). Resolve it; the Tech Researcher re-runs in Revision Mode. |
| Paused at pattern selection | 2+ candidate implementation patterns. Pick one; only the pending CONTEXT section is rewritten. |
| Spec Reviewer returned `iterate` | The writer regenerates with the reviewer's failed gates (max 2 regenerations), then the workflow continues with a warning. `abort` (score < 40) is a hard stop needing human review. |
| Epic/Spike spec scored badly | Epic and Spike specs use their own gate sets (`specs-quality-review`). If a Story-style gate failure appears, the wrong set was applied — check the SPEC filename suffix. |
| `/mep:accept-spec` logged `Score: N/A` | The SPEC has no `qualityScore` in frontmatter (it was produced before the orchestrator wrote scores, or the run stopped before review). |

## Implementation workflow

| Symptom | Cause / fix |
|---|---|
| "No spec file found" | Run `/mep:create-specs {KEY}` first, or attach the SPEC. |
| Reconciliation gate pauses | The plan is stale (missing files, AC drift, architecture conflict). Continue anyway, revise via `/mep:create-specs`, or fix inline. |
| Stopped with `test-loop-exhausted` / `build-loop-exhausted` / IMPLEMENT budget | Fix budget reached (2 per gate, 4 combined). Fix manually or abort; the workflow will not retry a third time. |
| Goal Verifier did not run | Small change with every AC mapped to a passing test: skipped by design and noted in the retrospective. |
| Rubber Duck did not run | In `/mep:start-implementation` the orchestrator skips it for small or docs/config-only changes (`implementation-rules` § 3.5); the COMPLETE summary's usage line shows whether it ran. Direct `/mep:review-pr` and `/mep:review-branch-changes` always run it. |
| Started on `develop`/`main` | Non-blocking warning. The Git Operator creates the feature branch at COMMIT and carries the working-tree changes onto it. |

## Skills not being picked up

Skills load by description match or by name. If a base agent does not seem to apply the tech layer's rules, confirm the `{stack}-*` skills are listed in Agent Customizations, reload the window (a stale skill list after install/update is the usual cause), and name the skill explicitly in the prompt. Whether your Copilot version follows "load the `{stack}-…` skill" instructions reliably should be verified once after installing the harness.
