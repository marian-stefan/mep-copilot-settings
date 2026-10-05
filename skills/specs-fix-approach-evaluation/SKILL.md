---
name: specs-fix-approach-evaluation
description: Fix approach evaluation checklist for Bug and Regression Bug tickets. Detects reuse opportunities and abstraction bypass before producing a single-patch implementation plan. Triggered after root cause analysis, before the Implementation Plan step.
---

# Specs Fix Approach Evaluation

Apply this skill for **Bug** and **Regression Bug** issue types only, after root cause analysis (step 2b) and before generating the Implementation Plan (Step 6).

---

## Step 1: Identify the Fix Concern

From the root cause analysis, extract:
- The exact method, property, or pattern being patched (the "fix concern").
- The file(s) and line(s) that are the primary fix target.

---

## Step 2: Search for Pattern Recurrence

Search the codebase for the same pattern at multiple levels:

| Search type | What to look for |
|---|---|
| **Symbol-level** | Same method name, property access, or function signature in other files |
| **Pattern-level** | Same anti-pattern or incorrect usage across the module |
| **Semantic** | Similar bugs reported in other areas (check BRIEF Open Questions, related Jira keys) |
| **Existing abstraction** | Utility function, helper, or base class that the fix concern should be delegated to |

---

## Step 3: Evaluate Refactor Signals

Check for any of the following signals:

- [ ] Duplication at ≥ 2 sites (the same incorrect pattern appears in 2 or more locations)
- [ ] Bypassed abstraction (the fix concern bypasses an existing utility, helper, or base class that was designed to handle this)
- [ ] Inline clone of existing helper (the bug replicates logic that already exists in a shared util)
- [ ] Pattern inconsistency across modules (one module handles this correctly; others do not)

---

## Step 4: Decision Gate

**If NO signal is detected**:
- Proceed with a normal single-patch fix.
- No Fix Options table required.
- Continue to Implementation Plan.

**If ANY signal is detected**:
- Do NOT proceed directly to Implementation Plan.
- Emit a **Fix Options** table (see format below).
- Block Spec generation by recording the decision as a **blocking assumption** in the CONTEXT `assumptions` frontmatter (`id: FIX-1`, `type: architectural`, `blocking: true`, `resolution: unresolved`, `text: "Fix approach undecided — see Fix Approach Options"`). The orchestrator's ambiguity gate (C) already pauses on `blocking: true` assumptions, so the user picks the approach there; the Tech Researcher then re-runs in Revision Mode with the chosen approach and sets `resolution: resolved`. Also mirror it as a blocking Open Question in the CONTEXT for readability.

---

## Fix Options Table Format

When any refactor signal is detected, produce this table in the CONTEXT under a `## Fix Approach Options` section:

```markdown
## Fix Approach Options

> ⚠️ Pattern recurrence detected. Review options before committing to a single-patch fix.

| Option | Description | Effort | Risk | Recommendation |
|--------|-------------|--------|------|----------------|
| A — Local patch | Fix only the identified site. Does not address duplication. | Low | Medium (recurrence likely) | Only if other sites confirmed safe |
| B — Reuse existing abstraction | Delegate to `{existingHelper}` (already handles this pattern at `{path}`). Minimal change. | Low-Medium | Low | Preferred if abstraction is already stable |
| C — Extract new abstraction | Create a shared util/helper and apply at all {N} affected sites. | Medium-High | Low (eliminates recurrence) | Preferred when ≥3 sites affected |

**Affected sites**: {list of file paths and line numbers}
**Recommended option**: {A | B | C} — {one sentence justification}
```

Add to the SPEC's Open Questions / Assumptions section as a **blocking item**:

```markdown
| FIX-1 | Fix approach not decided — see `## Fix Approach Options` in CONTEXT | High | Developer must choose A, B, or C before implementation |
```

---

## Notes

- This step is lightweight: symbol search and pattern grep, not a full codebase audit.
- If the codebase search tools are unavailable, document the limitation in Open Questions and recommend a manual search before implementation.
- If only 1 site is affected and no abstraction bypass is detected, explicitly note "Single-site fix — no recurrence found" in the CONTEXT.
