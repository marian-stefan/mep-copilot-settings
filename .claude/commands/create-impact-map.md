---
description: >
  Generate an architecture impact map from a Jira Epic — modules, risks, dependencies,
  and scope boundaries grounded in current repository evidence.
  Produces docs/specs/{KEY}/impact-map.md.
argument-hint: <EPIC_KEY>
arguments: [key]
allowed-tools: >
  mcp__etools__jira_get-issue mcp__etools__jira_search-issues
  mcp__etools__jira_get-comments mcp__etools__jira_get-attachments
  Read Write Bash(find . *) Bash(grep *)
effort: high
disable-model-invocation: true
---

# Create Impact Map

Generate an architecture impact map from a Jira Epic, grounded in current monorepo implementation.

## Context

- Epic key: $key

## Instructions

Act as an experienced codebase architect. Ground all technical statements in repository evidence, not generic assumptions.

### Step 1 — Fetch Epic Data

Use Jira MCP tools to fetch the Epic and its child issues:

- `mcp__etools__jira_get-issue` — issueKey: `$key`
- `mcp__etools__jira_search-issues` — search for child issues linked to `$key`

### Step 2 — Repository Discovery (required before writing)

1. Inspect the monorepo for relevant apps/libs, feature boundaries, and integration points tied to the Epic.
2. Use `{{DEPENDENCY_GRAPH_COMMAND}}` to identify impacted modules and dependency constraints.
3. Read representative files (components, services/facades, state, routing, API clients, models/contracts) to infer actual architecture.
4. Prefer existing conventions; if proposing new patterns, explain why current patterns are insufficient.

**Repository Evidence Checklist** (validate internally — do not add as a separate section):

- Impacted modules and why each is affected
- Key dependency edges (allowed boundaries, upstream/downstream effects)
- Representative files reviewed for each impacted layer
- Reusable existing patterns/components/services
- Missing or ambiguous code evidence requiring manual follow-up

### Step 3 — Produce Impact Map

Save to `docs/specs/$key/impact-map.md` with exactly these three sections:

1. **Requirements and acceptance criteria** — List main functional requirements and ACs; map each to Jira keys; flag gaps, ambiguities, or assumption dependencies.

2. **Affected modules, dependencies, and risks** — Identify actual modules/bounded contexts, technical dependencies (databases, APIs, queues, auth, etc.), and delivery risks (performance, consistency, security, operational complexity) from repository evidence.

3. **Assumptions and scope boundaries** — Explicit assumptions; clear **in scope** vs **out of scope** for this design iteration.

Write clearly without extra commentary outside those three sections.

## Failure Handling

- If Jira access fails: stop and return an actionable error.
- If child issue data is missing: continue and list missing data as ambiguities in section 1.
- If repository evidence is insufficient: continue but call out unknowns and list files for manual review.
- Do not invent requirements not present in Jira data.
