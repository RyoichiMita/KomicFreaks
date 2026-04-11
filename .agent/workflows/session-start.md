---
description: Session start protocol — check project board, summarize status, recommend next task
---

// turbo-all

# Session Start Protocol

Every time a new session begins, follow these steps:

1. Read `PROJECT_BOARD.md` at the project root
```bash
cat "/Users/zakariyayahiaoui/Development/projects/Komic Freaks/PROJECT_BOARD.md"
```

2. Read `ARCHITECTURE.md` for tech context
```bash
cat "/Users/zakariyayahiaoui/Development/projects/Komic Freaks/.agent/ARCHITECTURE.md"
```

3. Check if dev server is running
```bash
lsof -i :5173 2>/dev/null | head -5
```

4. Summarize to the user:
   - What's **Done** (recent completions)
   - What's **In Progress** and if anything is blocked
   - What's next in **To Do**
   - Current velocity metrics

5. Ask: "What would you like to work on today, or should I recommend something?"

6. When starting work on a task:
   - Move it from To Do → In Progress in `PROJECT_BOARD.md`
   - Create a plan if it's complex (>2 files, >1 hour)
   - Update the board when complete (In Progress → Done)

7. When the user gives a NEW task that isn't on the board:
   - Add it to In Progress immediately
   - Complete the work
   - Move to Done
