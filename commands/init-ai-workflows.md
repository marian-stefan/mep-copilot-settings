---
name: init-ai-workflows
description: Configure the mep harness for this repository — detect the tech stack, record the active tech layer and project identity in .github/copilot-instructions.md
agent: agent
tools: ['read/readFile', 'edit/createFile', 'edit/editFiles', 'search/fileSearch', 'search/textSearch', 'search/listDirectory', 'execute']
user-invocable: true
---

# /mep:init-ai-workflows

Configure the `mep` harness for this repository. The harness itself (agents, skills, commands, rules, the Tool Guardian hook and the `etools` MCP server) is delivered by the installed **mep** agent plugin and is never copied into this repository. This command records the two things the plugin cannot know, in **one** file — `.github/copilot-instructions.md`:

- **Active tech layer** — which `{slug}-stack-profile` skill resolves the `{{TOKEN}}` values.
- **Project identity** — Jira prefix, Bitbucket project/repo, default branch. Commands such as `/mep:review-pr` and `/mep:fix-pr` read these at runtime; nothing is substituted into plugin files.

Run it once per repository, and again whenever the stack or project coordinates change. It never overwrites a file without showing a preview and waiting for confirmation.

---

## Phase 0 — Pre-flight

1. Confirm the plugin is active: the skill `stack-profile` must be available. If it is not:

   ```markdown
   ❌ HARD STOP: the mep plugin is not active in this window.
   Install it (Chat: Install Plugin From Source → trimble-oss/mep-copilot-settings), enable it, and reload the window.
   ```

2. List the available tech layers — every skill named `{slug}-stack-profile` (plugin skills and any workspace skills under `.github/skills/`). Base skill `stack-profile` is the token registry, not a layer.
3. Read `.github/copilot-instructions.md` if it exists. If it has an `## Active Tech Layer` or `## Project Identity` section, treat the values as defaults and say so: `Existing configuration found — values below are pre-filled.`

---

## Phase 1 — Tech Stack Detection

Scan the repo for technology signals. Run all commands, then evaluate:

```bash
# .NET / C#
find . -maxdepth 4 \( -name "*.csproj" -o -name "*.sln" \) ! -path "*/.git/*" | head -5

# Angular / TypeScript
find . -maxdepth 4 -name "angular.json" ! -path "*/.git/*" | head -3

# React / Next.js
find . -maxdepth 4 \( -name "next.config.*" -o -name "vite.config.*" \) ! -path "*/.git/*" ! -path "*/node_modules/*" | head -3

# Java / Spring
find . -maxdepth 4 \( -name "pom.xml" -o -name "build.gradle" \) ! -path "*/.git/*" | head -3

# Python
find . -maxdepth 4 \( -name "pyproject.toml" -o -name "setup.py" \) ! -path "*/.git/*" | head -3

# Generic Node / frontend
find . -maxdepth 3 -name "package.json" ! -path "*/node_modules/*" ! -path "*/.git/*" | head -5
```

Apply this detection matrix (first match wins). The **Available Layer** column is resolved from Phase 0 — a stack has a layer when `{slug}-stack-profile` exists:

| Signal | Detected Stack | Slug |
| -------- | --------------- | ------ |
| `*.csproj` or `*.sln` | .NET / C# | `dotnet` |
| `angular.json` | Angular / TypeScript | `angular` |
| `next.config.*` | Next.js / React | `react-nextjs` |
| `pom.xml` or `build.gradle` | Java / Spring | `java-spring` |
| `pyproject.toml` or `setup.py` | Python | `python` |
| `package.json` only | Node / TypeScript | `node` |
| None | Unknown | — |

Present the finding and **WAIT for user confirmation** before proceeding:

```markdown
━━━━━━━━━━━━━━━━━━━━━━━━
🔍 Tech Stack Detection
━━━━━━━━━━━━━━━━━━━━━━━━
Detected stack : {detected stack name}
Evidence       : {file(s) that triggered detection}
Matching layer : {{slug}-stack-profile skill, or "none found"}

Is this correct?
  → Type "yes" to confirm
  → Type the correct stack name to override (e.g. "Angular", "Java Spring Boot")
  → Type "abort" to exit
━━━━━━━━━━━━━━━━━━━━━━━━
```

**WAIT** for explicit user response before continuing.

---

## Phase 2 — Tech Layer Resolution

**Case A — a `{slug}-stack-profile` skill exists**: confirm and **WAIT**:

```markdown
━━━━━━━━━━━━━━━━━━━━━━━━
✅ Tech Layer Found
━━━━━━━━━━━━━━━━━━━━━━━━
Layer   : {slug}
Skills  : {list every skill named {slug}-*}
Rules   : {list rules named {slug}-*.instructions.md if visible, else "delivered by the plugin"}

Use this layer?
  → Type "yes" to continue to configuration
  → Type "abort" to exit
━━━━━━━━━━━━━━━━━━━━━━━━
```

