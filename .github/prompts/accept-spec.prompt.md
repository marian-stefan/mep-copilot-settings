---
agent: 'agent'
tools: ['read/readFile', 'edit/editFiles', 'execute', 'search/fileSearch']
description: 'Mark a Spec document as accepted before implementation begins. Records acceptance status in the Spec frontmatter and appends to the quality metrics log.'
---

# Accept Spec

Mark a validated Spec document as accepted, recording the acceptance signal that feeds the spec quality feedback loop.

## Command Usage

```
/accept-spec <JIRA_KEY> [--comments "<optional notes>"]
```

**Examples**:

```bash
/accept-spec HON-37116
/accept-spec HON-37116 --comments "Revised section 4.2 before accepting"
```

## Workflow

1. **Locate the spec file**: Find the spec at `docs/specs/{JIRA_KEY}/`. Accept the first file matching `SPEC-{JIRA_KEY}*.md` (i.e., `SPEC-{KEY}.md`, `SPEC-{KEY}-Epic.md`, or `SPEC-{KEY}-Spike.md`).

2. **Read existing frontmatter**: Extract current values of `issueType`, `qualityScore`, `qualityBucket` if present.

3. **Update Spec frontmatter**: Add or update the following fields in the YAML frontmatter block:
   ```yaml
   status: accepted
   acceptedAt: {ISO-8601 timestamp}
   acceptedComments: {user-provided comments | null}
   ```

4. **Append to metrics log**: Add a row to `docs/specs/METRICS.md` (create the file if it does not exist):

   **METRICS.md format** (if creating for the first time):
   ```markdown
   # Spec Quality Metrics

   This file records spec acceptance/rejection signals as a proxy for spec quality ("Keep Rate").
   Rejection reasons help identify which workflow steps produce the most rework.

   | Date | Key | Type | Status | Reason | Section | Score | Comments | WorkflowId |
   |------|-----|------|--------|--------|---------|-------|----------|------------|
   ```

   **Row to append**:
   ```
   | {date} | {JIRA_KEY} | {issueType | unknown} | accepted | — | — | {qualityScore | N/A} | {comments | —} | {workflowId from SPEC frontmatter | legacy} |
   ```

5. **Confirm to user**:
   ```
   ✅ Spec accepted: docs/specs/{JIRA_KEY}/SPEC-{JIRA_KEY}-*.md
   Metrics recorded in docs/specs/METRICS.md
   ```

## Error Handling

- If spec file not found: report the expected path and stop.
- If `docs/specs/METRICS.md` cannot be written: report and stop; do NOT silently skip the metrics entry.
- Do NOT modify any other part of the spec file — frontmatter fields only.
