#!/usr/bin/env node
// Tool Guardian — blocks dangerous tool invocations before the GitHub
// Copilot coding agent executes them. Adapted from github/awesome-copilot's
// hooks/tool-guardian (bash) reference implementation, reimplemented in
// Node so the threat patterns live in one place rather than a bash/
// PowerShell fork. Node is a reasonable baseline dependency: most Copilot
// coding-agent environments already have it available for JS/TS tooling.
//
// Wired via ../hooks.json (PreToolUse -> this script, located through ${PLUGIN_ROOT}).
//
// Exit code contract — deliberate, do not "fix" to use exit 1 for block:
//   0  allow (or warn mode: threat logged, tool call proceeds)
//   2  deny — the Copilot coding agent's preToolUse hook blocks on any
//      non-zero exit; 2 is used for parity with other harnesses that give
//      exit code 2 special "blocked" semantics.
//
// Env vars:
//   GUARD_MODE            "block" (default) or "warn"
//   SKIP_TOOL_GUARD        "true" disables the guard entirely
//   TOOL_GUARD_LOG_DIR     default: "<cwd>/.tool-guardian-logs"
//   TOOL_GUARD_ALLOWLIST   comma-separated substrings to skip
//   TOOL_GUARD_LOG_PASSES  "true" also logs allowed calls (default: off)
//
// Scope: only shell-type tools are inspected, and only their command text.
// File content written by edit/create tools is never scanned — the patterns
// are shell-command shaped and would false-flag editing prompts, docs, or
// this script's own source. Any internal error fails open (exit 0), because a
// non-zero exit would block every tool call.

import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const MODE = process.env.GUARD_MODE || 'block';
const LOG_DIR = process.env.TOOL_GUARD_LOG_DIR || join(process.cwd(), '.tool-guardian-logs');
const ALLOWLIST = (process.env.TOOL_GUARD_ALLOWLIST || '')
  .split(',')
  .map((p) => p.trim())
  .filter(Boolean);

if (process.env.SKIP_TOOL_GUARD === 'true') {
  process.exit(0);
}

// Threat patterns: 6 categories, ported from the bash reference's pattern
// list (hooks/tool-guardian/guard-tool.sh in github/awesome-copilot). Add
// project-specific patterns here as needed.
// RF matches recursive+force flag spellings: -rf, -fr, -Rf, -r -f, --recursive --force.
const RF = String.raw`(?:-\w*(?:r\w*f|f\w*r)\w*|(?:-\w*r\w*|--recursive)\s+(?:-\w*f\w*|--force))`;
const PATTERNS = [
  ['destructive_file_ops', 'critical', new RegExp(String.raw`\brm\s+${RF}\s+/(?:\s|$|\*)`, 'i'), "Use targeted 'rm' on specific paths instead of root"],
  ['destructive_file_ops', 'critical', new RegExp(String.raw`\brm\s+${RF}\s+~`, 'i'), "Use targeted 'rm' on specific paths instead of the home directory"],
  ['destructive_file_ops', 'critical', new RegExp(String.raw`\brm\s+${RF}\s+\.\.`, 'i'), 'Never remove parent directories recursively'],
  ['destructive_file_ops', 'critical', new RegExp(String.raw`\brm\s+${RF}\s+\.(?:\s|$|/\*?(?:\s|$))`, 'i'), "Use targeted 'rm' on specific files instead of the current directory"],
  ['destructive_file_ops', 'critical', /\b(?:rm|del|unlink)\s+[^\n;&|]*\.env\b(?!\.(?:example|sample|template))/i, "Use 'mv' to back up .env files before removing"],
  ['destructive_file_ops', 'critical', /\b(?:rm|del|unlink)\s+[^\n;&|]*\.git(?![\w.])/i, "Never delete the .git directory — use git commands to manage repo state"],
  ['destructive_file_ops', 'high', /\bfind\s[^\n]*\s-delete\b/i, "Preview with 'find ... -print' before using -delete"],
  ['destructive_file_ops', 'critical', /\b(?:mkfs(?:\.\w+)?|dd\s[^\n]*\bof=\/dev\/)/i, 'Never write directly to block devices'],
  ['destructive_file_ops', 'critical', /Remove-Item\s[^\n]*-Recurse[^\n]*-Force|Remove-Item\s[^\n]*-Force[^\n]*-Recurse/i, 'Remove specific paths instead of recursive forced deletes'],
  ['destructive_git_ops', 'critical', /git\s+push\s[^\n]*(?:--force(?!-with-lease)|\s-f\b|\s\+\w)[^\n]*\b(?:main|master)\b/i, "Use 'git push --force-with-lease' or push to a feature branch"],
  ['destructive_git_ops', 'high', /git\s+reset\s+--hard/i, "Use 'git stash' to preserve changes, or 'git reset --soft'"],
  ['destructive_git_ops', 'high', /git\s+clean\s+-\w*f\w*d|git\s+clean\s+-\w*d\w*f/i, "Use 'git clean -n' (dry run) first to preview what will be deleted"],
  ['database_destruction', 'critical', /\bdrop\s+table\b/i, "Use 'ALTER TABLE' or a migration with rollback support"],
  ['database_destruction', 'critical', /\bdrop\s+(?:database|schema)\b/i, 'Create a backup first; consider revoking DROP privileges'],
  ['database_destruction', 'critical', /\btruncate\s+table\b/i, "Use 'DELETE FROM ... WHERE' with a condition for safer data removal"],
  ['database_destruction', 'high', /\bdelete\s+from\s+[\w."`\[\]]+\s*;/i, "Add a WHERE clause to 'DELETE FROM' to avoid deleting all rows"],
  ['permission_abuse', 'high', /\bchmod\s+(?:-\w+\s+)*777\b/i, "Use 'chmod 755' for directories or 'chmod 644' for files"],
  ['network_exfiltration', 'critical', /\bcurl\b[^\n]*\|\s*(?:sudo\s+)?(?:ba|z)?sh\b/i, 'Download the script first, review it, then execute'],
  ['network_exfiltration', 'critical', /\bwget\b[^\n]*\|\s*(?:sudo\s+)?(?:ba|z)?sh\b/i, 'Download the script first, review it, then execute'],
  ['network_exfiltration', 'high', /\bcurl\b[^\n]*--data[^\n]*@/i, "Review what data is being sent before using 'curl --data @file'"],
  ['system_danger', 'high', /(?:^|[\s;&|(])sudo\s/i, "Avoid 'sudo' — run commands with the least privilege needed"],
  ['system_danger', 'high', /\bnpm\s+publish\b(?![^\n]*--dry-run)/i, "Use 'npm publish --dry-run' first to verify package contents"],
];

// Only shell-type tools are inspected (see header). Matches tool names such as
// bash, powershell, execute, runInTerminal, run_in_terminal, shell.
const SHELL_TOOL = /bash|shell|terminal|powershell|execute|run_?command/i;
const COMMAND_KEYS = ['command', 'cmd', 'script', 'commandLine', 'input'];

function commandText(name, input) {
  if (!SHELL_TOOL.test(name)) return '';
  if (typeof input === 'string') {
    try {
      input = JSON.parse(input);
    } catch {
      return input;
    }
  }
  if (typeof input === 'string') return input;
  if (input && typeof input === 'object') {
    const parts = COMMAND_KEYS.map((k) => input[k]).filter((v) => typeof v === 'string');
    return parts.join('\n');
  }
  return '';
}

function readStdin() {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) {
      resolve(''); // manual invocation with no piped input — don't hang
      return;
    }
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => (data += chunk));
    process.stdin.on('end', () => resolve(data));
  });
}

