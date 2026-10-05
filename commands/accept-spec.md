---
agent: 'agent'
tools: ['read/readFile', 'edit/editFiles', 'execute', 'search/fileSearch']
description: 'Mark a Spec document as accepted before implementation begins. Records acceptance status in the Spec frontmatter and appends to the quality metrics log.'
---

# Accept Spec

Mark a validated Spec document as accepted, recording the acceptance signal that feeds the spec quality feedback loop.

## Command Usage

```markdown
/mep:accept-spec <JIRA_KEY> [--comments "<optional notes>"] [--credit-usage <v>] [--context-window <v>] [--session-meta <v>]
```

**Examples**:

```bash
/mep:accept-spec HON-37116
/mep:accept-spec HON-37116 --comments "Revised section 4.2 before accepting"
/mep:accept-spec HON-37116 --credit-usage "12.4k tokens" --context-window "128k/200k"
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

4. **Collect session info [REQUIRED]**: ask for each of `--credit-usage`, `--context-window`, `--session-meta` not supplied as a flag, exactly as specified in `skills/spec-metrics-log/SKILL.md` § Session info collection. Do not proceed to step 5 before asking.

5. **Append to metrics log**: add an `accepted` row to `docs/specs/METRICS.md` per `skills/spec-metrics-log/SKILL.md` (header, 15-column schema, create-if-missing). `Reason` and `Section` are `—`; `Comments` is the user's comments or `—`.

6. **Confirm to user**:

   ```markdown
   ✅ Spec accepted: docs/specs/{JIRA_KEY}/SPEC-{JIRA_KEY}-*.md
   Metrics recorded in docs/specs/METRICS.md
   ```

## Error Handling

- If spec file not found: report the expected path and stop.
- If `docs/specs/METRICS.md` cannot be written: report and stop; do NOT silently skip the metrics entry.
- Do NOT modify any other part of the spec file — frontmatter fields only.
