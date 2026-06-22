---
description: >
  Draft a high-level design (HLD) and ADR set from a Jira Epic — components,
  integrations, end-to-end flow, and architectural decisions grounded in the
  existing impact map and repository evidence.
  Produces docs/specs/{KEY}/high-level-design.md and docs/specs/{KEY}/adrs.md.
argument-hint: <EPIC_KEY>
arguments: [key]
allowed-tools: >
  mcp__etools__jira_get-issue mcp__etools__jira_search-issues
  mcp__etools__jira_get-comments mcp__etools__jira_get-attachments
  Read Write Bash(find . *) Bash(grep *)
effort: high
disable-model-invocation: true
---

# Create High-Level Design

Draft a high-level design (HLD) and ADR set from a Jira Epic, aligned with the existing impact map and current repository implementation patterns.

## Context

- Epic key: $key

## Instructions

Act as an experienced codebase architect. Base the design on how this repository is built today, not on framework-agnostic templates.

### Step 1 — Fetch Epic Data

- `mcp__etools__jira_get-issue` — issueKey: `$key`
- `mcp__etools__jira_search-issues` — fetch child issues for context and traceability

### Step 2 — Read Impact Map

Read `docs/specs/$key/impact-map.md` as the primary design input. If it does not exist, stop and suggest running `/create-impact-map $key` first.

### Step 3 — Repository Analysis (mandatory)

- Analyze relevant apps/libs and dependencies before proposing components.
- Use `{{DEPENDENCY_GRAPH_COMMAND}}` to reason about allowed boundaries and likely change surfaces.
- Read representative implementation files (UI, feature/state, service/integration, models/contracts, routing).
- Reuse established tech-stack patterns already present in the codebase.
- Include concise traceability from design elements to Jira keys and repository evidence.

**Repository Evidence Checklist** (validate internally):

- Impacted modules and why each is affected
- Key dependency edges constraining implementation
- Representative files reviewed for each impacted layer
- Reusable existing patterns/components to extend
- Missing or ambiguous code evidence requiring manual follow-up

### Step 4 — Produce HLD

Save to `docs/specs/$key/high-level-design.md` with these sections:

1. **Major components and responsibilities** — For each component or service, state its responsibility and what it does *not* own.

2. **Integrations and end-to-end flow** — Describe the main user journey as a sequence across components; note sync vs async steps; mention external integrations (email/SMS, identity, etc.) when applicable. Use the `/mermaid` skill to generate diagrams.

3. **Key architectural decisions** — Summary table linking to `adrs.md`:

   | ADR | Decision | Status |
   | ----- | ---------- | -------- |
   | [ADR-001](./adrs.md#adr-001-short-title) | Short description | Accepted |

### Step 5 — Produce ADRs

Save all architectural decisions to `docs/specs/$key/adrs.md` using the `/adr` skill template.

## Design Constraints

- Stay strictly aligned with the impact map; do not invent scope beyond sections 1–3.
- Use Jira data for traceability (map HLD components to Epic child issues where relevant).
- Explicitly call out when a proposed design introduces a new pattern vs extending an existing one.

## Failure Handling

- If Jira access fails: stop and return an actionable error.
- If impact map is missing: stop and suggest `/create-impact-map $key`.
- If repository analysis is inconclusive: flag missing context and identify specific files for manual validation.
