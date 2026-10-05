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
    resolution: unresolved     # resolved | unresolved
  - id: A2
    type: ticket-ambiguity
    blocking: true
    confidence: high
    text: "AC3 targets ComponentY but ComponentY is read-only; no owner identified"
    resolution: unresolved
  - id: A3
    type: ticket-ambiguity
    blocking: false
    confidence: high
    text: "Confirm no other module reads Entity.SortOrder by its current JSON name before renaming it"
    resolution: resolved
    evidence: "grep across every module/package in the repo for SortOrder/sortOrder found no reader outside the owning module — safe to rename"
```

### Field Definitions

| Field | Values | Description |
|---|---|---|
| `id` | A1, A2, … | Sequential identifier |
| `type` | `architectural` \| `ticket-ambiguity` | Architectural = design inference; ticket-ambiguity = ambiguity discovered in the ticket against the code |
| `blocking` | `true` \| `false` | Whether this assumption must be resolved before the Spec Writer proceeds. Always `false` when `resolution: resolved` — see § Resolution Attempt Protocol |
| `confidence` | `high` \| `medium` \| `low` | Confidence in the assumption's correctness |
| `text` | string | One sentence: what is being assumed and why |
| `resolution` | `resolved` \| `unresolved` | Whether the Resolution Attempt Protocol below settled this from the codebase, or it remains a genuine open question |
| `evidence` | string | Required when `resolution: resolved` — file path(s) and the fact found there. Omit when `unresolved` |

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
- [ ] Does the ticket reference an API that cannot be found in the codebase?
- [ ] Are there multiple valid interpretations of the same AC?
- [ ] Does "modify X" in the ticket leave the modification direction ambiguous?

---

## Resolution Attempt Protocol

Before recording **any** assumption/ambiguity entry, attempt to resolve it from the codebase. Most "open questions" in a ticket are facts sitting somewhere in the workspace — they only stay open when nobody looked. This step runs once per enumerated item, after it's identified and before it's written to frontmatter.

### How to attempt resolution, by type

- **`architectural`** — Check the active tech layer's module-boundary rules (`{stack}-patterns/SKILL.md`) for ownership, existing DI/service registrations, and established module-naming conventions in sibling modules.
- **`ticket-ambiguity`** — Search the **whole workspace**, not just the primary domain/module, for the referenced component, method, or endpoint. Check `git log`/`git blame` on the relevant file for prior intent if the ticket references past behaviour.

**Cross-module rule**: any question of the form "does anything else depend on X" or "is X used elsewhere" (a field name, a JSON property, a shared DTO shape, a CSS class) MUST be checked across **all other modules/packages in the repo** — not only the module that owns the file in question. A grep confined to the primary module answers "does this module use it," not the actual question asked.

### Resolvable vs. not resolvable

- **Resolvable** — the answer is a fact derivable from source code, config, committed docs, or version history: naming collisions or their absence, existing sort/copy/isolation logic, existing CSS selectors, established i18n namespace conventions, existing feature-flag registrations. If `grep`/`read`/`git log` can settle it, it is resolvable.
- **Not resolvable** — the question requires a preference, authorization, or business decision that nobody has recorded anywhere yet (e.g. "should this ship behind a flag in production," a genuine UX trade-off with no established precedent, anything requiring sign-off from a role the agent cannot consult). These remain `resolution: unresolved`.

When resolved: set `resolution: resolved`, `blocking: false` (always — see Field Definitions above), and record the `evidence` field with the file path(s) and the fact found there. When not resolvable: set `resolution: unresolved` and proceed to the Blocking × Confidence Matrix below as before.

Do not fabricate evidence. If a search comes back empty or inconclusive, that is itself sometimes the answer (e.g. "no other consumer reads this field" is a valid resolution backed by a negative grep result across every module) — but if the search is inconclusive about the actual question asked (e.g. found the file but couldn't tell what it does), leave it `unresolved` rather than guessing.

---

## Blocking × Confidence Matrix

Applies only to entries where `resolution: unresolved` — resolved entries never reach this matrix (they are always `blocking: false` and are informational only, per § Resolution Attempt Protocol).

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

## Orchestrator Gate

`blocking: true` assumptions are resolved in the Specs Workflow Orchestrator's Research Decisions pause (`agents/specs-workflow-orchestrator.agent.md` § Step 3b), together with any pattern choice. The procedure and state (`pauseReason: research-decisions`) are owned there. Resolved assumptions are written back with `blocking: false` and their resolution. Order: the E gate (`--review-context`, Step 3a) runs first, because a scope correction there can change which assumptions block.

Non-blocking assumptions flow through to the Spec Writer without pausing.

---

## Spec Writer Consumption

All three Specs Writer agents read the `assumptions` frontmatter from CONTEXT and map each **`resolution: unresolved`, non-blocking** assumption into an **Open Questions / Assumptions** section in the SPEC:

```markdown
## Open Questions / Assumptions

| ID | Assumption | Confidence | Recommended Action |
|----|------------|------------|--------------------|
| A1 | Assuming ModuleX owns this feature based on existing routing | High | Verify with module owner before implementation |
| A3 | AC2 interpretation assumed as client-side only | Medium | Confirm with product owner |
```

Blocking assumptions never reach the Spec Writer — the orchestrator gate stops the run first. `resolution: resolved` assumptions are never mapped into this table — they are settled facts, not questions for a reviewer to answer. The Specs Writer (Story) may optionally list them informationally under a "Resolved During Research" note (no owner, no action needed) so a reviewer can see what was auto-settled and why — see `skills/specs-generation-story/SKILL.md` § Section 4.
