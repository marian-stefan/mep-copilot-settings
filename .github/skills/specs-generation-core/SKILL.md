---
name: specs-generation-core
description: Technology-agnostic core sections for Specs generation across Story, Epic, and Spike.
---

# Specs Generation Core

This skill defines the baseline, technology-neutral structure for all Specs.
Technology-specific details must be added via plugin extension skills.

## Story/Task/Bug Template

Use sections 1-11 for standard work items (`Story`, `Task`, `Bug`).

### 1. Overview

- Jira Ticket: `{JIRA_KEY}`
- Goal: One clear outcome statement
- Success Criteria: Measurable outcomes with explicit targets
- Priority: Current delivery priority
- Estimated Complexity: `Low|Medium|High|Very High`

### 2. Background and Context

- Business Context: Why this is needed now
- User Scenario: Who is impacted and how
- Dependencies: Upstream/downstream services, teams, or initiatives

### 3. Requirements

#### 3.1 Functional Requirements

- FR-1: Testable requirement
- FR-2: Testable requirement

#### 3.2 Non-Functional Requirements

- Performance: Latency/throughput/SLO constraints
- Security: Authentication, authorization, input validation, secrets handling
- Reliability: Retry/timeout/failure behavior
- Usability: Error states, user feedback, operator clarity
- Maintainability: Modularity, docs, observability, test coverage

### 4. Architecture and Design

#### 4.1 System Boundaries

- Components to change with exact file paths from Technical Context
- New components/modules to add with exact file paths
- External boundaries (services, queues, databases, APIs)

#### 4.2 Data and Control Flow

- Request/command lifecycle from entry to persistence/output
- Error paths and fallback paths
- Idempotency and concurrency considerations where relevant

#### 4.3 Contracts and Interfaces

- API/DTO/interface changes with full field-level definitions
- Event schemas/message payloads when applicable
- Versioning and backward compatibility strategy

#### 4.4 Integration Points

- Backend Service Dependencies table from Technical Context
- Endpoint/operation list with auth expectations
- Configuration keys and environment assumptions

### 5. Security Analysis

This section is required.

#### 5.1 Threat Surface

- New API or command surface
- New user input surface
- New data movement or storage surface
- New trust boundary crossings

#### 5.2 Threat Vectors and Mitigations

- Injection risks (script, query, command)
- Data exposure risks (PII, secrets, sensitive logs)
- AuthN/AuthZ bypass risks
- Supply chain risks from new dependencies
- Integrity and replay risks for state-changing operations

For each identified risk, include:

- Risk statement
- Affected surface
- Mitigation
- Residual risk note

#### 5.3 Security Validation

- Security test cases tied to identified risks
- Required logging/auditing points
- Approval triggers (for example sensitive data or auth changes)

### 6. Implementation Plan

This section must be actionable and ordered.

Use phases with numbered steps. Each step includes:

- Exact file path(s)
- Intended change summary
- Relevant code snippet or signature
- Dependency on prior steps

Recommended phase skeleton:

1. Setup and scaffolding
2. Domain/data layer changes
3. Service/integration changes
4. Interface/API/UI changes
5. Hardening and error handling
6. Validation and documentation

Include rollback notes for high-risk changes.

### 7. Testing Strategy

- Unit Tests: Logic and edge cases for changed units
- Integration Tests: Cross-component behavior
- End-to-End/Acceptance: Critical user or system flows
- Non-Functional Validation: Performance, security, reliability checks

### 8. Acceptance Criteria

Provide checkbox criteria that are objectively verifiable.

Categories:

- Functional
- Technical quality
- Security
- Performance/reliability

### 9. Risks

- Top implementation risks with likelihood and impact
- Mitigation per risk

### 10. Rollout and Migration

- Deployment approach (phased/feature flag/full release)
- Backward compatibility notes
- Data migration plan if needed
- Observability and alerting checks during rollout

### 11. Appendix

- Related tickets
- Reference implementations
- Contract references (OpenAPI, schemas)
- Glossary for domain terms where needed

## Epic Additions

When `issueType` is `Epic`, include these sections in addition to the core guidance:

### Epic 1. Outcome and Scope

- Epic outcome statement
- Scope boundaries and non-goals

### Epic 2. Milestones and Timeline

- Milestone sequence with target dates/sprints
- Exit criteria per milestone

### Epic 3. Dependency Map

- Cross-team and external dependencies
- Critical path and blockers

### Epic 4. Suggested Child Tickets

- Machine-readable child ticket table
- Title, purpose, acceptance criteria, effort, labels

### Epic 5. Risk and Rollout Summary

- Epic-level risk concentration
- Rollout sequencing and guardrails

## Spike Additions

When `issueType` is `Spike`, include these sections in addition to the core guidance:

### Spike 1. Research Objective

- Primary decision question
- Secondary hypotheses

### Spike 2. Timebox and Experiments

- Timebox budget
- Experiment list with expected evidence

### Spike 3. Evidence and Findings Plan

- How evidence is captured
- Decision criteria for success/failure

### Spike 4. Follow-up Recommendations

- Recommended stories/tasks based on outcomes
- Deferred questions requiring additional investigation

## Quality Baseline

- No unresolved placeholders in final spec
- Requirements map to acceptance criteria
- At least one explicit security risk and mitigation
- Implementation steps are actionable and ordered
- Concrete file paths and concrete contracts are referenced from Technical Context
