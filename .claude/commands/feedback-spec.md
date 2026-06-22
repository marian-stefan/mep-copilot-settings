---
description: >
  Record developer implementation feedback for a Spec document. Captures whether
  the Spec was accurate to implement against — a continuous quality signal from
  the person who actually used it.
argument-hint: <JIRA_KEY> --accuracy <level> [--section <N>] [--comments "notes"]
arguments: [key]
allowed-tools: Read Edit Write Bash(find . *) Bash(git log *)
disallowed-tools: Bash(npx *) Bash(npm *)
effort: low
disable-model-invocation: true
---

# Feedback Spec

Record implementation-time feedback for a Spec document. For developers who have implemented (or attempted to implement) a ticket from a Spec — their ground-truth signal about spec accuracy.

Feedback is appended to the Spec's YAML frontmatter and logged to `docs/specs/METRICS.md`.

## Accuracy Levels

| Level | When to use |
| ------- | ------------- |
| `accurate` | The spec was correct and complete — implementation matched the plan closely |
| `partially-accurate` | The spec was mostly right but required adjustments (use `--section` and `--comments` to describe what diverged) |
| `inaccurate` | The spec was wrong or incomplete enough to cause significant rework |

`--section <N>` (optional): Pin feedback to the spec section that was inaccurate (1–9).

## Workflow

1. **Locate the spec file**: Find the spec at `docs/specs/$key/`. Accept the first file matching `SPEC-$key*.md`.

2. **Read existing frontmatter**: Extract current values of `issueType`, `qualityScore`, `qualityBucket`, `status`, and any existing `implementationFeedback` array.

3. **Append to Spec frontmatter**: Add to the `implementationFeedback` array — do NOT overwrite existing entries:

   ```yaml
   implementationFeedback:
     - submittedAt: {ISO-8601 timestamp}
       accuracy: accurate | partially-accurate | inaccurate
       section: {section-number | null}
       comments: {user-provided notes | null}
   ```

   If `implementationFeedback` does not exist, create it as a new array with this entry.

4. **Append to metrics log**: Add a row to `docs/specs/METRICS.md` (create with standard header if absent):

   ```markdown
   | {date} | $key | {issueType | unknown} | feedback | {accuracy-level} | {section | —} | {qualityScore | N/A} | {comments | —} | {workflowId | legacy} |
   ```

5. **Surface actionable guidance**:

   | Accuracy | Suggested action |
   | ---------- | ----------------- |
   | `accurate` | No action needed. Signal recorded for harness health tracking. |
   | `partially-accurate` | Consider updating the spec's section `{N}` with the corrected information before the next developer uses it. |
   | `inaccurate` | Consider re-running `/create-specs $key` or manually correcting the spec. Run `/review-harness-health` if this pattern recurs. |

6. **Confirm to user**:

   ```yaml
   📝 Feedback recorded: docs/specs/$key/SPEC-$key-*.md
   Accuracy: {accuracy-level}{, Section {N} | ""}
   Metrics recorded in docs/specs/METRICS.md
   {Suggested action}
   ```

## Error Handling

- If spec file not found: report the expected path and stop.
- If `--accuracy` is missing or invalid: stop and list valid options.
- If `--section` is not a number between 1 and 9: stop and explain valid values.
- If `docs/specs/METRICS.md` cannot be written: report and stop.
- Do NOT modify any part of the spec file other than the `implementationFeedback` frontmatter field.
