---
name: generate-tech-layer
description: Research a technology stack and generate all mandatory tech-layer files for agentic-base. Inspects the current repository to decide if backend-service-discovery is needed.
tools: ['agent', 'read/readFile', 'edit/createFile', 'edit/editFiles', 'search/textSearch', 'search/fileSearch', 'search/listDirectory', 'execute', 'web/fetch']
user-invocable: true
---

# /generate-tech-layer `<stack>`

Generates a complete, validated technology layer for the `agentic-base` harness by:

1. Inspecting the **current repository** to determine its project type (UI vs. service/library)
2. Researching the target `<stack>` across 4 independent dimensions in parallel
3. Adversarially verifying each research report
4. Presenting a human review gate before writing anything
5. Generating all 11 mandatory files (or 10, if backend discovery is excluded)
6. Validating the output against the ADAPTER-GUIDE contract
7. Writing files in dependency order

## Usage

```
/generate-tech-layer React/Next.js
/generate-tech-layer "Java Spring Boot"
/generate-tech-layer "Python FastAPI"
/generate-tech-layer "Vue 3 + TypeScript"
```

---

## Phase 0 — Input Normalization & Repo Inspection

### 0a. Parse the stack argument

Normalize `<stack>` into a `stackManifest`:

```
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

```
❓ I need a more specific stack name to generate the tech layer.
Examples: "<Framework> <Version>", "<Language> + <Framework>", "<Runtime> <Framework>"
What stack should I generate a tech layer for?
```

### 0b. Inspect the current repository to decide backend-service-discovery inclusion

Scan the repository root for signals of each project type. Apply in order — first match wins.

**Scan commands** (run all, then evaluate):

```bash
# Detect UI / frontend signals
find . -maxdepth 4 \( \
  -name "package.json" -o -name "angular.json" -o -name "next.config.*" \
  -o -name "vite.config.*" -o -name "webpack.config.*" -o -name "*.csproj" \
  -o -name "*.jsx" -o -name "*.tsx" -o -name "*.vue" -o -name "*.razor" \
  -o -name "*.cshtml" \
\) ! -path "*/node_modules/*" ! -path "*/.git/*" | head -40

# Detect pure-service / library signals
find . -maxdepth 3 \( \
  -name "*.csproj" -o -name "pom.xml" -o -name "build.gradle" \
  -o -name "setup.py" -o -name "pyproject.toml" \
\) ! -path "*/.git/*" | xargs grep -l \
  "Worker\|Console\|Daemon\|Service\|Library\|ClassLib\|Exe" 2>/dev/null | head -10
```

**Decision matrix**:

| Signals found | `includeBackendDiscovery` | Reason |
|---|---|---|
| `package.json` / `angular.json` / `next.config.*` / `*.jsx` / `*.tsx` / `*.vue` | **true** | Frontend app making API calls |
| `*.razor` / `*.cshtml` (Razor Pages / Blazor) | **true** | UI rendered server-side, calls APIs |
| `*.csproj` with `<OutputType>Exe</OutputType>` AND no `*.razor`/`*.cshtml` | **false** | Console app / background service |
| `*.csproj` with `<OutputType>Library</OutputType>` | **false** | Class library, no HTTP clients |
| `pom.xml` / `build.gradle` with `spring-boot-starter-web` BUT no frontend dir | **false** | Pure REST API service (exposes, doesn't consume) |
| `pom.xml` / `build.gradle` with `WebClient` / `RestTemplate` imports AND a frontend dir or separate UI module | **true** | Service that also orchestrates other APIs from a UI layer |
| None of the above / ambiguous | **true** | Err toward inclusion; backend discovery can always be skipped at runtime |

Record the decision:

```yaml
includeBackendDiscovery: true | false
reason: "<one-sentence explanation based on evidence found>"
evidence: ["<file or pattern that drove the decision>"]
```

Display to user before proceeding:

```
🔍 Repo inspection complete
   Stack: {stackSlug}
   Project type: {UI app | Service / Library | Ambiguous}
   Backend service discovery: {✅ included | ❌ excluded — {reason}}
   Evidence: {evidence list}

