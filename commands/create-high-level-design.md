---
description: "Draft a high-level design (HLD) from a Jira Epic — components, integrations, end-to-end flow, and architectural decisions"
agent: "agent"
argument-hint: "Jira Epic key (e.g. HON-1234)"
---

# High Level Design

> **Stack tokens**: `{{TOKEN}}` names in this file are symbolic — resolve them at runtime from the installed `{stack}-stack-profile` skill (registry: `skills/stack-profile/SKILL.md`). Never substitute them into files.

This prompt guides generation of a high-level design and ADR set from a Jira Epic using repository-grounded architecture evidence.

You are helping draft a **high-level design (HLD)** for a web system.

Act as an experienced **codebase architect**. Base the design on how this repository is built today, not on framework-agnostic templates.

**Jira Epic key:**
`${{ input }}`

**Instruction:** Locate the existing impact map from the prior create-impact-map run and produce an HLD aligned with it and current repository implementation patterns.

**Workflow:**

1. Read the Jira Epic key from input (e.g. `HON-30450`)
2. Use Jira Analyst to fetch Epic details, acceptance criteria, and child issues for context and traceability
3. Read the existing **`docs/specs/{EPIC_KEY}/impact-map.md`** as your primary design input
4. Perform repository analysis using the requirements and checklist below
5. Produce **`docs/specs/{EPIC_KEY}/high-level-design.md`** and **`docs/specs/{EPIC_KEY}/adrs.md`**

**Repository analysis requirements (mandatory):**

- Analyze relevant apps/libs and dependencies before proposing components or integrations.
- Use the workspace/module dependency graph context (`{{DEPENDENCY_GRAPH_COMMAND}}`) to reason about allowed boundaries and likely change surfaces.
- Read representative implementation files (UI, feature/state, service/integration, models/contracts, routing) for technical grounding.
- Reuse established tech-stack patterns and idioms already present in the codebase.
- Include concise traceability from design elements to Jira keys and repository evidence.

**Repository Evidence Checklist (required):**

- List impacted modules and why each is affected.
- List key dependency edges that constrain implementation (allowed boundaries, upstream/downstream effects).
- Cite representative files reviewed for each impacted layer (UI, feature/state, service/integration, routing, models/contracts).
- Note reusable existing patterns/components/services to extend.
- Identify missing or ambiguous code evidence and required manual follow-up.
- Use this checklist for internal validation while drafting the HLD/ADRs.

**HLD sections:**

1. **Major components and responsibilities** — For each component or service, state its responsibility and what it does *not* own.

2. **Integrations and end-to-end flow** — Describe the main user journey (e.g. owner books an appointment) as a sequence across components; note synchronous vs asynchronous steps where it matters; mention external integrations (email/SMS, identity, etc.) when applicable.

3. **Key architectural decisions** — Use the `/adr` skill to create all decisions in a single **`adrs.md`** file saved in the **same folder** as the impact map. In the HLD itself, include a summary table linking to the relevant section:

   | ADR | Decision | Status |
   |-----|----------|--------|
   | [ADR-001](./adrs.md#adr-001-short-title) | Short description | Accepted |

**Design constraints:**

- Stay strictly aligned with the impact map; do not invent major scope beyond sections 1–3.
- Use Jira Analyst output for traceability (map HLD components to Epic child issues where relevant).
- Ensure major technical claims are grounded in current repository structure and code conventions.
- Explicitly call out when a proposed design introduces a new pattern versus extending an existing one.
- Use the `/mermaid` skill to generate Mermaid diagrams that clarify component relationships and the end-to-end flow.

**Failure handling:**

- If Jira access fails (authentication, connectivity, or issue not found), stop and return an actionable error.
- If `docs/specs/{EPIC_KEY}/impact-map.md` does not exist, suggest running create-impact-map with the same Epic key first.
- If Jira Analyst data is incomplete, flag ambiguities in the HLD and recommend manual Jira review.
- If repository analysis is inconclusive, flag the missing code context and identify specific projects/files requiring manual validation.
- Do not invent requirements or architecture not grounded in the Epic data or impact map.
