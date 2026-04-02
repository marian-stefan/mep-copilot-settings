---
description: "Draft a high-level design (HLD) from a Jira Epic — components, integrations, end-to-end flow, and architectural decisions"
agent: "agent"
argument-hint: "Jira Epic key (e.g. HON-1234)"
---

You are helping draft a **high-level design (HLD)** for a web system.

**Jira Epic key:**
`${{ input }}`

**Instruction:** Locate the existing impact map from the prior create-impact-map run; use Jira Analyst to fetch Epic details for traceability; produce HLD aligned with the impact map.

**Workflow:**
1. Read the Jira Epic key from input (e.g. `HON-30450`)
2. Convert it to kebab-case folder name (e.g. `bid-breakdown/`) using the same logic as create-impact-map: lowercase Epic summary, spaces → hyphens, strip special characters
3. Use Jira Analyst to fetch Epic details, acceptance criteria, and child issues for context and traceability
4. Read the existing **`impact-map.md`** from that folder as your primary design input
5. Produce **`high-level-design.md`** and **`adrs.md`** in the **same folder**

**HLD sections:**

1. **Major components and responsibilities** — For each component or service, state its main responsibility and what it does *not* own.

2. **Integrations and end-to-end flow** — Describe the main user journey (e.g. owner books an appointment) as a sequence across components; note synchronous vs asynchronous steps where it matters. Mention external integrations (email/SMS, identity, etc.) if applicable.

3. **Key architectural decisions** — Use the `/adr` skill to create all decisions in a single **`adrs.md`** file saved in the **same folder** as the impact map. In the HLD itself, include a summary table linking to the relevant section:

   | ADR | Decision | Status |
   |-----|----------|--------|
   | [ADR-001](./adrs.md#adr-001-short-title) | Short description | Accepted |

**Design constraints:**
- Stay strictly aligned with the impact map; do not invent major scope beyond sections 1–3 of the impact map
- Use Jira Analyst output for traceability (map HLD components to Epic child issues where relevant)
- Use the `/mermaid` skill to generate Mermaid diagrams that clarify component relationships and the end-to-end flow

**Failure handling:**
- If Jira access fails (authentication, connectivity, or issue not found), stop and return an actionable error
- If impact-map.md does not exist in the derived folder, suggest running create-impact-map with the same Epic key first
- If Jira Analyst data is incomplete, flag ambiguities in the HLD and recommend manual review of the Jira ticket
- Do not invent requirements or architecture not grounded in the Epic data or impact map
