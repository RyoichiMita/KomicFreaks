# 📋 Komic Freaks Studio — Project Board

> Last updated: 2026-04-12

---

## ✅ Done — Komic Freaks Video Editor

- [x] Project planning & implementation plan
- [x] Git init + .gitignore + GitHub (zakariyayahiaoui-hub/KomicFreaks)
- [x] README.md + docs (FEATURE_REQUESTS, QUICK_START, guidance)
- [x] Vite + React scaffold + dark anime design system
- [x] Editor layout (sidebar, timeline, preview, vertical tool strip)
- [x] File import (drag & drop for MP4, MOV, MP3, WAV, JPG, PNG)
- [x] Video preview player (segment-aware)
- [x] Basic timeline (clips, trim, reorder, drag, resize)
- [x] Video export modal (MP4 format selection)
- [x] Keyboard shortcuts (Space=Play, Z=Undo, Delete=Remove, etc.)
- [x] AI Auto-Cut (silence detection, waveform, one-click apply)
- [x] Multi-track volume mixer (per-track sliders + mute)
- [x] Project persistence (localStorage + IndexedDB blob persistence)
- [x] Anime SFX library (24 synthesized sounds, preview + add to timeline)
- [x] Custom SFX Upload (WAV/MP3 upload, preview, add to timeline)
- [x] ElevenLabs narration + Browser TTS fallback
- [x] Thumbnail generator (6 presets, frame capture, quick titles, stickers)
- [x] Templates system (Figure Review, Unboxing, News, Comparison)
- [x] Notification toast system + Undo/Redo (50 levels)
- [x] Background music library (6 ambient tracks)
- [x] Audio Engine (real-time playback sync) + Audio Ducking
- [x] Multi-track FFmpeg export (filter graph mixing all audio + video)
- [x] Captions & text overlays (6 presets, burn-in during export)
- [x] Transition system (7 types with CSS preview + FFmpeg export)
- [x] Auto-Captions (OpenAI Whisper cloud, 90+ languages, dual language)
- [x] Track source selector for captions (Video, Audio, Narration, SFX)
- [x] Anime Clip Extractor (YouTube audio, waveform scrubber, clip library)
- [x] AI Vocal Isolation (Demucs integration)
- [x] Agent infrastructure (7 agents, 6 workflows)
- [x] Deployment configs (vercel.json, netlify.toml, COOP/COEP)

---

## 🔄 In Progress — VN Editor Feature Parity

### High Priority (Core Editing)
- [ ] Speed control (0.25x–4x per clip)
- [ ] Split clip at playhead (razor tool)
- [ ] Aspect ratio presets (16:9, 9:16, 1:1, 4:5, 4:3)
- [ ] Crop & Rotate per clip
- [ ] Duplicate clip

### High Priority (Visual Effects)
- [ ] Filters (Warm, Cool, Vintage, B&W, Anime presets)
- [ ] Color adjustments (brightness, contrast, saturation, exposure)
- [ ] Elements/Stickers overlay
- [ ] Picture-in-Picture

### Medium Priority
- [ ] Chroma key (green screen)
- [ ] Reverse video
- [ ] Keyframe animation (scale, position, opacity)
- [ ] Cover/Thumbnail from frame selection

### Ship
- [ ] Deploy to Vercel/Netlify
- [ ] Tutorial walkthrough for nephew

---

## 🆕 NEW PROJECT: The Private Vault (S.H. Figuarts Collector App)

> Full blueprint saved: `docs/guidance/private_vault_blueprint.md`

### What we already have (from Komic Freaks) that carries over:
| Existing Capability | Reusable For Vault? |
|---------------------|---------------------|
| ✅ Vite + React scaffold | Yes — same stack |
| ✅ Dark anime design system | Yes — adapt the theme |
| ✅ Supabase experience (from other projects) | Yes — auth, DB, storage |
| ✅ IndexedDB persistence | Yes — offline collection cache |
| ✅ Notification toast system | Yes — alerts |
| ✅ Agent infrastructure | Yes — reuse .agent/ folder |

### What's brand new (not in any project):
| Feature | Phase | Priority |
|---------|-------|----------|
| Figure database + retail grid layout | P1 | 🔴 High |
| Owned/Wishlist toggle (grey → color) | P1 | 🔴 High |
| Army Builder quantity counter | P1 | 🔴 High |
| Digital instruction manuals library | P1 | 🟡 Medium |
| Status flags (Display/Storage/For Sale) | P1 | 🔴 High |
| Storage tracking (bin/shelf) | P1 | 🟡 Medium |
| Portfolio value calculator (MSRP) | P1 | 🔴 High |
| Triple news feed (Global/Custom/Leaks) | P1 | 🟡 Medium |
| Dual-date release calendar (JP vs Global) | P1 | 🟡 Medium |
| Live market tracker + price graphs | P2 | 🔴 High |
| Grail Hunter price alerts | P2 | 🔴 High |
| Insurance PDF report generator | P2 | 🟡 Medium |
| Savings progress bar | P2 | 🟢 Low |
| Biometric auth + Ghost Vault | P2 | 🔴 High |
| Missing parts checklist | P2 | 🟡 Medium |
| Condition tracking (photo uploads) | P2 | 🟡 Medium |
| Barcode scanner (bootleg check) | P2 | 🔴 High |
| eBay/Mercari listing generator | P2 | 🟡 Medium |
| Compatibility matrix (head-swaps) | P2 | 🟢 Low |
| Fragility warnings database | P2 | 🟢 Low |
| Message board + Q&A Hub | P3 | 🟡 Medium |
| Showcase photo gallery | P3 | 🟡 Medium |
| Contact Seller (PM bridge) | P3 | 🟡 Medium |

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
