---
name: specs-subagent-invocation
description: Standardized runSubagent invocation patterns, error handling, and output integration for Specs workflow.
---

# Subagent Invocation Guide

This skill standardizes invocation style and integration patterns only.
It does not define workflow routing, validation thresholds, or agent contracts.

## Function Signature

```typescript
runSubagent({
  description: string;
  prompt: string;
}): Promise<string>
```

## Invocation Pattern

```typescript
const result = await runSubagent({
  description: "Descriptive task name",
  prompt: `Clear, detailed instructions...
           Include context needed by subagent.
           Specify expected output format.
           Include constraints and success criteria.`
});
```

## Best Practices

- Include explicit context, expected output format, and completion criteria.
- Avoid vague instructions and multi-problem prompts.

## Common Invocations


### Implementation Planning

```typescript
const implementationPlan = await runSubagent({
  description: "Implementation Plan",
  prompt: `Requirement Brief: ${requirementBrief}
           Output ordered actionable steps, exact file paths,
           implementation commands, effort estimates, and risk notes.`
});
```

## References

- Validation rules: `.github/skills/specs-validation/SKILL.md`
- Routing and naming: `.github/skills/specs-workflow-routing/SKILL.md`
- Error handling patterns: `.github/skills/specs-error-handling/SKILL.md`
