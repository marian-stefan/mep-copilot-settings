---
agent: 'agent'
tools: ['read/readFile', 'edit/editFiles', 'execute', 'search/fileSearch']
description: 'Record developer implementation feedback for a Spec document. Captures whether the Spec was accurate to implement against, enabling a continuous quality signal from the person who actually used the Spec.'
---

# Feedback Spec

Record implementation-time feedback for a Spec document. This command is for **developers** who have implemented (or attempted to implement) a ticket from a Spec — their ground-truth signal about spec accuracy is more reliable than pre-implementation review alone.

Feedback is appended to the Spec document's YAML frontmatter and logged to `docs/specs/METRICS.md` as a `feedback` row.

## Command Usage

```bash
/mep:feedback-spec <JIRA_KEY> --accuracy <level> [--section <N>] [--comments "<notes>"] [--credit-usage <v>] [--context-window <v>] [--session-meta <v>]
```

**`--accuracy` levels**:

| Level | When to use |
| ------- | ------------- |
| `accurate` | The spec was correct and complete — implementation matched the plan closely |
| `partially-accurate` | The spec was mostly right but required adjustments during implementation (use `--section` and `--comments` to describe what diverged) |
| `inaccurate` | The spec was wrong or incomplete enough to cause significant rework |

**`--section <N>` (optional)**: Pin the feedback to the spec section that was inaccurate. Valid values depend on the spec's issue type:

Section maps by issue type: `skills/spec-metrics-log/SKILL.md` § Spec section maps.

**Examples**:

```bash
/mep:feedback-spec HON-37116 --accuracy accurate
/mep:feedback-spec HON-37116 --accuracy partially-accurate --section 2 --comments "Step 3 of the implementation plan referenced a method that doesn't exist; had to create it"
/mep:feedback-spec HON-37116 --accuracy inaccurate --comments "The facade selector names in section 2 were all wrong"
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

4. **Collect session info [REQUIRED]**: ask for each of `--credit-usage`, `--context-window`, `--session-meta` not supplied as a flag, exactly as specified in `skills/spec-metrics-log/SKILL.md` § Session info collection. Do not proceed to step 5 before asking.

5. **Append to metrics log**: add a `feedback` row per `skills/spec-metrics-log/SKILL.md`. `Reason` is the accuracy level, `Section` the `--section` value or `—`.

6. **Surface actionable guidance** based on accuracy level:

   | Accuracy | Suggested action |
   | ---------- | ----------------- |
   | `accurate` | No action needed. Signal recorded for harness health tracking. |
   | `partially-accurate` | Consider filing a follow-up ticket or updating the spec's section `{N}` with the corrected information before the next developer uses it. |
   | `inaccurate` | Consider re-running `/mep:create-specs {KEY}` or manually correcting the spec before any further work. Run `/mep:review-harness-health` if this pattern recurs across multiple tickets. |

7. **Confirm to user**:

   ```markdown
   📝 Feedback recorded: docs/specs/{JIRA_KEY}/SPEC-{JIRA_KEY}-*.md
   Accuracy: {accuracy-level}{, Section {N} | ""}
   Metrics recorded in docs/specs/METRICS.md
   {Suggested action from table above}
   ```

## Error Handling

- If spec file not found: report the expected path and stop.
- If `--accuracy` is not provided or is not one of the valid levels: stop and list valid options.
- If `--section` is provided but is not a valid section number for the detected spec type (Story/Task/Bug/Regression Bug: 1–5; Epic: 1–5; Spike: 1–5): stop and list the valid section numbers for that type.
- If `docs/specs/METRICS.md` cannot be written: report and stop; do NOT silently skip the metrics entry.
- Do NOT modify any part of the spec file other than the `implementationFeedback` frontmatter field.
