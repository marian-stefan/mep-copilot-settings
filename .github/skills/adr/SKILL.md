---
name: adr
description: 'Create Architecture Decision Records (ADRs). Use when: documenting architectural decisions, recording design trade-offs, adding ADRs to an existing adrs.md, creating new ADR entries. Keywords: ADR, architecture decision record, decision, trade-off, rationale, alternatives.'
argument-hint: "describe the architectural decision to document"
---

# Architecture Decision Records (ADR)

## When to Use
- Document a significant architectural or technology choice
- Record trade-offs and rationale for a design decision
- Add new ADR entries to an existing `adrs.md` file
- Create an `adrs.md` from scratch when starting a new design

## Procedure

1. **Locate the output file.** Look for an existing `adrs.md` in the same folder as the project's impact map or high-level design. If none exists, create one.
2. **Determine the next ADR number.** Read the existing `adrs.md` and find the highest `ADR-NNN` number. Increment by 1. If the file is new, start at `ADR-001`.
3. **Apply the template.** Use the structure from [adr-template.md](./resources/adr-template.md) for each entry:
   - **Title**: `# ADR-NNN: Short Descriptive Title` — use kebab-case for the anchor (e.g. `adr-001-short-title`).
   - **Status**: One of `Proposed`, `Accepted`, `Deprecated`, `Superseded by [ADR-NNN]`.
   - **Context**: The problem, constraints, and traceability to requirements or impact map.
   - **Decision**: The chosen approach, stated clearly.
   - **Rationale**: Why this option wins — reference simplicity, scale, team expertise, stack alignment.
   - **Alternatives Considered**: Table with at least 1–2 alternatives, their pros/cons, and why they were rejected.
   - **Consequences**: Split into Positive, Negative/Trade-offs, and Risks.
   - **References**: Link to impact map, requirements, or other ADRs.
4. **Separate entries** with a horizontal rule (`---`).
5. **Update the HLD summary table** if a `high-level-design.md` exists in the same folder — add a row linking to the new ADR anchor.

## Quality Checklist
- [ ] Decision is a single, clear statement (not multiple bundled choices)
- [ ] At least one alternative is documented with trade-offs
- [ ] Context traces back to a requirement, risk, or impact map entry
- [ ] Consequences include both positive outcomes and trade-offs/risks
- [ ] Anchor ID in the heading matches the link pattern: `#adr-nnn-kebab-title`

## Anti-patterns
- **Vague context**: "We needed to pick something" — always state the forcing function
- **Missing alternatives**: A decision without alternatives is just a statement, not a record
- **Bundled decisions**: "We chose X, Y, and Z" — split into separate ADRs
- **No trade-offs**: Every decision has downsides; document them honestly