**Case B — no layer for the detected stack**: the default path is to generate one now, into this workspace. Present the proposal and **WAIT**:

```markdown
━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  No Tech Layer Available — Generation Required
━━━━━━━━━━━━━━━━━━━━━━━━
Detected stack  : {detected stack name}
Evidence        : {file(s) that triggered detection}
Available layers: {list from Phase 0}

A tech layer for "{detected stack name}" will be generated with
/mep:generate-tech-layer. It researches the stack online, verifies claims,
and writes the layer into this workspace:
  .github/skills/{slug}-*   .github/instructions/{slug}-*   docs/tech-layers/{slug}.md

Is "{detected stack name}" the correct stack to generate for?
  → Type "yes" to confirm and start generation
  → Type a different stack name to correct it (e.g. "Angular 18 + TypeScript")
  → Type "abort" to exit without changes
━━━━━━━━━━━━━━━━━━━━━━━━
```

**WAIT** for explicit user response.

- If user types `"yes"` or provides a corrected stack name: invoke `/mep:generate-tech-layer <confirmed stack name>`. It runs its own human review gate before writing any file — do NOT skip it.
- After generation completes, verify `.github/skills/{slug}-stack-profile/SKILL.md` exists, then show the Case A gate before proceeding.
- If user types `"abort"`: stop immediately, no files written.

---

## Phase 3 — Configuration Gathering

Detect defaults where possible, then present **all values together** for confirmation.

**Auto-detect**:

- Default branch: `git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null | sed 's|^origin/||'`, falling back to `git symbolic-ref --short HEAD`, then `develop`
- Jira project prefix: scan recent commit messages for `[A-Z]+-[0-9]+` patterns: `git log --oneline -20 | grep -oE '[A-Z]+-[0-9]+' | head -1 | grep -oE '^[A-Z]+'`
- Bitbucket project/repo: parse `git remote get-url origin` when it points at Bitbucket (`.../scm/{PROJECT}/{repo}.git` or `.../projects/{PROJECT}/repos/{repo}`)

Present collected values and **WAIT**:

```markdown
━━━━━━━━━━━━━━━━━━━━━━━━
⚙️  Configuration
━━━━━━━━━━━━━━━━━━━━━━━━
Jira project prefix    : {detected or "?"}
  (used in example commands, e.g. /mep:create-specs HON-123)

Bitbucket project key  : {detected or "not set"}
  (read at runtime by /mep:fix-pr and /mep:review-pr)

Bitbucket repo slug    : {detected or "not set"}

Default branch         : {detected, e.g. "develop"}

Spec output path       : docs/specs/

Are these correct? Please provide any missing or incorrect values.
  → Type "yes" to confirm all values as shown
  → Type "jira=XXX" / "bbproject=XXX" / "bbrepo=XXX" / "branch=XXX" to set individual values
  → Type "abort" to exit
━━━━━━━━━━━━━━━━━━━━━━━━
```

**WAIT** for explicit user response. If the Jira prefix or default branch is still unset after user input, re-prompt for that value only. Bitbucket values may stay `not set` — the commands that need them ask at run time.

---

## Phase 4 — Write `.github/copilot-instructions.md`

Compose the file from the template below, using the confirmed Phase 3 values and the Phase 2 layer. Keep the `{JIRA_KEY}` example tokens as written. Do not paraphrase or extend the template.

If `.github/copilot-instructions.md` already exists, preserve every section that is not one of **Project Identity**, **Active Tech Layer**, **Available Commands**, **Standing Policies** and **Key Skill References**: show the user exactly which sections will be replaced and which are kept.

Show the **full file content as a preview** and **WAIT for confirmation**:

```markdown
━━━━━━━━━━━━━━━━━━━━━━━━
📄 Preview: .github/copilot-instructions.md
━━━━━━━━━━━━━━━━━━━━━━━━
{full file content shown here}
━━━━━━━━━━━━━━━━━━━━━━━━
Write this file?
  → Type "yes" to write
  → Type "edit" followed by your changes to modify before writing
  → Type "abort" to skip
━━━━━━━━━━━━━━━━━━━━━━━━
```

**WAIT** for explicit user response.

### Template

````markdown
# GitHub Copilot Instructions

This file is loaded as context for every Copilot request in this repository.
The `mep` agent plugin reads the **Project Identity** and **Active Tech Layer** sections at runtime.
Generated by `/mep:init-ai-workflows`; safe to edit by hand.

## Project Identity

