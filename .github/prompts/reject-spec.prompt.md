---
agent: 'agent'
tools: ['read/readFile', 'edit/editFiles', 'execute', 'search/fileSearch']
description: 'Mark a Spec document as rejected before or during implementation. Records the rejection reason to feed the Spec quality feedback loop.'
---

# Reject Spec

Mark a Spec document as rejected with a categorized reason, recording the rejection signal that feeds the spec quality feedback loop.

## Command Usage

```
/reject-spec <JIRA_KEY> --reason <reason-code> [--section <N>] [--comments "<optional notes>"]
```

**`--reason` codes**:

| Code | When to use |
|------|-------------|
| `wrong-requirements` | The spec misunderstood or misrepresented the Jira requirements |
| `wrong-architecture` | The technical approach contradicts existing architecture or codebase patterns |
| `wrong-api-contracts` | Endpoint paths, DTO shapes, or service names were incorrect or fabricated |
| `missing-edge-cases` | Important acceptance criteria or edge cases were omitted |
| `other` | None of the above — add `--comments` to explain |

**`--section <N>` (optional)**: Pin the rejection to a specific SPEC section number. Use this to focus the metrics signal on the exact section that caused the rejection. Valid values: `1`–9 corresponding to spec sections (1 = Overview, 2 = Background, 3 = Requirements, 4 = Technical Architecture, 5 = Security Analysis, 6 = Implementation Plan, 7 = Testing Strategy, 8 = Risk Assessment, 9 = Rollout). Omit if the rejection spans multiple sections or is unclear.

**Examples**:

```bash
/reject-spec HON-37116 --reason wrong-api-contracts
/reject-spec HON-37116 --reason wrong-architecture --section 4
/reject-spec HON-37116 --reason other --comments "Section 4 described a component that doesn't exist"
```

## Workflow

1. **Locate the spec file**: Find the spec at `docs/specs/{JIRA_KEY}/`. Accept the first file matching `SPEC-{JIRA_KEY}*.md` (i.e., `SPEC-{KEY}.md`, `SPEC-{KEY}-Epic.md`, or `SPEC-{KEY}-Spike.md`).

2. **Read existing frontmatter**: Extract current values of `issueType`, `qualityScore`, `qualityBucket` if present.

3. **Update Spec frontmatter**: Add or update the following fields in the YAML frontmatter block:
   ```yaml
   status: rejected
   rejectedAt: {ISO-8601 timestamp}
   rejectedReason: {reason-code}
   rejectedSection: {section-number | null}
   rejectedComments: {user-provided comments | null}
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
   | {date} | {JIRA_KEY} | {issueType | unknown} | rejected | {reason-code} | {section-number | —} | {qualityScore | N/A} | {comments | —} | {workflowId from SPEC frontmatter | legacy} |
   ```

5. **Surface remediation guidance** based on rejection reason:

   | Reason | Suggested action | Harness guide to inspect |
   |--------|-----------------|--------------------------|
   | `wrong-requirements` | Re-run `/create-specs {KEY}` — the Jira Analyst may have missed requirements | `.github/agents/jira-analyst.agent.md` |
   | `wrong-architecture` | Re-run `/create-specs {KEY}` — check Tech Researcher's scope-narrowing step | `.github/agents/tech-researcher-story.agent.md`, tech-layer `{stack}-patterns/SKILL.md` |
   | `wrong-api-contracts` | Re-run `/create-specs {KEY}` — ensure backend services are accessible for Swagger fetch | `.github/skills/specs-backend-validation-gate/SKILL.md` |
   | `missing-edge-cases` | Re-run `/create-specs {KEY}` — review spec Testing Strategy section with Jira ACs | `.github/skills/specs-generation-story/SKILL.md` |
   | `other` | Review comments and decide whether to re-run or revise manually | Run `/review-harness-health` if pattern recurs |

6. **Confirm to user**:
   ```
   ❌ Spec rejected: docs/specs/{JIRA_KEY}/SPEC-{JIRA_KEY}-*.md
   Reason: {reason-code}{, Section {N} | ""}
   Metrics recorded in docs/specs/METRICS.md
   Suggested action: {see table above}
   ```

## Error Handling

- If spec file not found: report the expected path and stop.
- If `--reason` is not provided: stop and list valid reason codes.
- If `--section` is provided but is not a number between 1 and 9: stop and explain valid values.
- If `docs/specs/METRICS.md` cannot be written: report and stop; do NOT silently skip the metrics entry.
- Do NOT modify any other part of the spec file — frontmatter fields only.
