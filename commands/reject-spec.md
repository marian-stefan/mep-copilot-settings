---
agent: 'agent'
tools: ['read/readFile', 'edit/editFiles', 'execute', 'search/fileSearch']
description: 'Mark a Spec document as rejected before or during implementation. Records the rejection reason to feed the Spec quality feedback loop.'
---

# Reject Spec

Mark a Spec document as rejected with a categorized reason, recording the rejection signal that feeds the spec quality feedback loop.

## Command Usage

```bash
/mep:reject-spec <JIRA_KEY> --reason <reason-code> [--section <N>] [--comments "<optional notes>"] [--credit-usage <v>] [--context-window <v>] [--session-meta <v>]
```

**`--reason` codes**:

| Code | When to use |
| ------ | ------------- |
| `wrong-requirements` | The spec misunderstood or misrepresented the Jira requirements |
| `wrong-architecture` | The technical approach contradicts existing architecture or codebase patterns |
| `wrong-api-contracts` | Endpoint paths, DTO shapes, or service names were incorrect or fabricated |
| `missing-edge-cases` | Important acceptance criteria or edge cases were omitted |
| `other` | None of the above — add `--comments` to explain |

**`--section <N>` (optional)**: Pin the rejection to a specific SPEC section number. Use this to focus the metrics signal on the exact section that caused the rejection. Valid values depend on the spec's issue type:

Section maps by issue type: `skills/spec-metrics-log/SKILL.md` § Spec section maps.

Omit if the rejection spans multiple sections or is unclear.

**Examples**:

```bash
/mep:reject-spec HON-37116 --reason wrong-api-contracts
/mep:reject-spec HON-37116 --reason wrong-architecture --section 2
/mep:reject-spec HON-37116 --reason other --comments "Section 2 described a component that doesn't exist"
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

4. **Collect session info [REQUIRED]**: ask for each of `--credit-usage`, `--context-window`, `--session-meta` not supplied as a flag, exactly as specified in `skills/spec-metrics-log/SKILL.md` § Session info collection. Do not proceed to step 5 before asking.

5. **Append to metrics log**: add a `rejected` row per `skills/spec-metrics-log/SKILL.md`. `Reason` is the reason code, `Section` the `--section` value or `—`.

6. **Surface remediation guidance** based on rejection reason:

   | Reason | Suggested action | Harness guide to inspect |
   | -------- | ----------------- | -------------------------- |
   | `wrong-requirements` | Re-run `/mep:create-specs {KEY}` — the Jira Analyst may have missed requirements | `agents/jira-analyst.agent.md` |
   | `wrong-architecture` | Re-run `/mep:create-specs {KEY}` — check Tech Researcher's scope-narrowing step | `agents/tech-researcher-story.agent.md`, tech-layer `{stack}-patterns/SKILL.md` |
   | `wrong-api-contracts` | Re-run `/mep:create-specs {KEY}` — check the Technical Design step's API/DTO definitions against the repo's real contracts | `agents/tech-researcher-story.agent.md` (Technical Design), `skills/trimble-api-standard-compliance/SKILL.md` |
   | `missing-edge-cases` | Re-run `/mep:create-specs {KEY}` — review spec Section 1 (Acceptance Criteria) against Jira ACs | `skills/specs-generation-story/SKILL.md` |
   | `other` | Review comments and decide whether to re-run or revise manually | Run `/mep:review-harness-health` if pattern recurs |

7. **Confirm to user**:

   ```markdown
   ❌ Spec rejected: docs/specs/{JIRA_KEY}/SPEC-{JIRA_KEY}-*.md
   Reason: {reason-code}{, Section {N} | ""}
   Metrics recorded in docs/specs/METRICS.md
   Suggested action: {see table above}
   ```

## Error Handling

- If spec file not found: report the expected path and stop.
- If `--reason` is not provided: stop and list valid reason codes.
- If `--section` is provided but is not a valid section number for the detected spec type (Story/Task/Bug/Regression Bug: 1–5; Epic: 1–5; Spike: 1–5): stop and list the valid section numbers for that type.
- If `docs/specs/METRICS.md` cannot be written: report and stop; do NOT silently skip the metrics entry.
- Do NOT modify any other part of the spec file — frontmatter fields only.
