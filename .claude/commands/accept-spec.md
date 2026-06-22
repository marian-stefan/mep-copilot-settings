---
description: >
  Mark a Spec document as accepted before implementation begins. Records acceptance
  status in the Spec frontmatter and appends to the quality metrics log.
argument-hint: <JIRA_KEY> [--comments "notes"]
arguments: [key]
allowed-tools: Read Edit Write Bash(find . *) Bash(git log *)
disallowed-tools: Bash(npx *) Bash(npm *)
effort: low
disable-model-invocation: true
---

# Accept Spec

Mark a validated Spec document as accepted, recording the acceptance signal that feeds the spec quality feedback loop.

## Workflow

1. **Locate the spec file**: Find the spec at `docs/specs/$key/`. Accept the first file matching `SPEC-$key*.md` (i.e., `SPEC-$key.md`, `SPEC-$key-Epic.md`, or `SPEC-$key-Spike.md`).

2. **Read existing frontmatter**: Extract current values of `issueType`, `qualityScore`, `qualityBucket`, `workflowId` if present.

3. **Update Spec frontmatter**: Add or update the following fields in the YAML frontmatter block:

   ```yaml
   status: accepted
   acceptedAt: {ISO-8601 timestamp}
   acceptedComments: {user-provided comments from --comments flag | null}
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

   ```markdown
   | {date} | $key | {issueType | unknown} | accepted | — | — | {qualityScore | N/A} | {comments | —} | {workflowId from SPEC frontmatter | legacy} |
   ```

5. **Confirm to user**:

   ```markdown
   ✅ Spec accepted: docs/specs/$key/SPEC-$key-*.md
   Metrics recorded in docs/specs/METRICS.md
   ```

## Error Handling

- If spec file not found: report the expected path and stop.
- If `docs/specs/METRICS.md` cannot be written: report and stop; do NOT silently skip the metrics entry.
- Do NOT modify any other part of the spec file — frontmatter fields only.
