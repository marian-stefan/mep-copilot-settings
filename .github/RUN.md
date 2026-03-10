# How to Run the Specs Workflow

Step-by-step guide to generate a specification from a ticket.

## Prerequisites

- Repository root access
- Git credentials configured
- Jira ticket access (if using Jira)
- AI agent orchestration capability

## Setup (One-Time)

### 1. Copy generic-specs to Your Repository

```bash
# From the MEP workspace:
cp -r generic-specs /path/to/your/repo/

# Or manually:
# - Copy all files from this folder
# - Place at repository root
# - Commit to a setup branch (optional)
```

### 2. Configure repo.config.json

```bash
cd your-repo/generic-specs/config
cp repo.config.sample.json repo.config.json
```

Edit `repo.config.json`:

```json
{
  "repoType": "dotnet",              // Set to your language
  "specOutputPath": "./docs/specs",  // Where specs are saved
  "ticketSource": "jira",            // jira or manual
  "jiraConfig": {
    "host": "https://your-jira.atlassian.net",
    "projectKey": "YOUR_PROJECT"
  },
  "repositoryInfo": {
    "name": "your-service-name",
    "language": "C#",
    "description": "Purpose of this repo"
  }
}
```

## Running the Workflow

### Method 1: Using the Prompt (Recommended)

```bash
/create-specs YOUR_TICKET_KEY
```

**Examples:**
```bash
/create-specs PROJ-123              # Standard: generates spec locally
/create-specs PROJ-123 --push       # Auto-push: skips confirmation
/create-specs PROJ-123 --dry-run    # Dry-run: no git operations
```

### Method 2: Using the Agent Directly

If your environment supports agent invocation:

```
/specs-workflow-orchestrator
TICKET_KEY: YOUR_TICKET_KEY
FLAGS: --push (optional)
```

## What Happens

The workflow automatically executes 6 steps:

| Step | Agent | Output | Time |
|------|-------|--------|------|
| 1 | **Analyst** | `BRIEF-{KEY}.md` | 2-5 min |
| 2 | **Researcher** | `CONTEXT-{KEY}.md` | 5-10 min |
| 3 | **Writer** | `SPEC-{KEY}-Plan.md` | 3-5 min |
| 4 | **Reviewer (plugin-selected)** | Quality Report | 2-3 min |
| 5 | **Git Operator** | Branch + Commit | 1-2 min |
| 6 | **Orchestrator** | Summary | <1 min |

**Total Time**: Typically 15-30 minutes

Technology plugin resolution occurs before validation and selects:
- reviewer agent
- stack-specific spec guidance

Fallback behavior: if no plugin matches, `Generic Reviewer` is used.

## Understanding the Output

### Requirement Brief (`BRIEF-{KEY}.md`)

Located at repository root. Contains:
- Problem statement
- User stories
- Functional requirements  
- Acceptance criteria
- Open questions

**Action**: Review for accuracy, update ticket if gaps exist

### Technical Context (`CONTEXT-{KEY}.md`)

Located at repository root. Contains:
- Affected files with path and line numbers
- Before/after code snippets
- New files to create
- Implementation plan step-by-step
- Feasibility & risk analysis

**Action**: Review for completeness, technical accuracy

### Specification (`SPEC-{KEY}-Plan.md`)

Located at repository root. Final deliverable containing:
- Overview
- Requirements (functional & non-functional)
- Technical architecture
- Security considerations
- Implementation plan
- Testing approach
- Risks & mitigation

**Action**: Commit to the feature branch, use as reference for implementation

### Git Branch Output

```
✅ Spec Generation Complete

Ticket: PROJ-123
Branch: feature/PROJ-123
Spec File: SPEC-PROJ-123-Plan.md
Quality Score: 85/100
```

**Branch URL**: Provided in output (if available)

## Error Recovery

### "Ticket Not Found"

```
❌ Jira ticket PROJ-123 not found

Remediation:
1. Verify ticket key spelling
2. Check Jira access/credentials
3. Ensure ticket exists in project PROJ
```

**Action**: Fix and retry with correct ticket key