Proceeding with research…
```

---

## Phase 1 — Parallel Research Fan-Out (×4 concurrent subagents)

Each subagent receives the full `stackManifest`. Each **must cite a primary source URL** (official docs or GitHub permalink) for every non-obvious claim. Each returns a structured Markdown report ending with a `## Resolved Placeholders` section.

Run all four concurrently.

### Subagent 1 — Patterns Research

**Scope**: Language idioms, module taxonomy, state management, resource lifecycle, architecture layers.

**Owned `{{PLACEHOLDER}}` tokens**: `{{STATE_MANAGEMENT_PATTERNS}}`, `{{SUBSCRIPTION_LIFECYCLE_PATTERN}}`, `{{CODEBASE_MODULE_TAXONOMY}}`

**Produce**:
- Modern syntax patterns (language version from `stackManifest.languageVersion`)
- Module / project / package naming conventions and layer structure
- State management canonical patterns with code examples
- Resource/subscription cleanup idiom for this stack (what pattern is used to dispose of subscriptions, streams, or resources)
- Top 10 anti-patterns to flag in code review
- Architecture boundary rules (what layer may import what)

### Subagent 2 — Testing Research

**Scope**: Test framework, mock lifecycle, assertion style, coverage tooling.

**Owned `{{PLACEHOLDER}}` tokens**: `{{TEST_COMMAND}}`

**Produce**:
- Exact `{{TEST_COMMAND}}` with coverage flags (must produce a coverage report)
- Test file naming convention (source path → test path mapping)
- Mock lifecycle rules (when/how mocks initialize — constructor, setUp, beforeEach)
- Minimal defaults convention
- Test isolation rules
- `applyTo` glob for `testing.instructions.md`
- Concrete test skeleton with Arrange-Act-Assert

### Subagent 3 — Security Research

**Scope**: Stack-specific OWASP risks, auth patterns, secret management, injection prevention.

**Owned `{{PLACEHOLDER}}` tokens**: _(none — pure content synthesis)_

**Produce**:
- Top 10 security rules for this stack (must fix / should fix / consider)
- Secret management pattern (never hardcode; how to inject secrets in this stack)
- Input validation at API boundaries
- Auth/authz patterns canonical to this stack
- Known injection risks and mitigations
- `applyTo` glob for `security.instructions.md`

### Subagent 4 — Build System Research

**Scope**: Project/module discovery, dependency graph, scaffolding commands.

**Owned `{{PLACEHOLDER}}` tokens**: `{{BUILD_SYSTEM_PROJECT_DISCOVERY}}`, `{{DEPENDENCY_GRAPH_COMMAND}}`, `{{SCAFFOLD_COMMAND}}`

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
3. **Placeholder completeness**: verify every token from the static list below has a resolved value in the `## Resolved Placeholders` section of the correct report.

**Static placeholder list** (from `ADAPTER-GUIDE.md`):
- `{{BUILD_SYSTEM_PROJECT_DISCOVERY}}` — build-system report
- `{{DEPENDENCY_GRAPH_COMMAND}}` — build-system report
- `{{CODEBASE_MODULE_TAXONOMY}}` — patterns report
- `{{STATE_MANAGEMENT_PATTERNS}}` — patterns report
- `{{SUBSCRIPTION_LIFECYCLE_PATTERN}}` — patterns report
- `{{TEST_COMMAND}}` — testing report
- `{{SCAFFOLD_COMMAND}}` — build-system report

4. **API hallucination spot-check**: for each report, select the 3 most specific/obscure claims (e.g. a specific CLI flag, a specific config key, a library method signature). Fetch the primary source URL cited by the research agent. Confirm the claim appears in that source. Mark FAIL if not confirmed.

**On FAIL**: re-run only the failing dimension's subagent (not all four). Loop until all pass or 3 attempts exhausted (then HARD STOP with details).

**Output**: `verification-summary.md` with per-report PASS/FAIL and notes.

---

## Phase 3 — Human Review Gate (BLOCKING)

