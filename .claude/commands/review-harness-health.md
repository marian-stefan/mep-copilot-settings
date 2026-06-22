---
description: >
  Analyze accumulated spec quality signals (accept/reject/feedback metrics) to identify
  underperforming harness guides and propose targeted steering loop improvements.
allowed-tools: Read Bash(find . *) Bash(grep *)
disallowed-tools: Bash(npx *) Bash(npm *) Bash(git commit *) Bash(git push *)
effort: medium
disable-model-invocation: true
---

# Review Harness Health

Analyze the accumulated spec quality signals and propose targeted improvements to the workflow's feedforward guides (skills, agents, templates).

## Workflow

1. **Read METRICS.md**: Load `docs/specs/METRICS.md`. If it does not exist or has fewer than 3 data rows, report "Insufficient data for harness health analysis (need ≥3 rows)" and stop.

2. **Compute Keep Rate**:

   ```markdown
   keepRate = accepted / (accepted + rejected) × 100
   ```

   Display the overall keep rate and trend (improving/declining/stable) based on the last 10 entries vs all-time.

3. **Categorize Rejection Patterns**: Group rejections by reason code and compute frequency. Where `--section` data is available, break down by section within each reason code:

   | Reason Code | Count | % of Rejections | Top Section | Harness Guide to Inspect |
   | ------------- | ------- | ----------------- | ------------- | -------------------------- |
   | `wrong-requirements` | N | X% | §{N} or — | `.github/agents/jira-analyst.agent.md` |
   | `wrong-architecture` | N | X% | §{N} or — | `.github/agents/tech-researcher-story.agent.md` |
   | `wrong-api-contracts` | N | X% | §{N} or — | `.github/skills/specs-backend-validation-gate/SKILL.md` |
   | `missing-edge-cases` | N | X% | §{N} or — | `.github/skills/specs-generation-story/SKILL.md` |
   | `other` | N | X% | §{N} or — | Review comments for patterns |

4. **Identify Top Failure Mode**: The reason code with the highest frequency is the primary harness improvement target.

5. **Propose Improvement**: For the top 1–2 failure modes, read the corresponding harness guide file and suggest a concrete change:
   - `wrong-requirements` → additions to Jira Analyst's extraction rules
   - `wrong-architecture` → additions to Tech Researcher's codebase scanning scope
   - `wrong-api-contracts` → improvements to backend validation gate or Swagger discovery fallbacks
   - `missing-edge-cases` → additions to Specs Writer's section templates (edge-case checklist)
   - `other` → cluster comments and propose a new reason code if a pattern emerges

6. **Audit Log Aggregation** (when WorkflowId data is present): Glob `docs/specs/*/audit.log`. For each rejected spec with a known `WorkflowId`, find matching entries by the `## {workflowId}` header prefix. Report correlation findings under "Audit Trail Patterns". Skip legacy rows (WorkflowId: legacy).

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

### Recommended Harness Improvements
1. **{Top failure mode}**: {Concrete suggestion with file path and proposed change}
2. **{Second failure mode}** (if applicable): {Suggestion}

### Steering Loop Actions
- [ ] Apply improvement to {file}
- [ ] Re-run `/create-specs` on a recent rejected ticket to validate
- [ ] Track if keep-rate improves over next 5 specs
```

## Thresholds

| Keep Rate | Health Status | Action |
| ----------- | -------------- | -------- |
| ≥ 80% | ✅ Healthy | No immediate action needed |
| 60–79% | ⚠️ Attention | Inspect top rejection reason, consider guide improvement |
| < 60% | ❌ Underperforming | Prioritize harness improvement before generating more specs |
