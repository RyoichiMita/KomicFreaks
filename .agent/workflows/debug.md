---
description: Debugging command. Activates DEBUG mode for systematic problem investigation.
---

# /debug — Systematic Problem Investigation

$ARGUMENTS

## Behavior

When `/debug` is triggered:

1. **Gather information**
   - Error message or symptom
   - Reproduction steps
   - Expected vs actual behavior
   - Recent changes (`git log -5 --oneline`)

2. **Form hypotheses**
   - List possible causes
   - Order by likelihood

3. **Investigate systematically**
   - Check browser console for errors
   - Inspect Zustand store state
   - Check relevant source files
   - Use elimination method

4. **Fix and prevent**
   - Apply fix
   - Explain root cause
   - Test the fix works

## Output Format

```markdown
## 🔍 Debug: [Issue]

### 1. Symptom
[What's happening]

### 2. Information Gathered
- Error: `[error message]`
- File: `[filepath]`
- Component: [component name]

### 3. Hypotheses
1. ❓ [Most likely cause]
2. ❓ [Second possibility]

### 4. Investigation
**Testing hypothesis 1:** [What I checked] → [Result]

### 5. Root Cause
🎯 **[Explanation]**

### 6. Fix
[Code changes made]

### 7. Prevention
🛡️ [How to prevent recurrence]
```
