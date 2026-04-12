# 📋 Komic Freaks Studio — Project Board

> Last updated: 2026-04-12

---

## ✅ Done

- [x] Project planning & implementation plan
- [x] Git init + .gitignore
- [x] README.md
- [x] Project documentation (FEATURE_REQUESTS, QUICK_START, guidance)
- [x] Vite + React scaffold
- [x] Design system (dark anime theme with CSS custom properties)
- [x] Basic editor layout (sidebar, timeline, preview)
- [x] File import (drag & drop for MP4, MOV, MP3, WAV, JPG, PNG)
- [x] Video preview player (segment-aware for Auto-Cut)
- [x] Basic timeline (clips, trim, reorder, drag, resize)
- [x] Video export modal (MP4 format selection)
- [x] Keyboard shortcuts (Space=Play, Z=Undo, Delete=Remove, etc.)
- [x] AI Auto-Cut (silence detection, waveform visualisation, one-click apply)
- [x] Unified editor workspace (all tools in vertical tool strip, no tabs)
- [x] Multi-track volume mixer (per-track sliders + mute)
- [x] Project persistence (localStorage auto-save/load + Resume Project)
- [x] Anime SFX library (24 synthesized sounds, preview + add to timeline)
- [x] ElevenLabs narration panel (script editor, voice selection)
- [x] Thumbnail generator panel (6 presets, frame capture, quick titles, stickers)
- [x] Templates system (Figure Review, Unboxing, News, Comparison)
- [x] Notification toast system
- [x] Undo/Redo system (50-level history stack + ⌘Z/⌘⇧Z)
- [x] Background music library (6 synthesized ambient tracks)
- [x] Enhanced narration panel (Browser TTS fallback, quick scripts, voice preview)
- [x] Audio Engine (real-time playback sync for SFX, music, narration)
- [x] Multi-track export pipeline (FFmpeg filter graph mixing all audio + video)
- [x] Export track summary badges + muted track warnings
- [x] Captions & text overlay system (6 presets, position/alignment controls, live preview)
- [x] Transition system (7 types: Fade, Crossfade, Wipe, Zoom, Slide Up)
- [x] Auto-Captions (Web Speech API speech-to-text, batch add to timeline)
- [x] Agent infrastructure (7 agents, 6 workflows from Global Locksmith)
- [x] Caption burn-in during FFmpeg export (drawtext filters)
- [x] Transition preview CSS animations in video player
- [x] Export modal shows captions + transitions count badges
- [x] IndexedDB blob persistence (full project resume with media files)
- [x] Deployment configs (vercel.json, netlify.toml, COOP/COEP headers)
- [x] Anime Clip Extractor — YouTube audio fetch via yt-dlp proxy
- [x] Anime Clip Extractor — waveform scrubber with IN/OUT point selection
- [x] Anime Clip Extractor — clip library with tag/character/series metadata
- [x] AI Vocal Isolation — Demucs integration (clip-first architecture)
- [x] AI Vocal Isolation — torchcodec dependency fix
- [x] Cloud AI Captions — OpenAI Whisper API (no local server needed)
- [x] Cloud AI Captions — auto-detect 90+ languages (Japanese, Korean, etc.)
- [x] Cloud AI Captions — Original / English / Both translation modes
- [x] Cloud AI Captions — track source selector (Video, Audio, Narration, SFX)

---

## 🔄 In Progress

- [ ] Deploy to Vercel or Netlify (waiting for user to choose platform)

---

## 📝 To Do

### Phase 7: Advanced Polish
- [ ] Audio ducking (auto-lower music during narration)
- [ ] Custom SFX upload
- [ ] Performance optimization (Web Worker for FFmpeg)

### Phase 8: Ship
- [ ] GitHub remote setup & CI/CD
- [ ] Tutorial walkthrough for nephew

---

## 💡 Backlog

- [ ] YouTube API integration (direct upload)
- [ ] TikTok format export (9:16 vertical)
- [ ] Instagram Reels export
- [ ] Batch processing (multiple videos)
- [ ] Custom intro/outro animations
- [ ] Figure database integration (MyFigureCollection API)
- [ ] AI-generated video descriptions & tags
- [ ] Project cloud sync (Supabase)
