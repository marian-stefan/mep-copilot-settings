---
name: specs-backend-discovery-checklist
description: Single source of truth for backend service requirement checklists used by all three Tech Researcher agents. Defines per-issue-type checklists and the decision gate.
---

# Specs Backend Discovery Checklist

Use this skill to determine whether Backend Service Discovery is required for a given ticket. Replace all inline backend-discovery checklists in Tech Researcher agents with a load reference to this skill.

---

## Story / Task / Bug / Regression Bug (11 items)

If ANY item is Yes → `Backend services required: Yes` (MUST execute Backend Service Discovery).
If ALL items are No → `Backend services required: No` (skip discovery).

- [ ] Feature reads data from API endpoints?
- [ ] Feature writes/updates/deletes data via API?
- [ ] Feature modifies existing DTOs or interfaces?
- [ ] Feature adds new data models or entity types?
- [ ] Feature changes API request/response structures?
- [ ] Feature modifies authentication headers/scopes?
- [ ] Feature integrates with new backend service?
- [ ] Feature requires database schema changes?
- [ ] Bug involves an API response, payload, or DTO mismatch?
- [ ] Bug is triggered by a backend data change or schema migration?
- [ ] Fix requires modifying an API call, header, or authentication scope?

---

## Epic (6 items)

If ANY item is Yes → `Backend services required: Yes` (MUST execute Backend Service Discovery across all anticipated child stories).
If ALL items are No → `Backend services required: No`.

- [ ] Epic includes features that read/write data across multiple stories?
- [ ] Epic requires new shared data models or API contracts?
- [ ] Epic modifies authentication/authorization patterns globally?
- [ ] Any child story reads data from API endpoints?
- [ ] Any child story writes/updates/deletes data via API?
- [ ] Epic integrates with new backend service(s)?

---

## Spike (4 items)

If ANY item is Yes → `Backend services required: Yes` (focus on minimal endpoints needed for experiments).
If ALL items are No → `Backend services required: No`.

- [ ] Spike investigates API endpoint feasibility?
- [ ] Spike validates data model compatibility?
- [ ] Spike explores authentication/authorization patterns?
- [ ] Spike requires real API calls to validate hypotheses?

---

## Decision Gate

The gate is identical for all three issue-type variants:

> **If ANY item is Yes** → `Backend services required: Yes` — MUST invoke `.github/agents/backend-service-discovery.agent.md` via `runSubagent()`.
> **If ALL items are No** → `Backend services required: No` — explicitly state "No backend services involved" and skip service discovery.

Record the decision at the top of the Technical Context file:
```
Backend services required: Yes|No
```

This field is a BLOCKING pre-flight requirement — the Spec Writer will abort if this line is absent.
