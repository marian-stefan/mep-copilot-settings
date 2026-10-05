---
name: generate-tech-layer
description: Research a technology stack and generate all mandatory tech-layer files for this harness.
tools: ['agent', 'read/readFile', 'edit/createFile', 'edit/editFiles', 'search/textSearch', 'search/fileSearch', 'search/listDirectory', 'execute', 'web/fetch']
user-invocable: true
---

# /mep:generate-tech-layer `<stack>`

Generates a complete, validated technology layer for the `mep` harness by:

1. Researching the target `<stack>` across 4 independent dimensions in parallel
2. Adversarially verifying each research report
3. Presenting a human review gate before writing anything
4. Generating the layer's 9 files: a notes page, 6 skills (`{slug}-stack-profile`, `{slug}-patterns`, `{slug}-testing`, `{slug}-security-practices`, `{slug}-review-checklist`, `{stackSlug}-code-review-output`) and 2 rules. Tech layers are **skills and rules only** — they never ship same-name agent overrides (see `template/ADAPTER-GUIDE.md`). A plugin has one flat `skills/` directory, so every layer file is named `{stackSlug}-…`.
5. Validating the output against the ADAPTER-GUIDE contract
6. Writing files in dependency order

## Usage

```bash
/mep:generate-tech-layer React/Next.js
/mep:generate-tech-layer "Java Spring Boot"
/mep:generate-tech-layer "Python FastAPI"
/mep:generate-tech-layer "Vue 3 + TypeScript"
```

---

## Phase 0 — Input Normalization

### 0a. Parse the stack argument

Normalize `<stack>` into a `stackManifest`:

```markdown
stackSlug:       lowercase, replace [/ \s.+] with -  (e.g. "React/Next.js" → "react-nextjs")
language:        primary programming language
languageVersion: minimum version the tech layer targets
framework:       primary framework name and version
testFramework:   canonical test runner for this stack
assertionLib:    assertion library for this stack
mockingLib:      mocking library for this stack
coverageTool:    coverage collector for this stack
buildTool:       build/package tool for this stack
testFileGlob:    glob matching test files for this stack (e.g. "**/*Tests.<ext>", "**/*.spec.<ext>")
sourceFileGlob:  glob matching source files for this stack (e.g. "**/*.<ext>")
```

**HALT if ambiguous**: if `<stack>` does not unambiguously map to a language + framework (e.g. "backend" alone), emit:

```markdown
❓ I need a more specific stack name to generate the tech layer.
Examples: "<Framework> <Version>", "<Language> + <Framework>", "<Runtime> <Framework>"
What stack should I generate a tech layer for?
```

### 0b. Resolve the output target

Decide where the layer is written:

| Target | When | `{skillsDir}` | `{rulesDir}` |
| --- | --- | --- | --- |
| `plugin` | `.plugin/plugin.json` exists in the workspace root with `"name": "mep"` — a maintainer is extending the harness itself | `skills` | `rules` |
| `workspace` | any other repository — a team-local layer that the installed plugin does not ship | `.github/skills` | `.github/instructions` |

Both targets write the layer's notes page to `docs/tech-layers/{stackSlug}.md`. A `workspace` layer is discovered by VS Code like any other workspace skill and is picked up by `/mep:init-ai-workflows`. Show the resolved target in the review gate below.

---

## Phase 1 — Parallel Research Fan-Out (×4 concurrent subagents)

Each subagent receives the full `stackManifest`. Each **must cite a primary source URL** (official docs or GitHub permalink) for every non-obvious claim. Each returns a structured Markdown report ending with a `## Resolved Tokens` section (one concrete value per owned stack token).

Run all four concurrently.

### Subagent 1 — Patterns Research

**Scope**: Language idioms, module taxonomy, state management, resource lifecycle, architecture layers.

**Owned stack tokens** (registry: `skills/stack-profile/SKILL.md`): `{{STATE_MANAGEMENT_PATTERNS}}`, `{{SUBSCRIPTION_LIFECYCLE_PATTERN}}`, `{{CODEBASE_MODULE_TAXONOMY}}`, `{{MODULE_LESSONS_PATH}}`, `{{SHARED_LIB_PATH_PREFIX}}`, `{{SHARED_LIB_TAG}}`, `{{DOMAIN_TAG_PREFIX}}` (Optional ones may be `n/a — <reason>`)

