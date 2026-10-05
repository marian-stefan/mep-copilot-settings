#!/usr/bin/env node
// Harness maintenance tool (no dependencies, Node 18+).
//   node scripts/harness.mjs lint            static checks; exit 1 on errors
//   node scripts/harness.mjs catalog         (re)write docs/CATALOG.md
//   node scripts/harness.mjs catalog --check fail if docs/CATALOG.md is stale
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
const rel = (p) => relative(ROOT, p).split(sep).join('/');
const read = (p) => readFileSync(p, 'utf8');
const ls = (d) => (existsSync(d) ? readdirSync(d) : []);

// ---------- discovery ----------
function walk(dir, out = []) {
  for (const n of ls(dir)) {
    if (n === '.git' || n === 'node_modules') continue;
    const p = join(dir, n);
    statSync(p).isDirectory() ? walk(p, out) : out.push(p);
  }
  return out;
}
const allMd = walk(ROOT).filter((p) => p.endsWith('.md'));
const allSkills = ls(join(ROOT, 'skills')).filter((n) => existsSync(join(ROOT, 'skills', n, 'SKILL.md')));
// A tech layer is every skill named `{slug}-*`, identified by its `{slug}-stack-profile` skill (plugins cannot ship
// per-layer directories: only immediate children of skills/ are discovered).
const layerSlugs = allSkills.filter((n) => n.endsWith('-stack-profile')).map((n) => n.slice(0, -'-stack-profile'.length));
const layerSkills = (layer) => allSkills.filter((n) => n.startsWith(`${layer}-`));
const baseSkills = allSkills.filter((n) => !layerSlugs.some((l) => n.startsWith(`${l}-`)));
const ruleFiles = ls(join(ROOT, 'rules')).filter((n) => n.endsWith('.instructions.md'));
const agentFiles = ls(join(ROOT, 'agents')).filter((n) => n.endsWith('.agent.md'));
const promptFiles = ls(join(ROOT, 'commands')).filter((n) => n.endsWith('.md'));

