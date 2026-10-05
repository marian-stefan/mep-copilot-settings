# Tool Guardian

Blocks dangerous tool invocations — destructive file ops, force pushes, DB
drops, and similar — before the GitHub Copilot coding agent executes them.
Adapted from [github/awesome-copilot's `hooks/tool-guardian`](https://github.com/github/awesome-copilot/tree/main/hooks/tool-guardian),
reimplemented in Node.

## Deployment

The hook ships with the `mep` agent plugin. `hooks/hooks.json` registers a `PreToolUse` command that runs
`node ${PLUGIN_ROOT}/hooks/tool-guardian/guard-tool.mjs` with `GUARD_MODE=block`; nothing is copied into the
adopter repository. Two constraints drive the layout:

- Only **Open Plugin** format plugins (`.plugin/plugin.json`, `hooks/hooks.json`) expand `${PLUGIN_ROOT}` in
  hook commands and export `PLUGIN_ROOT` to the hook process. The Agent Plugins v1 and plain Copilot formats leave
  the token to the shell, where it is empty and the script cannot be found.
- The hook runs with the workspace folder as its working directory, so `.tool-guardian-logs/` is created in
  the user's workspace (add it to that project's `.gitignore`).

Verified in VS Code (Chat). Hooks from installed plugins are reported not to run in some other hosts (agents
window / agent host, see microsoft/vscode#338680 and #330114); Copilot CLI and the cloud agent discover
`.github/hooks/*.json` instead. Verify each host you rely on.

## Input payloads

The native `preToolUse` payload uses `toolName` and `toolArgs`. Arguments may be
an object or a JSON-serialized object. Legacy `toolInput` and the snake-case
`tool_name` / `tool_input` fields are also supported, as are plain command strings.
For structured arguments, only `command`, `cmd`, `script`, `commandLine`, and
`input` strings are scanned; descriptions and other metadata are ignored.

## Environment variables

| Variable | Values | Default | Description |
| ---------- | -------- | --------- | ------------- |
| `GUARD_MODE` | `block`, `warn` | `block` | `warn` logs threats only; `block` exits 2 to prevent the tool call |
| `SKIP_TOOL_GUARD` | `true` | unset | Disable the guard entirely |
| `TOOL_GUARD_LOG_DIR` | path | `<cwd>/.tool-guardian-logs` | Where JSON Lines guard events are written |
| `TOOL_GUARD_ALLOWLIST` | comma-separated substrings | unset | Skip scanning when the tool invocation contains any of these |
| `TOOL_GUARD_LOG_PASSES` | `true` | unset | Also log allowed calls (off by default to avoid unbounded log growth) |

Set overrides in the `env` block of `hooks/hooks.json` (or in the environment of the VS Code process).

## Threat categories

Pattern-based, six categories: `destructive_file_ops`, `destructive_git_ops`,
`database_destruction`, `permission_abuse`, `network_exfiltration`,
`system_danger`. See the `PATTERNS` array in `guard-tool.mjs` for the exact
regexes and suggested safer alternatives — edit that array to add
project-specific patterns.

## Limitations

Pattern matching only, no semantic analysis: it can't see obfuscated or
encoded commands, and can false-positive on safe commands that happen to
match a pattern (use `TOOL_GUARD_ALLOWLIST` for those; it is an unscoped
substring match, so keep entries specific).

Scope: only shell-type tools (`bash`, `powershell`, `execute`, `runInTerminal`,
`terminal`, ...) are inspected, and only their command text. File content
written via edit/create tools is **not** scanned — the patterns are
shell-command shaped and would otherwise false-flag editing this hook's own
source or documentation.

Fail-open: any internal error in the script exits 0 (a non-zero exit would
block every tool call). Allowed calls are not logged unless
`TOOL_GUARD_LOG_PASSES=true`; threats are always logged to
`.tool-guardian-logs/guard.log` (gitignored).

## Prerequisite

Requires `node` on PATH in the environment the Copilot coding agent runs in.

## Validation

Run the process-level integration tests from the repository root:

```bash
node --test hooks/tool-guardian/guard-tool.test.mjs
```

The tests invoke only the guard script. Sample commands are inert input strings;
they are never executed. Logs are isolated in temporary directories and removed
after each invocation. Tests cover payloads, modes, metadata filtering, and
manifest wiring (including that `${PLUGIN_ROOT}` resolves to the packaged script), but do not prove a live Copilot session discovers the hook.

For a host smoke check, temporarily set `TOOL_GUARD_LOG_PASSES=true` in the
`hooks/hooks.json`, reload the window, start a fresh Chat session, and request `git status`.
Confirm a new `guard_passed` event in `.tool-guardian-logs/guard.log`, then remove
the temporary setting. No destructive command is needed.
