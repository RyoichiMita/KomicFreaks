# 📋 Komic Freaks Studio — Project Board

> Last updated: 2026-04-12 (AI Roadmap added)

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

## 🤖 To Do — AI Intelligence Layer

> Full strategy: `docs/guidance/ai_strategy.md`  
> API: OpenAI (`gpt-4o-mini` / `gpt-4o`) + ElevenLabs  
> Service hub: `src/services/aiService.js`

### 🟢 Tier 1: Quick Wins (1–2 days each)
| # | Feature | Side | API | Est. Cost | Status |
|---|---------|------|-----|-----------|--------|
| 1 | AI Script Writer — template + figure name → full narration script | Video Editor | `gpt-4o-mini` | ~$0.001/call | ⬜ To Do |
| 2 | AI Video Metadata Generator — YouTube title, description, tags, hashtags | Video Editor | `gpt-4o-mini` | ~$0.002/call | ⬜ To Do |
| 3 | AI Figure Lore Cards — character backstory, trivia, power level | SHF Vault | `gpt-4o-mini` | ~$0.001/call | ⬜ To Do |

### 🟡 Tier 2: Core Differentiators (3–5 days each)
| # | Feature | Side | API | Est. Cost | Status |
|---|---------|------|-----|-----------|--------|
| 4 | AI Edit Copilot — chat sidebar with function calling into editor | Video Editor | `gpt-4o` | ~$0.02/turn | ⬜ To Do |
| 5 | AI Thumbnail Generator (Enhanced) — DALL-E backgrounds + AI text | Video Editor | `dall-e-3` | ~$0.04/image | ⬜ To Do |
| 6 | AI Bootleg Detector — photo upload → Vision AI legit score 0–100% | SHF Vault | `gpt-4o` vision | ~$0.02/scan | ⬜ To Do |
| 7 | AI Collection Insights — portfolio analysis, completion tips, sell recs | SHF Vault | `gpt-4o-mini` | ~$0.005/call | ⬜ To Do |

### 🔴 Tier 3: Premium / Future (1–2 weeks each)
| # | Feature | Side | API | Depends On | Status |
|---|---------|------|-----|------------|--------|
| 8 | AI Voice Clone — nephew's voice via ElevenLabs cloning | Video Editor | ElevenLabs Pro | Paid plan | ⬜ To Do |
| 9 | AI Price Predictor — market value forecasting per figure | SHF Vault | `gpt-4o` | Pricing Engine (P4) | ⬜ Blocked |
| 10 | AI Auto-Edit — one-click full edit pipeline (cut+transitions+music+captions) | Video Editor | Orchestrator | All edit features | ⬜ Blocked |
| 11 | AI Smart B-Roll — auto-insert relevant clips during narration | Video Editor | `gpt-4o` vision | Clip library tagging | ⬜ Blocked |
| 12 | AI Trade Advisor — compare two figures for fair trade analysis | SHF Vault | `gpt-4o-mini` | Live pricing (P4) | ⬜ Blocked |

---

## ✅ Done — The Private Vault (S.H. Figuarts Collector App)

> Full blueprint saved: `docs/guidance/private_vault_blueprint.md`

### Phase 1: Core Engine — COMPLETE ✅
| Feature | Status |
|---------|--------|
| Figure database + retail grid layout | ✅ 40 Dragon Ball figures |
| FigureImage component (Amazon + gradient fallbacks) | ✅ |
| Owned/Wishlist toggle (grey → color) | ✅ Greyscale for unowned |
| Army Builder quantity counter (x2, x5) | ✅ Counter + grid badge |
| Status flags (On Display / In Storage / For Sale) | ✅ Picker + grid indicators |
| Storage tracking (bin/shelf) | ✅ Conditional text field |
| Portfolio value calculator (MSRP × quantity) | ✅ |
| Series Tracker with completion % | ✅ 4 series defined |
| Release Calendar with countdown timers | ✅ |
| Search + Filter + Sort | ✅ By arc, release type, name, price |
| Badge system (Owned/Quest/Grail) | ✅ |
| COEP fix for external images | ✅ credentialless policy |

### Phase 1: Still To Do
| Feature | Phase | Priority |
|---------|-------|----------|
| Digital instruction manuals library | P1 | 🟡 Medium |
| Triple news feed (Global/Custom/Leaks) | P1 | 🟡 Medium |
| Dual-date release calendar (JP vs Global) | P1 | 🟡 Medium |

### Phase 2: Premium Tier (Not Started)
| Feature | Phase | Priority |
|---------|-------|----------|
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
- [x] ~~AI-generated video descriptions & tags~~ → Moved to AI Layer (#2)
- [ ] Project cloud sync (Supabase)