// ---------- frontmatter (minimal, top-level scalars only) ----------
function frontmatter(text) {
  if (!text.startsWith('---\n')) return null;
  const end = text.indexOf('\n---', 4);
  if (end < 0) return null;
  const raw = text.slice(4, end);
  const fm = {};
  const lines = raw.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^([A-Za-z][\w-]*):\s?(.*)$/);
    if (!m) continue;
    let val = m[2];
    if (val === '' || val === '|' || val === '>') {
      const block = [];
      while (i + 1 < lines.length && /^(\s|-)/.test(lines[i + 1])) block.push(lines[++i]);
      val = block.join(' ').trim();
      fm[m[1]] = { value: val, plain: false, line: lines[i] };
    } else {
      fm[m[1]] = { value: val, plain: !/^["'\[{|>]/.test(val) };
    }
  }
  return fm;
}
const scalar = (f, k) => (f?.[k]?.value ?? '').replace(/^["']|["']$/g, '');

// ---------- lint ----------
const HARNESS_PREFIXES = ['agents/', 'skills/', 'commands/', 'rules/', 'hooks/', 'template/'];
const errors = [];
const warns = [];
const err = (f, m) => errors.push(`${rel(f)}: ${m}`);
const warn = (f, m) => warns.push(`${rel(f)}: ${m}`);

function lintFrontmatter() {
  const names = new Map();
  const targets = [
    ...agentFiles.map((n) => ['agent', join(ROOT, 'agents', n)]),
    ...promptFiles.map((n) => ['prompt', join(ROOT, 'commands', n)]),
    ...baseSkills.map((n) => ['skill', join(ROOT, 'skills', n, 'SKILL.md')]),
    ...layerSlugs.flatMap((l) => layerSkills(l).map((n) => ['skill', join(ROOT, 'skills', n, 'SKILL.md')])),
  ];
  for (const [kind, f] of targets) {
    const fm = frontmatter(read(f));
    if (!fm) { err(f, 'missing or unterminated YAML frontmatter'); continue; }
    if (kind !== 'prompt' && !fm.name) err(f, 'frontmatter has no `name`');
    if (!fm.description) err(f, 'frontmatter has no `description`');
    for (const [k, v] of Object.entries(fm)) {
      if (v.plain && /:\s|\s#/.test(v.value)) err(f, `\`${k}\` is an unquoted YAML scalar containing ": " or " #" — quote it`);
    }
    if (kind === 'skill') {
      const dir = f.split(sep).slice(-2)[0];
      if (fm.name && scalar(fm, 'name') !== dir) err(f, `skill name "${scalar(fm, 'name')}" does not match directory "${dir}"`);
    }
    if (kind === 'agent' && fm.name) {
      const n = scalar(fm, 'name');
      if (names.has(n)) err(f, `agent name "${n}" duplicates ${names.get(n)}`); else names.set(n, rel(f));
    }
  }
  // A `.prompt.md` file under commands/ would be exposed as `/mep:name.prompt`.
  for (const n of promptFiles) if (n.endsWith('.prompt.md')) err(join(ROOT, 'commands', n), 'command files are named {command}.md — the `.prompt` infix becomes part of the command name');
}

function lintReferences() {
  const skillExists = (n) => allSkills.includes(n);
  for (const f of allMd) {
    if (rel(f).startsWith('docs/CATALOG.md')) continue;
    const t = read(f);
    for (const m of t.matchAll(/skills\/([a-z0-9-]+)\/SKILL\.md/g)) {
      if (m[1] === 'some-skill') continue; // documented example
      if (!skillExists(m[1])) err(f, `references missing skill "${m[1]}"`);
    }
    for (const m of t.matchAll(/(?<![\w/.{}-])(agents\/[a-z0-9-]+\.agent\.md|commands\/[a-z0-9-]+\.md)/g)) {
      if (!existsSync(join(ROOT, m[1]))) err(f, `references missing file ${m[1]}`);
    }
  }
}

function lintTokens() {
  const regPath = join(ROOT, 'skills/stack-profile/SKILL.md');
  const reg = read(regPath);
  const registry = new Set([...reg.matchAll(/^\| `\{\{([A-Z_]+)\}\}`/gm)].map((m) => m[1]));
  if (registry.size === 0) { err(regPath, 'no tokens found in registry table'); return; }
  const examples = new Set(['TOKEN', 'PLACEHOLDER']);
  for (const f of allMd) {
    const r = rel(f);
    if (r === 'AI-FLOWS-AUDIT.md' || r.startsWith('docs/') || r.endsWith('stack-profile/SKILL.md')) continue;
    for (const m of read(f).matchAll(/\{\{([A-Za-z_]+)\}\}/g)) {
      if (!registry.has(m[1]) && !examples.has(m[1])) err(f, `token {{${m[1]}}} is not in the stack-profile registry`);
    }
  }
  for (const l of layerSlugs) {
    const p = join(ROOT, 'skills', `${l}-stack-profile`, 'SKILL.md');
    const t = read(p);
    const have = new Set([...t.matchAll(/^\| `\{\{([A-Z_]+)\}\}`/gm)].map((m) => m[1]));
    for (const tok of registry) if (!have.has(tok)) err(p, `missing value row for {{${tok}}}`);
    for (const tok of have) if (!registry.has(tok)) err(p, `row for {{${tok}}} which is not in the registry`);
    for (const line of t.split('\n')) if (/^\| `\{\{/.test(line) && /\bTODO\b|<TODO>/.test(line)) err(p, `TODO in value row: ${line.slice(0, 60)}`);
  }
}

function lintPlugin() {
  const json = (rp) => {
    const f = join(ROOT, rp);
    if (!existsSync(f)) { err(f, 'missing'); return null; }
    try { return JSON.parse(read(f)); } catch (e) { err(f, `invalid JSON: ${e.message}`); return null; }
  };
  const manifest = json('.plugin/plugin.json');
  if (manifest) {
    const f = join(ROOT, '.plugin/plugin.json');
    if (!/^[a-z0-9]+([.-][a-z0-9]+)*$/.test(manifest.name ?? '')) err(f, '`name` must be lowercase letters, digits, hyphens and periods');
    if (!/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(manifest.version ?? '')) err(f, '`version` must be semver');
    if (!manifest.description) err(f, 'missing `description`');
  }
  const mcp = json('.mcp.json');
  if (mcp && !mcp.mcpServers?.etools) err(join(ROOT, '.mcp.json'), 'missing the `etools` server — agents and commands reference `etools/*` tools');
  const hooks = json('hooks/hooks.json');
  if (hooks) {
    const f = join(ROOT, 'hooks/hooks.json');
    for (const [event, entries] of Object.entries(hooks.hooks ?? {})) for (const e of entries) {
      for (const k of ['command', 'bash', 'powershell', 'windows', 'linux', 'osx']) {
        if (typeof e[k] !== 'string') continue;
        if (!e[k].includes('${PLUGIN_ROOT}')) err(f, `${event} ${k} does not locate its script through \${PLUGIN_ROOT}`);
        for (const m of e[k].matchAll(/\$\{PLUGIN_ROOT\}\/(\S+)/g)) if (!existsSync(join(ROOT, m[1]))) err(f, `${event} ${k} references missing script ${m[1]}`);
      }
    }
  }
  for (const n of ruleFiles) {
    const f = join(ROOT, 'rules', n);
    if (!frontmatter(read(f))?.applyTo) err(f, 'rule has no `applyTo` — it would apply to every request');
    if (layerSlugs.length && !layerSlugs.some((l) => n.startsWith(`${l}-`))) err(f, 'rule file names must start with a tech-layer slug ({slug}-*.instructions.md)');
  }
}

function lintReadmeCommands() {
  const readme = read(join(ROOT, 'README.md'));
  const cmds = new Set([...readme.matchAll(/`\/(?:mep:)?([a-z][a-z-]+)(?=[ `<\[])/g)].map((m) => m[1]));
  const prompts = new Set(promptFiles.map((n) => n.replace(/\.md$/, '')));
  for (const c of cmds) if (!prompts.has(c)) err(join(ROOT, 'README.md'), `documents /mep:${c} but no commands/${c}.md exists`);
  for (const p of prompts) if (!cmds.has(p)) warn(join(ROOT, 'README.md'), `prompt /${p} is not mentioned in the README command tables`);
}

function lintSize() {
  const KB = 1000;
  for (const n of agentFiles) {
    const f = join(ROOT, 'agents', n);
    const s = statSync(f).size;
    // Orchestrators stay resident for a whole session, so they get a hard ceiling.
    if (n.includes('orchestrator')) {
      if (s > 24 * KB) err(f, `${s} bytes exceeds the 24 KB orchestrator ceiling`);
      else if (s > 20 * KB) warn(f, `${s} bytes exceeds the 20 KB orchestrator budget`);
    } else if (s > 12 * KB) warn(f, `${s} bytes exceeds the 12 KB agent budget`);
  }
  for (const n of promptFiles) { const f = join(ROOT, 'commands', n); const s = statSync(f).size; if (s > 20 * KB) warn(f, `${s} bytes exceeds the 20 KB prompt budget`); }
}

const rawFrontmatter = (text) => { const end = text.indexOf('\n---', 4); return text.startsWith('---\n') && end > 0 ? text.slice(4, end) : ''; };
const body = (text) => { const end = text.indexOf('\n---', 4); return end > 0 ? text.slice(end + 4) : text; };
const listValue = (raw, key) => { const m = raw.match(new RegExp(`^${key}:\\s*\\[(.*)\\]\\s*$`, 'm')); return m ? m[1].split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean) : null; };
const hasTool = (fm, tool) => new RegExp(`(^|[\\s,\\['"])${tool}(/[\\w-]+)?(?=['",\\]\\s]|$)`).test(fm?.tools?.value ?? '');

function lintAgentGraph() {
  const agents = new Map(agentFiles.map((n) => { const t = read(join(ROOT, 'agents', n)); return [scalar(frontmatter(t), 'name'), { n, t, fm: frontmatter(t) }]; }));
  for (const [name, { n, t, fm }] of agents) {
    const f = join(ROOT, 'agents', n);
    const raw = rawFrontmatter(t);
    const hidden = scalar(fm, 'user-invocable') === 'false';
    const handoffTargets = [...raw.matchAll(/^\s+agent:\s*(.+?)\s*$/gm)].map((m) => m[1].replace(/^['"]|['"]$/g, ''));
    if (hidden && handoffTargets.length) err(f, 'user-invocable: false agent has handoffs (buttons are never shown to a subagent) — see docs/CONVENTIONS.md § Subagents and handoffs');
    for (const target of handoffTargets) {
      if (!agents.has(target)) err(f, `handoff targets unknown agent "${target}"`);
      else if (scalar(agents.get(target).fm, 'user-invocable') === 'false') err(f, `handoff targets "${target}", which is user-invocable: false`);
    }
    const allow = listValue(raw, 'agents');
    if (hasTool(fm, 'agent') && !allow) err(f, 'has the `agent` tool but no `agents:` allowlist');
    if (allow && allow.length && !allow.includes('*') && !hasTool(fm, 'agent')) err(f, '`agents:` is set but the `agent` tool is missing');
    for (const a of allow ?? []) if (a !== '*' && !agents.has(a)) err(f, `agents: lists unknown agent "${a}"`);
    void name;
  }
  const builtIn = new Set(['agent', 'ask', 'edit', 'plan']);
  for (const n of promptFiles) {
    const f = join(ROOT, 'commands', n);
    const a = scalar(frontmatter(read(f)), 'agent');
    if (a && !builtIn.has(a) && !agents.has(a)) err(f, `agent: "${a}" is not a known agent`);
  }
}

function lintPauseReasons() {
  const pairs = [['specs-workflow-orchestrator', 'specs-workflow-state-machine'], ['implementation-workflow-orchestrator', 'implementation-workflow-state-machine']];
  for (const [agent, skill] of pairs) {
    const a = join(ROOT, 'agents', `${agent}.agent.md`);
    const s = join(ROOT, 'skills', skill, 'SKILL.md');
    if (!existsSync(a) || !existsSync(s)) continue;
    const enumLine = read(s).match(/^pauseReason:\s*(.+)$/m);
    if (!enumLine) { err(s, 'no `pauseReason:` enum line in the state schema'); continue; }
    const allowed = new Set(enumLine[1].split('#')[0].split('|').map((x) => x.trim()));
    for (const m of read(a).matchAll(/PAUSE \(([^)]*)\)/g)) {
      for (const v of m[1].matchAll(/`([a-z]+(?:-[a-z]+)+)`/g)) if (!allowed.has(v[1])) err(a, `pause reason "${v[1]}" is not in ${rel(s)}`);
    }
  }
}

function lintStaleMarkers() {
  const patterns = [[/\[F\d+\]/, 'plan footnote marker'], [/\bintroduced by [A-Z]\b/, 'change-plan reference'], [/\bPlan Agent\b/, 'reference to a non-existent Plan Agent']];
  for (const f of allMd) {
    const r = rel(f);
    if (!HARNESS_PREFIXES.some((x) => r.startsWith(x))) continue;
    const t = read(f);
    for (const [re, what] of patterns) if (re.test(t)) err(f, `contains a ${what} (${re}) — change-log text does not belong in live instructions`);
  }
}

function lintRelativeLinks() {
  for (const f of allMd) {
    const r = rel(f);
    if (!HARNESS_PREFIXES.some((x) => r.startsWith(x))) continue;
    const t = read(f);
    const targets = [...t.matchAll(/\]\((\.{1,2}\/[^)#\s]+)[^)]*\)/g), ...t.matchAll(/require\(['"](\.{1,2}\/[^'"]+)['"]\)/g)].map((m) => m[1]);
    for (const p of targets) {
      // Same-folder links like ./adrs.md usually sit in templates for generated docs; check only harness-internal targets.
      if (p.includes('{') || !/^\.\.\/|\/(skills|agents|commands|rules|hooks|template|docs|scripts)\//.test(p)) continue;
      const base = join(f, '..');
      if (!existsSync(join(base, p))) err(f, `relative path ${p} does not resolve`);
    }
  }
}

function lintToolHeuristics() {
  for (const n of agentFiles) {
    const f = join(ROOT, 'agents', n);
    const t = read(f);
    const fm = frontmatter(t);
    if (!fm?.tools) continue;
    const b = body(t);
    if (/`git (diff|status|log|branch|merge-base|ls-files)\b/.test(b) && !hasTool(fm, 'execute')) warn(f, 'body runs git commands but `tools` has no `execute`');
    if (/\b(create_file|edit\/createFile|edit\/editFiles)\b/.test(b) && !hasTool(fm, 'edit')) warn(f, 'body asks to create/edit files but `tools` has no `edit`');
    if (/\bweb\/fetch\b|\bfetch the current\b/i.test(b) && !hasTool(fm, 'web')) warn(f, 'body fetches web content but `tools` has no `web`');
  }
}

// ---------- catalog ----------
const esc = (s) => s.replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
const cut = (s, n = 150) => { const t = esc(s); return t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t; };

function buildCatalog() {
  const L = [];
  L.push('# Harness Catalog', '', '> Generated by `node scripts/harness.mjs catalog` — do not edit by hand. `node scripts/harness.mjs catalog --check` fails when this file is stale.', '');
  L.push('## Agents', '', '| Agent | User-invocable | Model | Purpose |', '|---|---|---|---|');
  for (const n of agentFiles.sort()) {
    const fm = frontmatter(read(join(ROOT, 'agents', n)));
    L.push(`| ${scalar(fm, 'name')} (\`${n}\`) | ${scalar(fm, 'user-invocable') || 'default'} | ${scalar(fm, 'model') || 'session model'} | ${cut(scalar(fm, 'description'))} |`);
  }
  L.push('', '## Commands (slash commands, prefixed `/mep:`)', '', '| Command | Runs as | Purpose |', '|---|---|---|');
  for (const n of promptFiles.sort()) {
    const fm = frontmatter(read(join(ROOT, 'commands', n)));
    L.push(`| \`/mep:${n.replace(/\.md$/, '')}\` | ${scalar(fm, 'agent') || '—'} | ${cut(scalar(fm, 'description'))} |`);
  }
  L.push('', '## Skills (base)', '', '| Skill | Purpose |', '|---|---|');
  for (const n of baseSkills.sort()) L.push(`| \`${n}\` | ${cut(scalar(frontmatter(read(join(ROOT, 'skills', n, 'SKILL.md'))), 'description'))} |`);
  for (const l of layerSlugs.sort()) {
    L.push('', `## Tech layer: ${l}`, '', '| Skill | Purpose |', '|---|---|');
    for (const n of layerSkills(l).sort()) L.push(`| \`${n}\` | ${cut(scalar(frontmatter(read(join(ROOT, 'skills', n, 'SKILL.md'))), 'description'))} |`);
    const ins = ruleFiles.filter((x) => x.startsWith(`${l}-`));
    if (ins.length) L.push('', `Rules: ${ins.map((x) => `\`${x}\``).join(', ')}`);
  }
  L.push('');
  return L.join('\n');
}

// ---------- main ----------
const [cmd, flag] = process.argv.slice(2);
if (cmd === 'lint') {
  lintFrontmatter(); lintPlugin(); lintReferences(); lintTokens(); lintReadmeCommands(); lintSize();
  lintAgentGraph(); lintPauseReasons(); lintStaleMarkers(); lintRelativeLinks(); lintToolHeuristics();
  const catPath = join(ROOT, 'docs/CATALOG.md');
  if (!existsSync(catPath) || read(catPath) !== buildCatalog()) err(catPath, 'stale or missing — run `node scripts/harness.mjs catalog`');
  warns.forEach((w) => console.log(`warn  ${w}`));
  errors.forEach((e) => console.log(`ERROR ${e}`));
  console.log(`\n${errors.length} error(s), ${warns.length} warning(s)`);
  process.exit(errors.length ? 1 : 0);
} else if (cmd === 'catalog') {
  const out = buildCatalog();
  const p = join(ROOT, 'docs/CATALOG.md');
  if (flag === '--check') {
    if (!existsSync(p) || read(p) !== out) { console.error('docs/CATALOG.md is stale — run: node scripts/harness.mjs catalog'); process.exit(1); }
    console.log('catalog is up to date');
  } else { writeFileSync(p, out); console.log(`wrote ${rel(p)}`); }
} else {
  console.error('usage: node scripts/harness.mjs lint | catalog [--check]');
  process.exit(2);
}