**Produce**:

- Modern syntax patterns (language version from `stackManifest.languageVersion`)
- Module / project / package naming conventions and layer structure
- State management canonical patterns with code examples
- Resource/subscription cleanup idiom for this stack (what pattern is used to dispose of subscriptions, streams, or resources)
- Top 10 anti-patterns to flag in code review
- Architecture boundary rules (what layer may import what)

### Subagent 2 — Testing Research

**Scope**: Test framework, mock lifecycle, assertion style, coverage tooling.

**Owned stack tokens**: `{{TEST_COMMAND}}` (full and scoped forms), `{{TEST_FILE_GLOB}}`

**Produce**:

- Exact `{{TEST_COMMAND}}` with coverage flags (must produce a coverage report)
- Test file naming convention (source path → test path mapping)
- Mock lifecycle rules (when/how mocks initialize — constructor, setUp, beforeEach)
- Minimal defaults convention
- Test isolation rules
- `applyTo` glob for `testing.instructions.md` — use `sourceFileGlob` (ALL source files), not `testFileGlob`: the Test Companion Rule must fire on source-file edits, not just test-file edits
- Concrete test skeleton with Arrange-Act-Assert

### Subagent 3 — Security Research

**Scope**: Stack-specific OWASP risks, auth patterns, secret management, injection prevention.

**Owned stack tokens**: _(none — pure content synthesis)_

**Produce**:

- Top 10 security rules for this stack (must fix / should fix / consider)
- Secret management pattern (never hardcode; how to inject secrets in this stack)
- Input validation at API boundaries
- Auth/authz patterns canonical to this stack
- Known injection risks and mitigations
- `applyTo` glob for `security.instructions.md`

### Subagent 4 — Build System Research

**Scope**: Project/module discovery, dependency graph, scaffolding commands.

**Owned stack tokens**: `{{BUILD_SYSTEM_PROJECT_DISCOVERY}}`, `{{DEPENDENCY_GRAPH_COMMAND}}` (must include a reverse/consumer lookup), `{{SCAFFOLD_COMMAND}}`, `{{BUILD_COMMAND}}`, `{{AFFECTED_BUILD_COMMAND}}`, `{{INSTALL_COMMAND}}`, `{{RUN_COMMAND}}`

**Produce**:

- Shell commands to discover affected projects / modules in a monorepo or multi-module setup
- Dependency graph command (visual or text output)
- Module taxonomy table: layer → directory pattern → purpose (e.g. `domain`, `application`, `infrastructure`, `presentation` — names and structure vary by stack)
- Scaffolding command for new modules/components
- Dependency rules (what may depend on what)

---

## Phase 2 — Adversarial Verification (single verifier subagent)

Read all four research reports. For each report:

1. **Internal consistency**: do all code examples use the same language version? Do imports match the stated framework version?
2. **Version coherence**: cross-check that `stackManifest.languageVersion` matches examples across all four reports.
3. **Token completeness**: verify every token in the registry `skills/stack-profile/SKILL.md` has a concrete, runnable value in the `## Resolved Tokens` section of the owning report. **Required** tokens may not be `n/a`; **Optional** tokens may be `n/a — <reason>`. Read the registry at run time — do not use a hard-coded list.

4. **API hallucination spot-check**: for each report, select the 3 most specific/obscure claims (e.g. a specific CLI flag, a specific config key, a library method signature). Fetch the primary source URL cited by the research agent. Confirm the claim appears in that source. Mark FAIL if not confirmed.

**On FAIL**: re-run only the failing dimension's subagent (not all four). Loop until all pass or 3 attempts exhausted (then HARD STOP with details).

**Output**: `verification-summary.md` with per-report PASS/FAIL and notes.

---

## Phase 3 — Human Review Gate (BLOCKING)

Present to the user before writing anything:

```markdown
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Tech Layer Generation — Review Gate
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Stack:    {stackManifest.framework} ({stackManifest.language} {stackManifest.languageVersion})
Slug:     {stackSlug}
Output:   target={plugin|workspace} — skills → {skillsDir}/, rules → {rulesDir}/, notes → docs/tech-layers/{stackSlug}.md

Verification: {✅ all 4 dimensions passed | ⚠️ {N} dimensions re-ran}

── Resolved Stack Tokens ────────────────────────────
{one line per registry token → value (tables summarized)}

── Files to be written ───────────────────────────────
  docs/tech-layers/{stackSlug}.md
  {skillsDir}/{stackSlug}-stack-profile/SKILL.md
  {skillsDir}/{stackSlug}-patterns/SKILL.md
  {skillsDir}/{stackSlug}-testing/SKILL.md
  {skillsDir}/{stackSlug}-security-practices/SKILL.md
  {skillsDir}/{stackSlug}-review-checklist/SKILL.md
  {skillsDir}/{stackSlug}-code-review-output/SKILL.md
  {rulesDir}/{stackSlug}-testing.instructions.md
  {rulesDir}/{stackSlug}-security.instructions.md

── Response options ──────────────────────────────────
Type "approve"             → proceed to file generation
Type "revise patterns"     → redo patterns research only
Type "revise testing"      → redo testing research only
Type "revise security"     → redo security research only
Type "revise build"        → redo build-system research only
Type "abort"               → stop without writing anything
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**WAIT for explicit user response before continuing.** On "revise {dimension}": re-run that dimension's Phase 1 subagent and Phase 2 verifier, then re-display the gate.

---

## Phase 4 — Parallel File Generation (×2 groups)

Run both groups concurrently. Both groups receive all four research reports, the `stackManifest`, the `verification-summary.md`..

### Group A — Stack profile & review checklist

Do **not** generate agent overrides: a same-name agent file replaces the base agent wholesale and silently drops its workflow. Stack knowledge is delivered as skills that the base agents load.

1. `{skillsDir}/{stackSlug}-stack-profile/SKILL.md` — frontmatter `name: {stackSlug}-stack-profile`. Body follows the section layout of `skills/dotnet-stack-profile/SKILL.md`: a **Token values** table with one row per registry token (`skills/stack-profile/SKILL.md`), **Module taxonomy**, **Research steps**, **Code snippet format**. Values from patterns + build + testing research.
2. `{skillsDir}/{stackSlug}-review-checklist/SKILL.md` — architecture-boundary rules owned here, plus a triage table that points into `{stackSlug}-patterns`, `{stackSlug}-security-practices`, `{stackSlug}-testing` (do not restate their rules); must reference `{skillsDir}/{stackSlug}-code-review-output/SKILL.md`. Model on `dotnet-review-checklist`.

### Group B — Content Synthesis (remaining skills, rules, notes page)

Synthesize each file from its dimension's research report. Follow the structure mandated by `ADAPTER-GUIDE.md` for each file type.

Files produced:

- `{skillsDir}/{stackSlug}-patterns/SKILL.md` — from patterns research; include code examples in the correct language
- `{skillsDir}/{stackSlug}-testing/SKILL.md` — from testing research; include mock lifecycle, assertion patterns, coverage config
- `{skillsDir}/{stackSlug}-security-practices/SKILL.md` — from security research; OWASP checklist + code examples
- `{skillsDir}/{stackSlug}-code-review-output/SKILL.md` — **fixed template structure** (Summary / Risk table / Findings by severity / Metrics / Follow-up checklist); only the language examples vary
- `{rulesDir}/{stackSlug}-testing.instructions.md` — `applyTo: "{sourceFileGlob}"` from stackManifest (ALL source files, not just test files — the Test Companion Rule in `skills/implementation-rules/SKILL.md` § 2.4 must trigger on source-file edits too); rules from testing research
- `{rulesDir}/{stackSlug}-security.instructions.md` — `applyTo: "{sourceFileGlob}"` from stackManifest; critical rules from security research
- `docs/tech-layers/{stackSlug}.md` — documents stack version assumptions, file structure, how to activate, tech stack table

---

## Phase 5 — Programmatic Validation

Run these 7 checks against all generated draft files **before writing to disk**. Any FAIL is a hard block — report the exact file and the exact issue.

| # | Check | PASS condition | FAIL message |
| --- | --- | --- | --- |
| 1 | Stack profile completeness | `{stackSlug}-stack-profile` has a row for every registry token; no value cell is empty, contains `{{`, or `TODO`; Required tokens are not `n/a`. No other draft file contains `{{` | `UNRESOLVED_TOKEN: {{TOKEN}} in {file}` |
| 2 | `{stackSlug}-code-review-output` reference | `{stackSlug}-review-checklist/SKILL.md` contains `{stackSlug}-code-review-output/SKILL.md` | `MISSING_REF: review checklist does not reference {stackSlug}-code-review-output/SKILL.md` |
| 3 | `applyTo` glob — testing | `testing.instructions.md` frontmatter `applyTo` matches `stackManifest.sourceFileGlob` (all source files, not test-only) | `GLOB_MISMATCH: testing.instructions applyTo does not match {sourceFileGlob}` |
| 4 | `applyTo` glob — security | `security.instructions.md` frontmatter `applyTo` matches `stackManifest.sourceFileGlob` | `GLOB_MISMATCH: security.instructions applyTo does not match {sourceFileGlob}` |
| 5 | Language plausibility | No wrong-language keywords in any skill file (e.g. a keyword characteristic of a different language appearing in a skill for this stack) | `LANGUAGE_MISMATCH: {keyword} found in {file}` |
| 6 | No agent overrides | No `agents/` directory (or agent file) is produced — tech layers are skills-only | `AGENT_OVERRIDE: agents/ must not be generated` |
| 7 | Notes page tech stack table | `docs/tech-layers/{stackSlug}.md` contains a table with language, framework, test framework, and version | `MISSING_TECH_TABLE: docs/tech-layers/{stackSlug}.md does not contain a tech stack table` |

---

## Phase 6 — Disk Write

Write files in dependency order (so partial writes leave the layer in a usable state):

1. `docs/tech-layers/{stackSlug}.md`
2. `{skillsDir}/{stackSlug}-stack-profile/SKILL.md`
3. `{skillsDir}/{stackSlug}-patterns/SKILL.md`
4. `{skillsDir}/{stackSlug}-testing/SKILL.md`
5. `{skillsDir}/{stackSlug}-security-practices/SKILL.md`
6. `{skillsDir}/{stackSlug}-review-checklist/SKILL.md`
7. `{skillsDir}/{stackSlug}-code-review-output/SKILL.md`
8. `{rulesDir}/{stackSlug}-testing.instructions.md`
9. `{rulesDir}/{stackSlug}-security.instructions.md`

After all writes:

```bash
grep -rn '{{' {skillsDir}/{stackSlug}-* {rulesDir}/{stackSlug}-* docs/tech-layers/{stackSlug}.md | grep -v '/{stackSlug}-stack-profile/'
```

Must return **zero matches** (the stack profile legitimately names tokens in its table). If any match is found, HARD STOP and report which file.

Print final summary:

```markdown
✅ Tech Layer Generated ({target}): {skillsDir}/{stackSlug}-*, {rulesDir}/{stackSlug}-*

  Files written:
  ├── docs/tech-layers/{stackSlug}.md             ({N} bytes)
  ├── {skillsDir}/
  │   ├── {stackSlug}-stack-profile/SKILL.md      ({N} bytes)
  │   ├── {stackSlug}-patterns/SKILL.md           ({N} bytes)
  │   ├── {stackSlug}-testing/SKILL.md            ({N} bytes)
  │   ├── {stackSlug}-security-practices/SKILL.md ({N} bytes)
  │   ├── {stackSlug}-review-checklist/SKILL.md   ({N} bytes)
  │   └── {stackSlug}-code-review-output/SKILL.md             ({N} bytes)
  └── {rulesDir}/
      ├── {stackSlug}-testing.instructions.md     ({N} bytes)
      └── {stackSlug}-security.instructions.md    ({N} bytes)

  Stack tokens resolved:       {N}/{registry size}
  Validation checks passed:    7/7

Next: run /mep:init-ai-workflows — it will detect this layer and record it as the active tech layer.
See docs/tech-layers/README.md and template/ADAPTER-GUIDE.md for the layer contract.
```

---

## Error Handling

| Condition | Action |
| --- | --- |
| Ambiguous `<stack>` argument | HALT Phase 0, emit clarifying question |
| Research subagent fails 3 verification attempts | HARD STOP with dimension name and last error |
| User types "abort" at Phase 3 gate | Stop immediately, write nothing |
| Phase 5 validation fails | HARD STOP with check number, file, and exact issue |
| Post-write grep finds unresolved tokens | HARD STOP with file and token |
| Output directory already exists | Warn user: "{skillsDir}/{stackSlug}-stack-profile already exists. Overwrite? (yes/no)" |
