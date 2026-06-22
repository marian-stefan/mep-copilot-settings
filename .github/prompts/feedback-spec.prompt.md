---
agent: 'agent'
tools: ['read/readFile', 'edit/editFiles', 'execute', 'search/fileSearch']
description: 'Record developer implementation feedback for a Spec document. Captures whether the Spec was accurate to implement against, enabling a continuous quality signal from the person who actually used the Spec.'
---

# Feedback Spec

Record implementation-time feedback for a Spec document. This command is for **developers** who have implemented (or attempted to implement) a ticket from a Spec — their ground-truth signal about spec accuracy is more reliable than pre-implementation review alone.

Feedback is appended to the Spec document's YAML frontmatter and logged to `docs/specs/METRICS.md` as a `feedback` row.

## Command Usage

```
/feedback-spec <JIRA_KEY> --accuracy <level> [--section <N>] [--comments "<notes>"]
```

**`--accuracy` levels**:

| Level | When to use |
|-------|-------------|
| `accurate` | The spec was correct and complete — implementation matched the plan closely |
| `partially-accurate` | The spec was mostly right but required adjustments during implementation (use `--section` and `--comments` to describe what diverged) |
| `inaccurate` | The spec was wrong or incomplete enough to cause significant rework |

**`--section <N>` (optional)**: Pin the feedback to the spec section that was inaccurate. Valid values: `1`–`9` (1 = Overview, 2 = Background, 3 = Requirements, 4 = Technical Architecture, 5 = Security Analysis, 6 = Implementation Plan, 7 = Testing Strategy, 8 = Risk Assessment, 9 = Rollout).

**Examples**:

```bash
/feedback-spec HON-37116 --accuracy accurate
/feedback-spec HON-37116 --accuracy partially-accurate --section 6 --comments "Step 3 of the implementation plan referenced a method that doesn't exist; had to create it"
/feedback-spec HON-37116 --accuracy inaccurate --comments "The facade selector names in section 4 were all wrong"
```

## Workflow

1. **Locate the spec file**: Find the spec at `docs/specs/{JIRA_KEY}/`. Accept the first file matching `SPEC-{JIRA_KEY}*.md` (i.e., `SPEC-{KEY}.md`, `SPEC-{KEY}-Epic.md`, or `SPEC-{KEY}-Spike.md`).

2. **Read existing frontmatter**: Extract current values of `issueType`, `qualityScore`, `qualityBucket`, `status`, and any existing `implementationFeedback` array if present.

3. **Append to Spec frontmatter**: Add or extend the `implementationFeedback` array in the YAML frontmatter block. Do NOT overwrite existing entries — append a new entry:
   ```yaml
   implementationFeedback:
     - submittedAt: {ISO-8601 timestamp}
       accuracy: accurate | partially-accurate | inaccurate
       section: {section-number | null}
       comments: {user-provided notes | null}
   ```
   If `implementationFeedback` does not exist yet, create it as a new array with this entry.

4. **Append to metrics log**: Add a row to `docs/specs/METRICS.md` (create with standard header if it does not exist — see `/accept-spec` for the header format):

   **Row to append**:
   ```
   | {date} | {JIRA_KEY} | {issueType | unknown} | feedback | {accuracy-level} | {section-number | —} | {qualityScore | N/A} | {comments | —} | {workflowId from SPEC frontmatter | legacy} |
   ```

5. **Surface actionable guidance** based on accuracy level:

   | Accuracy | Suggested action |
   |----------|-----------------|
   | `accurate` | No action needed. Signal recorded for harness health tracking. |
   | `partially-accurate` | Consider filing a follow-up ticket or updating the spec's section `{N}` with the corrected information before the next developer uses it. |
   | `inaccurate` | Consider re-running `/create-specs {KEY}` or manually correcting the spec before any further work. Run `/review-harness-health` if this pattern recurs across multiple tickets. |

6. **Confirm to user**:
   ```
   📝 Feedback recorded: docs/specs/{JIRA_KEY}/SPEC-{JIRA_KEY}-*.md
   Accuracy: {accuracy-level}{, Section {N} | ""}
   Metrics recorded in docs/specs/METRICS.md
   {Suggested action from table above}
   ```

## Error Handling

- If spec file not found: report the expected path and stop.
- If `--accuracy` is not provided or is not one of the valid levels: stop and list valid options.
- If `--section` is provided but is not a number between 1 and 9: stop and explain valid values.
- If `docs/specs/METRICS.md` cannot be written: report and stop; do NOT silently skip the metrics entry.
- Do NOT modify any part of the spec file other than the `implementationFeedback` frontmatter field.