- **Jira project**: {JIRA_PREFIX} (e.g. `{JIRA_PREFIX}-123`)
- **Bitbucket project**: {BB_PROJECT}
- **Bitbucket repo**: {BB_REPO}
- **Default branch**: {DEFAULT_BRANCH}
- **Spec output path**: docs/specs/{JIRA_KEY}/

## Active Tech Layer

- **slug**: {slug}
- **name**: {tech layer name}

The tech layer is a set of skills (`{slug}-stack-profile`, `{slug}-patterns`, `{slug}-testing`, `{slug}-security-practices`, `{slug}-review-checklist`, `{slug}-code-review-output`) plus auto-applied rules. Base agents load them at runtime; `{{TOKEN}}` values are resolved from the `{slug}-stack-profile` skill (registry: the `stack-profile` skill).

## Available Commands

| Command | Purpose |
|---------|---------|
| `/mep:create-specs <JIRA_KEY>` | Jira ticket → validated Spec document |
| `/mep:start-implementation [JIRA_KEY]` | Validated Spec → code + tests → review → commit |
| `/mep:create-tests` | Branch diff → unit tests meeting the Coverage Contract |
| `/mep:review-pr <PR_ID>` | Bitbucket PR → structured review report |
| `/mep:fix-pr <PR_ID>` | Apply fixes for PR feedback and review findings |
| `/mep:review-branch-changes` | Local branch changeset → review report |
| `/mep:create-high-level-design <EPIC_KEY>` | Epic → HLD + ADRs |
| `/mep:create-impact-map <EPIC_KEY>` | Epic → architecture impact map |
| `/mep:accept-spec <JIRA_KEY>` | Mark spec accepted; log to METRICS.md |
| `/mep:reject-spec <JIRA_KEY> --reason <code>` | Mark spec rejected; log to METRICS.md |
| `/mep:feedback-spec <JIRA_KEY> --accuracy <level>` | Post-implementation accuracy signal |
| `/mep:review-harness-health` | Analyze METRICS.md; surface systemic issues |

## Standing Policies

1. **Jira is read-only**: No agent may post comments, transition status, or modify any Jira field. See the `jira-readonly-policy` skill.
2. **Coverage Contract**: Every implementation must pass all tests with 100% of changed lines and branches covered (no repo-wide regression) before review. See the `implementation-rules` skill.
3. **Spec required before implementation**: Always have a validated Spec at `docs/specs/{JIRA_KEY}/SPEC-{JIRA_KEY}*.md` before running `/mep:start-implementation`. Pre-flight warnings are informational; the spec status is not a hard block.

## Key Skill References

| Topic | Skill |
|-------|-------|
| Issue-type routing & artifact naming | `specs-workflow-routing` |
| Spec quality gates & scoring | `specs-quality-review` |
| Implementation rules | `implementation-rules` |
| Error taxonomy | `specs-error-handling` |
````

---

## Phase 5 — Validation & Summary

Run a final validation pass:

```bash
# 1. The written file carries both runtime sections
grep -c '^## Project Identity$\|^## Active Tech Layer$' .github/copilot-instructions.md   # expect 2

# 2. The active layer's stack profile is available
#    (plugin skill, or .github/skills/{slug}-stack-profile/SKILL.md for a workspace layer)
```

Confirm by name that the skill `{slug}-stack-profile` is available, and that the `etools` MCP server is listed among the available tools. If `etools` tools are missing, print:

```markdown
⚠️  MCP Warning: the plugin's `etools` server (Jira + Bitbucket) is not available.
   Required for /mep:create-specs, /mep:review-pr, /mep:fix-pr.
   Open the MCP servers list, start or trust `etools` (provided by the mep plugin), and sign in.
```

Do NOT block completion for warnings — report and continue.

Print the final summary:

```markdown
━━━━━━━━━━━━━━━━━━━━━━━━
✅ AI Workflows Configured
━━━━━━━━━━━━━━━━━━━━━━━━
Tech layer     : {name} ({slug})
Stack profile  : {slug}-stack-profile ✅
Project values : {N} set, {N} "not set" (asked at run time)
Config file    : .github/copilot-instructions.md ✅

Quick start:
  /mep:create-specs {JIRA_PREFIX}-123      Generate a Spec from a Jira ticket
  /mep:start-implementation                 Implement from a validated Spec
  /mep:create-tests                         Generate tests for branch changes
  /mep:review-pr <PR_ID>                    Review a Bitbucket PR
━━━━━━━━━━━━━━━━━━━━━━━━
```

Commit `.github/copilot-instructions.md` (and any workspace tech layer under `.github/skills/`, `.github/instructions/`, `docs/tech-layers/`) so teammates share the same configuration.
