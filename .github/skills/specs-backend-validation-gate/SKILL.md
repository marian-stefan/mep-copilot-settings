---
name: specs-backend-validation-gate
description: Backend-specific validation gate for Technical Context before Spec generation.
---

# Backend Validation Gate

This skill is backend-validation specific for the RESEARCH → GENERATE checkpoint.
For global validation gates and scoring, use `.github/skills/specs-validation/SKILL.md`.

## Purpose

Validate that Technical Context includes real backend dependency evidence when backend work is required.

## Validation Criteria

### If backend services are required

Technical Context must include **Backend Service Dependencies** with:
- Real service URLs (no placeholders)
- Real endpoint paths/methods from Swagger/OpenAPI
- Real schema fields and types
- Auth details aligned with API spec

If Swagger fetch failed, document blocker details and manual review path.

### If backend services are not required

Backend validation is skipped and workflow can proceed.

## Validation Failure Conditions

- Backend required but dependency section missing
- Placeholder/fabricated endpoint or schema data
- Swagger fetch failed without blocker + remediation details

## On Validation Failure

1. Stop progression to Specs Writer.
2. Return a validation report with exact missing/invalid items.
3. Provide remediation steps (re-run discovery, verify service access, attach API evidence).

## Optional User Override Path

If orchestrator interaction is enabled:
- Ask whether to continue without verified backend contracts.
- If continue, record override metadata and warnings.
- If stop, terminate with remediation report.
