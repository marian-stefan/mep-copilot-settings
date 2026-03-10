---
name: specs-generation-core
description: Technology-agnostic core sections for Specs generation across Story, Epic, and Spike.
---

# Specs Generation Core

This skill defines the baseline, technology-neutral structure for all Specs.
Technology-specific details must be added via plugin extension skills.

## Core Sections (All Issue Types)

1. Overview
- Ticket key
- Goal
- Success criteria
- Priority and complexity

2. Background and Context
- Business context
- User scenario
- Dependencies

3. Requirements
- Functional requirements
- Non-functional requirements (performance, security, reliability, usability)

4. Architecture and Design
- Impacted components and boundaries
- Data flow and integration points
- Key interfaces/contracts

5. Security Analysis
- Threat surface
- Risks and mitigations

6. Implementation Plan
- Ordered phases with concrete file paths
- Sequence and dependencies
- Rollback considerations

7. Testing Strategy
- Unit and integration targets
- End-to-end or acceptance tests
- Non-functional validation

8. Risks and Open Questions
- Known risks
- Assumptions
- Unknowns requiring clarification

## Epic Additions

- Milestones and expected outcomes
- Child ticket strategy
- Cross-team dependencies

## Spike Additions

- Experiments and hypotheses
- Timebox and exit criteria
- Follow-up recommendations

## Quality Baseline

- No unresolved placeholders in final spec
- Requirements map to acceptance criteria
- At least one explicit security risk and mitigation
- Implementation steps are actionable and ordered
