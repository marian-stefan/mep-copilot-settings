---
name: init-ai-workflows
description: Initialize AI workflows in this repo — detects or generates a tech layer, installs it into .github/, resolves placeholders, and writes copilot-instructions.md
agent: agent
tools: ['read/readFile', 'edit/createFile', 'edit/editFiles', 'search/fileSearch', 'search/textSearch', 'search/listDirectory', 'execute']
user-invocable: true
---

# /init-ai-workflows

Bootstrap the AI workflow harness for this repository. Installs the technology-specific overlay from `template/tech-layers/` into `.github/`, resolves all configuration placeholders, and writes `.github/copilot-instructions.md`.

Run this once after copying the `mep-copilot-settings` repo into your project root.

---

## Phase 0 — Pre-flight

1. Verify `template/tech-layers/` exists at the repo root. If missing:
   ```
   ❌ HARD STOP: template/tech-layers/ not found.
   This prompt must be run after copying the full mep-copilot-settings repo into your project root.
   ```

2. List available tech layers:
   ```bash
   ls template/tech-layers/
   ```

3. Check whether a tech layer was already installed (detect by presence of `.github/instructions/testing.instructions.md`). If found:
   ```
   ⚠️  A tech layer appears to be already installed (.github/instructions/ exists).
   Re-running will only overwrite files that contain unresolved {{PLACEHOLDER}} tokens.
   Existing configured files will not be touched.
   ```

---

## Phase 1 — Tech Stack Detection

Scan the repo for technology signals. Run all commands, then evaluate:

```bash
# .NET / C#
find . -maxdepth 4 \( -name "*.csproj" -o -name "*.sln" \) ! -path "*/.git/*" ! -path "*/template/*" | head -5

# Angular / TypeScript
find . -maxdepth 4 -name "angular.json" ! -path "*/.git/*" ! -path "*/template/*" | head -3

# React / Next.js
find . -maxdepth 4 \( -name "next.config.*" -o -name "vite.config.*" \) ! -path "*/.git/*" ! -path "*/node_modules/*" ! -path "*/template/*" | head -3

# Java / Spring
find . -maxdepth 4 \( -name "pom.xml" -o -name "build.gradle" \) ! -path "*/.git/*" ! -path "*/template/*" | head -3

# Python
find . -maxdepth 4 \( -name "pyproject.toml" -o -name "setup.py" \) ! -path "*/.git/*" ! -path "*/template/*" | head -3

# Generic Node / frontend
find . -maxdepth 3 -name "package.json" ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/template/*" | head -5
```

Apply this detection matrix (first match wins):

| Signal | Detected Stack | Slug | Available Layer |
|--------|---------------|------|----------------|
| `*.csproj` or `*.sln` | .NET / C# | `dotnet` | `template/tech-layers/dotnet/` |
| `angular.json` | Angular / TypeScript | `angular` | — |
| `next.config.*` | Next.js / React | `react-nextjs` | — |
| `pom.xml` or `build.gradle` | Java / Spring | `java-spring` | — |
| `pyproject.toml` or `setup.py` | Python | `python` | — |
| `package.json` only | Node / TypeScript | `node` | — |
| None | Unknown | — | — |

Present the finding and **WAIT for user confirmation** before proceeding:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 Tech Stack Detection
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Detected stack : {detected stack name}
Evidence       : {file(s) that triggered detection}
Matching layer : {layer path or "none found"}

Is this correct?
  → Type "yes" to confirm
  → Type the correct stack name to override (e.g. "Angular", "Java Spring Boot")
  → Type "abort" to exit
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**WAIT** for explicit user response before continuing.

---

## Phase 2 — Tech Layer Resolution

**Case A — Matching layer found in `template/tech-layers/`**:

Present a confirmation gate and **WAIT**:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Tech Layer Found
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Layer  : template/tech-layers/{slug}/
Files  : {list agents/, skills/, instructions/ counts}

Proceed with this layer?
  → Type "yes" to continue to configuration
  → Type "abort" to exit
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Case B — No matching layer**:

No layer exists for the detected stack. The default path is to generate one now. Present the proposal and **WAIT**:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  No Tech Layer Available — Generation Required
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Detected stack  : {detected stack name}
Evidence        : {file(s) that triggered detection}
Available layers: {list from template/tech-layers/}

