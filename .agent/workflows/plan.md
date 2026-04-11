---
description: Create project plan using project-planner agent. No code writing - only plan file generation.
---

# /plan — Project Planning Mode

$ARGUMENTS

## CRITICAL RULES

1. **NO CODE WRITING** — This command creates plan file only
2. **Socratic Gate** — Ask clarifying questions before planning
3. **Dynamic Naming** — Plan file named based on task

## Steps

1. Read `PROJECT_BOARD.md` and `ARCHITECTURE.md`
2. Ask 1-3 clarifying questions about scope and priority
3. Create `docs/PLAN-{task-slug}.md` with:
   - Overview (what & why)
   - Success criteria
   - Tech decisions
   - File structure changes
   - Task breakdown with agent assignments
   - Verification checklist
4. **DO NOT write any code files**
5. Report plan file location

## After Planning

Tell user:
```
✅ Plan created: docs/PLAN-{slug}.md

Next steps:
- Review the plan
- Say "go" to start implementation
- Or modify the plan manually
```
