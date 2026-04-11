---
description: Build and deploy Komic Freaks Studio to production hosting.
---

# /deploy — Build & Deploy

// turbo-all

## Pre-Deploy Checks

1. Ensure all work is committed
```bash
cd "/Users/zakariyayahiaoui/Development/projects/Komic Freaks" && git status --short
```

2. Run production build
```bash
cd "/Users/zakariyayahiaoui/Development/projects/Komic Freaks" && npm run build
```

3. If build fails → fix errors before proceeding

## Deploy Options

### Option A: Vercel (Recommended)
```bash
npx -y vercel --prod
```

### Option B: Netlify
```bash
npx -y netlify deploy --prod --dir=dist
```

### Option C: GitHub Pages
```bash
# Ensure base path is set in vite.config.js
# Push to gh-pages branch
```

## Post-Deploy

1. Verify live URL works
2. Test core features (import, timeline, export)
3. Update PROJECT_BOARD.md with deployment status
4. Commit any config changes