A tech layer for "{detected stack name}" will be generated using
/generate-tech-layer. This researches the stack online, verifies
claims, and writes all required files into:
  template/tech-layers/{slug}/

Is "{detected stack name}" the correct stack to generate for?
  → Type "yes" to confirm and start generation
  → Type a different stack name to correct it (e.g. "Angular 18 + TypeScript")
  → Type "abort" to exit without changes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**WAIT** for explicit user response.

- If user types `"yes"` or provides a corrected stack name: invoke `/generate-tech-layer <confirmed stack name>`. The generation prompt will run its own human review gate (Phase 3 of that prompt) before writing any files — do NOT skip it.
- After generation completes, verify the new layer exists at `template/tech-layers/{slug}/`, then show the Case A confirmation gate before proceeding to Phase 3.
- If user types `"abort"`: stop immediately, no files written.

---

## Phase 3 — Configuration Gathering

Detect defaults where possible, then present **all values together** for confirmation.

**Auto-detect**:
- Default branch: `git symbolic-ref --short HEAD 2>/dev/null || echo "develop"`
- Jira project prefix: scan recent commit messages for `[A-Z]+-[0-9]+` patterns: `git log --oneline -20 | grep -oE '[A-Z]+-[0-9]+' | head -1 | grep -oE '^[A-Z]+'`

Present collected values and **WAIT**:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚙️  Configuration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Jira project prefix    : {detected or "?"}
  (used in example commands, e.g. /create-specs HON-123)

Bitbucket project key  : {not set}
  (replaces {YOUR_BITBUCKET_PROJECT} in fix-pr and review-pr prompts)

Bitbucket repo slug    : {not set}
  (replaces {YOUR_BITBUCKET_REPO} in fix-pr and review-pr prompts)

Default branch         : {detected, e.g. "develop"}

Spec output path       : docs/specs/

Are these correct? Please provide any missing or incorrect values.
  → Type "yes" to confirm all values as shown
  → Type "jira=XXX" / "bbproject=XXX" / "bbrepo=XXX" / "branch=XXX" to set individual values
  → Type "abort" to exit
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**WAIT** for explicit user response. If any value is still unset after user input, re-prompt for that value only. Do not proceed until all four values are confirmed.

---

## Phase 4 — File Installation Plan

List every file to be copied **before touching anything**, then **WAIT for confirmation**:

```bash
# Inventory the tech layer
find template/tech-layers/{slug}/ -type f | sort
```

Present the plan:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Installation Plan
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Source : template/tech-layers/{slug}/
Target : .github/

Files to install:
  agents/   {N} files → .github/agents/      (shadow base agents by name)
  skills/   {N} files → .github/skills/      (override base skills by name)
  instructions/ {N} files → .github/instructions/  (NEW — auto-applied to source/test files)

Skip rule: existing files are NOT overwritten unless they contain {{PLACEHOLDER}} tokens.

Also:
  .github/copilot-instructions.md  ← will be created (or overwritten if exists)

Proceed with installation?
  → Type "yes" to install
  → Type "abort" to exit
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**WAIT** for explicit `"yes"` before writing any file.

---

## Phase 5 — File Installation

Copy in dependency order. For each file:

1. Check if target already exists and does NOT contain `{{` tokens → skip with `[skip] already configured`
2. Otherwise copy and log `[install] <target path>`

```
Copy order:
1. template/tech-layers/{slug}/skills/     → .github/skills/
2. template/tech-layers/{slug}/agents/     → .github/agents/
3. template/tech-layers/{slug}/instructions/ → .github/instructions/
```

Use shell copy commands, creating directories as needed:
```bash
mkdir -p .github/skills .github/agents .github/instructions
```

---

## Phase 6 — Placeholder Resolution

Scan all `.github/` files for unresolved tokens and apply substitutions.

**Known placeholders to replace**:

| Token | Value |
|-------|-------|
| `{YOUR_BITBUCKET_PROJECT}` | Bitbucket project key from Phase 3 |
| `{YOUR_BITBUCKET_REPO}` | Bitbucket repo slug from Phase 3 |

Scan command:
```bash
grep -rl '{YOUR_BITBUCKET_' .github/prompts/ .github/agents/ 2>/dev/null
```