### "Technical Context Validation Failed"

```
❌ CRITICAL VALIDATION FAILURE

Failed Gates:
  - File paths missing concrete examples (uses {placeholder})
  - Backend services required declaration missing
```

**Action**: 
1. Review `CONTEXT-{KEY}.md` file (already created)
2. Identify gaps (missing file paths, incomplete snippets)
3. Update ticket with clarifications
4. Retry workflow

### "Git Conflicts"

```
❌ Merge conflict or unrelated changes detected

Remediation:
1. Stash unrelated changes: git stash
2. Retry specs workflow
3. Restore stash: git stash pop
```

**Action**: Stash work, retry

## Next Steps After Generation

### 1. Review the Spec

```bash
# In your IDE or editor:
cat generic-specs/SPEC-{KEY}-Plan.md
```

Check:
- ✅ Requirements are complete
- ✅ Implementation plan is actionable
- ✅ File paths are correct for your repo
- ✅ Code snippets make sense

### 2. Discuss in Planning

- Share the branch/spec with the team
- Address any questions or clarifications
- Finalize acceptance criteria

### 3. Begin Implementation

Use the Technical Context (`CONTEXT-{KEY}.md`) as your implementation guide:
- Exact file paths and line numbers identified
- Before/after code snippets provided
- Step-by-step plan ready to follow

### 4. Push and Merge

If you used `--dry-run`:
```bash
git checkout feature/{KEY}
git push origin feature/{KEY}
```

Create PR/merge request in your Git host.

## Advanced Usage

### Generate Multiple Specs

For epics with child tickets:

```bash
/create-specs PROJ-100        # Epic (generates parent spec)
/create-specs PROJ-101 --push # Child 1
/create-specs PROJ-102 --push # Child 2
```

### Skip Confirmation Prompts

```bash
/create-specs PROJ-123 --push --dry-run
# Generates locally AND automatically pushes (if not dry-run)
```

### Dry-Run Without Git Operations

```bash
/create-specs PROJ-123 --dry-run
# Generates BRIEF, CONTEXT, SPEC files
# No branch created
# No git push
```

Review artifacts locally, then manually commit if satisfied.

## Troubleshooting

### Agent Invocation Fails

Check prerequisites:
- [ ] Agent runtime available
- [ ] MCP server configured (if applicable)
- [ ] Jira MCP tools available
- [ ] File read/write permissions

### Incomplete Specs

Possible causes:
- Ticket is missing critical details (check `Open Questions` section)
- Repository structure differs from config (update `repo.config.json`)
- Tech Researcher couldn't analyze codebase (update ticket with context)

**Action**: Update ticket, re-run workflow

### Quality Score Low

Reasons:
- Missing before/after code snippets in Technical Context
- File paths incomplete or using `{placeholder}` syntax
- Implementation plan lacks concrete steps

**Action**: 
1. Review `CONTEXT-{KEY}.md` for gaps
2. Provide missing info to Tech Researcher
3. Retry workflow

## Example Workflow

```bash
# 1. Prepare repo
cd /my-backend-service
cp -r ../generic-specs .
cd generic-specs
cp config/repo.config.sample.json config/repo.config.json
vi config/repo.config.json  # Edit for your repo

# 2. Generate spec
/create-specs MYPROJ-456

# 3. Review artifacts
cat ../BRIEF-MYPROJ-456.md
cat ../CONTEXT-MYPROJ-456.md
cat ../SPEC-MYPROJ-456-Plan.md

# 4. Accept and push
cd ..
git checkout feature/MYPROJ-456
git push origin feature/MYPROJ-456  # Or let workflow push with --push flag
```

## Support

For issues:
1. Check `skills/specs-error-handling/SKILL.md` for error patterns
2. Review `README.md` for configuration guidance
3. Verify `config/repo.config.json` is correct for your repo

---

**Need help?** Consult:
- `README.md` - Overview and features
- `skills/specs-validation/SKILL.md` - Quality gates
- `skills/specs-error-handling/SKILL.md` - Error types and recovery
- `agents/tech-researcher.agent.md` - How research works
