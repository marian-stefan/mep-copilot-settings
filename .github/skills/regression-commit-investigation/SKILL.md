---
name: regression-commit-investigation
description: Step-by-step git and Bitbucket investigation procedure for identifying the commit that introduced a regression. Loaded by Tech Researcher only when issueType is Regression Bug. Outputs a ranked suspect-commit table for embedding in the Technical Context Regression Analysis section.
---

# Regression Commit Investigation

**Trigger**: Execute this procedure if and only if the issue is classified as a **Regression Bug** — `issueType = "Regression Bug"`, OR `issueType = "Bug"` AND (Jira labels include `regression` OR summary/description contains the word "regression").

**Goal**: Identify the specific commit (or small set of commits) most likely responsible for introducing the regression and produce a ranked suspect table for the Technical Context.

---

## Step 1 — Extract the Regression Window

From the Requirement Brief:
- Look for "was working in version X / broken in version Y", a broken-since date, a broken build number, or a specific environment reference.
- If no explicit window is stated: use the Jira ticket creation date as the upper bound; fall back to the last 30 days as the search range.
- Record: `regressionSince` (date or tag), `lastKnownGood` (date or tag).

## Step 2 — Identify Candidate Files

Use the file list from the codebase analysis already completed in Step 2 of the Tech Researcher workflow. If the list is empty, run a broader semantic search on keywords from the bug description.

## Step 3 — Git Log Sweep

For each candidate file:

```bash
# With a date window:
git log --oneline --since="<regressionSince>" --until="$(date +%Y-%m-%d)" -- <file_path>

# With version tags (preferred when available):
git log --oneline <lastKnownGood>..<HEAD> -- <file_path>

# Broad keyword search across all files (fallback):
git log --oneline --grep="<keyword_from_bug>" --since="<regressionSince>"
```

Collect all commit hashes. If the list exceeds 20 commits, filter first by commits that touch more than one candidate file.

## Step 4 — Commit Triage

For each collected commit hash:

```bash
# See which files the commit touched:
git show --stat <hash>

# Inspect the actual diff for each candidate file:
git diff <hash>^ <hash> -- <file_path>
```

Note for each commit:
- Files changed and number of lines modified
- Whether the change is in a method/property directly related to the bug symptom
- Commit message relevance

## Step 5 — Bitbucket Enrichment

Use as a complement, especially when git history lacks PR context:
- Call `mcp_etools_bitbucket_get-commits` filtered to the regression window to obtain PR-associated metadata.
- For each suspicious commit hash, call `mcp_etools_bitbucket_get-pull-request` to get PR title, description, and linked Jira key.

## Step 6 — Confidence Scoring

Assign each candidate commit a confidence level:

| Confidence | Criteria |
|------------|----------|
| **High** | Commit touches the exact method/property named in the bug report AND was merged within the regression window |
| **Medium** | Commit touches the same file/module but the changed method is adjacent, not the direct cause |
| **Low** | Commit is within the time window but only has indirect file overlap |

Rank candidates High → Medium → Low. Present at most the top 3.

## Step 7 — Fallback

If `execute` is unavailable or git commands fail:
- Use `etools/bitbucket_get-commits` as the primary investigation tool.
- Filter by date range and cross-reference file paths manually from PR diffs via `etools/bitbucket_get-pull-request`.
- If Bitbucket tools also fail: document as a **Manual Investigation Required** blocker with explicit reproduction steps for the developer.

---

## Output Format

Embed the following section verbatim in the Technical Context under `## Regression Analysis`:

```markdown
## Regression Analysis

**Regression Window**: <date range or version tags>
**Affected Files**: <candidate file paths>

### Suspected Offending Commit(s)

| Commit | Date | Author | Message | Confidence |
|--------|------|--------|---------|------------|
| `abc1234` | 2026-04-15 | Jane Doe | refactor: update estimate service loading | High |

### Evidence
<brief explanation of why each commit was ranked as it was>

### Root Cause Hypothesis
<reasoned explanation linking commit change to bug symptom>
```

If no offending commit could be identified, write:

```markdown
### Suspected Offending Commit(s)
No offending commit identified via automated investigation.

**Manual Investigation Required**: {specific reproduction steps for the developer}
```
