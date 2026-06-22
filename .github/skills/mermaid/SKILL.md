---
name: mermaid
description: 'Generate Mermaid diagrams from architecture documents. Use when: creating sequence diagrams, component diagrams, flowcharts, or any visual from impact maps, HLD, or design docs. Keywords: mermaid, diagram, sequence, flow, component, architecture, visual.'
argument-hint: "describe the diagram to generate or reference a design document"
---

# Mermaid Diagram Generation

## When to Use
- Visualize component relationships from a high-level design
- Create sequence diagrams for end-to-end flows (e.g. booking journey)
- Generate flowcharts for decision logic or workflows
- Produce architecture overviews from impact maps or design docs

## Procedure

1. **Read the source document** provided as input (impact map, HLD, requirements, etc.).
2. **Identify the diagram type** that best fits the request:
   - `sequenceDiagram` — for user journeys, API call flows, async messaging
   - `graph TD` / `graph LR` — for component relationships, module dependencies
   - `flowchart` — for decision logic, branching workflows
   - `C4Context` / `C4Container` — for system context or container views
3. **Generate the Mermaid code block** using these conventions:
   - Use clear, short node labels (e.g. `Booking API`, `Email Service`)
   - Group related nodes with `subgraph` where it reduces clutter
   - Distinguish sync (solid arrows `-->`) from async (dotted arrows `-.->`) interactions in `graph`/`flowchart` diagrams
   - In `sequenceDiagram`, use the arrow reference below — **never use `-.)` which is invalid syntax**
   - Add notes (`Note right of ...`) for important constraints or SLAs
4. **Wrap output** in a fenced code block with ` ```mermaid ` so it renders in Markdown.
5. If multiple diagrams are needed, produce each one with a short heading explaining what it shows.

## Style Guidelines

- Prefer **vertical layout** (`TD`) for hierarchical views, **left-to-right** (`LR`) for flows.
- Keep diagrams under ~20 nodes; split into multiple diagrams if larger.
- Use participant aliases in sequence diagrams for readability.
- Label edges with the action or message name.

## Sequence Diagram Arrow Reference

| Arrow | Meaning |
|-------|---------|
| `->>` | Solid line with filled arrowhead (sync request) |
| `-->>` | Dotted line with filled arrowhead (sync response) |
| `-)` | Solid line with open arrowhead (async fire-and-forget) |
| `--)` | Dotted line with open arrowhead (async fire-and-forget) |
| `-x` | Solid line with cross (failed/lost message) |
| `--x` | Dotted line with cross |

**Do NOT use `-.)` — it is invalid Mermaid syntax and causes parse errors.**

## Pre-Write Validation

Before writing any Mermaid diagram to a file, run this checklist:

1. **Unclosed brackets**: Scan all node labels for `[` without a matching `]`. If any are found, close them before writing.
2. **Special characters in labels**: Escape or quote `"` and `:` characters inside node labels. In `graph`/`flowchart`, wrap labels containing these characters with `"..."` or use the `["..."]` node syntax.
3. **Arrow syntax**: Verify all arrows against the arrow reference table above. In particular:
   - `-.)` is invalid — use `-.->` or `--)` depending on intent.
   - `-->` is valid for solid lines with arrowheads; `-.->` for dotted with arrowhead.
   - In `sequenceDiagram`, use only the sequence-specific arrows from the arrow reference table.
4. **Complexity fallback**: If the diagram would exceed ~20 nodes, do NOT attempt to render it as Mermaid. Instead, write a text outline with the heading `<!-- Diagram available on request — exceeds 20-node rendering threshold -->` followed by a plain-text representation.

If any check fails, fix the issue before writing. Do not write a diagram you know will produce a parse error.

## Example

```mermaid
sequenceDiagram
    participant Owner
    participant API as Booking API
    participant DB as Database
    participant Queue as Message Queue
    participant Email as Email Service

    Owner->>API: POST /bookings
    API->>DB: Reserve slot (optimistic lock)
    DB-->>API: Confirmed
    API-->>Owner: 200 Booking Confirmed
    API--)Queue: BookingConfirmed event
    Queue--)Email: Send confirmation
    Email-->>Queue: Delivered
```
