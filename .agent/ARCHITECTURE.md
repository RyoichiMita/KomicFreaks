# Komic Freaks Studio — Agent Architecture

## Tech Stack
- **Frontend:** Vite + React (JavaScript, NOT TypeScript)
- **Styling:** Vanilla CSS with CSS custom properties
- **State:** Zustand (single store: `editorStore.js`)
- **Video Processing:** FFmpeg.wasm (browser-side)
- **Audio:** Web Audio API + HTMLAudioElement pool
- **AI Narration:** ElevenLabs API (via `VITE_ELEVENLABS_API_KEY`)
- **Icons:** lucide-react

## Directory Structure (Key Convention)
```
src/
├── components/{ComponentName}/{ComponentName}.jsx
├── services/          # API clients & engines
│   ├── audioEngine.js
│   ├── ffmpeg.js
│   ├── transitionEngine.js
│   └── projectPersistence.js
├── stores/
│   └── editorStore.js  # Single source of truth
├── hooks/
├── utils/
├── App.jsx
├── App.css            # All component styles
└── index.css          # Design tokens & variables
```

## Available Agents

| Agent | File | Domain |
|-------|------|--------|
| `orchestrator` | `orchestrator.md` | Multi-agent coordination |
| `frontend-specialist` | `frontend-specialist.md` | React components, CSS, UI/UX |
| `video-engineer` | `video-engineer.md` | FFmpeg, video processing, export |
| `audio-engineer` | `audio-engineer.md` | Web Audio API, SFX, music |
| `debugger` | `debugger.md` | Root cause analysis, bug fixes |
| `performance-optimizer` | `performance-optimizer.md` | Bundle size, runtime perf |
| `project-planner` | `project-planner.md` | Task breakdown, planning |

## Available Workflows

| Command | File | Purpose |
|---------|------|---------|
| `/session-start` | `session-start.md` | Read PROJECT_BOARD, recommend next task |
| `/plan` | `plan.md` | Create plan without writing code |
| `/feature` | `feature.md` | Capture feature idea to FEATURE_REQUESTS |
| `/debug` | `debug.md` | Systematic debugging protocol |
| `/status` | `status.md` | Show project + agent status |
| `/deploy` | `deploy.md` | Build + deploy to hosting |

## Rules
- All colours via CSS custom properties (NEVER hard-code)
- Dark theme only — anime-inspired palette
- Component-specific styles in `App.css`
- Design tokens in `index.css`
- No TypeScript — JavaScript only
- No Tailwind — Vanilla CSS only
- Never commit `.env` files
