---
name: specs-generation-story
description: "Compact Spec template for Story, Task, Bug, and Regression Bug. Five sections: metadata block, Acceptance Criteria, Implementation Summary, Security Decisions, Risks & Open Questions. Full technical detail lives in CONTEXT; SPEC is the human-reviewable decision surface."
---

# Specs Generation — Story / Task / Bug / Regression Bug

The Spec document is the **human review surface** for a ticket. It answers: what must be true when done (acceptance criteria), what the developer will do in order (implementation summary), what security decisions were made, and what risks or open questions remain.

All code-level detail (file snippets, DTOs, scaffolding commands, API contracts) lives in `CONTEXT-{KEY}.md` — the Spec references it rather than repeating it. This keeps SPEC reviewable in under 5 minutes and eliminates duplication.

Spec filename: `SPEC-{JIRA_KEY}.md`

---

## Frontmatter

```yaml
---
issueKey: {JIRA_KEY}
issueType: Story|Task|Bug|Regression Bug
workflowId: {workflowId}
priority: {ticket priority}
complexity: Low|Medium|High|Very High
---
```

---

## Section 1 — Acceptance Criteria

Testable criteria only. No prose. Each line must be independently verifiable by a developer or QA engineer.

**Functional** (one line per requirement, derived from BRIEF acceptance criteria):
- [ ] {criterion 1}
- [ ] {criterion 2}

**Technical** (include all that apply):
- [ ] All new code follows current tech stack syntax patterns
- [ ] All tests pass; changed lines and branches are covered (Coverage Contract)
- [ ] No unresolved linting or formatting errors
- [ ] No security vulnerabilities introduced

**Performance** (include only if explicitly required by the ticket):
- [ ] {measurable performance criterion with numeric target}

**For Bug / Regression Bug** — add one line per criterion confirming the fix:
- [ ] {specific regression scenario no longer reproduces}

---

## Section 2 — Implementation Summary

> Full code-level detail: [CONTEXT-{KEY}.md](./CONTEXT-{KEY}.md)

**For Bug / Regression Bug** — state root cause in one sentence before the steps:
> Root cause: {one-sentence summary from Technical Context}

Ordered implementation steps — action verb + file path + one-line description. No code snippets here; they are in CONTEXT.

1. {Action verb} `{file path}` — {one-line description}
2. {Action verb} `{file path}` — {one-line description}
3. …

Derived from the "Implementation Plan" section of CONTEXT-{KEY}.md. Maximum 15 steps. Each step names exactly one file or command.

---

## Section 3 — Security Decisions

One row per relevant threat. Omit categories with no applicable threats for this ticket.

| Threat | Affected surface | Mitigation |
|--------|-----------------|------------|
| {e.g. Unauthorized access} | {e.g. GET /estimates endpoint} | {e.g. Bearer token + policy guard on controller} |

Minimum one row required. Derived from the "Security Considerations" section of CONTEXT-{KEY}.md.

---

## Section 4 — Risks & Open Questions

**Risks** (include only if identified in CONTEXT):
- {Risk}: {one-line mitigation}

**Open Questions** (include only if unresolved at spec-generation time):
- {Question} — owner: {who must answer}

If no risks and no open questions: write `None identified.`

**Resolved During Research** (optional, informational only — no owner, no action needed): list any CONTEXT `assumptions` entries with `resolution: resolved` (per `skills/specs-ambiguity-detection/SKILL.md` § Resolution Attempt Protocol) so a reviewer can see what was auto-settled from the codebase and why:
- {Assumption text} — {evidence, one line}

---

## Section 5 — Cross-references

- Technical detail (file paths, code snippets, DTOs, API contracts): [CONTEXT-{KEY}.md](./CONTEXT-{KEY}.md)
- Requirements & acceptance criteria source: [BRIEF-{KEY}.md](./BRIEF-{KEY}.md)
- Related Jira tickets: {comma-separated keys, or "None"}
