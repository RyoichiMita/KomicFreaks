# 📝 Architecture Decisions — Komic Freaks Studio

## ADR-001: Web App over Desktop App
- **Date:** 2026-04-11
- **Decision:** Build as a web application (Vite + React) instead of a desktop app (Electron/Tauri)
- **Rationale:** Zero installation, works on any computer, faster to build, free hosting on Vercel. Desktop app would add complexity without meaningful benefit for this use case.

## ADR-002: FFmpeg.wasm for Video Processing
- **Date:** 2026-04-11
- **Decision:** Use FFmpeg.wasm for all video processing (trim, merge, export)
- **Rationale:** Runs entirely in the browser — no server costs, no upload/download delay. Handles all common video operations. Only limitation: slower than native FFmpeg on very large files, but acceptable for YouTube videos (typically 5-20 minutes).

## ADR-003: ElevenLabs for AI Narration
- **Date:** 2026-04-11
- **Decision:** Use ElevenLabs API for text-to-speech narration
- **Rationale:** Best quality AI voices available. Free tier provides 10,000 characters/month (enough for testing). Starter plan at ~£5/mo gives 30,000 characters. API is simple and well-documented.

## ADR-004: Vanilla CSS over Tailwind
- **Date:** 2026-04-11
- **Decision:** Use vanilla CSS with CSS custom properties for the design system
- **Rationale:** Maximum control over the anime-inspired dark theme. No build dependencies. Better performance. Custom animations easier to implement.

## ADR-005: Client-Side State Management
- **Date:** 2026-04-11
- **Decision:** Use Zustand for state management
- **Rationale:** Lightweight, simple API, no boilerplate. Perfect for managing editor state (timeline, clips, settings). React Context would be too complex for this use case.
