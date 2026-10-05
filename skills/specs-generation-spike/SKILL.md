---
name: specs-generation-spike
description: Section templates for Spike Spec documents. Covers Objective & Background, Timebox & Experiment Plan, Success/Failure Criteria, Minimal Repro Steps, and Recommended Follow-up Stories. Does NOT include Implementation Plan — replaced by Experiment Plan.
---

# Specs Generation — Spike

> **Stack tokens**: `{{TOKEN}}` names in this file are symbolic — resolve them at runtime from the installed `{stack}-stack-profile` skill (registry: `skills/stack-profile/SKILL.md`). Never substitute them into files.

> **Scope**: This skill provides Spike-specific sections (Experiment Plan, Success/Failure Criteria, Minimal Prototype). The base section structure follows `specs-generation/SKILL.md`. Only Spike-unique sections are defined here.

Section templates for generating Spec documents for Spike issue types. The Specs Writer agent populates these sections with real values from the Technical Context and Jira ticket.

Spec filename: `SPEC-{JIRA_KEY}-Spike.md`

---

## Spike Specs Section - Objective & Experiments

**Used in**: Spike Specs (Sections 1-2)

### 1. Objective & Background

**Research Goal**: What are we trying to learn or evaluate?

- **Primary Question**: {The core question this spike answers}
- **Secondary Questions**: {Related unknowns to explore}
- **Success Definition**: {What does "successful research" look like}

**Background**:

- Why is this spike needed now
- What decisions depend on the results
- Business/technical impact of the spike outcome

### 2. Timebox & Experiment Plan

**Timebox**: {Number of days/hours allocated for research}

- Start Date: {Date}
- End Date: {Date}
- Effort: {Dev days or hours}

**Experiment Plan**:

1. **Experiment 1: {Title}**
   - **Objective**: {What are we testing}
   - **Approach**: {How will we test it}
   - **Expected Outcome**: {What success looks like}
   - **Time Allocation**: {Hours}

2. **Experiment 2: {Title}**
   - **Objective**: {What are we testing}
   - **Approach**: {How will we test it}
   - **Expected Outcome**: {What success looks like}
   - **Time Allocation**: {Hours}

3. **Experiment 3: {Title}**
   - **Objective**: {What are we testing}
   - **Approach**: {How will we test it}
   - **Expected Outcome**: {What success looks like}
   - **Time Allocation**: {Hours}

---

## Spike Specs Section - Success & Follow-up

**Used in**: Spike Specs (Sections 3-5)

### 3. Success/Failure Criteria

**Success Criteria** (Spike is successful if):

- [ ] {Specific, measurable criterion}
- [ ] {Another criterion}
- [ ] {Critical finding or learning achieved}

**Failure Criteria** (Spike inconclusive if):

- [ ] {Specific blocking issue}
- [ ] {Unavailable information}
- [ ] {Technical blocker encountered}

**Metrics** (How to measure results):

- {Metric 1}: {How to measure}
- {Metric 2}: {How to measure}

### 4. Minimal Repro Steps / Prototype Guidance

**Steps to Reproduce Experiments**:

1. Clone/checkout branch: `git checkout {branch}`
2. Setup environment: `{{INSTALL_COMMAND}}`
3. Configure any environment the experiment needs (env vars, config)
4. Run Experiment 1:

    ```bash
    {{RUN_COMMAND}} {script}
    # Expected output: {description}
    ```

5. Validate results: {Validation steps}

**Code Locations**:

- Experiment 1 code: `{source path per project conventions}/{file}`
- Test data: `{test fixtures path per project conventions}/{data}`
- Config: `{environment config file per project conventions}`

**Prototype Implementation** (if applicable):

```
// Minimal prototype to test spike hypothesis
// Key implementation details that informed the spike decision
// (syntax depends on tech stack)
```

### 5. Recommended Follow-up Stories

Based on spike findings, recommend creation of:

| Title | Purpose | Effort | Labels |
| ------- | --------- | -------- | -------- |
| `FR-{ID}`: {Story Title} | {Implement learning from Experiment 1} | 13 | `domain:{domain}`, `type:feature` |
| `FR-{ID}`: {Story Title} | {Implement learning from Experiment 2} | 8 | `domain:{domain}`, `type:feature` |

**Next Steps If Spike Results**:

- {Positive outcome}: Proceed with FR-{ID}
- {Negative outcome}: Investigate alternative approach
- {Inconclusive}: {Recommendation for follow-up research}
