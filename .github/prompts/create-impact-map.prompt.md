---
description: "Generate an impact map from a Jira Epic — architecture discovery for modules, risks, and scope boundaries"
agent: "agent"
argument-hint: "Jira Epic key (e.g. HON-1234)"
---

You are helping with architecture discovery for a small product team.

**Jira Epic key:**
`${{ input }}`

**Instruction:** Use Jira Analyst to fetch Epic details, acceptance criteria, and child issues before generating the impact map.

Using Jira Epic data (Epic plus child issues) as the single source of truth, produce an **impact map** in Markdown with these sections:

1. **Requirements and acceptance criteria** — Table or bullet list of the main functional requirements and their acceptance criteria; map each requirement to Epic or child Jira keys when available; flag gaps, ambiguities, or dependencies on assumptions.

2. **Affected modules, dependencies, and risks** — Identify likely application/domain modules (or bounded contexts), technical dependencies (databases, APIs, queues, email/SMS, auth, etc.), and delivery risks (performance, consistency, security, operational complexity).

3. **Assumptions and scope boundaries** — Explicit assumptions; clear **in scope** vs **out of scope** for this design iteration.

**Output instructions:**
- Read the Jira Epic summary/title to identify the requirement name (e.g. "Appointment Booking System").
- Convert it to a kebab-case folder name (e.g. `appointment-booking-system/`): lowercase, spaces replaced by hyphens, strip special characters.
- Create that folder in the workspace root unless an output base path is explicitly provided in the prompt input.
- Save the result as **`impact-map.md`** inside that new folder.
- This folder is the **shared output directory** for all artifacts derived from this requirement (impact map, high-level design, ADRs, diagrams, etc.).

**Failure handling:**
- If Jira access fails (authentication, connectivity, or issue not found), stop and return an actionable error.
- If some child issue data is missing, continue and explicitly list the missing data as ambiguities in section 1.
- Do not invent requirements that are not present in Jira data.

Write clearly, without extra commentary outside those three sections.