Show substitutions before applying and **WAIT for confirmation**:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔁 Placeholder Replacements
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{YOUR_BITBUCKET_PROJECT} → {value}   in: fix-pr.prompt.md, review-pr.prompt.md
{YOUR_BITBUCKET_REPO}    → {value}   in: fix-pr.prompt.md, review-pr.prompt.md

Apply these replacements?
  → Type "yes" to apply
  → Type "abort" to skip this step
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**WAIT** for explicit `"yes"` before modifying any file.

After applying, run a final scan for any remaining unresolved tokens:
```bash
grep -rn '{{' .github/ 2>/dev/null | grep -v '.git'
```

Report any still-unresolved tokens by file and token name.

---

## Phase 7 — Generate `copilot-instructions.md`

Compose the contents of `.github/copilot-instructions.md` using the confirmed values from Phase 3 and the installed tech layer name.

Show the **full file content as a preview** and **WAIT for confirmation**:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 Preview: .github/copilot-instructions.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{full file content shown here}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Write this file?
  → Type "yes" to write
  → Type "edit" followed by your changes to modify before writing
  → Type "abort" to skip
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**WAIT** for explicit user response.

The file content to generate:

```markdown
# GitHub Copilot Instructions

This file is automatically loaded as context for every Copilot request in this repository.

## Project Identity

- **Jira project**: {JIRA_PREFIX} (e.g. `{JIRA_PREFIX}-123`)
- **Bitbucket project**: {BB_PROJECT} / **repo**: {BB_REPO}
- **Default branch**: {DEFAULT_BRANCH}
- **Spec output path**: docs/specs/{JIRA_KEY}/

## Active Tech Layer

**{tech layer name}** — installed from `template/tech-layers/{slug}/`

Tech-layer agents shadow the base agents by name. When calling "Tech Researcher (Story)" or "Code Reviewer", the {slug} variant is preferred.

## Available Commands

| Command | Purpose |
|---------|---------|
| `/create-specs <JIRA_KEY>` | Jira ticket → validated Spec document |
| `/start-implementation [JIRA_KEY]` | Validated Spec → code + tests → review → commit |
| `/create-tests` | Branch diff → unit tests with 100% coverage |
| `/review pr <PR_ID>` | Bitbucket PR → structured review report |
| `/review branch` | Local changeset → review report |
| `/create-high-level-design <EPIC_KEY>` | Epic → HLD + ADRs |
| `/create-impact-map <EPIC_KEY>` | Epic → architecture impact map |
| `/accept-spec <JIRA_KEY>` | Mark spec accepted; log to METRICS.md |
| `/reject-spec <JIRA_KEY> --reason <code>` | Mark spec rejected; log to METRICS.md |
| `/feedback-spec <JIRA_KEY> --accuracy <level>` | Post-implementation accuracy signal |
| `/review-harness-health` | Analyze METRICS.md; surface systemic issues |

## Standing Policies

1. **Jira is read-only**: No agent may post comments, transition status, or modify any Jira field. See `.github/skills/jira-readonly-policy/SKILL.md`.
2. **100% test coverage required**: Every implementation must pass all tests with full branch, function, line, and statement coverage before review. See `.github/skills/implementation-rules/SKILL.md`.
3. **Spec required before implementation**: Always have a validated Spec at `docs/specs/{JIRA_KEY}/SPEC-{JIRA_KEY}*.md` before running `/start-implementation`. Pre-flight warnings are informational; the spec status is not a hard block.

## Key Skill References

| Topic | File |
|-------|------|
| Issue-type routing & artifact naming | `.github/skills/specs-workflow-routing/SKILL.md` |
| Spec quality gates & scoring | `.github/skills/specs-quality-review/SKILL.md` |
| Implementation rules | `.github/skills/implementation-rules/SKILL.md` |
| Error taxonomy | `.github/skills/specs-error-handling/SKILL.md` |
```

---

## Phase 8 — Validation & Summary

Run a final validation pass:

```bash
# 1. Check for unresolved tokens
echo "=== Unresolved tokens ==="
grep -rn '{YOUR_\|{{' .github/ 2>/dev/null | grep -v '.git' | grep -v 'init-ai-workflows'

# 2. Check MCP configuration
echo "=== MCP servers ==="
cat .vscode/mcp.json 2>/dev/null || echo "⚠️  .vscode/mcp.json not found"

# 3. Count installed tech-layer files
echo "=== Installed files ==="
ls .github/agents/ | wc -l
ls .github/skills/ | wc -l
ls .github/instructions/ 2>/dev/null | wc -l

# 4. Extract all .github/-prefixed paths referenced inside harness files
echo "=== Internal path references ==="
grep -roh '\.github/[a-zA-Z0-9_./-]*' .github/ 2>/dev/null | \
  sed 's|.*:||' | sort -u
```

For every path produced by step 4, verify it exists:

```bash
# Run once per unique path found above
test -e "<path>" && echo "✅ <path>" || echo "❌ MISSING: <path>"
```

Collect all missing paths. If any are found, print a warning block:

```
⚠️  Broken internal references detected:
   ❌ .github/skills/some-skill/SKILL.md   (referenced in: agents/foo.agent.md)
   ❌ .github/instructions/testing.instructions.md   (referenced in: agents/bar.agent.md)

These files are referenced by harness agents or skills but were not found on disk.
Possible causes:
  - The tech layer was not fully installed (re-run Phase 5)
  - A file was renamed or not copied during installation
  - The reference uses a pre-installation path (e.g. dotnet/skills/... instead of .github/skills/...)
```

Do NOT block completion for broken references — report and continue so the user can decide whether to fix manually or re-run installation.

Check `.vscode/mcp.json` for required MCP servers. If `etools` (Jira + Bitbucket) or `web`/`fetch` are missing, print:

```
⚠️  MCP Warning: The following required servers were not found in .vscode/mcp.json:
   - etools  → required for /create-specs, /review-pr, /fix-pr (Jira + Bitbucket access)
   - web     → required for backend service discovery

Add them to .vscode/mcp.json before using the workflow commands.
```

Print the final summary:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ AI Workflows Initialized
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tech layer     : {name} ({slug})
Agents         : {N} installed → .github/agents/
Skills         : {N} installed → .github/skills/
Instructions   : {N} installed → .github/instructions/
Placeholders   : {all resolved | N unresolved — see above}
Instructions   : .github/copilot-instructions.md ✅

Quick start:
  /create-specs {JIRA_PREFIX}-123      Generate a Spec from a Jira ticket
  /start-implementation                 Implement from a validated Spec
  /create-tests                         Generate tests for branch changes
  /review pr <PR_ID>                    Review a Bitbucket PR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Phase 9 — Post-Install Cleanup

Remove files and directories that were only needed to bootstrap the harness and have no purpose in the target project.

Present the list and **WAIT for confirmation**:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧹 Cleanup
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The following files are no longer needed in this repository:

  README.md                                  (harness repo docs)
  MAINTAINERS.md                             (harness repo metadata)
  CLAUDE.md                                  (harness-specific Claude guidance)
  .claude/                                   (local harness dev settings)
  template/                                  (tech-layer sources — already installed into .github/)
  .github/prompts/init-ai-workflows.prompt.md   (this prompt — one-time bootstrap)
  .github/prompts/generate-tech-layer.prompt.md (tech-layer generator — not needed day-to-day)

Remove these now?
  → Type "yes" to delete
  → Type "skip" to leave them in place
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**WAIT** for explicit user response.

If `"yes"`:

```bash
rm -f README.md MAINTAINERS.md CLAUDE.md
rm -rf .claude/
rm -rf template/
rm -f .github/prompts/generate-tech-layer.prompt.md
rm -f .github/prompts/init-ai-workflows.prompt.md
```

Print confirmation:

```
🧹 Cleanup complete. Removed 7 bootstrap artifacts.
```

---

## Error Handling

| Condition | Action |
|-----------|--------|
| `template/tech-layers/` missing | HARD STOP — instructions above |
| User types "abort" at any gate | Stop immediately, report what was and wasn't applied |
| `/generate-tech-layer` fails | HARD STOP — report the failure, do not proceed to install |
| File copy fails (permissions) | HARD STOP — report the failing path |
| All placeholders still unresolved after Phase 6 | Warn and list them, but do not block Phase 7 |
