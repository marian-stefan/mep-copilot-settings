---
description: >
  Mark a Spec document as rejected with a categorized reason. Records the rejection
  signal to feed the Spec quality feedback loop.
argument-hint: <JIRA_KEY> --reason <code> [--section <N>] [--comments "notes"]
arguments: [key]
allowed-tools: Read Edit Write Bash(find . *) Bash(git log *)
disallowed-tools: Bash(npx *) Bash(npm *)
effort: low
disable-model-invocation: true
---

# Reject Spec

Mark a Spec document as rejected with a categorized reason, recording the rejection signal that feeds the spec quality feedback loop.

## Reason Codes

| Code | When to use |
| ------ | ------------- |
| `wrong-requirements` | The spec misunderstood or misrepresented the Jira requirements |
| `wrong-architecture` | The technical approach contradicts existing architecture or codebase patterns |
| `wrong-api-contracts` | Endpoint paths, DTO shapes, or service names were incorrect or fabricated |
| `missing-edge-cases` | Important acceptance criteria or edge cases were omitted |
| `other` | None of the above — add `--comments` to explain |

`--section <N>` (optional): Pin the rejection to a specific SPEC section number (1–9). Omit if the rejection spans multiple sections.

## Workflow

1. **Locate the spec file**: Find the spec at `docs/specs/$key/`. Accept the first file matching `SPEC-$key*.md`.

2. **Read existing frontmatter**: Extract current values of `issueType`, `qualityScore`, `qualityBucket`, `workflowId` if present.

3. **Update Spec frontmatter**: Add or update the following fields:

   ```yaml
   status: rejected
   rejectedAt: {ISO-8601 timestamp}
   rejectedReason: {reason-code from --reason flag}
   rejectedSection: {section-number from --section flag | null}
   rejectedComments: {user-provided comments | null}
   ```

4. **Append to metrics log**: Add a row to `docs/specs/METRICS.md` (create with standard header if absent):

   ```markdown
   | {date} | $key | {issueType | unknown} | rejected | {reason-code} | {section | —} | {qualityScore | N/A} | {comments | —} | {workflowId | legacy} |
   ```

5. **Surface remediation guidance**:

   | Reason | Suggested action | Guide to inspect |
   | -------- | ----------------- | ------------------ |
   | `wrong-requirements` | Re-run `/create-specs $key` — Jira Analyst may have missed requirements | `.github/agents/jira-analyst.agent.md` |
   | `wrong-architecture` | Re-run `/create-specs $key` — check Tech Researcher's scope-narrowing step | `.github/agents/tech-researcher-story.agent.md` |
   | `wrong-api-contracts` | Re-run `/create-specs $key` — ensure backend Swagger is accessible | `.github/skills/specs-backend-validation-gate/SKILL.md` |
   | `missing-edge-cases` | Re-run `/create-specs $key` — review Testing Strategy section with Jira ACs | `.github/skills/specs-generation-story/SKILL.md` |
   | `other` | Review comments and decide whether to re-run or revise manually | Run `/review-harness-health` if pattern recurs |

6. **Confirm to user**:

   ```yaml
   ❌ Spec rejected: docs/specs/$key/SPEC-$key-*.md
   Reason: {reason-code}{, Section {N} | ""}
   Metrics recorded in docs/specs/METRICS.md
   Suggested action: {from table above}
   ```

## Error Handling

- If spec file not found: report the expected path and stop.
- If `--reason` is not provided: stop and list valid reason codes.
- If `--section` is not a number between 1 and 9: stop and explain valid values.
- If `docs/specs/METRICS.md` cannot be written: report and stop.
- Do NOT modify any other part of the spec file — frontmatter fields only.