Present to the user before writing anything:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Tech Layer Generation — Review Gate
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Stack:    {stackManifest.framework} ({stackManifest.language} {stackManifest.languageVersion})
Slug:     {stackSlug}
Output:   agentic-base/tech-layers/{stackSlug}/

Backend service discovery: {✅ included | ❌ excluded — {reason}}
Verification: {✅ all 4 dimensions passed | ⚠️ {N} dimensions re-ran}

── Resolved Placeholder Tokens ───────────────────────
{{BUILD_SYSTEM_PROJECT_DISCOVERY}}  →  {value}
{{DEPENDENCY_GRAPH_COMMAND}}        →  {value}
{{CODEBASE_MODULE_TAXONOMY}}        →  {table summary}
{{STATE_MANAGEMENT_PATTERNS}}       →  {value}
{{SUBSCRIPTION_LIFECYCLE_PATTERN}}  →  {value}
{{TEST_COMMAND}}                    →  {value}
{{SCAFFOLD_COMMAND}}                →  {value}

── Files to be written ───────────────────────────────
  README.md
  agents/tech-researcher-story.agent.md
  agents/code-reviewer.agent.md
  agents/test-generator.agent.md
  {if includeBackendDiscovery} agents/backend-service-discovery.agent.md
  skills/{stackSlug}-patterns/SKILL.md
  skills/{stackSlug}-testing/SKILL.md
  skills/security-practices/SKILL.md
  skills/code-review-output/SKILL.md
  instructions/testing.instructions.md
  instructions/security.instructions.md

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

Run both groups concurrently. Both groups receive all four research reports, the `stackManifest`, the `verification-summary.md`, and the `includeBackendDiscovery` flag.

### Group A — Template Injection (agent files)

For each agent file, read the corresponding base agent from `agentic-base/agents/` and produce the tech-layer override by:
1. Replacing every `{{PLACEHOLDER}}` token with the resolved value from the research reports
2. Appending stack-specific sections (grep patterns, code snippet format examples, language-specific research steps)
3. Keeping the `name:` in the YAML frontmatter **identical** to the base agent name (e.g. `Tech Researcher (Story)`, `Code Reviewer`) — tech-layer agents shadow base agents by name, so the names must match exactly
4. Referencing the tech-layer's own skills (e.g. `skills/{stackSlug}-patterns/SKILL.md`) not the base skills

Files produced:
- `agents/tech-researcher-story.agent.md` — from patterns + build research
- `agents/code-reviewer.agent.md` — from patterns + security research; must reference `skills/code-review-output/SKILL.md`
- `agents/test-generator.agent.md` — from testing research
- `agents/backend-service-discovery.agent.md` — **only if `includeBackendDiscovery: true`**; from build research (service registration patterns for this stack)

### Group B — Content Synthesis (skills, instructions, README)

Synthesize each file from its dimension's research report. Follow the structure mandated by `ADAPTER-GUIDE.md` for each file type.

Files produced:
- `skills/{stackSlug}-patterns/SKILL.md` — from patterns research; include code examples in the correct language
- `skills/{stackSlug}-testing/SKILL.md` — from testing research; include mock lifecycle, assertion patterns, coverage config
- `skills/security-practices/SKILL.md` — from security research; OWASP checklist + code examples
- `skills/code-review-output/SKILL.md` — **fixed template structure** (Summary / Risk table / Findings by severity / Metrics / Follow-up checklist); only the language examples vary
- `instructions/testing.instructions.md` — `applyTo: "{testFileGlob}"` from stackManifest; rules from testing research
- `instructions/security.instructions.md` — `applyTo: "{sourceFileGlob}"` from stackManifest; critical rules from security research
- `README.md` — documents stack version assumptions, file structure, how to activate, tech stack table

---

## Phase 5 — Programmatic Validation

Run these 7 checks against all generated draft files **before writing to disk**. Any FAIL is a hard block — report the exact file and the exact issue.

