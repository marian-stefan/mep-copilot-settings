import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(new URL('./guard-tool.mjs', import.meta.url));
const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url));
const blockedCommand = 'git reset --hard';

function runGuard(payload, overrides = {}) {
  const logDirectory = mkdtempSync(join(tmpdir(), 'tool-guardian-test-'));
  try {
    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: repositoryRoot,
      input: typeof payload === 'string' ? payload : JSON.stringify(payload),
      encoding: 'utf8',
      timeout: 5000,
      env: {
        ...process.env,
        GUARD_MODE: 'block',
        SKIP_TOOL_GUARD: 'false',
        TOOL_GUARD_ALLOWLIST: '',
        TOOL_GUARD_LOG_PASSES: 'false',
        ...overrides,
        TOOL_GUARD_LOG_DIR: logDirectory,
      },
    });
    assert.ifError(result.error);
    assert.equal(result.signal, null);
    const logPath = join(logDirectory, 'guard.log');
    const events = existsSync(logPath)
      ? readFileSync(logPath, 'utf8').trim().split('\n').map((line) => JSON.parse(line))
      : [];
    return { ...result, events };
  } finally {
    rmSync(logDirectory, { recursive: true, force: true });
  }
}

for (const field of ['toolArgs', 'toolInput', 'tool_input']) {
  for (const serialized of [false, true]) {
    test(`blocks ${field} with ${serialized ? 'serialized' : 'object'} arguments`, () => {
      const command = { command: blockedCommand };
      const nameField = field === 'tool_input' ? 'tool_name' : 'toolName';
      const result = runGuard({ [nameField]: 'bash', [field]: serialized ? JSON.stringify(command) : command });
      assert.equal(result.status, 2);
      assert.match(result.stderr, /Operation blocked/);
      assert.equal(result.events[0].event, 'threats_detected');
    });
  }
}

test('scans plain command strings and decodes JSON escape sequences', () => {
  for (const toolArgs of [blockedCommand, JSON.stringify(blockedCommand), JSON.stringify({ command: 'chmod\t777 example' })]) {
    assert.equal(runGuard({ toolName: 'bash', toolArgs }).status, 2);
  }
});

test('prefers toolArgs over legacy fields', () => {
  assert.equal(runGuard({ toolName: 'bash', toolArgs: { command: blockedCommand }, toolInput: { command: 'git status' } }).status, 2);
});

test('scans each supported command field for shell tools', () => {
  for (const toolName of ['bash', 'powershell', 'execute', 'runInTerminal', 'run_in_terminal', 'shell']) {
    for (const field of ['command', 'cmd', 'script', 'commandLine', 'input']) {
      assert.equal(runGuard({ toolName, toolArgs: { [field]: blockedCommand } }).status, 2, `${toolName}/${field}`);
    }
  }
});

test('ignores metadata and non-shell tool content', () => {
  for (const toolArgs of [{ description: blockedCommand }, { command: 'git status', description: blockedCommand }]) {
    for (const input of [toolArgs, JSON.stringify(toolArgs)]) {
      const result = runGuard({ toolName: 'bash', toolArgs: input });
      assert.equal(result.status, 0);
      assert.equal(result.stderr, '');
      assert.deepEqual(result.events, []);
    }
  }
  for (const toolName of ['edit', 'create', 'read', 'search']) {
    assert.equal(runGuard({ toolName, toolArgs: { input: blockedCommand } }).status, 0);
  }
});

test('allows empty, malformed, or non-command input', () => {
  for (const payload of ['', '{', {}, { toolName: 'bash', toolArgs: null }, { toolName: 'bash', toolArgs: 42 }]) {
    assert.equal(runGuard(payload).status, 0);
  }
});

test('warn mode logs a threat without blocking', () => {
  const result = runGuard({ toolName: 'bash', toolArgs: { command: blockedCommand } }, { GUARD_MODE: 'warn' });
  assert.equal(result.status, 0);
  assert.match(result.stderr, /Threats logged in warn mode/);
  assert.equal(result.events[0].event, 'threats_detected');
  assert.equal(result.events[0].mode, 'warn');
});

test('preserves explicit skip and allowlist behavior', () => {
  const payload = { toolName: 'bash', toolArgs: { command: blockedCommand } };
  const skipped = runGuard(payload, { SKIP_TOOL_GUARD: 'true' });
  assert.equal(skipped.status, 0);
  assert.deepEqual(skipped.events, []);
  const allowed = runGuard(payload, { TOOL_GUARD_ALLOWLIST: blockedCommand });
  assert.equal(allowed.status, 0);
  assert.equal(allowed.events[0].event, 'guard_skipped');
});

test('logs safe calls only when requested', () => {
  const result = runGuard({ toolName: 'bash', toolArgs: { command: 'git status' } }, { TOOL_GUARD_LOG_PASSES: 'true' });
  assert.equal(result.status, 0);
  assert.equal(result.events[0].event, 'guard_passed');
});

test('publishes a plugin hook manifest that locates its script through PLUGIN_ROOT', () => {
  // Plugin hooks are read from hooks/hooks.json in Open Plugin format; ${PLUGIN_ROOT} is the only way to find the script.
  assert.equal(existsSync(new URL('./hooks.json', import.meta.url)), false);
  assert.equal(existsSync(new URL('../../.github/hooks', import.meta.url)), false);
  const manifest = JSON.parse(readFileSync(new URL('../hooks.json', import.meta.url), 'utf8'));
  assert.equal(manifest.hooks.PreToolUse.length, 1);
  const hook = manifest.hooks.PreToolUse[0];
  assert.equal(hook.type, 'command');
  assert.equal(hook.bash, 'node ${PLUGIN_ROOT}/hooks/tool-guardian/guard-tool.mjs');
  assert.equal(hook.powershell, hook.bash);
  assert.equal(hook.env.GUARD_MODE, 'block');
  assert.equal(hook.timeoutSec, 10);
  assert.ok(existsSync(scriptPath));
});

test('plugin root token resolves to the packaged script', () => {
  const pluginRoot = fileURLToPath(new URL('../../', import.meta.url));
  const manifest = JSON.parse(readFileSync(new URL('../hooks.json', import.meta.url), 'utf8'));
  const script = manifest.hooks.PreToolUse[0].bash.split(' ')[1].replace('${PLUGIN_ROOT}', pluginRoot);
  assert.ok(existsSync(script), `${script} must exist`);
});