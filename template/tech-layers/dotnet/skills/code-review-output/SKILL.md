---
name: code-review-output
description: Mandatory output template for .NET code review reports. All code-reviewer outputs must follow this exact structure.
---

# .NET Code Review Output Template

**REQUIRED:** Use this EXACT template for ALL code reviews. DO NOT deviate from this structure.

---

## Code Review: [PR Title / Branch / Changeset]

**Author:** [Name] | **Branch:** [source] → [target] | **Files Changed:** [N]

### Summary

[Brief overview of changes and scope - 2-3 sentences explaining what the PR does]

### Risk Assessment

| Category         | Rating                           | Critical Items |
| ---------------- | -------------------------------- | -------------- |
| Architecture     | [🟢/🟡/🟠/🔴]                    | [count]        |
| Security         | [🟢/🟡/🟠/🔴]                    | [count]        |
| Testing          | [🟢/🟡/🟠/🔴]                    | [count]        |
| Performance      | [🟢/🟡/🟠/🔴]                    | [count]        |
| **Overall Risk** | **[Low/Moderate/High/Critical]** | **Score: [X]** |

**Rating Legend:**

🟢 Green: No issues found
🟡 Yellow: Minor issues, suggestions only
🟠 Orange: Issues that should be addressed
🔴 Red: Critical issues that must be fixed

### Detailed Findings

#### 🔴 Critical Issues (Must Fix)

**[Category]**: [Issue description]

- **Location:** `Path/To/File.cs:123`
- **Impact:** [Explanation of why this is critical]
- **Fix:** [Suggested code change or approach]

#### 🟠 High Priority (Should Fix)

**[Category]**: [Issue description]

- **Location:** `Path/To/File.cs:123`
- **Impact:** [Explanation]
- **Recommendation:** [Suggested approach]

#### 🟡 Medium Priority (Consider Fixing)

**[Category]**: [Issue description]

- **Location:** `Path/To/File.cs:123`
- **Impact:** [Explanation]
- **Suggestion:** [Optional improvement]

#### 🟢 Suggestions (Nice to Have)

**[Category]**: [Positive observation or minor suggestion]

- **Note:** [Explanation or acknowledgment of good practices]

### Metrics

- **Lines Added:** [N] | **Lines Removed:** [M]
- **Files Modified:** [X] | **New Files:** [Y] | **Deleted Files:** [Z]
- **Test Coverage:** [X% via coverlet or "Not measured"]
- **Violations:** [Total count by severity: Critical: X, High: Y, Medium: Z]

### Follow-up Actions

- [ ] [Specific actionable item 1]
- [ ] [Specific actionable item 2]
- [ ] [Specific actionable item 3]

### Additional Notes

[Any additional context, related tickets, or discussion points]