| # | Check | PASS condition | FAIL message |
|---|---|---|---|
| 1 | Placeholder completeness | Zero `{{` tokens remain in any draft file | `UNRESOLVED_TOKEN: {{TOKEN}} in {file}` |
| 2 | `code-review-output` reference | `code-reviewer.agent.md` contains `code-review-output/SKILL.md` | `MISSING_REF: code-reviewer does not reference code-review-output/SKILL.md` |
| 3 | `applyTo` glob — testing | `testing.instructions.md` frontmatter `applyTo` matches `stackManifest.testFileGlob` | `GLOB_MISMATCH: testing.instructions applyTo does not match {testFileGlob}` |
| 4 | `applyTo` glob — security | `security.instructions.md` frontmatter `applyTo` matches `stackManifest.sourceFileGlob` | `GLOB_MISMATCH: security.instructions applyTo does not match {sourceFileGlob}` |
| 5 | Language plausibility | No wrong-language keywords in any skill file (e.g. a keyword characteristic of a different language appearing in a skill for this stack) | `LANGUAGE_MISMATCH: {keyword} found in {file}` |
| 6 | Backend discovery consistency | If `includeBackendDiscovery: false`, `agents/backend-service-discovery.agent.md` is NOT in draft file list; if `true`, it IS | `BACKEND_INCONSISTENCY: inclusion flag and file list do not match` |
| 7 | README tech stack table | `README.md` contains a table with language, framework, test framework, and version | `MISSING_TECH_TABLE: README.md does not contain a tech stack table` |

---

## Phase 6 — Disk Write

Write files in dependency order (so partial writes leave the layer in a usable state):

1. `README.md`
2. `skills/{stackSlug}-patterns/SKILL.md`
3. `skills/{stackSlug}-testing/SKILL.md`
4. `skills/security-practices/SKILL.md`
5. `skills/code-review-output/SKILL.md`
6. `agents/tech-researcher-story.agent.md`
7. `agents/code-reviewer.agent.md`
8. `agents/test-generator.agent.md`
9. `agents/backend-service-discovery.agent.md` _(only if included)_
10. `instructions/testing.instructions.md`
11. `instructions/security.instructions.md`

After all writes:

```bash
grep -r '{{' agentic-base/tech-layers/{stackSlug}/
```

Must return **zero matches**. If any match is found, HARD STOP and report which file.

Print final summary:

```
✅ Tech Layer Generated: agentic-base/tech-layers/{stackSlug}/

  Files written:
  ├── README.md                                  ({N} bytes)
  ├── agents/
  │   ├── tech-researcher-story.agent.md         ({N} bytes)
  │   ├── code-reviewer.agent.md                 ({N} bytes)
  │   ├── test-generator.agent.md                ({N} bytes)
  │   └── backend-service-discovery.agent.md     ({N} bytes | EXCLUDED)
  ├── skills/
  │   ├── {stackSlug}-patterns/SKILL.md          ({N} bytes)
  │   ├── {stackSlug}-testing/SKILL.md           ({N} bytes)
  │   ├── security-practices/SKILL.md            ({N} bytes)
  │   └── code-review-output/SKILL.md            ({N} bytes)
  └── instructions/
      ├── testing.instructions.md                ({N} bytes)
      └── security.instructions.md               ({N} bytes)

  Placeholder tokens resolved: {N}/7
  Validation checks passed:    7/7
  Backend discovery:           {✅ included | ❌ excluded}

Next: copy agentic-base/ to .github/ in your target repo.
See agentic-base/README.md for activation instructions.
```

---

## Error Handling

| Condition | Action |
|---|---|
| Ambiguous `<stack>` argument | HALT Phase 0, emit clarifying question |
| Research subagent fails 3 verification attempts | HARD STOP with dimension name and last error |
| User types "abort" at Phase 3 gate | Stop immediately, write nothing |
| Phase 5 validation fails | HARD STOP with check number, file, and exact issue |
| Post-write grep finds unresolved tokens | HARD STOP with file and token |
| Output directory already exists | Warn user: "agentic-base/tech-layers/{stackSlug}/ already exists. Overwrite? (yes/no)" |