function log(entry) {
  try {
    mkdirSync(LOG_DIR, { recursive: true });
    appendFileSync(join(LOG_DIR, 'guard.log'), `${JSON.stringify({ timestamp: new Date().toISOString(), ...entry })}\n`);
  } catch {
    // Logging is best-effort; a filesystem hiccup must never block a tool call.
  }
}

try {
  const raw = await readStdin();
  let payload;
  try {
    payload = JSON.parse(raw || '{}');
  } catch {
    payload = {};
  }

  const toolName = payload.toolName ?? payload.tool_name ?? '';
  const toolInput = payload.toolArgs ?? payload.toolInput ?? payload.tool_input ?? {};
  const combined = commandText(toolName, toolInput);

  if (!combined) {
    process.exit(0); // not a shell tool (edit/read/search/...) — nothing to inspect
  }

  if (ALLOWLIST.some((pattern) => combined.includes(pattern))) {
    log({ event: 'guard_skipped', reason: 'allowlisted', tool: toolName });
    process.exit(0);
  }

  const threats = [];
  for (const [category, severity, regex, suggestion] of PATTERNS) {
    const match = combined.match(regex);
    if (match) threats.push({ category, severity, match: match[0], suggestion });
  }

  if (threats.length === 0) {
    if (process.env.TOOL_GUARD_LOG_PASSES === 'true') log({ event: 'guard_passed', mode: MODE, tool: toolName });
    process.exit(0);
  }

  log({ event: 'threats_detected', mode: MODE, tool: toolName, threatCount: threats.length, threats });

  const report = [
    '',
    `Tool Guardian: ${threats.length} threat(s) detected in '${toolName}' invocation`,
    '',
    ...threats.map((t) => `  [${t.severity}] ${t.category}: ${t.match}\n    -> ${t.suggestion}`),
    '',
  ];

  if (MODE === 'block') {
    report.push(
      'Operation blocked: resolve the threats above or adjust TOOL_GUARD_ALLOWLIST.',
      'Set GUARD_MODE=warn to log without blocking.',
    );
    process.stderr.write(`${report.join('\n')}\n`);
    process.exit(2); // blocks on the Copilot coding agent (any non-zero exit)
  }

  report.push('Threats logged in warn mode. Set GUARD_MODE=block to prevent dangerous operations.');
  process.stderr.write(`${report.join('\n')}\n`);
  process.exit(0);
} catch (err) {
  // Fail open: an internal error must never block every tool call.
  try {
    process.stderr.write(`Tool Guardian internal error (allowing call): ${err?.message ?? err}\n`);
  } catch {}
  process.exit(0);
}
