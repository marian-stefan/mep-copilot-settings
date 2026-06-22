---
name: specs-ambiguity-detection
description: Assumption registry and ambiguity surfacing checklist for Tech Researchers. Defines the assumption schema, blocking × confidence matrix, and how Spec Writers consume non-blocking assumptions.
---

# Specs Ambiguity Detection

Defines how Tech Researchers enumerate and record architectural assumptions and ticket ambiguities before codebase analysis proceeds.

---

## When to Run

Add an assumption registry step between scope-narrowing (step 2a) and codebase analysis (step 2b) in all three Tech Researcher agents:

1. **Pre-analysis** (after 2a, before 2b): Enumerate the top 3–5 architectural assumptions being made about ownership, patterns, and module boundaries.
2. **Post-analysis** (after 2b): Add any ticket ambiguities that only became visible against the code.

---

## Assumption Schema

Record assumptions in a structured `assumptions` block in the CONTEXT YAML frontmatter:

```yaml
assumptions:
  - id: A1
    type: architectural        # architectural | ticket-ambiguity
    blocking: false
    confidence: high           # high | medium | low
    text: "Assuming ModuleX owns this feature based on existing routing"
  - id: A2
    type: ticket-ambiguity
    blocking: true
    confidence: high
    text: "AC3 targets ComponentY but ComponentY is read-only; no owner identified"
```

### Field Definitions

| Field | Values | Description |
|---|---|---|
| `id` | A1, A2, … | Sequential identifier |
| `type` | `architectural` \| `ticket-ambiguity` | Architectural = design inference; ticket-ambiguity = ambiguity discovered in the ticket against the code |
| `blocking` | `true` \| `false` | Whether this assumption must be resolved before the Spec Writer proceeds |
| `confidence` | `high` \| `medium` \| `low` | Confidence in the assumption's correctness |
| `text` | string | One sentence: what is being assumed and why |

---

## Assumption Checklist

When identifying assumptions, check these categories:

**Architectural assumptions (type: architectural)**:
- [ ] Which module/service owns this feature? Is ownership unambiguous from the codebase?
- [ ] Which layer type does the change belong to (feature/ui/data-access/util/api/model)?
- [ ] Does this feature require a new module or extend an existing one?
- [ ] Are there shared library implications that were not explicit in the ticket?
- [ ] Is the implementation approach (e.g., state management pattern) inferred or specified?

**Ticket ambiguities (type: ticket-ambiguity)**:
- [ ] Do any ACs reference a component or method that does not exist or is read-only?
- [ ] Is there a conflict between the ticket description and the ACs?
- [ ] Does the ticket reference an API that cannot be found in the codebase or Swagger?
- [ ] Are there multiple valid interpretations of the same AC?
- [ ] Does "modify X" in the ticket leave the modification direction ambiguous?

---

## Blocking × Confidence Matrix

| `blocking` | `confidence` | Behaviour |
|---|---|---|
| `true` | `high` | Surface immediately; halt the orchestrator gate until user resolves |
| `true` | `medium` | Surface immediately; halt the orchestrator gate |
| `true` | `low` | Surface immediately; halt the orchestrator gate |
| `false` | `high` | Do not surface at gate; flow directly to Spec Writer as Open Question |
| `false` | `medium` | Surface as a warning in the Research Summary (E gate); flow to Spec Writer as Open Question |
| `false` | `low` | Surface as a warning in the Research Summary (E gate); flow to Spec Writer as Open Question |

`blocking: true` is the sole gating signal for the orchestrator's ambiguity gate. `confidence` controls surfacing behaviour — it does not change whether the gate fires.

---

## Orchestrator Gate (implemented in specs-workflow-orchestrator)

After RESEARCH completes, the orchestrator reads the `assumptions` frontmatter of `CONTEXT-{KEY}.md` and checks for any entry with `blocking: true`. If any are present:

1. Pause the workflow before invoking the Spec Writer.
2. Display each blocking assumption with its `id`, `type`, and `text`.
3. Prompt the user: *"The following assumptions require resolution before spec generation:"*
4. Record user resolutions in `pendingDecision: { assumptions: Assumption[] }` in the workflow state.
5. Update `pauseReason: "ambiguity-gate"` in the state file.
6. After resolution: update the CONTEXT `assumptions` entries to `blocking: false` (or remove them) and proceed to GENERATE.

Non-blocking assumptions flow through to the Spec Writer without pausing.

**C + E gate interaction**: If C's blocking-assumption gate fires and the user resolves the assumptions, E's `--review-context` gate still runs afterward (if active). The two gates are complementary, not mutually exclusive.

---

## Spec Writer Consumption

All three Specs Writer agents read the `assumptions` frontmatter from CONTEXT and map each non-blocking assumption into an **Open Questions / Assumptions** section in the SPEC:

```markdown
## Open Questions / Assumptions

| ID | Assumption | Confidence | Recommended Action |
|----|------------|------------|--------------------|
| A1 | Assuming ModuleX owns this feature based on existing routing | High | Verify with module owner before implementation |
| A3 | AC2 interpretation assumed as client-side only | Medium | Confirm with product owner |
```

Blocking assumptions never reach the Spec Writer — the orchestrator gate stops the run first.
