---
description: Display project status — progress tracking, dev server health, and next steps.
---

# /status — Show Project Status

// turbo-all

## Steps

1. Read project board
```bash
cat "/Users/zakariyayahiaoui/Development/projects/Komic Freaks/PROJECT_BOARD.md"
```

2. Check dev server health
```bash
lsof -i :5173 2>/dev/null | head -5
```

3. Check git status
```bash
cd "/Users/zakariyayahiaoui/Development/projects/Komic Freaks" && git log --oneline -5 && echo "---" && git status --short
```

4. Count codebase stats
```bash
cd "/Users/zakariyayahiaoui/Development/projects/Komic Freaks" && find src -name "*.jsx" -o -name "*.js" -o -name "*.css" | wc -l && echo "files" && wc -l src/**/*.jsx src/**/*.js src/**/*.css 2>/dev/null | tail -1
```

5. Present status summary:
```
=== Komic Freaks Studio Status ===

📁 Project: Komic Freaks Studio
🏷️ Type: WEB (Vite + React)
🌐 Dev Server: [Running/Stopped]

✅ Done: X features
🔄 In Progress: X features
📝 To Do: X features

📊 Last 5 commits:
[git log output]

📄 Codebase: X files, Y lines
```
