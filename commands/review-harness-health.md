---
agent: 'agent'
tools: ['read/readFile', 'search/fileSearch', 'search/textSearch']
description: 'Analyze spec quality metrics to identify underperforming harness guides and propose steering loop improvements'
---

# Review Harness Health

Analyze the accumulated spec quality signals (accept/reject metrics) and propose targeted improvements to the workflow's feedforward guides (skills, agents, templates).

## Command Usage

```bash
/mep:review-harness-health
```

## Workflow

1. **Read METRICS.md**: Load `docs/specs/METRICS.md` (schema: `skills/spec-metrics-log/SKILL.md`). If it does not exist or has fewer than 3 `accepted`/`rejected` rows, report "Insufficient data for harness health analysis" and stop. Only `accepted` and `rejected` rows count toward the minimum and toward Keep Rate; `feedback`, `accuracy` and `goal-verification` rows feed the Implementation Signals section (step 6). The last six columns are informational only; short legacy rows are valid, not malformed.

2. **Compute Keep Rate**:

   ```markdown
   keepRate = accepted / (accepted + rejected) × 100
   ```

   Display the overall keep rate and trend (improving/declining/stable) based on the last 10 entries vs all-time.

3. **Categorize Rejection Patterns**: Group rejections by reason code and compute frequency. Where `--section` data is available, break down by section within each reason code to identify the exact spec section driving the most rework:

   | Reason Code | Count | % of Rejections | Top Section | Harness Guide to Inspect |
   | ------------- | ------- | ----------------- | ------------- | -------------------------- |
   | `wrong-requirements` | N | X% | §{N} or — | `agents/jira-analyst.agent.md` |
   | `wrong-architecture` | N | X% | §{N} or — | `agents/tech-researcher-story.agent.md`, tech-layer `{stack}-patterns/SKILL.md` |
   | `wrong-api-contracts` | N | X% | §{N} or — | `agents/tech-researcher-story.agent.md` (Technical Design step), `skills/trimble-api-standard-compliance/SKILL.md` |
   | `missing-edge-cases` | N | X% | §{N} or — | `skills/specs-generation-story/SKILL.md` (Acceptance Criteria section template) |
   | `other` | N | X% | §{N} or — | Review comments for patterns |

4. **Identify Top Failure Mode**: The reason code with the highest frequency is the primary harness improvement target.

5. **Propose Improvement**: For the top 1–2 failure modes, read the corresponding harness guide file and suggest a concrete change:
   - For `wrong-requirements`: Suggest additions to the Jira Analyst's extraction rules or field coverage
   - For `wrong-architecture`: Suggest additions to Tech Researcher's codebase scanning scope or codebase pattern rules
   - For `wrong-api-contracts`: Suggest improvements to the Tech Researcher's Technical Design step (checking API/DTO definitions against real contracts in the repo)
   - For `missing-edge-cases`: Suggest additions to the Specs Writer's section templates (e.g., edge-case checklist, AC coverage rules)
   - For `other`: Cluster the comments and propose a new reason code if a pattern emerges

6. **Implementation Signals** (only if `feedback`, `accuracy` or `goal-verification` rows exist):
   - Spec accuracy: share of `accuracy` rows with `modified-not-in-spec > 0` or `in-spec-not-modified > 0`, and the average of each count.
   - Goal verification: share of `goal-verification` rows (these are only written when AC coverage < 100% or scope mismatched), and the most frequent gap.
   - Developer feedback: distribution of `accurate` / `partially-accurate` / `inaccurate`, plus the most-cited `Section`.
   - Map recurring gaps to a guide: predicted-vs-actual file divergence → `agents/tech-researcher-story.agent.md` (impact analysis) and `specs-generation-story`; AC gaps → `agents/jira-analyst.agent.md` and the AC section template.

7. **Output Report**:

```markdown
## Harness Health Report

**Period**: {earliest date} → {latest date}
**Total Specs**: {count}
**Keep Rate**: {keepRate}% ({trend})

### Quality Threshold
{✅ Healthy (≥80%) | ⚠️ Attention needed (60–79%) | ❌ Harness underperforming (<60%)}

### Rejection Breakdown
| Reason | Count | % | Target Guide |
|--------|-------|---|--------------|
| ... | ... | ... | ... |

### Implementation Signals
{accuracy divergence %, goal-verification gaps, developer feedback distribution — or "no implementation rows yet"}

### Recommended Harness Improvements
1. **{Top failure mode}**: {Concrete suggestion with file path and proposed change}
2. **{Second failure mode}** (if applicable): {Suggestion}

### Steering Loop Actions
- [ ] Apply improvement to {file}
- [ ] Re-run `/mep:create-specs` on a recent rejected ticket to validate
- [ ] Track if keep-rate improves over next 5 specs
```

## Thresholds

| Keep Rate | Health Status | Action |
| ----------- | -------------- | -------- |
| ≥ 80% | Healthy | No immediate action needed |
| 60–79% | Attention | Inspect top rejection reason, consider guide improvement |
| < 60% | Underperforming | Prioritize harness improvement before generating more specs |

## Audit Log Aggregation (optional)

When METRICS rows exist with a `WorkflowId` column, optionally aggregate audit logs across multiple spec keys to correlate decision trails with outcomes:

1. Glob `docs/specs/*/audit.log` to discover all audit log files.
2. For each rejected spec with a known `WorkflowId`, find matching entries in the corresponding `audit.log` by matching the `## {workflowId}` header prefix.
3. Identify patterns using `/mep:reject-spec` reason codes — for example: "Pattern discovery was skipped in 4/7 workflows with `wrong-architecture` rejections" (look for the corresponding `Warnings:` lines in audit entries).
4. Report correlation findings under a "Audit Trail Patterns" subsection in the health report.

**Legacy row handling**: Rows without a `WorkflowId` column (or with `WorkflowId: legacy`) were produced before audit log support was added. Aggregate them by issue key only — they cannot be correlated to audit entries. Do NOT error on legacy rows.

## When to Run

- After every 5+ specs have been accepted or rejected
- When a pattern of repeated rejections is noticed
- As part of a periodic (weekly/sprint) harness maintenance cycle
