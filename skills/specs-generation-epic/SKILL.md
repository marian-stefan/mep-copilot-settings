---
name: specs-generation-epic
description: Section templates for Epic Spec documents. Covers Epic Overview, Milestones & Timeline, Dependencies & Impacted Areas, Suggested Child Tickets, and Security & Risk Summary sections. Does NOT include Implementation Plan — replaced by Milestones & Story Breakdown.
---

# Specs Generation — Epic

> **Stack tokens**: `{{TOKEN}}` names in this file are symbolic — resolve them at runtime from the installed `{stack}-stack-profile` skill (registry: `skills/stack-profile/SKILL.md`). Never substitute them into files.

> **Scope**: This skill provides Epic-specific sections (Milestones, child ticket breakdown, cross-team coordination). The base section structure follows `specs-generation/SKILL.md`. Only Epic-unique sections are defined here.

Section templates for generating Spec documents for Epic issue types. The Specs Writer agent populates these sections with real values from the Technical Context, Jira ticket, and child issue data.

Spec filename: `SPEC-{JIRA_KEY}-Epic.md`

---

## Epic Specs Section - Overview & Milestones

**Used in**: Epic Specs (Sections 1-2)

### 1. Overview

- **Jira Ticket**: {JIRA_KEY}
- **Epic Goal**: High-level objective (what will be achieved across all stories)
- **Business Value**: What problems does this epic solve for stakeholders
- **Success Criteria**: Measurable outcomes for the epic completion
- **Priority**: Business priority level
- **Stakeholders**: Teams/roles involved
- **Estimated Complexity**: T-shirt size (XS=25, S=50, M=100, L=150, XL=200 story points)

### 2. Milestones & Timeline

**Milestone Structure**:

1. **{Milestone Name}** - {short description}
   - **Target Date**: {Sprint N or specific date}
   - **Acceptance Criteria**:
     - [ ] {Specific, testable criterion}
     - [ ] {Another criterion}

2. **{Next Milestone}** - {description}
   - **Target Date**: {Sprint N or specific date}
   - **Acceptance Criteria**:
     - [ ] {Specific, testable criterion}
     - [ ] {Another criterion}

**Note**: Structure milestones to show progression toward epic completion, with clear dependencies noted between milestones.

#### 3. Dependencies & Impacted Areas

**Affected Applications**:

- `{app path}` — {reason affected}

**Affected Modules** (per layering defined in `{{CODEBASE_MODULE_TAXONOMY}}`):

- `{presentation layer path}` — {reason affected}
- `{service/state layer path}` — {reason affected}
- `{UI layer path}` — {reason affected}

**Impacted Teams**:

- {Team Name}: {Responsibility}

**External Dependencies**:

- {Third-party services or platforms affected}
- {Breaking changes or integrations required}

---

## Epic Specs Section - Suggested Child Tickets

**Used in**: Epic Specs (Section 4)

**IMPORTANT**: This is a machine-readable suggestion list. Creating actual Jira issues requires explicit human or `jira-operator` action. Do NOT automatically create issues.

**Format**: Each child ticket includes title, description, acceptance criteria, effort estimate, and labels for Jira creation.

| # | Title | Description | Acceptance Criteria | Effort | Labels |
| --- | ------- | ------------- | ------------------- | -------- | -------- |
| 1 | `{FR-ID}`: {Component Title} | {1-2 line purpose} | -Criterion 1 -Criterion 2 | {5\|8\|13\|21} | `type:feature`, `domain:{domain}` |
| 2 | `{FR-ID}`: {Another Component} | {Purpose} | -Criterion 1 -Criterion 2 | {points} | `type:feature`, `domain:{domain}` |

**Child Ticket Template**:

Each child ticket should be created as:

- **Issue Type**: Story or Task (depending on nature)
- **Project**: Same project as Epic
- **Parent**: {JIRA_KEY} (the Epic)
- **Summary**: {Matching table title above}
- **Description**: {Matching description above}
- **Acceptance Criteria**: {Listed as checkboxes}
- **Story Points**: {Effort estimate}
- **Labels**: {domain:*, type:*, scope:lib}
- **Components**: {Relevant components}

**Example**:

```markdown
FR-123: Implement Export Parallelization
Parent: EP-456 (Epic)
Acceptance Criteria:
  - [ ] Parallel chunk processing reduces export time by 50%
  - [ ] Handles errors in individual chunks gracefully
  - [ ] Sample dataset exports complete within 2 minutes
Story Points: 13
Labels: domain:{your-domain}, type:feature, scope:lib
```

---

## Epic Specs Section - Security & Risk Summary

**Used in**: Epic Specs (Section 5)

#### 5. Security & Risk Summary

**Security Considerations for Epic**:

- New authentication/authorization logic: {describe}
- Sensitive data handling across stories: {describe}
- API security changes: {describe}
- Third-party integration risks: {describe}

**Top Risks**:

1. {Risk}: {Description} → **Mitigation**: {Strategy}
2. {Risk}: {Description} → **Mitigation**: {Strategy}
3. {Risk}: {Description} → **Mitigation**: {Strategy}

**Rollout Strategy**:

- Feature flags: {Which feature flags guard new functionality}
- Incremental rollout: {Phased approach for deployment}
- Backwards compatibility: {Breaking changes or migration path}
- Monitoring & alerts: {What metrics indicate success/failure}
