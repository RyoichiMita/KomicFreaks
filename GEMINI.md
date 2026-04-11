# Komic Freaks Studio — Project Rules

## Tech Stack
- **Frontend:** Vite + React (JavaScript, not TypeScript)
- **Styling:** Vanilla CSS with CSS custom properties (NO Tailwind)
- **State:** Zustand
- **Video:** FFmpeg.wasm (browser-side)
- **AI Narration:** ElevenLabs API
- **Icons:** lucide-react

## Conventions
- Components live in `src/components/{ComponentName}/{ComponentName}.jsx`
- Services (API clients) live in `src/services/`
- State stores live in `src/stores/`
- Utilities live in `src/utils/`
- All design tokens are CSS custom properties in `src/index.css`
- Component-specific styles go in `src/App.css` (single CSS file strategy)
- Dark theme only — all colours follow the anime-inspired palette

## Key Patterns
- Use Zustand store (`src/stores/editorStore.js`) for all global state
- Components should be functional + hooks only
- Keep components focused — one responsibility each
- No hard-coded colours — always use CSS custom properties

## API Keys
- ElevenLabs key via `VITE_ELEVENLABS_API_KEY` env var
- NEVER commit `.env` files
